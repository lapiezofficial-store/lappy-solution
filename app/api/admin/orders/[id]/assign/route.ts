import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerPusherEvent } from '@/lib/pusher';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { riderId, orderStatus } = await req.json();

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderId: id }],
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order nahi mila' }, { status: 404 });
    }

    if (!riderId) {
      // Unassign rider
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          riderId: null,
          orderStatus: orderStatus || 'Ready',
        },
      });
      return NextResponse.json({ success: true, message: 'Rider unassigned', order: updated });
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider nahi mila' }, { status: 404 });
    }

    if (rider.isBlocked) {
      return NextResponse.json({ error: 'Yeh rider blocked hai. Assign nahi kar sakte.' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        riderId: rider.id,
        orderStatus: orderStatus || 'Out For Delivery',
      },
    });

    // Notify Rider
    await triggerPusherEvent('riders-channel', 'order-assigned', {
      orderId: updatedOrder.orderId,
      riderId: rider.id,
      customerName: updatedOrder.customerName,
      address: updatedOrder.address,
    });

    // Notify Admin Panel
    await triggerPusherEvent('admin-channel', 'order-updated', {
      orderId: updatedOrder.orderId,
      riderId: rider.id,
      riderName: rider.name,
    });

    return NextResponse.json({
      success: true,
      message: `Order #${updatedOrder.orderId} rider ${rider.name} ko assign ho gaya!`,
      order: updatedOrder,
      rider: { id: rider.id, name: rider.name, phone: rider.phone },
    });
  } catch (error: any) {
    console.error('Assign rider error:', error);
    return NextResponse.json({ error: 'Failed to assign rider: ' + error.message }, { status: 500 });
  }
}
