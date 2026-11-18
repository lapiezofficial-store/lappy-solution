import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch real-time activities for a rider or for all riders (Admin View)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const riderId = searchParams.get('riderId');
    const orderId = searchParams.get('orderId');
    const limit = Math.min(Number(searchParams.get('limit')) || 40, 100);

    const where: any = {};
    if (riderId) where.riderId = riderId;
    if (orderId) where.orderId = orderId;

    const activities = await prisma.riderActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
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

    return NextResponse.json({ success: true, activities });
  } catch (error: any) {
    console.error('Fetch rider activities error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// POST: Log a new rider activity
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { riderId, orderId, activityType, title, description, lat, lng, locationText, metadata } = body;

    if (!riderId || !activityType || !title) {
      return NextResponse.json({ error: 'riderId, activityType and title are required' }, { status: 400 });
    }

    const activity = await prisma.riderActivity.create({
      data: {
        riderId,
        orderId: orderId || null,
        activityType,
        title: title.trim(),
        description: description ? description.trim() : title.trim(),
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        locationText: locationText || null,
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      },
      include: {
        rider: {
          select: {
            id: true,
            riderCode: true,
            name: true,
          },
        },
      },
    });

    // Also update rider's lastActiveAt and location if provided
    await prisma.rider.update({
      where: { id: riderId },
      data: {
        lastActiveAt: new Date(),
        ...(lat && lng ? { currentLat: Number(lat), currentLng: Number(lng) } : {}),
        ...(locationText ? { lastLocationText: locationText } : {}),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error('Log rider activity error:', error);
    return NextResponse.json({ error: 'Failed to log activity: ' + error.message }, { status: 500 });
  }
}
