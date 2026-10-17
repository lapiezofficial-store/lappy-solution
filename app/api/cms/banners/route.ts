import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { invalidateInitCache } from '@/app/api/cms/init/route';
import { INITIAL_BANNERS } from '@/data/banners';

export async function GET() {
  try {
    let banners = await prisma.banner.findMany({
      orderBy: { position: 'asc' },
    });

    // If database table is empty, auto-seed with INITIAL_BANNERS
    if (!banners || banners.length === 0) {
      try {
        await prisma.banner.createMany({
          data: INITIAL_BANNERS.map((b) => ({
            id: b.id,
            title: b.title,
            titleHighlight: b.titleHighlight,
            subtitle: b.subtitle,
            badge: b.badge,
            desktopImage: b.desktopImage,
            mobileImage: b.mobileImage,
            buttonText: b.buttonText,
            buttonUrl: b.buttonUrl,
            whatsappMsg: b.whatsappMsg,
            bgGradient: b.bgGradient,
            position: b.position,
            status: b.status,
          })),
          skipDuplicates: true,
        });
        banners = await prisma.banner.findMany({
          orderBy: { position: 'asc' },
        });
      } catch (seedErr) {
        console.warn('Could not auto-seed banners to DB, returning default banners:', seedErr);
      }
    }

    return NextResponse.json({
      banners: (banners && banners.length > 0) ? banners : INITIAL_BANNERS,
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ banners: INITIAL_BANNERS });
  }
}

export async function POST(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();

    // Reset / Seed defaults action
    if (body.action === 'seed_defaults') {
      try {
        await prisma.banner.deleteMany({});
        await prisma.banner.createMany({
          data: INITIAL_BANNERS.map((b) => ({
            id: b.id,
            title: b.title,
            titleHighlight: b.titleHighlight,
            subtitle: b.subtitle,
            badge: b.badge,
            desktopImage: b.desktopImage,
            mobileImage: b.mobileImage,
            buttonText: b.buttonText,
            buttonUrl: b.buttonUrl,
            whatsappMsg: b.whatsappMsg,
            bgGradient: b.bgGradient,
            position: b.position,
            status: b.status,
          })),
        });
      } catch (e) {
        console.error('Failed to reset banners in DB:', e);
      }
      invalidateInitCache();
      return NextResponse.json({ success: true, banners: INITIAL_BANNERS });
    }

    const banner = await prisma.banner.create({
      data: body,
    });
    invalidateInitCache();
    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { id, createdAt, updatedAt, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });

    const banner = await prisma.banner.upsert({
      where: { id },
      update: data,
      create: {
        id,
        ...data,
      },
    });
    invalidateInitCache();
    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
      await prisma.banner.delete({ where: { id } });
    } catch (dbErr) {
      console.warn('Banner to delete may not exist in DB:', dbErr);
    }
    invalidateInitCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
