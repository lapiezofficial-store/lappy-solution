import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerPusherEvent } from '@/lib/pusher';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // id can be db 'id' or 'orderId'
    const { riderId } = await req.json();

    if (!riderId) {
      return NextResponse.json({ error: 'Rider ID required' }, { status: 400 });
    }

    // Atomic transaction for Race Condition Protection
    const result = await prisma.$transaction(async (tx) => {
      // Find order by id or orderId
      const order = await tx.order.findFirst({
        where: {
          OR: [{ id: id }, { orderId: id }],
        },
      });

      if (!order) {
        throw new Error('ORDER_NOT_FOUND');
      }

      if (order.riderId) {
        throw new Error('ALREADY_TAKEN');
      }

      const rider = await tx.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new Error('RIDER_NOT_FOUND');
      }

      if (rider.isBlocked) {
        throw new Error('RIDER_BLOCKED');
      }

      // Assign to this rider & set status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          riderId: rider.id,
          orderStatus: 'Out For Delivery',
        },
      });

      return { order: updatedOrder, riderName: rider.name };
    });

    // 1. Notify Admin Panel
    await triggerPusherEvent('admin-channel', 'order-accepted', {
      orderId: result.order.orderId,
      dbId: result.order.id,
      riderId,
      riderName: result.riderName,
      status: 'Out For Delivery',
    });

    // 2. Remove from other riders' available list
    await triggerPusherEvent('riders-channel', 'order-taken', {
      orderId: result.order.orderId,
      dbId: result.order.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully!',
      order: result.order,
    });
  } catch (error: any) {
    if (error.message === 'ALREADY_TAKEN') {
      return NextResponse.json({ error: 'Ye order kisi aur rider ne pehle hi accept kar liya!' }, { status: 409 });
    }
    if (error.message === 'RIDER_BLOCKED') {
      return NextResponse.json({ error: 'Account blocked hai.' }, { status: 403 });
    }
    if (error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Order nahi mila' }, { status: 404 });
    }
    console.error('Accept order error:', error);
    return NextResponse.json({ error: 'Failed to accept order: ' + error.message }, { status: 500 });
  }
}
