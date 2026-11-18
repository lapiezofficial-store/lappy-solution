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
    const hasRealPhone = rawPhone.replace(/\D/g, '').length >= 10;

    // If cleanPhone is empty or not 10 digits, generate a unique 10-digit virtual phone
    if (!cleanPhone || cleanPhone.length < 10) {
      let uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      while (await prisma.staffUser.findUnique({ where: { phone: uniquePhone } })) {
        uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      }
      cleanPhone = uniquePhone;
    }

    // Check if staff member already exists by explicit customCode or real phone only
    const exists = (customCode || hasRealPhone) ? await prisma.staffUser.findFirst({
      where: {
        OR: [
          ...(customCode ? [{ staffCode: customCode }] : []),
          ...(hasRealPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    }) : null;

    const hashedPassword = await bcrypt.hash(password, 10);

    // If already exists with that code/phone, update password and settings
    if (exists) {
      const updated = await prisma.staffUser.update({
        where: { id: exists.id },
        data: {
          name: name || exists.name,
          phone: hasRealPhone ? cleanPhone : exists.phone,
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
      const allStaff = await prisma.staffUser.findMany({ select: { staffCode: true } });
      const existingCodes = new Set(allStaff.map((s) => s.staffCode?.trim().toUpperCase()).filter(Boolean));

      let maxNum = 0;
      for (const code of existingCodes) {
        const match = code?.match(/LAP-STF-(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      let suffix = maxNum + 1;
      staffCode = `LAP-STF-${String(suffix).padStart(3, '0')}`;
      while (existingCodes.has(staffCode.toUpperCase())) {
        suffix++;
        staffCode = `LAP-STF-${String(suffix).padStart(3, '0')}`;
      }
    }

    let created: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        created = await prisma.staffUser.create({
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
        break;
      } catch (err: any) {
        if (err.code === 'P2002') {
          // If collision on phone or code, regenerate
          cleanPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
          const rand = Math.floor(100 + Math.random() * 900);
          staffCode = `LAP-STF-${rand}`;
          continue;
        }
        throw err;
      }
    }

    if (!created) {
      throw new Error('Staff ID generate nahi ho paya. Kripya punah prayas karein.');
    }

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

