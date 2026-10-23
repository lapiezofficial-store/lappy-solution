import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { invalidateInitCache } from '@/app/api/cms/init/route';

export const DEFAULT_HOMEPAGE_SECTIONS = [
  { sectionKey: 'banners', title: 'Top Hero Slider Banners', position: 1, isVisible: true, badge: 'HERO DEALS' },
  { sectionKey: 'brands', title: 'Top Brands We Deal In', position: 2, isVisible: true, badge: 'OFFICIAL BRANDS' },
  { sectionKey: 'trust_bar', title: 'Indian E-Commerce 4 Trust Pillars', position: 3, isVisible: true, badge: 'TRUST BADGES' },
  { sectionKey: 'categories', title: 'Shop by Hardware Category Grid', position: 4, isVisible: true, badge: 'DISCOVERY' },
  { 
    sectionKey: 'trending', 
    title: 'Trending Products', 
    subtitle: 'Top rated Frontech curved monitors, 12th/13th Gen laptops, and showroom verified hardware with instant counter pickup.',
    badge: '🔥 HOT & TRENDING',
    position: 5, 
    isVisible: true 
  },
  { 
    sectionKey: 'bestsellers', 
    title: 'Best Sellers', 
    subtitle: 'Most purchased computer accessories, genuine laptop spares, and bestselling hardware in Garhwa.',
    badge: '⭐ SHOWROOM FAVORITES',
    position: 6, 
    isVisible: true 
  },
  { 
    sectionKey: 'premium', 
    title: 'Premium Segment', 
    subtitle: 'High-end 200Hz IPS gaming displays, Intel Core i7/i9 workstation rigs, and certified power laptops.',
    badge: '👑 HIGH-PERFORMANCE RIGS',
    position: 7, 
    isVisible: true 
  },
  { 
    sectionKey: 'refurbished_laptops', 
    title: 'Refurbished Laptops & Printers', 
    subtitle: 'Tested quality Dell Latitude, HP EliteBook, Lenovo ThinkPad & commercial printers with local warranty support.',
    badge: '🏷️ WORK SMARTER SPEND LESS',
    position: 8, 
    isVisible: true 
  },
  { 
    sectionKey: 'cctv_spotlight', 
    title: 'CCTV Security & Surveillance', 
    subtitle: 'Turnkey 4-camera and 8-camera CP-PLUS & Frontech kits with night vision, mobile live view, and installation.',
    badge: '📹 24/7 SURVEILLANCE',
    position: 9, 
    isVisible: true 
  },
  { 
    sectionKey: 'blogs_preview', 
    title: 'Latest Tech Guides & Hardware News', 
    subtitle: 'Expert buying tips, laptop repair advice, and tech tutorials from Lapiez engineers.',
    badge: '📰 GARHWA TECH DIARY',
    position: 10, 
    isVisible: true 
  },
  { sectionKey: 'promo', title: 'Dual Spotlight Promo Banners (SSD & Laptops)', position: 11, isVisible: true, badge: 'PROMOS' },
  { sectionKey: 'catalog_cta', title: 'Complete Showroom Catalog Quick-Chips Card', position: 12, isVisible: true, badge: 'EXPLORE' },
  { sectionKey: 'showroom', title: 'Garhwa Showroom Counter & Verification', position: 13, isVisible: true, badge: 'STORE VISIT' }
];

