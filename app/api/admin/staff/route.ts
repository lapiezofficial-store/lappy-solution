import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
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
  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const rawPhone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    let cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

    const password = typeof body?.password === 'string' ? body.password.trim() : '';
    const role = typeof body?.role === 'string' && ['COUNTER', 'TECHNICIAN', 'MANAGER'].includes(body.role)
      ? body.role
      : 'COUNTER';
    const canHandleOrders = body?.canHandleOrders !== false;
    const canHandleWarranty = body?.canHandleWarranty !== false;

    if (!name || !password) {
      return NextResponse.json({ error: 'Staff Member Name aur Password/PIN dalna zaroori hai!' }, { status: 400 });
    }

    const customCode = body?.customStaffCode ? String(body.customStaffCode).trim().toUpperCase() : '';

    // If cleanPhone is empty or not 10 digits, generate a unique 10-digit virtual phone
    if (!cleanPhone || cleanPhone.length < 10) {
      let uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      while (await prisma.staffUser.findUnique({ where: { phone: uniquePhone } })) {
        uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      }
      cleanPhone = uniquePhone;
    }

    // Check if staff member already exists by phone, customCode, or name
    const exists = await prisma.staffUser.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(customCode ? [{ staffCode: customCode }] : []),
          { name: { equals: name, mode: 'insensitive' } },
        ],
      },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // If already exists, SMART UPDATE password and settings rather than throwing an error!
    if (exists) {
      const updated = await prisma.staffUser.update({
        where: { id: exists.id },
        data: {
          name: name || exists.name,
          phone: cleanPhone || exists.phone,
          password: hashedPassword,
          role,
          canHandleOrders,
          canHandleWarranty,
          isBlocked: false,
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
          lastActiveAt: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        isUpdate: true,
        message: `Staff '${updated.name}' (${updated.staffCode}) ka Password & Account update ho gaya!`,
        staff: updated,
      });
    }

    // Otherwise create brand new staff
    let staffCode = customCode;
    if (!staffCode) {
      const count = await prisma.staffUser.count();
      let suffix = count + 1;
      staffCode = `LAP-STF-${String(suffix).padStart(3, '0')}`;
      while (await prisma.staffUser.findUnique({ where: { staffCode } })) {
        suffix++;
        staffCode = `LAP-STF-${String(suffix).padStart(3, '0')}`;
      }
    }

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

    return NextResponse.json({
      success: true,
      message: `Staff ID ${created.staffCode} successfully created!`,
      staff: created,
    });
  } catch (error: any) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff: ' + error.message }, { status: 500 });
  }
}

