import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { invalidateInitCache } from '@/app/api/cms/init/route';
import { CATEGORIES } from '@/data/categories';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to seed categories & subcategories from default taxonomy if empty
async function ensureDefaultCategories() {
  const count = await prisma.category.count();
  if (count > 0) return;

  try {
    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i];
      const mainCat = await prisma.category.create({
        data: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.imageUrl || '',
          startingPrice: cat.startingPrice || '',
          position: i,
          status: 'active',
          parentId: null,
        },
      });

      if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
        for (let j = 0; j < cat.subcategories.length; j++) {
          const sub = cat.subcategories[j];
          const subSlug = sub.slug || `${cat.slug}-${sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          // Ensure slug uniqueness
          const existing = await prisma.category.findUnique({ where: { slug: subSlug } });
          const finalSlug = existing ? `${subSlug}-${j + 1}` : subSlug;

          await prisma.category.create({
            data: {
              id: sub.id || `${cat.id}-sub-${j + 1}`,
              name: sub.name,
              slug: finalSlug,
              image: sub.imageUrl || cat.imageUrl || '',
              startingPrice: '',
              position: j,
              status: 'active',
              parentId: mainCat.id,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error('Error auto-seeding categories:', err);
  }
}

export async function GET() {
  try {
    await ensureDefaultCategories();

    const allCategories = await prisma.category.findMany({
      orderBy: { position: 'asc' },
    });

    // Group into main categories with nested subcategories
    const mainCategories = allCategories.filter((c) => !c.parentId);
    const subCategories = allCategories.filter((c) => Boolean(c.parentId));

    const tree = mainCategories.map((main) => ({
      ...main,
      subcategories: subCategories
        .filter((sub) => sub.parentId === main.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    }));

    return NextResponse.json({ categories: tree, all: allCategories });
  } catch (error) {
    console.error('Error fetching categories, falling back to canonical categories:', error);
    return NextResponse.json({ categories: CATEGORIES, all: CATEGORIES });
  }
}

export async function POST(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    let baseSlug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!baseSlug) baseSlug = `cat-${Date.now()}`;

    // Ensure unique slug
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const count = await prisma.category.count({
      where: { parentId: body.parentId || null },
    });

    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        slug: finalSlug,
        parentId: body.parentId || null,
        image: body.image || '',
        startingPrice: body.startingPrice || '',
        position: body.position !== undefined ? Number(body.position) : count,
        status: body.status || 'active',
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();

    // 1. Bulk update / reordering
    if (Array.isArray(body.categories)) {
      for (const item of body.categories) {
        if (item.id) {
          await prisma.category.update({
            where: { id: item.id },
            data: {
              position: item.position !== undefined ? Number(item.position) : undefined,
              status: item.status !== undefined ? item.status : undefined,
              name: item.name !== undefined ? item.name : undefined,
              image: item.image !== undefined ? item.image : undefined,
              startingPrice: item.startingPrice !== undefined ? item.startingPrice : undefined,
            },
          });
        }
      }
      invalidateInitCache();
      return NextResponse.json({ success: true, message: 'Categories updated successfully' });
    }

    // 2. Single category update
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim();
    if (data.image !== undefined) updateData.image = data.image;
    if (data.startingPrice !== undefined) updateData.startingPrice = data.startingPrice;
    if (data.position !== undefined) updateData.position = Number(data.position);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.parentId !== undefined) updateData.parentId = data.parentId || null;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    invalidateInitCache();
    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Also delete any child subcategories
    await prisma.category.deleteMany({
      where: { parentId: id },
    });

    // Delete the category itself
    await prisma.category.delete({
      where: { id },
    });

    invalidateInitCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
