import { prisma } from './prisma';
import { supabase } from './supabase';
import { triggerPusherEvent } from './pusher';

export interface NotificationPayload {
  recipient: string; // 'ADMIN' | phone | customerId | email
  type: 'NEW_ORDER' | 'ORDER_STATUS' | 'PAYMENT_STATUS' | 'SYSTEM';
  title: string;
  message: string;
  orderId?: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Creates and broadcasts an order notification to the Admin.
 */
export async function notifyAdminOnNewOrder(order: {
  orderId: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  paymentMethod: string;
  itemsJson?: string;
  address?: string;
}) {
  try {
    let itemCount = 1;
    try {
      if (order.itemsJson) {
        const parsed = JSON.parse(order.itemsJson);
        if (Array.isArray(parsed)) itemCount = parsed.length;
      }
    } catch {}

    const title = `New Order #${order.orderId}`;
    const message = `${order.customerName} (${order.phone}) placed an order for ₹${order.totalAmount.toLocaleString('en-IN')} (${itemCount} item${itemCount > 1 ? 's' : ''}).`;

    // 1. Persist notification in database
    const notification = await prisma.notification.create({
      data: {
        recipient: 'ADMIN',
        type: 'NEW_ORDER',
        title,
        message,
        orderId: order.orderId,
        link: '/admin',
        metadataJson: JSON.stringify({
          customerName: order.customerName,
          phone: order.phone,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          itemCount,
        }),
      },
    });

    const payload = {
      id: notification.id,
      orderId: order.orderId,
      customerName: order.customerName,
      phone: order.phone,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      title,
      message,
      createdAt: notification.createdAt,
    };

    // 2. Broadcast via Supabase Realtime (best-effort)
    try {
      const channel = supabase.channel('lapiez_notifications');
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'new_order',
            payload,
          }).finally(() => {
            supabase.removeChannel(channel).catch(() => {});
          });
        }
      });
    } catch (e) {
      console.warn('Supabase realtime broadcast notice:', e);
    }

    // 3. Pusher trigger (if configured)
    await triggerPusherEvent('admin-channel', 'new-order', payload).catch(() => {});

    return notification;
  } catch (error) {
    console.error('Error in notifyAdminOnNewOrder:', error);
    return null;
  }
}

/**
 * Creates and broadcasts an order status change notification to the Customer.
 */
export async function notifyCustomerOnOrderUpdate(order: {
  orderId: string;
  phone: string;
  customerName?: string;
  customerId?: string | null;
  customerEmail?: string | null;
  orderStatus: string;
  paymentStatus?: string;
  totalAmount?: number;
  riderName?: string;
}, updateType: 'STATUS' | 'PAYMENT' | 'RIDER' = 'STATUS') {
  try {
    const cleanPhone = (order.phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone && !order.customerId && !order.customerEmail) {
      return null;
    }

    let title = '';
    let message = '';

    if (updateType === 'PAYMENT') {
      if (order.paymentStatus === 'Paid') {
        title = `Payment Verified - Order #${order.orderId}`;
        message = `Payment for order #${order.orderId} has been verified. Official 18% GST invoice is available.`;
      } else if (order.paymentStatus === 'Rejected') {
        title = `Payment Verification Failed - Order #${order.orderId}`;
        message = `Payment for order #${order.orderId} could not be verified. Please submit correct UTR reference or contact showroom.`;
      } else {
        title = `Payment Status Updated - Order #${order.orderId}`;
        message = `Payment status for order #${order.orderId} is now ${order.paymentStatus}.`;
      }
    } else if (updateType === 'RIDER') {
      title = `Delivery Rider Assigned - Order #${order.orderId}`;
      message = order.riderName
        ? `Rider ${order.riderName} has been assigned to deliver order #${order.orderId}.`
        : `A delivery rider has been assigned for order #${order.orderId}.`;
    } else {
      // Order status updates
      switch (order.orderStatus) {
        case 'Confirmed':
          title = `Order Confirmed - #${order.orderId}`;
          message = `Your order #${order.orderId} has been confirmed by Lapiez Showroom. Packaging started.`;
          break;
        case 'Packed':
          title = `Order Packed - #${order.orderId}`;
          message = `Order #${order.orderId} is packed and ready for dispatch / showroom pickup.`;
          break;
        case 'Ready':
          title = `Ready for Pickup - #${order.orderId}`;
          message = `Order #${order.orderId} is ready for collection at the Lapiez Showroom counter.`;
          break;
        case 'Shipped':
        case 'Out For Delivery':
          title = `Out for Delivery - #${order.orderId}`;
          message = `Order #${order.orderId} is out for delivery and will arrive shortly.`;
          break;
        case 'Delivered':
          title = `Order Delivered - #${order.orderId}`;
          message = `Order #${order.orderId} has been successfully delivered. Thank you for shopping with Lapiez Garhwa!`;
          break;
        case 'Cancelled':
          title = `Order Cancelled - #${order.orderId}`;
          message = `Order #${order.orderId} has been cancelled. Please contact showroom for details.`;
          break;
        default:
          title = `Order Update - #${order.orderId}`;
          message = `Order #${order.orderId} status updated to ${order.orderStatus}.`;
      }
    }

    const recipient = cleanPhone || order.customerId || order.customerEmail || 'CUSTOMER';

    // 1. Persist notification in database
    const notification = await prisma.notification.create({
      data: {
        recipient,
        type: updateType === 'PAYMENT' ? 'PAYMENT_STATUS' : 'ORDER_STATUS',
        title,
        message,
        orderId: order.orderId,
        link: `/account?tab=orders`,
        metadataJson: JSON.stringify({
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          customerName: order.customerName,
          phone: cleanPhone,
        }),
      },
    });

    const payload = {
      id: notification.id,
      orderId: order.orderId,
      recipient,
      phone: cleanPhone,
      customerId: order.customerId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      title,
      message,
      createdAt: notification.createdAt,
    };

    // 2. Broadcast via Supabase Realtime (best-effort)
    try {
      const channel = supabase.channel('lapiez_notifications');
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'customer_order_update',
            payload,
          }).finally(() => {
            supabase.removeChannel(channel).catch(() => {});
          });
        }
      });
    } catch (e) {
      console.warn('Customer notification broadcast notice:', e);
    }

    // 3. Pusher trigger (if configured)
    await triggerPusherEvent('customer-channel', 'order-update', payload).catch(() => {});

    return notification;
  } catch (error) {
    console.error('Error in notifyCustomerOnOrderUpdate:', error);
    return null;
  }
}

