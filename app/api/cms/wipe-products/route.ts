import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { invalidateInitCache } from '@/app/api/cms/init/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function performWipe() {
  const result = await prisma.product.deleteMany({});
  invalidateInitCache();
  return result.count;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Allow with secret key or admin session
  if (secret !== 'Lapiez@2026#' && !hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const count = await performWipe();
    return NextResponse.json({
      success: true,
      deletedCount: count,
      message: `Successfully wiped ${count} products from database!`,
    });
  } catch (err: any) {
    console.error('Error wiping products from database:', err);
    return NextResponse.json({ error: err?.message || 'Failed to wipe products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'Lapiez@2026#' && !hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const count = await performWipe();
    return NextResponse.json({
      success: true,
      deletedCount: count,
      message: `Successfully wiped ${count} products from database!`,
    });
  } catch (err: any) {
    console.error('Error wiping products from database:', err);
    return NextResponse.json({ error: err?.message || 'Failed to wipe products' }, { status: 500 });
  }
}
