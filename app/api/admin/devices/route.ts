import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/adminAuth';
import { listAllDevices, approveDevice, revokeDevice, removeDevice, DEVICE_AUTH_COOKIE } from '@/lib/deviceSecurity';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const data = listAllDevices();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, deviceId, deviceName } = body;

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required.' }, { status: 400 });
  }

  if (action === 'approve') {
    const { token, device } = approveDevice({
      deviceId,
      deviceName,
      approvedBy: 'Admin Console (Malik Verified)',
    });
    return NextResponse.json({ success: true, message: 'Device approved successfully.', token, device });
  }

  if (action === 'revoke') {
    revokeDevice(deviceId);
    return NextResponse.json({ success: true, message: 'Device authorization revoked.' });
  }

  if (action === 'remove') {
    removeDevice(deviceId);
    return NextResponse.json({ success: true, message: 'Device deleted from registry.' });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}
