import { NextRequest, NextResponse } from 'next/server';
import { getDeliverySettings, saveDeliverySettings } from '@/lib/deliveryService';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'lapiez_dev_secret_key_2026';

export async function GET() {
  try {
    const settings = getDeliverySettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('lapiez_admin_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin login required' }, { status: 401 });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid admin session' }, { status: 401 });
    }

    const body = await req.json();
    const updated = saveDeliverySettings(body);

    return NextResponse.json({
      success: true,
      message: 'Delivery rate scale updated successfully',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
