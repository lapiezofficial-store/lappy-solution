import { NextRequest, NextResponse } from 'next/server';
import { adminSessionCookie, createAdminSession, isAdminConfigured, verifyAndCheckAdminPassword, migrateAdminPassword } from '@/lib/adminAuth';
import {
  isDeviceApproved,
  registerPendingDevice,
  approveDevice,
  verifyOwnerPin,
  verifyAndConsumeEmergencyKey,
  hasAnyApprovedDevices,
  DEVICE_AUTH_COOKIE,
} from '@/lib/deviceSecurity';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

function checkRateLimit(ip: string): { isBlocked: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  if (rateLimitStore.size > 1000) {
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt <= now) rateLimitStore.delete(key);
    }
  }

  const record = rateLimitStore.get(ip);
  if (!record || record.resetAt <= now) {
    return { isBlocked: false, remainingAttempts: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { isBlocked: true, remainingAttempts: 0, retryAfterSeconds };
  }

  return { isBlocked: false, remainingAttempts: MAX_ATTEMPTS - record.attempts, retryAfterSeconds: 0 };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || record.resetAt <= now) {
    rateLimitStore.set(ip, { attempts: 1, resetAt: now + WINDOW_MS });
  } else {
    record.attempts += 1;
  }
}

function clearRateLimit(ip: string) {
  rateLimitStore.delete(ip);
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Admin authentication is not configured on the server.' }, { status: 503 });
  }

  const clientIp = getClientIp(request);

  const body = await request.json().catch(() => null);
  const password = body && typeof body.password === 'string' ? body.password.trim() : '';
  const deviceId = body && typeof body.deviceId === 'string' ? body.deviceId.trim() : '';
  const deviceInfo = body && typeof body.deviceInfo === 'string' ? body.deviceInfo.trim() : 'Web Browser';
  const ownerPin = body && typeof body.ownerPin === 'string' ? body.ownerPin.trim() : '';

  // 1. Check if the submitted password is an Emergency Master Key (Max 2 Uses Each)
  const emergencyCheck = verifyAndConsumeEmergencyKey(password, deviceId, clientIp);
  if (emergencyCheck.success && emergencyCheck.token) {
    clearRateLimit(clientIp);
    const sessionToken = createAdminSession();
    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      deviceApproved: true,
      isEmergencyMaster: true,
      message: `Emergency Master Passkey accepted! (${emergencyCheck.remainingUses} uses remaining).`,
    });
    response.cookies.set(adminSessionCookie.name, sessionToken, adminSessionCookie.options);
    response.cookies.set(DEVICE_AUTH_COOKIE.name, emergencyCheck.token, DEVICE_AUTH_COOKIE.options);
    return response;
  }

  if (emergencyCheck.error && password.toUpperCase().startsWith('LPZ-OWNER')) {
    return NextResponse.json({ error: emergencyCheck.error }, { status: 403 });
  }

  // 2. Check standard admin password
  const verification = await verifyAndCheckAdminPassword(password);

  if (verification.isValid) {
    clearRateLimit(clientIp);
  } else {
    recordFailedAttempt(clientIp);
    const rateLimit = checkRateLimit(clientIp);
    return NextResponse.json(
      {
        error: rateLimit.isBlocked
          ? `Too many failed login attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`
          : `Invalid credentials. (${rateLimit.remainingAttempts} attempts remaining)`
      },
      { status: rateLimit.isBlocked ? 429 : 401 }
    );
  }

  // Auto-migration on first login: if password was verified from plaintext legacy, upgrade to Bcrypt hash in background
  if (verification.needsMigration) {
    migrateAdminPassword(password).catch((err) => {
      console.warn('Auto-migration note:', err);
    });
  }

  // 3. Check 256-bit Device Verification & Approval
  const deviceCookie = request.cookies.get(DEVICE_AUTH_COOKIE.name)?.value || null;
  const isApproved = deviceId ? isDeviceApproved(deviceId, deviceCookie) : false;

  // Case 1: Device is ALREADY APPROVED by Master Admin
  if (isApproved) {
    const sessionToken = createAdminSession();
    const response = NextResponse.json({ success: true, token: sessionToken, deviceApproved: true });
    response.cookies.set(adminSessionCookie.name, sessionToken, adminSessionCookie.options);
    return response;
  }

  // Case 2: Owner Master PIN provided directly on login
  if (ownerPin) {
    const pinCheck = verifyOwnerPin(ownerPin);
    if (pinCheck.isValid) {
      const { token } = approveDevice({
        deviceId: deviceId || `dev_${Date.now()}`,
        deviceInfo,
        ip: clientIp,
        approvedBy: `${pinCheck.ownerName} PIN Verification`,
      });

      const sessionToken = createAdminSession();
      const response = NextResponse.json({ success: true, token: sessionToken, deviceApproved: true });
      response.cookies.set(adminSessionCookie.name, sessionToken, adminSessionCookie.options);
      response.cookies.set(DEVICE_AUTH_COOKIE.name, token, DEVICE_AUTH_COOKIE.options);
      return response;
    } else {
      return NextResponse.json({ error: 'Incorrect Owner Master PIN.' }, { status: 403 });
    }
  }

  // Case 3: Device is UNAPPROVED -> Even with correct password, MUST be approved by Master Admin!
  const effectiveDeviceId = deviceId || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const { deviceCode } = registerPendingDevice({
    deviceId: effectiveDeviceId,
    deviceInfo,
    ip: clientIp,
  });

  // Post alert to admin notifications in background
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.notification.create({
      data: {
        recipient: 'ADMIN',
        type: 'SYSTEM',
        title: 'New Device Login Approval Requested',
        message: `Device Code ${deviceCode} (${deviceInfo}) at IP ${clientIp} requires Owner approval.`,
        link: '/admin?tab=security',
      },
    }).catch(() => null);
  } catch (err) {
    // Ignore notification error
  }

  return NextResponse.json({
    requiresDeviceApproval: true,
    deviceId: effectiveDeviceId,
    deviceCode,
    deviceInfo,
    ip: clientIp,
    message: 'Correct password, but this device requires approval from Store Owner 1 or Store Owner 2.',
  });
}
