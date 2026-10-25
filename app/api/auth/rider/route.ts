import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SESSION_SECRET || 'lapiez-rider-secret-key-2026';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 });
    }

    const input = (phone || '').trim();
    const cleanPhone = input.replace(/[^0-9]/g, '');
    const rider = await prisma.rider.findFirst({
      where: {
        OR: [
          { riderCode: input.toUpperCase() },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          { phone: input },
        ],
      },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider nahi mila! Check phone number ya register karein.' }, { status: 404 });
    }

    // 1. Check Approval Status
    if (rider.approvalStatus === 'PENDING') {
      return NextResponse.json({ 
        error: 'Aapka account verification pending hai. Admin approval ke baad hi aap login kar sakte hain.' 
      }, { status: 403 });
    }

    if (rider.approvalStatus === 'REJECTED') {
      return NextResponse.json({ 
        error: `Aapka registration reject ho chuka hai: ${rider.rejectionReason || 'Kripya Admin se sampark karein.'}` 
      }, { status: 403 });
    }

    // 2. Check Block Status
    if (rider.isBlocked) {
      return NextResponse.json({ 
        error: `Aapka account Admin dwara block kar diya gaya hai. ${rider.blockReason ? `Karan: ${rider.blockReason}` : ''}` 
      }, { status: 403 });
    }

    // 3. Password Verification
    const isValid = await bcrypt.compare(password, rider.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Galat password. Kripya sahi password dalein.' }, { status: 401 });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { id: rider.id, phone: rider.phone, role: 'RIDER' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      token,
      rider: {
        id: rider.id,
        riderCode: rider.riderCode,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        vehicleType: rider.vehicleType,
        vehicleNumber: rider.vehicleNumber,
        city: rider.city,
        approvalStatus: rider.approvalStatus,
        isOnline: rider.isOnline,
        walletBalance: rider.walletBalance,
        commissionPerOrder: rider.commissionPerOrder,
        bankAccountNo: rider.bankAccountNo,
        bankIfsc: rider.bankIfsc,
        bankUpi: rider.bankUpi,
      },
    });
  } catch (error: any) {
    console.error('Rider login error:', error);
    return NextResponse.json({ error: 'Server error: ' + (error.message || 'Unknown') }, { status: 500 });
  }
}
