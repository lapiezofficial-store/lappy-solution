import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { invalidateInitCache } from '@/app/api/cms/init/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const themeSettings = await prisma.themeSettings.findUnique({
      where: { id: 'default' },
    });
    return NextResponse.json({ themeSettings });
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const allowedFields = ['primaryColor', 'secondaryColor', 'dealColor', 'canvasBg', 'fontFamily', 'borderRadius'];
    const safeTheme = Object.fromEntries(Object.entries(body).filter(([key]) => allowedFields.includes(key)));
    if (Object.keys(safeTheme).length === 0) return NextResponse.json({ error: 'No valid theme fields provided.' }, { status: 400 });
    const updated = await prisma.themeSettings.upsert({
      where: { id: 'default' },
      update: safeTheme,
      create: { id: 'default', ...safeTheme },
    });
    invalidateInitCache();
    return NextResponse.json({ success: true, themeSettings: updated });
  } catch (error) {
    console.error('Error updating theme settings:', error);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}
