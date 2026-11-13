import { NextRequest, NextResponse } from 'next/server';
import { verifyAndApproveWithPin, DEVICE_AUTH_COOKIE } from '@/lib/deviceSecurity';
import { createAdminSession, adminSessionCookie } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { deviceId, pin, deviceInfo } = body;

  if (!deviceId || !pin) {
    return NextResponse.json({ error: 'Device ID and Master PIN are required.' }, { status: 400 });
  }

  const clientIp = getClientIp(request);
  const result = verifyAndApproveWithPin({
    deviceId,
    pin,
    deviceInfo,
    ip: clientIp,
  });

  if (!result.success || !result.token) {
    return NextResponse.json({ error: result.error || 'Invalid Owner Master PIN.' }, { status: 403 });
  }

  const sessionToken = createAdminSession();
  const response = NextResponse.json({
    success: true,
    message: 'Device authorized and unlocked successfully!',
    token: sessionToken,
    deviceToken: result.token,
  });

  // Set device persistent 256-bit cookie (1 year)
  response.cookies.set(DEVICE_AUTH_COOKIE.name, result.token, DEVICE_AUTH_COOKIE.options);

  // Set admin session cookie
  response.cookies.set(adminSessionCookie.name, sessionToken, adminSessionCookie.options);

  return response;
}

