import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerPusherEvent } from '@/lib/pusher';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderIdParam = decodeURIComponent(id || '').trim();

    if (!orderIdParam) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Find order by either cuid id or orderId (e.g. LAP-1234)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdParam },
          { orderId: orderIdParam },
        ],
      },
      select: {
        id: true,
        orderId: true,
        customerName: true,
        phone: true,
        orderStatus: true,
        riderId: true,
        rider: {
          select: {
            id: true,
            riderCode: true,
            name: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
          },
        },
      },
    });

    const targetOrderIds = order ? [order.id, order.orderId] : [orderIdParam];

    const messages = await prisma.orderChatMessage.findMany({
      where: {
        orderId: { in: targetOrderIds },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      order,
      messages,
    });
  } catch (error: any) {
    console.error('Fetch order chat error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderIdParam = decodeURIComponent(id || '').trim();
    const body = await req.json();
    const { senderType, senderName, message, riderId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdParam },
          { orderId: orderIdParam },
        ],
      },
      select: {
        id: true,
        orderId: true,
        customerName: true,
        phone: true,
        riderId: true,
      },
    });

    const canonicalOrderId = order ? order.orderId : orderIdParam;
    const effectiveRiderId = riderId || order?.riderId || null;

    const chatMsg = await prisma.orderChatMessage.create({
      data: {
        orderId: canonicalOrderId,
        riderId: effectiveRiderId,
        senderType: senderType || 'RIDER',
        senderName: senderName ? senderName.trim() : (senderType === 'RIDER' ? 'Delivery Partner' : 'Customer'),
        message: message.trim(),
      },
    });

    // If Rider sent message, log to RiderActivity
    if (effectiveRiderId && senderType === 'RIDER') {
      await prisma.riderActivity.create({
        data: {
          riderId: effectiveRiderId,
          orderId: canonicalOrderId,
          activityType: 'CHAT_MESSAGE',
          title: `Sent message to customer`,
          description: `Message: "${message.trim().slice(0, 80)}"`,
          metadata: JSON.stringify({
            orderId: canonicalOrderId,
            message: message.trim(),
          }),
        },
      }).catch(() => {});
    }

    // Broadcast via Pusher for instant socket update if configured
    await triggerPusherEvent(`order-chat-${canonicalOrderId}`, 'new-message', chatMsg).catch(() => {});

    return NextResponse.json({ success: true, message: chatMsg });
  } catch (error: any) {
    console.error('Send order chat error:', error);
    return NextResponse.json({ error: 'Failed to send message: ' + error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderIdParam = decodeURIComponent(id || '').trim();
    const body = await req.json().catch(() => ({}));
    const { viewerType } = body;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdParam }, { orderId: orderIdParam }],
      },
      select: { id: true, orderId: true },
    });
    const targetOrderIds = order ? [order.id, order.orderId] : [orderIdParam];

    const filter: any = {
      orderId: { in: targetOrderIds },
      isRead: false,
    };
    if (viewerType) {
      filter.senderType = { not: viewerType };
    }

    const updated = await prisma.orderChatMessage.updateMany({
      where: filter,
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}