export async function GET() {
  try {
    let sections = await prisma.homepageSection.findMany({
      orderBy: { position: 'asc' },
    });

    // Auto-seed defaults if database is empty
    if (!sections || sections.length === 0) {
      for (const def of DEFAULT_HOMEPAGE_SECTIONS) {
        await prisma.homepageSection.upsert({
          where: { sectionKey: def.sectionKey },
          update: {},
          create: def,
        });
      }
      sections = await prisma.homepageSection.findMany({
        orderBy: { position: 'asc' },
      });
    }

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();

    // Action 1: Make all sections visible
    if (body.makeAllVisible) {
      await prisma.homepageSection.updateMany({
        data: { isVisible: true },
      });
      const updated = await prisma.homepageSection.findMany({
        orderBy: { position: 'asc' },
      });
      invalidateInitCache();
      return NextResponse.json({ success: true, sections: updated });
    }

    // Action 2: Reset all sections to default catalog layout
    if (body.resetToDefaults) {
      for (const def of DEFAULT_HOMEPAGE_SECTIONS) {
        await prisma.homepageSection.upsert({
          where: { sectionKey: def.sectionKey },
          update: {
            title: def.title,
            subtitle: (def as any).subtitle || null,
            badge: (def as any).badge || null,
            position: def.position,
            isVisible: true,
          },
          create: def,
        });
      }
      const updated = await prisma.homepageSection.findMany({
        orderBy: { position: 'asc' },
      });
      invalidateInitCache();
      return NextResponse.json({ success: true, sections: updated });
    }

    // Action 3: Single section update (e.g. changing title, subtitle, badge, productIds, or toggling visibility)
    if (body.section || body.sectionKey || body.id) {
      const s = body.section || body;
      const productIds = Array.isArray(s.productIds) ? JSON.stringify(s.productIds) : s.productIds;
      
      const updateData: any = {};
      if (s.title !== undefined) updateData.title = s.title;
      if (s.subtitle !== undefined) updateData.subtitle = s.subtitle;
      if (s.badge !== undefined) updateData.badge = s.badge;
      if (productIds !== undefined) updateData.productIds = productIds;
      if (s.position !== undefined) updateData.position = s.position;
      if (s.isVisible !== undefined) updateData.isVisible = s.isVisible;

      if (s.sectionKey) {
        await prisma.homepageSection.upsert({
          where: { sectionKey: s.sectionKey },
          update: updateData,
          create: {
            sectionKey: s.sectionKey,
            title: s.title || s.sectionKey,
            subtitle: s.subtitle || '',
            badge: s.badge || '',
            productIds: productIds || '[]',
            position: s.position ?? 99,
            isVisible: s.isVisible ?? true,
          },
        });
      } else if (s.id) {
        await prisma.homepageSection.update({
          where: { id: s.id },
          data: updateData,
        });
      }

      const updated = await prisma.homepageSection.findMany({
        orderBy: { position: 'asc' },
      });
      invalidateInitCache();
      return NextResponse.json({ success: true, sections: updated });
    }

    // Action 4: Bulk sections update (e.g. reordering or saving full list)
    const { sections } = body;
    if (Array.isArray(sections)) {
      for (const s of sections) {
        const productIds = Array.isArray(s.productIds) ? JSON.stringify(s.productIds) : s.productIds;
        const updateFields: any = {};
        if (s.title !== undefined) updateFields.title = s.title;
        if (s.subtitle !== undefined) updateFields.subtitle = s.subtitle;
        if (s.badge !== undefined) updateFields.badge = s.badge;
        if (productIds !== undefined) updateFields.productIds = productIds;
        if (s.position !== undefined) updateFields.position = s.position;
        if (s.isVisible !== undefined) updateFields.isVisible = s.isVisible;

        if (s.sectionKey) {
          await prisma.homepageSection.upsert({
            where: { sectionKey: s.sectionKey },
            update: updateFields,
            create: {
              sectionKey: s.sectionKey,
              title: s.title || s.sectionKey,
              subtitle: s.subtitle || '',
              badge: s.badge || '',
              productIds: productIds || '[]',
              position: s.position ?? 99,
              isVisible: s.isVisible ?? true,
            },
          });
        } else if (s.id) {
          await prisma.homepageSection.update({
            where: { id: s.id },
            data: updateFields,
          }).catch(() => null);
        }
      }
    }

    const updated = await prisma.homepageSection.findMany({
      orderBy: { position: 'asc' },
    });

    invalidateInitCache();
    return NextResponse.json({ success: true, sections: updated });
  } catch (error) {
    console.error('Error updating homepage sections:', error);
    return NextResponse.json({ error: 'Failed to update sections' }, { status: 500 });
  }
}
