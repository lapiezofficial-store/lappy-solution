import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffPin, createStaffSession, staffSessionCookie, hasStaffOrAdminSession } from '@/lib/staffAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const session = hasStaffOrAdminSession(request);
  if (!session.authorized) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    staffName: session.staffName || 'Staff Member',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
    const staffName = typeof body?.staffName === 'string' && body.staffName.trim()
      ? body.staffName.trim()
      : 'Counter Staff';

    if (!pin) {
      return NextResponse.json({ error: 'Please enter Staff PIN or Master Key' }, { status: 400 });
    }

    const isValid = await verifyStaffPin(pin);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect Staff PIN or Master Passkey.' }, { status: 401 });
    }

    const token = createStaffSession(staffName);
    const response = NextResponse.json({
      success: true,
      staffName,
      token,
    });

    response.cookies.set(staffSessionCookie.name, token, staffSessionCookie.options);
    return response;
  } catch (error) {
    console.error('Staff auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(staffSessionCookie.name);
  return response;
}
