import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const staff = await prisma.staffUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        staffCode: true,
        name: true,
        phone: true,
        role: true,
        canHandleOrders: true,
        canHandleWarranty: true,
        isBlocked: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json(staff);
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to load staff accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const rawPhone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const password = typeof body?.password === 'string' ? body.password.trim() : '';
    const role = typeof body?.role === 'string' && ['COUNTER', 'TECHNICIAN', 'MANAGER'].includes(body.role)
      ? body.role
      : 'COUNTER';
    const canHandleOrders = body?.canHandleOrders !== false;
    const canHandleWarranty = body?.canHandleWarranty !== false;

    if (!name || cleanPhone.length !== 10 || !password) {
      return NextResponse.json({ error: 'Name, 10-digit Phone aur Password dalna zaroori hai!' }, { status: 400 });
    }

    const exists = await prisma.staffUser.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(body?.customStaffCode ? [{ staffCode: String(body.customStaffCode).trim().toUpperCase() }] : []),
        ],
      },
    });

    if (exists) {
      return NextResponse.json({ error: 'Yeh Phone ya Staff ID pehle se bana hua hai!' }, { status: 409 });
    }

    let staffCode = body?.customStaffCode ? String(body.customStaffCode).trim().toUpperCase() : '';
    if (!staffCode) {
      const count = await prisma.staffUser.count();
      staffCode = `LAP-STF-${String(count + 1).padStart(3, '0')}`;
      // Guarantee uniqueness
      let suffix = count + 1;
      while (await prisma.staffUser.findUnique({ where: { staffCode } })) {
        suffix++;
        staffCode = `LAP-STF-${String(suffix).padStart(3, '0')}`;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await prisma.staffUser.create({
      data: {
        staffCode,
        name,
        phone: cleanPhone,
        password: hashedPassword,
        role,
        canHandleOrders,
        canHandleWarranty,
      },
      select: {
        id: true,
        staffCode: true,
        name: true,
        phone: true,
        role: true,
        canHandleOrders: true,
        canHandleWarranty: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, staff: created });
  } catch (error: any) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff: ' + error.message }, { status: 500 });
  }
}

