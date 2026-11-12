import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isPickupOrder(order: any): boolean {
  const pm = (order.paymentMethod || '').toLowerCase();
  const addr = (order.address || '').toLowerCase();
  return (
    pm.includes('pickup') ||
    pm.includes('counter') ||
    addr.includes('store pickup') ||
    addr.includes('counter pickup')
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const riderId = searchParams.get('riderId')?.trim();

    if (!riderId) {
      return NextResponse.json({ error: 'Rider ID required' }, { status: 400 });
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      select: {
        id: true,
        riderCode: true,
        name: true,
        phone: true,
        vehicleType: true,
        vehicleNumber: true,
        city: true,
        approvalStatus: true,
        isOnline: true,
        isBlocked: true,
        walletBalance: true,
        commissionPerOrder: true,
        bankAccountNo: true,
        bankIfsc: true,
        bankUpi: true,
        lastLocationText: true,
        lastActiveAt: true,
        lastDeliveryAt: true,
      },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    const [candidateAvailable, activeOrders, completedOrders, payouts] = await Promise.all([
      prisma.order.findMany({
        where: {
          orderStatus: { in: ['Ready', 'READY', 'Packed', 'PACKED'] },
          riderId: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      prisma.order.findMany({
        where: {
          riderId: rider.id,
          orderStatus: { in: ['Out For Delivery', 'Shipped', 'Ready', 'Packed', 'Confirmed'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 40,
      }),
      prisma.order.findMany({
        where: {
          riderId: rider.id,
          orderStatus: 'Delivered',
        },
        orderBy: { deliveredAt: 'desc' },
        take: 50,
      }),
      prisma.riderPayout.findMany({
        where: { riderId: rider.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    const availableOrders = candidateAvailable.filter((o) => !isPickupOrder(o));

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCompleted = completedOrders.filter((o) => {
      const refDate = o.deliveredAt ? new Date(o.deliveredAt).toISOString().slice(0, 10) : o.date;
      return refDate === todayStr;
    });

    const codCollectedToday = todayCompleted
      .filter((o) => (o.paymentMethod || '').toLowerCase().includes('cod') || (o.paymentMethod || '').toLowerCase().includes('cash'))
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    return NextResponse.json({
      success: true,
      rider,
      availableOrders,
      activeOrders,
      completedOrders,
      payouts,
      stats: {
        todayDeliveries: todayCompleted.length,
        todayEarnings: todayCompleted.length * (Number(rider.commissionPerOrder) || 25),
        codCollectedToday,
        totalCompleted: completedOrders.length,
      },
    });
  } catch (error: any) {
    console.error('Error loading rider orders:', error);
    return NextResponse.json({ error: 'Failed to load rider orders' }, { status: 500 });
  }
}

