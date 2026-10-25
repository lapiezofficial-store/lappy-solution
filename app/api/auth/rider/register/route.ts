import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, password, vehicleType, vehicleNumber, dlNumber, city, emergencyContact, email } = body;

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Name, Phone aur Password zaroori hain!' }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Sahi 10-digit mobile number dalein.' }, { status: 400 });
    }

    // Check if phone already registered
    const exists = await prisma.rider.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { phone: phone.trim() }],
      },
    });

    if (exists) {
      return NextResponse.json({ error: 'Yeh mobile number pehle se registered hai!' }, { status: 409 });
    }

    // Generate Auto Rider Code (e.g. LAP-RD-001, LAP-RD-002)
    const count = await prisma.rider.count();
    const riderCode = `LAP-RD-${String(count + 1).padStart(3, '0')}`;

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
        approvalStatus: 'PENDING', // Will wait for Admin Approval
        isOnline: false,
        isBlocked: false,
      },
    });

    const { password: _, ...sanitized } = newRider;

    return NextResponse.json({
      success: true,
      message: `Registration safal raha! Aapki Rider ID hai: ${riderCode}. Admin verification ke baad aapka account activate ho jayega.`,
      rider: sanitized,
    });
  } catch (error: any) {
    console.error('Rider registration error:', error);
    return NextResponse.json({ error: 'Registration fail hua: ' + error.message }, { status: 500 });
  }
}
