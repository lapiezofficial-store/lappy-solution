import { NextRequest, NextResponse } from 'next/server';
import {
  verifyStaffPin,
  verifyStaffCredentials,
  createStaffSession,
  staffSessionCookie,
  hasStaffOrAdminSession,
} from '@/lib/staffAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const session = hasStaffOrAdminSession(request);
  if (!session.authorized) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    staffId: session.staffId || null,
    staffCode: session.staffCode || 'COUNTER',
    staffName: session.staffName || 'Staff Member',
    role: session.role || 'COUNTER',
    canHandleOrders: session.canHandleOrders ?? true,
    canHandleWarranty: session.canHandleWarranty ?? true,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
    const password = typeof body?.password === 'string' ? body.password.trim() : '';

    // 1. Individual Staff ID / Phone + Password login
    if (identifier && password) {
      const check = await verifyStaffCredentials(identifier, password);
      if (!check.ok || !check.staff) {
        return NextResponse.json({ error: check.error || 'Invalid Staff ID or Password' }, { status: 401 });
      }

      const token = createStaffSession(check.staff.name, {
        staffId: check.staff.id,
        staffCode: check.staff.staffCode,
        role: check.staff.role,
        canHandleOrders: check.staff.canHandleOrders,
        canHandleWarranty: check.staff.canHandleWarranty,
      });

      const response = NextResponse.json({
        success: true,
        staffId: check.staff.id,
        staffCode: check.staff.staffCode,
        staffName: check.staff.name,
        role: check.staff.role,
        canHandleOrders: check.staff.canHandleOrders,
        canHandleWarranty: check.staff.canHandleWarranty,
        token,
      });
      response.cookies.set(staffSessionCookie.name, token, staffSessionCookie.options);
      return response;
    }

    // 2. Fallback Counter PIN / Master Key login
    const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
    const staffName = typeof body?.staffName === 'string' && body.staffName.trim()
      ? body.staffName.trim()
      : 'Counter Staff';

    if (!pin) {
      return NextResponse.json({ error: 'Staff ID/Phone & Password ya Counter PIN dalein.' }, { status: 400 });
    }

    const isValid = await verifyStaffPin(pin);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect Staff credentials.' }, { status: 401 });
    }

    const token = createStaffSession(staffName, {
      staffCode: 'PIN-DESK',
      role: 'COUNTER',
      canHandleOrders: true,
      canHandleWarranty: true,
    });
    const response = NextResponse.json({
      success: true,
      staffCode: 'PIN-DESK',
      staffName,
      role: 'COUNTER',
      canHandleOrders: true,
      canHandleWarranty: true,
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
