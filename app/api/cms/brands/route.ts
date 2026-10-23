import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { DEFAULT_BRANDS, CMSBrand } from '@/data/brands';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to get stored brands from database
async function getStoredBrands(): Promise<CMSBrand[]> {
  try {
    const section = await prisma.homepageSection.findUnique({
      where: { sectionKey: 'brands' },
    });

    if (section?.productIds) {
      try {
        const parsed: CMSBrand[] = JSON.parse(section.productIds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((b) => b.id.toLowerCase()));
          const existingNames = new Set(parsed.map((b) => b.name.toLowerCase().replace(/[^a-z0-9]/g, '')));

          let hasNewBrands = false;
          const merged = [...parsed];

          // Smart merge: ensure new requested brands are included
          for (const def of DEFAULT_BRANDS) {
            const cleanName = def.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!existingIds.has(def.id.toLowerCase()) && !existingNames.has(cleanName)) {
              merged.push({
                ...def,
                position: merged.length,
              });
              hasNewBrands = true;
            }
          }

          if (hasNewBrands) {
            await saveStoredBrands(merged);
            return merged.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          }

          return parsed.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        }
      } catch (e) {
        console.error('Error parsing stored brands JSON:', e);
      }
    }

    // If section exists but productIds is null/empty, seed default brands
    if (section) {
      await prisma.homepageSection.update({
        where: { sectionKey: 'brands' },
        data: { productIds: JSON.stringify(DEFAULT_BRANDS) },
      });
    }

    return DEFAULT_BRANDS;
  } catch (error) {
    console.error('Error fetching stored brands from database:', error);
    return DEFAULT_BRANDS;
  }
}

// Helper to save brands to database
async function saveStoredBrands(brands: CMSBrand[]): Promise<boolean> {
  try {
    const indexed = brands.map((b, index) => ({
      ...b,
      position: index,
    }));

    await prisma.homepageSection.upsert({
      where: { sectionKey: 'brands' },
      update: {
        productIds: JSON.stringify(indexed),
      },
      create: {
        sectionKey: 'brands',
        title: 'Top Brands We Deal In',
        badge: 'OFFICIAL BRANDS',
        position: 11,
        isVisible: true,
        productIds: JSON.stringify(indexed),
      },
    });
    return true;
  } catch (error) {
    console.error('Error saving brands to database:', error);
    return false;
  }
}

// GET: Fetch all brands
export async function GET() {
  try {
    const brands = await getStoredBrands();
    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error in GET /api/cms/brands:', error);
    return NextResponse.json({ brands: DEFAULT_BRANDS });
  }
}

// POST: Add a new brand
export async function POST(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const currentBrands = await getStoredBrands();

    const newBrand: CMSBrand = {
      id: body.id || `brand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: body.name || 'New Brand',
      query: body.query || body.name || 'Brand',
      logoType: body.logoType || 'preset',
      presetKey: body.presetKey || undefined,
      imageUrl: body.imageUrl || undefined,
      bgColor: body.bgColor || undefined,
      textColor: body.textColor || undefined,
      position: currentBrands.length,
      isVisible: body.isVisible !== undefined ? body.isVisible : true,
    };

    const updatedBrands = [...currentBrands, newBrand];
    await saveStoredBrands(updatedBrands);

    return NextResponse.json({ success: true, brand: newBrand, brands: updatedBrands });
  } catch (error) {
    console.error('Error in POST /api/cms/brands:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}

// PUT: Update single brand or bulk reorder
export async function PUT(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Case 1: Bulk array of brands (e.g. after reordering or drag-and-drop)
    if (Array.isArray(body.brands)) {
      const reindexed = body.brands.map((b: CMSBrand, idx: number) => ({
        ...b,
        position: idx,
      }));
      await saveStoredBrands(reindexed);
      return NextResponse.json({ success: true, brands: reindexed });
    }

    // Case 2: Reset to defaults
    if (body.resetToDefaults) {
      await saveStoredBrands(DEFAULT_BRANDS);
      return NextResponse.json({ success: true, brands: DEFAULT_BRANDS });
    }

    // Case 3: Single brand update
    const currentBrands = await getStoredBrands();
    const targetId = body.id || body.brand?.id;

    if (!targetId) {
      return NextResponse.json({ error: 'Brand ID required for update' }, { status: 400 });
    }

    const updatedBrands = currentBrands.map((b) => {
      if (b.id === targetId) {
        return {
          ...b,
          ...(body.brand || body),
          id: b.id, // keep id intact
        };
      }
      return b;
    });

    await saveStoredBrands(updatedBrands);
    return NextResponse.json({ success: true, brands: updatedBrands });
  } catch (error) {
    console.error('Error in PUT /api/cms/brands:', error);
    return NextResponse.json({ error: 'Failed to update brands' }, { status: 500 });
  }
}

// DELETE: Remove a brand
export async function DELETE(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    const currentBrands = await getStoredBrands();
    const filtered = currentBrands.filter((b) => b.id !== id);
    const reindexed = filtered.map((b, idx) => ({ ...b, position: idx }));

    await saveStoredBrands(reindexed);
    return NextResponse.json({ success: true, brands: reindexed });
  } catch (error) {
    console.error('Error in DELETE /api/cms/brands:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
