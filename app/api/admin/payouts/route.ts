import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Settle payout to rider
export async function POST(req: Request) {
  try {
    const { riderId, amount, paymentMode, utrNumber, note } = await req.json();

    if (!riderId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid Rider and Amount are required' }, { status: 400 });
    }

    const payAmount = Number(amount);

    const result = await prisma.$transaction(async (tx) => {
      const rider = await tx.rider.findUnique({ where: { id: riderId } });
      if (!rider) throw new Error('Rider nahi mila');

      // 1. Create Payout Record
      const payout = await tx.riderPayout.create({
        data: {
          riderId,
          amount: payAmount,
          paymentMode: paymentMode || 'UPI',
          utrNumber: utrNumber || null,
          note: note || 'Admin Settlement',
          status: 'PAID',
        },
      });

      // 2. Deduct from rider's wallet balance
      const newBalance = Math.max(0, rider.walletBalance - payAmount);
      const updatedRider = await tx.rider.update({
        where: { id: riderId },
        data: { walletBalance: newBalance },
      });

      return { payout, newBalance: updatedRider.walletBalance };
    });

    return NextResponse.json({
      success: true,
      message: `₹${payAmount} payout settled successfully!`,
      payout: result.payout,
      newBalance: result.newBalance,
    });
  } catch (error: any) {
    console.error('Payout settlement error:', error);
    return NextResponse.json({ error: error.message || 'Failed to settle payout' }, { status: 500 });
  }
}

// GET: Payout history
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const riderId = searchParams.get('riderId');

    const payouts = await prisma.riderPayout.findMany({
      where: riderId ? { riderId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        rider: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(payouts);
  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}
