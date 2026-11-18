import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Fetch all riders + real order/COD stats + undispatched queue for Admin
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeQueue = searchParams.get('includeQueue') === 'true';

    const riders = await prisma.rider.findMany({
      orderBy: [
        { createdAt: 'desc' },
      ],
      include: {
        orders: {
          select: {
            id: true,
            orderId: true,
            orderStatus: true,
            customerName: true,
            address: true,
            totalAmount: true,
            paymentMethod: true,
            paymentStatus: true,
            deliveredAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            payouts: true,
          },
        },
      },
    });

    const sanitized = riders.map((r) => {
      const { password, orders, ...rest } = r;
      const activeOrders = (orders || []).filter((o) =>
        ['Out For Delivery', 'Shipped', 'Ready', 'Confirmed', 'Packed'].includes(o.orderStatus)
      );
      const deliveredOrders = (orders || []).filter((o) => o.orderStatus === 'Delivered');
      const codCollected = deliveredOrders
        .filter((o) => (o.paymentMethod || '').toLowerCase().includes('cod') || (o.paymentMethod || '').toLowerCase().includes('cash'))
        .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      return {
        ...rest,
        orders: activeOrders,
        deliveredCount: deliveredOrders.length,
        codCollected,
      };
    });

    if (!includeQueue) {
      return NextResponse.json(sanitized);
    }

    const candidateQueue = await prisma.order.findMany({
      where: {
        riderId: null,
        orderStatus: { in: ['Confirmed', 'Packed', 'Ready', 'Shipped'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        orderId: true,
        customerName: true,
        phone: true,
        address: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        orderStatus: true,
        createdAt: true,
      },
    });

    const undispatchedOrders = candidateQueue.filter((o) => {
      const pm = (o.paymentMethod || '').toLowerCase();
      const addr = (o.address || '').toLowerCase();
      return !pm.includes('pickup') && !pm.includes('counter') && !addr.includes('store pickup') && !addr.includes('counter pickup');
    });

    return NextResponse.json({
      riders: sanitized,
      undispatchedOrders,
    });
  } catch (error: any) {
    console.error('Error fetching riders:', error);
    return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 });
  }
}

// POST: Add new rider from Admin Panel (Direct Creation)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, phone, password, vehicleType, vehicleNumber, 
      dlNumber, city, customRiderCode, commissionPerOrder, 
      approvalStatus, email, emergencyContact 
    } = body;

    if (!name || !name.trim() || !phone || !password) {
      return NextResponse.json({ error: 'Name, Phone and Password are required' }, { status: 400 });
    }

    const digitsOnly = phone.trim().replace(/\D/g, '');
    const cleanPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    const exists = await prisma.rider.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: `0${cleanPhone}` },
          { phone: `+91${cleanPhone}` },
          { phone: `91${cleanPhone}` },
          { phone: phone.trim() },
        ],
      },
    });

    if (exists) {
      return NextResponse.json({ 
        error: `Yeh phone number (${cleanPhone}) pehle se registered hai! (Rider ID: ${exists.riderCode || exists.id.slice(-6)})`,
        alreadyRegistered: true,
        riderCode: exists.riderCode,
      }, { status: 409 });
    }

    // Determine Unique Rider Code
    const allRiders = await prisma.rider.findMany({
      select: { riderCode: true },
    });
    const existingCodes = new Set(allRiders.map((r) => r.riderCode).filter(Boolean));

    let riderCode = customRiderCode ? customRiderCode.trim().toUpperCase() : null;
    if (riderCode && existingCodes.has(riderCode)) {
      return NextResponse.json({ error: `Rider Code ${riderCode} pehle se taken hai! Kripya doosra code dalein ya auto-generate hone dein.` }, { status: 400 });
    }

    if (!riderCode) {
      let maxNum = 0;
      for (const code of existingCodes) {
        const match = code?.match(/LAP-RD-(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      let nextNum = maxNum + 1;
      riderCode = `LAP-RD-${String(nextNum).padStart(3, '0')}`;
      while (existingCodes.has(riderCode)) {
        nextNum++;
        riderCode = `LAP-RD-${String(nextNum).padStart(3, '0')}`;
      }
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    let newRider: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        newRider = await prisma.rider.create({
          data: {
            riderCode,
            name: name.trim(),
            phone: cleanPhone,
            email: email ? email.trim() : null,
            password: hashedPassword,
            vehicleType: vehicleType || 'BIKE',
            vehicleNumber: vehicleNumber ? vehicleNumber.trim().toUpperCase() : null,
            dlNumber: dlNumber ? dlNumber.trim().toUpperCase() : null,
            city: city ? city.trim() : 'Garhwa',
            emergencyContact: emergencyContact ? emergencyContact.trim() : null,
            commissionPerOrder: Number(commissionPerOrder) || 25,
            approvalStatus: approvalStatus || 'APPROVED', // Admin created riders default to APPROVED
            isOnline: false,
            isBlocked: false,
          },
        });
        break;
      } catch (err: any) {
        if (err.code === 'P2002' && err.meta?.target?.includes('riderCode') && !customRiderCode) {
          const rand = Math.floor(100 + Math.random() * 900);
          riderCode = `LAP-RD-${rand}`;
          continue;
        }
        throw err;
      }
    }

    if (!newRider) {
      throw new Error('Rider generate nahi ho paya. Kripya punah prayas karein.');
    }

    const { password: _, ...sanitizedRider } = newRider;
    return NextResponse.json({ success: true, rider: sanitizedRider });
  } catch (error: any) {
    console.error('Error creating rider:', error);
    return NextResponse.json({ error: 'Failed to create rider: ' + error.message }, { status: 500 });
  }
}
