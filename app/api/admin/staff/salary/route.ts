import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession, isMasterAdminSecret } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface StaffSalaryPayment {
  id: string;
  staffId: string;
  staffCode: string;
  staffName: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  utrNumber?: string;
  note?: string;
  month: string; // e.g. "2026-11"
  paymentDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface StaffSalaryProfile {
  staffId: string;
  staffCode: string;
  staffName: string;
  role: string;
  phone: string;
  monthlySalary: number; // e.g. 12000
  joiningDate?: string;
  bankDetails?: string;
  updatedAt: string;
}

interface SalaryStore {
  profiles: Record<string, StaffSalaryProfile>; // staffId -> Profile
  payments: StaffSalaryPayment[];
}

// Helper to read salary store from DB
async function getStoredSalaryData(): Promise<SalaryStore> {
  try {
    const record = await prisma.customPage.findUnique({
      where: { slug: '_system_staff_salaries' },
    });
    if (record?.content) {
      const parsed = JSON.parse(record.content);
      if (parsed && typeof parsed === 'object') {
        return {
          profiles: parsed.profiles || {},
          payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        };
      }
    }
  } catch (err) {
    console.warn('Could not read salary data from DB:', err);
  }
  return { profiles: {}, payments: [] };
}

// Helper to save salary store to DB
async function saveStoredSalaryData(data: SalaryStore) {
  try {
    await prisma.customPage.upsert({
      where: { slug: '_system_staff_salaries' },
      update: {
        content: JSON.stringify(data),
        updatedAt: new Date(),
      },
      create: {
        slug: '_system_staff_salaries',
        title: 'System Staff Salary & Payout Records',
        content: JSON.stringify(data),
        status: 'draft',
      },
    });
  } catch (err) {
    console.warn('Could not save salary data to DB:', err);
  }
}

// GET: Fetch staff salaries, payment history, and current balances
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffIdParam = searchParams.get('staffId');
    const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7); // e.g. "2026-11"

    const allStaff = await prisma.staffUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        staffCode: true,
        name: true,
        phone: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    const store = await getStoredSalaryData();

    // Compile roster with salary metrics
    const staffSalaries = allStaff.map((staff) => {
      const profile = store.profiles[staff.id] || {
        staffId: staff.id,
        staffCode: staff.staffCode,
        staffName: staff.name,
        role: staff.role,
        phone: staff.phone,
        monthlySalary: 12000, // standard default
        updatedAt: staff.createdAt.toISOString(),
      };

      // Filter payments for this staff in target month
      const staffPaymentsThisMonth = store.payments.filter(
        (p) => p.staffId === staff.id && p.month === monthParam
      );
      const totalPaidThisMonth = staffPaymentsThisMonth.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingBalance = Math.max(0, (profile.monthlySalary || 0) - totalPaidThisMonth);

      // All-time payments for this staff
      const allStaffPayments = store.payments.filter((p) => p.staffId === staff.id);
      const allTimePaid = allStaffPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        ...profile,
        staffName: staff.name,
        staffCode: staff.staffCode,
        phone: staff.phone,
        role: staff.role,
        isBlocked: staff.isBlocked,
        currentMonth: monthParam,
        totalPaidThisMonth,
        pendingBalance,
        allTimePaid,
        paymentsThisMonth: staffPaymentsThisMonth,
        allPayments: allStaffPayments,
      };
    });

    const filtered = staffIdParam
      ? staffSalaries.filter((s) => s.staffId === staffIdParam)
      : staffSalaries;

    const totalMonthlyPayroll = staffSalaries.reduce((sum, s) => sum + (s.monthlySalary || 0), 0);
    const totalDisbursedThisMonth = staffSalaries.reduce((sum, s) => sum + (s.totalPaidThisMonth || 0), 0);
    const totalPendingPayroll = Math.max(0, totalMonthlyPayroll - totalDisbursedThisMonth);

    return NextResponse.json({
      success: true,
      month: monthParam,
      stats: {
        totalStaff: allStaff.length,
        totalMonthlyPayroll,
        totalDisbursedThisMonth,
        totalPendingPayroll,
      },
      staffSalaries: filtered,
      recentPayments: store.payments.slice(-30).reverse(),
    });
  } catch (error: any) {
    console.error('Error fetching staff salaries:', error);
    return NextResponse.json({ error: 'Failed to fetch staff salaries: ' + error.message }, { status: 500 });
  }
}

// POST: Update Salary Profile OR Record a Payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      action, // "SET_SALARY" | "RECORD_PAYMENT"
      staffId,
      monthlySalary,
      amount,
      paymentMode,
      utrNumber,
      note,
      month,
      paymentDate,
    } = body;

    if (!staffId) {
      return NextResponse.json({ error: 'staffId required hai' }, { status: 400 });
    }

    const staff = await prisma.staffUser.findUnique({
      where: { id: staffId },
      select: { id: true, staffCode: true, name: true, role: true, phone: true },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member nahi mila' }, { status: 404 });
    }

    const store = await getStoredSalaryData();
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = month || todayStr.slice(0, 7);

    if (action === 'SET_SALARY') {
      const salaryNum = Math.max(0, Number(monthlySalary) || 0);
      store.profiles[staff.id] = {
        staffId: staff.id,
        staffCode: staff.staffCode,
        staffName: staff.name,
        role: staff.role,
        phone: staff.phone,
        monthlySalary: salaryNum,
        updatedAt: new Date().toISOString(),
      };
      await saveStoredSalaryData(store);

      return NextResponse.json({
        success: true,
        message: `${staff.name} ki monthly salary ₹${salaryNum.toLocaleString('en-IN')} update ho gayi!`,
        profile: store.profiles[staff.id],
      });
    }

    // Default: RECORD_PAYMENT
    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount required hai' }, { status: 400 });
    }

    const newPayment: StaffSalaryPayment = {
      id: `sal-pay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      staffId: staff.id,
      staffCode: staff.staffCode,
      staffName: staff.name,
      amount: payAmount,
      paymentMode: paymentMode || 'CASH',
      utrNumber: utrNumber || null,
      note: note || `Salary payment for ${currentMonth}`,
      month: currentMonth,
      paymentDate: paymentDate || todayStr,
      createdAt: new Date().toISOString(),
    };

    store.payments.push(newPayment);
    await saveStoredSalaryData(store);

    return NextResponse.json({
      success: true,
      message: `${staff.name} ko ₹${payAmount.toLocaleString('en-IN')} ka salary payment (${paymentMode || 'CASH'}) record ho gaya!`,
      payment: newPayment,
    });
  } catch (error: any) {
    console.error('Error saving salary data:', error);
    return NextResponse.json({ error: 'Failed to record salary: ' + error.message }, { status: 500 });
  }
}
