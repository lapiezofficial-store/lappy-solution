import { NextRequest, NextResponse } from 'next/server';
import { adminSessionCookie, createAdminSession, isAdminConfigured, verifyAndCheckAdminPassword, migrateAdminPassword } from '@/lib/adminAuth';

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
  const rateLimit = checkRateLimit(clientIp);

  if (rateLimit.isBlocked) {
    return NextResponse.json(
      { error: `Too many failed login attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const body = await request.json().catch(() => null);
  const password = body && typeof body.password === 'string' ? body.password : '';
  const verification = await verifyAndCheckAdminPassword(password);

  if (!verification.isValid) {
    recordFailedAttempt(clientIp);
    const updated = checkRateLimit(clientIp);
    return NextResponse.json(
      {
        error: updated.isBlocked
          ? 'Too many failed login attempts. Account locked for 15 minutes.'
          : `Invalid credentials. (${updated.remainingAttempts} attempts remaining)`
      },
      { status: 401 }
    );
  }

  // Auto-migration on first login: if password was verified from plaintext legacy, upgrade to Bcrypt hash in background
  if (verification.needsMigration) {
    migrateAdminPassword(password).catch((err) => {
      console.warn('Auto-migration note:', err);
    });
  }

  clearRateLimit(clientIp);

  const sessionToken = createAdminSession();
  const response = NextResponse.json({ success: true, token: sessionToken });
  response.cookies.set(adminSessionCookie.name, sessionToken, adminSessionCookie.options);
  return response;
}

