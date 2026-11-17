import { NextRequest, NextResponse } from 'next/server';
import { getDeliverySettings, saveDeliverySettings } from '@/lib/deliveryService';
import { hasAdminSession } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Try reading persistent settings from database
    try {
      const dbRecord = await prisma.customPage.findUnique({
        where: { slug: '_system_delivery_rates' },
      });
      if (dbRecord?.content) {
        const parsed = JSON.parse(dbRecord.content);
        if (parsed && Array.isArray(parsed.slabs) && parsed.slabs.length > 0) {
          saveDeliverySettings(parsed); // Sync memory cache
          return NextResponse.json({ success: true, settings: parsed });
        }
      }
    } catch (dbErr) {
      // Database read fallback to local cache
    }

    const settings = getDeliverySettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication using universal session check
    if (!hasAdminSession(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin login required' }, { status: 401 });
    }

    const body = await req.json();
    const updated = saveDeliverySettings(body);

    // Save permanently to Supabase PostgreSQL database
    try {
      await prisma.customPage.upsert({
        where: { slug: '_system_delivery_rates' },
        update: {
          content: JSON.stringify(updated),
          updatedAt: new Date(),
        },
        create: {
          slug: '_system_delivery_rates',
          title: 'System Delivery Rates',
          content: JSON.stringify(updated),
          status: 'draft',
        },
      });
    } catch (dbErr) {
      console.warn('Could not persist delivery rates to DB:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery rate scale updated successfully',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

