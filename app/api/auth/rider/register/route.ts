import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, password, vehicleType, vehicleNumber, dlNumber, city, emergencyContact, email } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Kripya apna pura naam dalein.' }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Kripya apna mobile number dalein.' }, { status: 400 });
    }

    if (!password || password.trim().length < 4) {
      return NextResponse.json({ error: 'Password kam se kam 4 characters ka hona chahiye.' }, { status: 400 });
    }

    // Normalize phone number: strip non-digits, leading zero, country code
    const digitsOnly = phone.trim().replace(/\D/g, '');
    const cleanPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Kripya sahi 10-digit mobile number dalein.' }, { status: 400 });
    }

    // Check if phone is already registered under any format
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
        error: `Yeh mobile number (${cleanPhone}) pehle se registered hai! Aapki Rider ID hai: ${exists.riderCode || exists.id.slice(-6)}. Kripya Login karein.`,
        alreadyRegistered: true,
        riderCode: exists.riderCode,
      }, { status: 409 });
    }

    // Generate Guaranteed Unique Rider Code (e.g. LAP-RD-001, LAP-RD-002, ...)
    const allRiders = await prisma.rider.findMany({
      select: { riderCode: true },
    });
    const existingCodes = new Set(allRiders.map((r) => r.riderCode).filter(Boolean));

    let maxNum = 0;
    for (const code of existingCodes) {
      const match = code?.match(/LAP-RD-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }

    let nextNum = maxNum + 1;
    let riderCode = `LAP-RD-${String(nextNum).padStart(3, '0')}`;
    while (existingCodes.has(riderCode)) {
      nextNum++;
      riderCode = `LAP-RD-${String(nextNum).padStart(3, '0')}`;
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Create Rider with collision retry loop
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
            approvalStatus: 'PENDING', // Requires approval from Showroom Staff or Admin
            commissionPerOrder: 25,
            isOnline: false,
            isBlocked: false,
          },
        });
        break;
      } catch (err: any) {
        if (err.code === 'P2002' && err.meta?.target?.includes('riderCode')) {
          nextNum++;
          riderCode = `LAP-RD-${String(nextNum).padStart(3, '0')}`;
          continue;
        }
        if (err.code === 'P2002' && err.meta?.target?.includes('phone')) {
          return NextResponse.json({
            error: `Yeh phone number (${cleanPhone}) pehle se registered hai! Kripya Login karein.`,
            alreadyRegistered: true,
          }, { status: 409 });
        }
        throw err;
      }
    }

    if (!newRider) {
      throw new Error('Rider ID generate nahi ho payi. Kripya punah prayas karein.');
    }

    // Record registration submission in RiderActivity timeline
    await prisma.riderActivity.create({
      data: {
        riderId: newRider.id,
        activityType: 'REGISTRATION_SUBMITTED',
        title: 'New Rider Registered (Pending Verification)',
        description: `Rider ${newRider.name} (${newRider.riderCode}, phone: ${newRider.phone}) ne register kiya. Showroom Staff ya Admin se verification & approval pending hai.`,
        locationText: newRider.city || 'Garhwa',
      },
    }).catch(() => {});

    const { password: _, ...sanitized } = newRider;

    return NextResponse.json({
      success: true,
      status: 'PENDING',
      message: `Registration safal raha! Aapki Rider ID hai: ${riderCode}. Showroom Staff ya Admin dwara verification ke baad account activate ho jayega.`,
      rider: sanitized,
    });
  } catch (error: any) {
    console.error('Rider registration error:', error);
    return NextResponse.json({ 
      error: 'Registration fail hua: ' + (error.message || 'Kripya details check karke dobara prayas karein.') 
    }, { status: 500 });
  }
}
