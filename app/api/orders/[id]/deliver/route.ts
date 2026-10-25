import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerPusherEvent } from '@/lib/pusher';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const payoutPerDelivery = Number(body.payoutAmount) || 25; // Default ₹25 per delivery

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          OR: [{ id: id }, { orderId: id }],
        },
      });

      if (!order) {
        throw new Error('ORDER_NOT_FOUND');
      }

      if (order.orderStatus === 'Delivered') {
        throw new Error('ALREADY_DELIVERED');
      }

      if (!order.riderId) {
        throw new Error('NO_RIDER_ASSIGNED');
      }

      // Mark order delivered
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'Delivered',
          paymentStatus: order.paymentMethod === 'COD' ? 'Paid' : order.paymentStatus,
          deliveredAt: new Date(),
        },
      });

      // Add ₹25 to Rider wallet
      const updatedRider = await tx.rider.update({
        where: { id: order.riderId },
        data: {
          walletBalance: { increment: payoutPerDelivery },
        },
      });

      return { order: updatedOrder, rider: updatedRider, earned: payoutPerDelivery };
    });

    // Notify Admin Panel
    await triggerPusherEvent('admin-channel', 'order-delivered', {
      orderId: result.order.orderId,
      dbId: result.order.id,
      riderId: result.rider.id,
      riderName: result.rider.name,
      walletBalance: result.rider.walletBalance,
    });

    return NextResponse.json({
      success: true,
      message: `Delivery completed! ₹${result.earned} wallet me add ho gaye.`,
      order: result.order,
      walletBalance: result.rider.walletBalance,
    });
  } catch (error: any) {
    if (error.message === 'ALREADY_DELIVERED') {
      return NextResponse.json({ error: 'Order pehle se delivered hai!' }, { status: 400 });
    }
    console.error('Deliver order error:', error);
    return NextResponse.json({ error: 'Failed to deliver: ' + error.message }, { status: 500 });
  }
}
