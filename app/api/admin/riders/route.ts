import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Fetch all riders + order stats for Admin
export async function GET() {
  try {
    const riders = await prisma.rider.findMany({
      orderBy: [
        { createdAt: 'desc' },
      ],
      include: {
        orders: {
          where: {
            orderStatus: { in: ['Out For Delivery', 'Shipped', 'Ready', 'Confirmed', 'Packed'] },
          },
          select: {
            orderId: true,
            orderStatus: true,
            customerName: true,
            address: true,
            totalAmount: true,
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
      const { password, ...rest } = r;
      return rest;
    });

    return NextResponse.json(sanitized);
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

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Name, Phone and Password are required' }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const exists = await prisma.rider.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: phone.trim() },
        ],
      },
    });

    if (exists) {
      return NextResponse.json({ error: 'Yeh phone number pehle se registered hai!' }, { status: 409 });
    }

    // Determine Rider Code
    let riderCode = customRiderCode ? customRiderCode.trim().toUpperCase() : null;
    if (!riderCode) {
      const count = await prisma.rider.count();
      riderCode = `LAP-RD-${String(count + 1).padStart(3, '0')}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newRider = await prisma.rider.create({
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

    const { password: _, ...sanitizedRider } = newRider;
    return NextResponse.json({ success: true, rider: sanitizedRider });
  } catch (error: any) {
    console.error('Error creating rider:', error);
    return NextResponse.json({ error: 'Failed to create rider: ' + error.message }, { status: 500 });
  }
}
