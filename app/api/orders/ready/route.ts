import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerPusherEvent } from '@/lib/pusher';

// GET: Fetch available ready orders for riders
export async function GET() {
  try {
    const readyOrders = await prisma.order.findMany({
      where: {
        orderStatus: { in: ['Ready', 'READY', 'Packed', 'PACKED'] },
        riderId: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(readyOrders);
  } catch (error: any) {
    console.error('Error fetching ready orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST: Mark order as READY from Admin or Store and broadcast to riders
export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    const order = await prisma.order.update({
      where: { orderId: orderId },
      data: {
        orderStatus: 'Ready',
      },
    });

    // Notify all online riders
    await triggerPusherEvent('riders-channel', 'new-order', {
      id: order.id,
      orderId: order.orderId,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Error setting order to ready:', error);
    return NextResponse.json({ error: 'Failed to mark ready: ' + error.message }, { status: 500 });
  }
}
