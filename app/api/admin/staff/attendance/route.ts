import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession, isMasterAdminSecret } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffCode: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  checkInTime?: string; // e.g. "09:30 AM"
  checkOutTime?: string; // e.g. "07:30 PM"
  notes?: string;
  markedBy?: string; // "ADMIN" | "SELF"
  updatedAt: string;
}

// Helper to get persistent attendance store
async function getStoredAttendance(): Promise<Record<string, AttendanceRecord>> {
  try {
    const record = await prisma.customPage.findUnique({
      where: { slug: '_system_staff_attendance' },
    });
    if (record?.content) {
      const parsed = JSON.parse(record.content);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('Could not read attendance from DB:', err);
  }
  return {};
}

// Helper to save persistent attendance store
async function saveStoredAttendance(data: Record<string, AttendanceRecord>) {
  try {
    await prisma.customPage.upsert({
      where: { slug: '_system_staff_attendance' },
      update: {
        content: JSON.stringify(data),
        updatedAt: new Date(),
      },
      create: {
        slug: '_system_staff_attendance',
        title: 'System Staff Attendance Records',
        content: JSON.stringify(data),
        status: 'draft',
      },
    });
  } catch (err) {
    console.warn('Could not save attendance to DB:', err);
  }
}

// GET: Fetch attendance for a date, month, or staff
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const todayStr = new Date().toISOString().split('T')[0];
    const dateParam = searchParams.get('date') || todayStr;
    const monthParam = searchParams.get('month'); // e.g. "2026-11"
    const staffIdParam = searchParams.get('staffId');

    const allStaff = await prisma.staffUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        staffCode: true,
        name: true,
        phone: true,
        role: true,
        isBlocked: true,
      },
    });

    const store = await getStoredAttendance();
    const records = Object.values(store);

    // Filter records
    let filtered = records;
    if (monthParam) {
      filtered = filtered.filter((r) => r.date.startsWith(monthParam));
    } else if (dateParam && !staffIdParam) {
      filtered = filtered.filter((r) => r.date === dateParam);
    }

    if (staffIdParam) {
      filtered = filtered.filter((r) => r.staffId === staffIdParam);
    }

    // Compute today's sheet for all active staff
    const todaySheet = allStaff.map((s) => {
      const key = `${s.id}_${dateParam}`;
      const existing = store[key];
      return {
        staffId: s.id,
        staffCode: s.staffCode,
        staffName: s.name,
        role: s.role,
        phone: s.phone,
        isBlocked: s.isBlocked,
        date: dateParam,
        status: existing?.status || 'NOT_MARKED',
        checkInTime: existing?.checkInTime || null,
        checkOutTime: existing?.checkOutTime || null,
        notes: existing?.notes || '',
        markedBy: existing?.markedBy || null,
      };
    });

    const presentCount = todaySheet.filter((s) => s.status === 'PRESENT').length;
    const absentCount = todaySheet.filter((s) => s.status === 'ABSENT').length;
    const halfDayCount = todaySheet.filter((s) => s.status === 'HALF_DAY').length;
    const leaveCount = todaySheet.filter((s) => s.status === 'LEAVE').length;

    return NextResponse.json({
      success: true,
      date: dateParam,
      stats: {
        totalStaff: allStaff.length,
        presentCount,
        absentCount,
        halfDayCount,
        leaveCount,
        notMarkedCount: allStaff.length - (presentCount + absentCount + halfDayCount + leaveCount),
      },
      todaySheet,
      history: filtered,
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance: ' + error.message }, { status: 500 });
  }
}

// POST: Mark / Update Attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      staffId,
      status, // "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE"
      date,
      checkInTime,
      checkOutTime,
      notes,
      markedBy,
      adminKey,
    } = body;

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = date || todayStr;

    if (!staffId || !status) {
      return NextResponse.json({ error: 'staffId aur status required hain' }, { status: 400 });
    }

    // Verify staff exists
    const staff = await prisma.staffUser.findUnique({
      where: { id: staffId },
      select: { id: true, staffCode: true, name: true },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member nahi mila' }, { status: 404 });
    }

    const key = `${staff.id}_${targetDate}`;
    const store = await getStoredAttendance();

    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const record: AttendanceRecord = {
      id: key,
      staffId: staff.id,
      staffCode: staff.staffCode,
      staffName: staff.name,
      date: targetDate,
      status,
      checkInTime: checkInTime || (status === 'PRESENT' || status === 'HALF_DAY' ? nowTime : undefined),
      checkOutTime: checkOutTime || store[key]?.checkOutTime,
      notes: notes || '',
      markedBy: markedBy || (adminKey ? 'ADMIN' : 'STAFF'),
      updatedAt: new Date().toISOString(),
    };

    store[key] = record;
    await saveStoredAttendance(store);

    return NextResponse.json({
      success: true,
      message: `${staff.name} (${staff.staffCode}) ki attendance '${status}' mark ho gayi!`,
      record,
    });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Failed to mark attendance: ' + error.message }, { status: 500 });
  }
}
