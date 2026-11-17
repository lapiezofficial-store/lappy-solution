import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawInput = (body?.code || body?.staffCode || body?.pin || body?.password || '').toString().trim();

    if (!rawInput) {
      return NextResponse.json({ valid: false, error: 'Staff Code or PIN is required.' }, { status: 400 });
    }

    const cleanInput = rawInput.toUpperCase();
    const cleanPhone = rawInput.replace(/\D/g, '').slice(-10);

    // 1. Check Store Default / Admin Counter PIN fallback
    if (rawInput === '1234' || rawInput === 'Lapiez@2026#' || cleanInput === 'ADMIN') {
      return NextResponse.json({
        valid: true,
        staff: {
          id: 'counter-master',
          name: 'Store Counter Manager',
          staffCode: 'LAP-CTR-01',
          role: 'COUNTER',
        },
      });
    }

    // 2. Search prisma.staffUser by staffCode or phone
    const staffMembers = await prisma.staffUser.findMany({
      where: {
        isBlocked: false,
      },
    });

    let matchedStaff: typeof staffMembers[0] | null = null;

    for (const staff of staffMembers) {
      // Direct match on staff code (e.g. LAP-STF-001 or STF-001 or 001)
      if (
        staff.staffCode.toUpperCase() === cleanInput ||
        staff.staffCode.toUpperCase().endsWith(cleanInput) ||
        cleanInput.endsWith(staff.staffCode.toUpperCase())
      ) {
        matchedStaff = staff;
        break;
      }

      // Match on phone number
      if (cleanPhone.length === 10 && staff.phone === cleanPhone) {
        matchedStaff = staff;
        break;
      }

      // Match on password hash if user entered staff password/PIN
      if (staff.password) {
        try {
          const isPassMatch = await bcrypt.compare(rawInput, staff.password);
          if (isPassMatch) {
            matchedStaff = staff;
            break;
          }
        } catch {}
      }
    }

    if (!matchedStaff) {
      return NextResponse.json(
        { valid: false, error: 'Invalid Staff Code or PIN. Please enter authorized staff credentials.' },
        { status: 401 }
      );
    }

    if (!matchedStaff.canHandleOrders) {
      return NextResponse.json(
        { valid: false, error: 'This staff account does not have permission to process orders.' },
        { status: 403 }
      );
    }

    // Update last active timestamp asynchronously
    try {
      await prisma.staffUser.update({
        where: { id: matchedStaff.id },
        data: { lastActiveAt: new Date() },
      });
    } catch {}

    return NextResponse.json({
      valid: true,
      staff: {
        id: matchedStaff.id,
        name: matchedStaff.name,
        staffCode: matchedStaff.staffCode,
        role: matchedStaff.role,
      },
    });
  } catch (error: any) {
    console.error('Staff verify error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to verify staff credentials: ' + (error?.message || 'Server error') },
      { status: 500 }
    );
  }
}
