import { NextRequest, NextResponse } from 'next/server';
import { isDeviceApproved, DEVICE_AUTH_COOKIE } from '@/lib/deviceSecurity';
import { createAdminSession, adminSessionCookie } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get('deviceId');
  if (!deviceId) {
    return NextResponse.json({ approved: false, error: 'DeviceId required' }, { status: 400 });
  }

  const deviceCookie = request.cookies.get(DEVICE_AUTH_COOKIE.name)?.value || null;
  const approved = isDeviceApproved(deviceId, deviceCookie);

  if (!approved) {
    return NextResponse.json({ approved: false });
  }

  // Device has been approved by Master Admin! Issue session token
  const sessionToken = createAdminSession();
  const response = NextResponse.json({
    approved: true,
    token: sessionToken,
    message: 'Device has been approved by Store Owner!',
  });
  response.cookies.set(adminSessionCookie.name, sessionToken, adminSessionCookie.options);

  return response;
}

