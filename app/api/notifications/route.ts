import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientParam = searchParams.get('recipient')?.trim();
    const phoneParam = searchParams.get('phone')?.trim();
    const customerIdParam = searchParams.get('customerId')?.trim();

    const isAdmin = hasAdminSession(request);

    // If querying admin notifications, enforce admin session
    if (recipientParam === 'ADMIN') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const notifications = await prisma.notification.findMany({
        where: { recipient: 'ADMIN' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const unreadCount = await prisma.notification.count({
        where: { recipient: 'ADMIN', read: false },
      });

      return NextResponse.json({ notifications, unreadCount });
    }

    // Customer notifications query
    const targetRecipients: string[] = [];
    if (recipientParam && recipientParam !== 'ADMIN') {
      targetRecipients.push(recipientParam);
    }
    if (phoneParam) {
      const cleanPhone = phoneParam.replace(/\D/g, '').slice(-10);
      if (cleanPhone) targetRecipients.push(cleanPhone);
    }
    if (customerIdParam) {
      targetRecipients.push(customerIdParam);
    }

    if (targetRecipients.length === 0) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipient: { in: targetRecipients },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        recipient: { in: targetRecipients },
        read: false,
      },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, markAllRead, recipient } = body;

    if (id) {
      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      return NextResponse.json({ success: true, notification: updated });
    }

    if (markAllRead && recipient) {
      await prisma.notification.updateMany({
        where: { recipient, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: 'All marked as read' });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const recipient = searchParams.get('recipient');

    if (id) {
      await prisma.notification.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: 'Notification deleted' });
    }

    if (recipient) {
      await prisma.notification.deleteMany({
        where: { recipient },
      });
      return NextResponse.json({ success: true, message: 'Notifications cleared' });
    }

    return NextResponse.json({ error: 'Missing id or recipient' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}

