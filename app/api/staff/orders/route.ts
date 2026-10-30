import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasStaffOrAdminSession } from '@/lib/staffAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseOrder(order: any) {
  let items: any[] = [];
  try {
    items = JSON.parse(order.itemsJson);
    if (!Array.isArray(items)) items = [];
  } catch {
    items = [];
  }

  let handedOverBy = '';
  if (typeof order.address === 'string' && (order.address.includes('Handed Over By:') || order.address.includes('Sold By:'))) {
    const match = order.address.match(/(?:Handed Over By|Sold By):\s*([^•\n]+)/i);
    if (match) handedOverBy = match[1].trim();
  }

  const isStorePickup =
    (order.paymentMethod && order.paymentMethod.toLowerCase().includes('pickup')) ||
    (order.paymentMethod && order.paymentMethod.toLowerCase().includes('counter')) ||
    (order.address && order.address.toLowerCase().includes('store pickup')) ||
    (order.address && order.address.toLowerCase().includes('counter pickup'));

  return {
    ...order,
    items,
    itemsJson: undefined,
    handedOverBy,
    isStorePickup,
  };
}

export async function GET(request: NextRequest) {
  const session = hasStaffOrAdminSession(request);
  if (!session.authorized) {
    return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const tab = searchParams.get('tab') || 'all'; // 'aaya' | 'gya' | 'all'

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        rider: {
          select: {
            id: true,
            riderCode: true,
            name: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            isOnline: true,
          },
        },
      },
    });

    const parsedOrders = orders.map(parseOrder);

    // Calculate Inflow vs Outflow metrics
    // "Aaya" (Incoming / Pending): Confirmed, Packed, Ready, Verification Pending
    // "Gya" (Outgoing / Dispatched): Out For Delivery, Delivered, Handed Over
    const aayaOrders = parsedOrders.filter(
      (o) =>
        ['Confirmed', 'Packed', 'Ready', 'Ready for Pickup'].includes(o.orderStatus) &&
        o.orderStatus !== 'Cancelled'
    );

    const gyaOrders = parsedOrders.filter(
      (o) =>
        ['Out For Delivery', 'Delivered'].includes(o.orderStatus) ||
        (o.deliveredAt !== null && o.orderStatus !== 'Cancelled')
    );

    const cancelledOrders = parsedOrders.filter((o) => o.orderStatus === 'Cancelled');

    // Today's summary
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrders = parsedOrders.filter(
      (o) => o.date === todayStr || (o.createdAt && new Date(o.createdAt).toISOString().slice(0, 10) === todayStr)
    );

    let filtered = parsedOrders;
    if (tab === 'aaya') {
      filtered = aayaOrders;
    } else if (tab === 'gya') {
      filtered = gyaOrders;
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.phone && o.phone.includes(q)) ||
          (o.address && o.address.toLowerCase().includes(q)) ||
          o.items.some((it: any) => it.name && it.name.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      metrics: {
        total: parsedOrders.length,
        todayTotal: todayOrders.length,
        aayaCount: aayaOrders.length,
        gyaCount: gyaOrders.length,
        cancelledCount: cancelledOrders.length,
      },
      orders: filtered,
    });
  } catch (error) {
    console.error('Error fetching staff orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = hasStaffOrAdminSession(request);
  if (!session.authorized) {
    return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { orderId, orderStatus, paymentStatus, staffName } = body;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const effectiveStaff = staffName?.trim() || session.staffName || 'Showroom Staff';
    let updatedAddress = existingOrder.address || '';

    // If order is delivered or handed over, stamp the staff name in order notes/address
    if (orderStatus === 'Delivered' || staffName) {
      if (updatedAddress.includes('Handed Over By:')) {
        updatedAddress = updatedAddress.replace(/Handed Over By:\s*([^•\n]+)/i, `Handed Over By: ${effectiveStaff}`);
      } else {
        updatedAddress = `${updatedAddress} • Handed Over By: ${effectiveStaff}`;
      }
    }

    const dataToUpdate: any = {};
    if (orderStatus) {
      dataToUpdate.orderStatus = orderStatus;
      if (orderStatus === 'Delivered') {
        dataToUpdate.deliveredAt = new Date();
      }
    }
    if (paymentStatus) {
      dataToUpdate.paymentStatus = paymentStatus;
    }
    if (updatedAddress !== existingOrder.address) {
      dataToUpdate.address = updatedAddress;
    }

    const updated = await prisma.order.update({
      where: { orderId },
      data: dataToUpdate,
      include: {
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

    return NextResponse.json({
      success: true,
      order: parseOrder(updated),
      message: `Order #${orderId} successfully updated.`,
    });
  } catch (error) {
    console.error('Error updating staff order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
