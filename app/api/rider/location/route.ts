import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerPusherEvent } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const { riderId, lat, lng, locationText } = await req.json();

    if (!riderId) {
      return NextResponse.json({ error: 'Rider ID required' }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.rider.update({
      where: { id: riderId },
      data: {
        ...(lat !== undefined && { currentLat: Number(lat) }),
        ...(lng !== undefined && { currentLng: Number(lng) }),
        ...(locationText && { lastLocationText: locationText }),
        lastActiveAt: now,
        isOnline: true, // Activity ping marks rider online
      },
      select: {
        id: true,
        riderCode: true,
        name: true,
        phone: true,
        vehicleType: true,
        currentLat: true,
        currentLng: true,
        lastLocationText: true,
        lastActiveAt: true,
        isOnline: true,
      },
    });

    // Real-time broadcast to Admin Panel
    await triggerPusherEvent('admin-channel', 'rider-location-update', {
      riderId: updated.id,
      riderCode: updated.riderCode,
      name: updated.name,
      lat: updated.currentLat,
      lng: updated.currentLng,
      locationText: updated.lastLocationText,
      lastActiveAt: updated.lastActiveAt,
    });

    return NextResponse.json({ success: true, rider: updated });
  } catch (error: any) {
    console.error('Rider location update error:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}
