import { NextRequest, NextResponse } from 'next/server';
import { recordCustomerLocation, getRecentCustomerLocations, calculateDeliveryFee } from '@/lib/deliveryService';
import { triggerPusherEvent } from '@/lib/pusher';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'lapiez_dev_secret_key_2026';

export async function GET(req: NextRequest) {
  try {
    // Admin check
    const cookieStore = await cookies();
    const token = cookieStore.get('lapiez_admin_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const locations = getRecentCustomerLocations(limit);

    return NextResponse.json({ success: true, locations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    const distanceKm = typeof body.distanceKm === 'number' ? body.distanceKm : 3;
    const { fee, slab } = calculateDeliveryFee(distanceKm, body.subtotal || 0);

    const saved = recordCustomerLocation({
      area: body.area || 'Garhwa Town',
      city: body.city || 'Garhwa',
      pincode: body.pincode || '822114',
      landmark: body.landmark,
      distanceKm,
      distanceSlab: slab.name,
      deliveryFee: fee,
      ip,
      userAgent: userAgent.substring(0, 120),
    });

    // Broadcast to Admin via Pusher if available
    try {
      await triggerPusherEvent('admin-channel', 'customer-location', {
        id: saved.id,
        area: saved.area,
        city: saved.city,
        pincode: saved.pincode,
        distanceKm: saved.distanceKm,
        distanceSlab: saved.distanceSlab,
        deliveryFee: saved.deliveryFee,
        timestamp: saved.timestamp,
        ip,
      });
    } catch (e) {
      // Pusher broadcast is non-blocking
    }

    return NextResponse.json({
      success: true,
      location: saved,
      fee,
      slab,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

