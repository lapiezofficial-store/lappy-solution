import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch call logs for a rider or order
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const riderId = searchParams.get('riderId');
    const orderId = searchParams.get('orderId');

    const where: any = {};
    if (riderId) where.riderId = riderId;
    if (orderId) where.orderId = orderId;

    const callLogs = await prisma.riderCallLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        rider: {
          select: {
            id: true,
            riderCode: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, callLogs });
  } catch (error: any) {
    console.error('Fetch rider call logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 });
  }
}

// POST: Log a customer call made by rider
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { riderId, orderId, customerName, customerPhone, callStatus, outcomeNote, durationSec } = body;

    if (!riderId || !customerPhone) {
      return NextResponse.json({ error: 'riderId and customerPhone are required' }, { status: 400 });
    }

    const cleanPhone = customerPhone.trim().replace(/\D/g, '').slice(-10);

    const callLog = await prisma.riderCallLog.create({
      data: {
        riderId,
        orderId: orderId || null,
        customerName: customerName ? customerName.trim() : null,
        customerPhone: cleanPhone || customerPhone.trim(),
        callStatus: callStatus || 'INITIATED',
        outcomeNote: outcomeNote ? outcomeNote.trim() : null,
        durationSec: Number(durationSec) || 0,
      },
    });

    // Also record in RiderActivity timeline
    await prisma.riderActivity.create({
      data: {
        riderId,
        orderId: orderId || null,
        activityType: 'CALL_CUSTOMER',
        title: `Called Customer ${customerName ? `(${customerName})` : ''}`,
        description: `Customer mobile ${cleanPhone || customerPhone} par call kiya.${outcomeNote ? ` Note: ${outcomeNote}` : ''}`,
        metadata: JSON.stringify({
          customerName,
          customerPhone: cleanPhone,
          callStatus,
          outcomeNote,
        }),
      },
    }).catch((err) => console.error('Failed to log call activity:', err));

    return NextResponse.json({ success: true, callLog });
  } catch (error: any) {
    console.error('Create call log error:', error);
    return NextResponse.json({ error: 'Failed to save call log: ' + error.message }, { status: 500 });
  }
}
