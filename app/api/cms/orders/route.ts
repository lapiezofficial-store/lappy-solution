import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { INITIAL_COUPONS, Coupon, calculateCouponDiscount } from '@/data/coupons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const orderIpRateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ORDERS_PER_IP = 5;
const IP_WINDOW_MS = 15 * 60 * 1000;
const MAX_ORDERS_PER_PHONE_DB = 3;
const PHONE_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

function checkIpRateLimit(ip: string): { isBlocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  if (orderIpRateLimitStore.size > 1000) {
    for (const [key, record] of orderIpRateLimitStore.entries()) {
      if (record.resetAt <= now) orderIpRateLimitStore.delete(key);
    }
  }

  const record = orderIpRateLimitStore.get(ip);
  if (!record || record.resetAt <= now) {
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_ORDERS_PER_IP) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { isBlocked: true, retryAfterSeconds };
  }

  return { isBlocked: false, retryAfterSeconds: 0 };
}

function recordOrderIpAttempt(ip: string) {
  const now = Date.now();
  const record = orderIpRateLimitStore.get(ip);
  if (!record || record.resetAt <= now) {
    orderIpRateLimitStore.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
  } else {
    record.count += 1;
  }
}

const toClientOrder = (order: { itemsJson: string; address?: string } & Record<string, unknown>) => {
  let items: unknown[] = [];
  try {
    const parsed = JSON.parse(order.itemsJson);
    items = Array.isArray(parsed) ? parsed : [];
  } catch {}
  const rest = Object.fromEntries(Object.entries(order).filter(([key]) => key !== 'itemsJson'));

  let pickupHandedBy = '';
  if (typeof order.address === 'string' && (order.address.includes('Handed Over By:') || order.address.includes('Sold By:'))) {
    const match = order.address.match(/(?:Handed Over By|Sold By):\s*([^•\n]+)/i);
    if (match) pickupHandedBy = match[1].trim();
  }

  let approvedBy = '';
  if (typeof order.address === 'string' && order.address.includes('Approved By:')) {
    const match = order.address.match(/Approved By:\s*([^•\n]+)/i);
    if (match) approvedBy = match[1].trim();
  }
  if (approvedBy === 'Jay Prakash Chaubey' || approvedBy === 'Jay Prakash') {
    approvedBy = 'Lapiez';
  }

  return { ...rest, items, pickupHandedBy, approvedBy };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  // Single order lookup (e.g. order confirmation, public tracking)
  if (orderId) {
    const cleanId = orderId.trim();
    try {
      const order = await prisma.order.findUnique({
        where: { orderId: cleanId },
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
              currentLat: true,
              currentLng: true,
              lastLocationText: true,
            },
          },
        },
      });
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ order: toClientOrder(order) });
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
  }

  // Bulk order list requires admin session
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
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
            currentLat: true,
            currentLng: true,
            lastLocationText: true,
          },
        },
      },
    });
    return NextResponse.json({ orders: orders.map(toClientOrder) });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. IP-level rate limiting
    const clientIp = getClientIp(request);
    const ipLimit = checkIpRateLimit(clientIp);
    if (ipLimit.isBlocked) {
      return NextResponse.json(
        { error: `Too many order attempts from your network. Please try again in ${ipLimit.retryAfterSeconds} seconds.` },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const phone = rawPhone.replace(/\D/g, '').slice(-10); // Standardize 10-digit Indian phone
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const requestedItems = Array.isArray(body.items) ? body.items : [];

    if (!customerName || customerName.length < 2 || customerName.length > 100) {
      return NextResponse.json({ error: 'Please enter a valid customer name (2-100 characters).' }, { status: 400 });
    }

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    }

    if (!address || address.length < 5 || address.length > 300) {
      return NextResponse.json({ error: 'Please enter a valid delivery or showroom pickup address.' }, { status: 400 });
    }

    if (requestedItems.length === 0 || requestedItems.length > 25) {
      return NextResponse.json({ error: 'Order must contain between 1 and 25 items.' }, { status: 400 });
    }

    // 2. Database-level rate limiting across Vercel serverless instances (checks orders by phone in last 15 mins)
    const phoneWindowStart = new Date(Date.now() - PHONE_WINDOW_MS);
    const recentOrdersByPhone = await prisma.order.count({
      where: {
        phone: { contains: phone },
        createdAt: { gte: phoneWindowStart },
      },
    });

    if (recentOrdersByPhone >= MAX_ORDERS_PER_PHONE_DB) {
      return NextResponse.json(
        { error: 'Too many orders placed with this phone number. Please wait 15 minutes before placing a new order.' },
        {
          status: 429,
          headers: { 'Retry-After': '900' },
        }
      );
    }

    // 3. Item and quantity validation
    const quantities = new Map<string, number>();
    for (const item of requestedItems) {
      const id = typeof item?.productId === 'string' ? item.productId : item?.id;
      const quantity = Number(item?.quantity);
      if (typeof id !== 'string' || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return NextResponse.json({ error: 'Invalid order item quantity. Maximum 10 units per item.' }, { status: 400 });
      }
      quantities.set(id, (quantities.get(id) ?? 0) + quantity);
    }

    const products = await prisma.product.findMany({
      where: { id: { in: [...quantities.keys()] }, status: 'active', inStock: true },
    });

    if (products.length !== quantities.size) {
      return NextResponse.json({ error: 'One or more selected products are unavailable or discontinued.' }, { status: 409 });
    }

    for (const product of products) {
      const requestedQty = quantities.get(product.id) ?? 0;
      if (product.stockQuantity < requestedQty) {
        return NextResponse.json({ error: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}` }, { status: 409 });
      }
    }

    // Recalculate trusted gross subtotal from database product prices
    const items = products.map((product) => ({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantities.get(product.id) ?? 0,
      image: product.image,
      category: product.category,
      sku: product.sku,
    }));
    const subtotalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);

    // Validate coupon if provided
    let finalCouponCode: string | null = null;
    let finalCouponDiscount = 0;
    const requestedCoupon = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : null;

    if (requestedCoupon) {
      // Check in database first
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: requestedCoupon },
      }).catch(() => null);

      if (dbCoupon) {
        const couponObj: Coupon = {
          id: dbCoupon.id,
          code: dbCoupon.code,
          title: dbCoupon.title,
          discountType: dbCoupon.discountType === 'fixed' ? 'fixed' : 'percentage',
          discountValue: dbCoupon.discountValue,
          minOrder: dbCoupon.minOrder,
          maxDiscount: dbCoupon.maxDiscount ?? undefined,
          audience: (dbCoupon.audience === 'premium' ? 'premium' : dbCoupon.audience === 'normal' ? 'normal' : 'all'),
          description: dbCoupon.description || '',
          isActive: dbCoupon.isActive,
          validUntil: dbCoupon.validUntil || undefined,
          usageLimit: dbCoupon.usageLimit ?? undefined,
          timesUsed: dbCoupon.timesUsed,
        };
        const validation = calculateCouponDiscount(couponObj, subtotalAmount);
        if (validation.isValid) {
          finalCouponCode = dbCoupon.code;
          finalCouponDiscount = validation.discountAmount;
        }
      } else {
        // Fallback to static initial coupons
        const staticCoupon = INITIAL_COUPONS.find((c) => c.code === requestedCoupon);
        if (staticCoupon) {
          const validation = calculateCouponDiscount(staticCoupon, subtotalAmount);
          if (validation.isValid) {
            finalCouponCode = staticCoupon.code;
            finalCouponDiscount = validation.discountAmount;
          }
        }
      }
    }

    const totalAmount = Math.max(0, subtotalAmount - finalCouponDiscount);

    const rawMethod = String(body.paymentMethod || '').toLowerCase();
    const isUpi = rawMethod.includes('upi') || rawMethod === 'upi_qr';
    const isCod = rawMethod.includes('cod') || rawMethod.includes('cash') || rawMethod.includes('pickup') || rawMethod.includes('counter');
    const isNetbanking = rawMethod.includes('netbanking') || rawMethod.includes('bank');

    if (!isUpi && !isCod && !isNetbanking) {
      return NextResponse.json({ error: 'Unsupported payment method. Please select UPI QR or Cash on Counter/Delivery.' }, { status: 400 });
    }

    const utrNumber = typeof body.utrNumber === 'string' ? body.utrNumber.trim() : null;
    if (isUpi && (!utrNumber || !/^[A-Za-z0-9-]{6,40}$/.test(utrNumber))) {
      return NextResponse.json({ error: 'Please enter a valid UPI transaction reference (UTR / Reference number).' }, { status: 400 });
    }

    // 4. Duplicate UTR check: Prevent submitting the same UTR for multiple active orders
    if (isUpi && utrNumber) {
      const existingUtr = await prisma.order.findFirst({
        where: {
          utrNumber: { equals: utrNumber, mode: 'insensitive' },
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          NOT: { orderStatus: 'Cancelled' },
        },
        select: { id: true, orderId: true },
      });

      if (existingUtr) {
        return NextResponse.json({
          error: `This UPI Reference / UTR number (${utrNumber}) has already been submitted for order #${existingUtr.orderId}. If you believe this is an error, please contact showroom support.`
        }, { status: 409 });
      }
    }

    // Generate or validate canonical order ID on server (accepts LPZ- and LS- prefixes)
    const rawOrderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const orderId = /^(LPZ|LS)-[A-Za-z0-9-]{4,40}$/.test(rawOrderId)
      ? rawOrderId
      : `LPZ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const pickupHandedBy = typeof body.pickupHandedBy === 'string' ? body.pickupHandedBy.trim() : '';
    let finalAddress = address;
    if (pickupHandedBy && !finalAddress.includes('Handed Over By:')) {
      finalAddress = `${finalAddress} • Handed Over By: ${pickupHandedBy}`;
    }

    const isPickup = rawMethod.includes('pickup') || rawMethod.includes('counter') || finalAddress.toLowerCase().includes('pickup');
    const resolvedPaymentMethod = isUpi
      ? (isPickup ? 'Store Pickup (Online UPI QR)' : 'UPI Dynamic QR (GPay/PhonePe)')
      : (isPickup ? 'Store Pickup (Cash at Counter)' : (isCod ? 'Cash on Delivery (COD)' : 'NetBanking'));

    const order = await prisma.$transaction(async (tx) => {
      // Atomic inventory deduction with concurrency check
      for (const product of products) {
        const quantity = quantities.get(product.id) ?? 0;
        const willBeOutOfStock = product.stockQuantity === quantity;
        const updated = await tx.product.updateMany({
          where: { id: product.id, stockQuantity: { gte: quantity }, inStock: true },
          data: { 
            stockQuantity: { decrement: quantity },
            ...(willBeOutOfStock ? { inStock: false } : {}),
          },
        });
        if (updated.count !== 1) {
          throw new Error(`STOCK_UNAVAILABLE:${product.name}`);
        }
      }

      // Increment coupon usage count if applied
      if (finalCouponCode) {
        await tx.coupon.updateMany({
          where: { code: finalCouponCode },
          data: { timesUsed: { increment: 1 } },
        }).catch(() => null);
      }

      return tx.order.create({
        data: {
          orderId,
          customerId: typeof body.customerId === 'string' ? body.customerId.trim() : null,
          customerEmail: typeof body.customerEmail === 'string' && body.customerEmail.includes('@')
            ? body.customerEmail.trim()
            : (typeof body.email === 'string' && body.email.includes('@') ? body.email.trim() : null),
          customerName,
          phone,
          email: typeof body.email === 'string' && body.email.includes('@') ? body.email.trim() : null,
          address: finalAddress,
          itemsJson: JSON.stringify(items),
          subtotalAmount,
          couponCode: finalCouponCode,
          couponDiscount: finalCouponDiscount,
          totalAmount,
          paymentMethod: resolvedPaymentMethod,
          paymentStatus: isUpi ? 'Verification Pending' : (isCod ? 'Pending Payment' : 'Verification Pending'),
          utrNumber: isUpi ? utrNumber : null,
          orderStatus: 'Confirmed',
          inventoryStatus: 'allocated',
          date: new Date().toISOString().slice(0, 10),
        },
      });
    });

    // Record successful order attempt in IP rate limiter
    recordOrderIpAttempt(clientIp);

    return NextResponse.json({ success: true, order: toClientOrder(order) }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('STOCK_UNAVAILABLE:')) {
      const prodName = error.message.split('STOCK_UNAVAILABLE:')[1];
      return NextResponse.json({ error: `Stock changed for "${prodName}". Please try again.` }, { status: 409 });
    }
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Unable to place this order. Please try again.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { orderId, paymentStatus, orderStatus } = body;
    const paymentStatuses = new Set(['Pending Payment', 'Verification Pending', 'Paid', 'Rejected']);
    const orderStatuses = new Set(['Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled']);

    if (typeof orderId !== 'string' || (!paymentStatuses.has(paymentStatus) && !orderStatuses.has(orderStatus))) {
      return NextResponse.json({ error: 'Invalid order update parameters.' }, { status: 400 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { orderId },
      });

      if (!currentOrder) {
        throw new Error('ORDER_NOT_FOUND');
      }

      const nextOrderStatus = orderStatuses.has(orderStatus) ? orderStatus : currentOrder.orderStatus;
      const nextPaymentStatus = paymentStatuses.has(paymentStatus) ? paymentStatus : currentOrder.paymentStatus;
      const willBeCancelledOrRejected = nextOrderStatus === 'Cancelled' || nextPaymentStatus === 'Rejected';
      const isCurrentlyActive = currentOrder.inventoryStatus === 'allocated' && currentOrder.orderStatus !== 'Cancelled' && currentOrder.paymentStatus !== 'Rejected';

      let newInventoryStatus = currentOrder.inventoryStatus;

      // Restore stock exactly once when transitioning from active -> Cancelled or Rejected
      if (isCurrentlyActive && willBeCancelledOrRejected) {
        let items: Array<{ id?: string; productId?: string; quantity?: number }> = [];
        try {
          const parsed = JSON.parse(currentOrder.itemsJson);
          if (Array.isArray(parsed)) items = parsed;
        } catch {
          console.error(`Failed to parse itemsJson for order ${orderId}`);
        }

        for (const item of items) {
          const prodId = item.productId || item.id;
          const qty = Number(item.quantity) || 1;
          if (typeof prodId === 'string' && qty > 0) {
            await tx.product.updateMany({
              where: { id: prodId },
              data: {
                stockQuantity: { increment: qty },
                inStock: true,
              },
            });
          }
        }
        newInventoryStatus = 'restored';
      } else if (currentOrder.inventoryStatus === 'restored' && !willBeCancelledOrRejected) {
        // Re-activating a previously cancelled order: re-decrement stock if available
        let items: Array<{ id?: string; productId?: string; quantity?: number }> = [];
        try {
          const parsed = JSON.parse(currentOrder.itemsJson);
          if (Array.isArray(parsed)) items = parsed;
        } catch {}

        for (const item of items) {
          const prodId = item.productId || item.id;
          const qty = Number(item.quantity) || 1;
          if (typeof prodId === 'string' && qty > 0) {
            await tx.product.updateMany({
              where: { id: prodId, stockQuantity: { gte: qty } },
              data: {
                stockQuantity: { decrement: qty },
              },
            });
          }
        }
        newInventoryStatus = 'allocated';
      }

      let updatedAddress = currentOrder.address;
      const staffName = typeof body.pickupHandedBy === 'string'
        ? body.pickupHandedBy.trim()
        : (typeof body.staffName === 'string' ? body.staffName.trim() : '');

      if (staffName) {
        if (updatedAddress.includes('Handed Over By:')) {
          updatedAddress = updatedAddress.replace(/Handed Over By:\s*([^•\n]+)/i, `Handed Over By: ${staffName}`);
        } else if (updatedAddress.includes('Sold By:')) {
          updatedAddress = updatedAddress.replace(/Sold By:\s*([^•\n]+)/i, `Sold By: ${staffName}`);
        } else {
          updatedAddress = `${updatedAddress} • Handed Over By: ${staffName}`;
        }
      }

      const approverName = typeof body.approvedBy === 'string' ? body.approvedBy.trim() : '';
      if (approverName) {
        if (updatedAddress.includes('Approved By:')) {
          updatedAddress = updatedAddress.replace(/Approved By:\s*([^•\n]+)/i, `Approved By: ${approverName}`);
        } else {
          updatedAddress = `${updatedAddress} • Approved By: ${approverName}`;
        }
      }

      return tx.order.update({
        where: { orderId },
        data: {
          ...(paymentStatuses.has(paymentStatus) ? { paymentStatus } : {}),
          ...(orderStatuses.has(orderStatus) ? { orderStatus } : {}),
          ...(staffName || approverName ? { address: updatedAddress } : {}),
          inventoryStatus: newInventoryStatus,
        },
      });
    });

    return NextResponse.json({ success: true, order: toClientOrder(updatedOrder) });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
