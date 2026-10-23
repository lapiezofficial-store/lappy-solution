import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { invalidateInitCache } from '@/app/api/cms/init/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function purgeExpiredTrash() {
  try {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const result = await prisma.product.deleteMany({
      where: {
        status: 'trash',
        OR: [
          { deletedAt: { lte: fifteenDaysAgo } },
          { deletedAt: null, updatedAt: { lte: fifteenDaysAgo } }
        ]
      }
    });
    if (result.count > 0) {
      console.log(`[Auto-Purge] Cleaned ${result.count} products from dustbin older than 15 days.`);
      invalidateInitCache();
    }
    return result.count;
  } catch (err) {
    console.error('Error auto-purging expired trash:', err);
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    // 1. Auto-clean any product in dustbin older than 15 days
    await purgeExpiredTrash();

    const { searchParams } = new URL(request.url);
    const isTrash = searchParams.get('trash') === 'true';

    // 2. If dustbin/trash is requested by admin
    if (isTrash) {
      if (!hasAdminSession(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const trashed = await prisma.product.findMany({
        where: { status: 'trash' },
        orderBy: { updatedAt: 'desc' }
      });

      return NextResponse.json({ 
        products: trashed.map(p => formatProductPayload(p)),
        count: trashed.length,
        retentionDays: 15
      });
    }

    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const requestedLimit = Number(searchParams.get('limit'));
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 1000) : 500;

    const where: Prisma.ProductWhereInput = { status: 'active' };
    if (id) {
      where.OR = [
        { id: id },
        { slug: id },
        { sku: id },
      ];
    } else if (slug) {
      where.slug = slug;
    } else {
      if (category && category !== 'All' && category !== 'All Products') {
        where.category = category;
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { brand: { contains: search } },
          { specs: { contains: search } },
          { sku: { contains: search } },
        ];
      }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Enrich with gallery images, verified reviews & subcategory metadata
    const { PRODUCTS } = await import('@/data/products');
    const richMap = new Map(PRODUCTS.map(p => [p.sku, p]));
    const idMap = new Map(PRODUCTS.map(p => [p.id, p]));

    const enrichedProducts = products.map((p) => {
      const rich = richMap.get(p.sku) || idMap.get(p.id);
      return formatProductPayload(p, rich);
    });

    return NextResponse.json({ products: enrichedProducts });
  } catch (error) {
    console.error('Error fetching products from DB:', error);
    return NextResponse.json({ products: [] });
  }
}

export function formatProductPayload(p: any, rich?: any) {
  let galleryImages: string[] = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    galleryImages = p.images
      .flatMap((s: any) => typeof s === 'string' && s.includes('|||') ? s.split('|||') : [s])
      .map((s: string) => String(s).trim())
      .filter(Boolean);
  } else if (typeof p.image === 'string' && p.image.includes('|||')) {
    galleryImages = p.image.split('|||').map((s: string) => s.trim()).filter(Boolean);
  } else if (typeof p.image === 'string' && p.image.startsWith('[')) {
    try {
      const parsed = JSON.parse(p.image);
      if (Array.isArray(parsed)) {
        galleryImages = parsed.map((s: string) => String(s).trim()).filter(Boolean);
      }
    } catch (e) {}
  } else if (rich?.images && rich.images.length > 0) {
    galleryImages = rich.images;
  } else if (p.image) {
    galleryImages = [p.image.trim()];
  }

  const primaryImage = galleryImages[0] || (typeof p.image === 'string' ? p.image.split('|||')[0].trim() : '') || '';

  return {
    ...p,
    status: p.status || 'active',
    deletedAt: p.deletedAt ? new Date(p.deletedAt).toISOString() : null,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : (rich?.createdAt ? new Date(rich.createdAt).toISOString() : null),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : (rich?.updatedAt ? new Date(rich.updatedAt).toISOString() : null),
    image: primaryImage,
    images: galleryImages.length > 0 ? galleryImages : (primaryImage ? [primaryImage] : []),
    reviews: rich?.reviews || p.reviews || [],
    subcategory: rich?.subcategory || p.subcategory || p.category,
    isScraped: rich?.isScraped ?? p.isScraped ?? false,
    sourceUrl: rich?.sourceUrl || p.sourceUrl || '',
  };
}

export async function POST(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.name !== 'string' || typeof body.category !== 'string' || typeof body.brand !== 'string' || !Number.isFinite(Number(body.price)) || Number(body.price) < 0) {
      return NextResponse.json({ error: 'Name, category, brand, and a valid price are required.' }, { status: 400 });
    }
    const trimmedName = body.name.trim();
    const catClean = (body.category || 'GEN').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';

    // 1. Rapid double-click deduplication (within last 4 seconds)
    const fourSecondsAgo = new Date(Date.now() - 4000);
    const recent = await prisma.product.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        brand: { equals: body.brand.trim(), mode: 'insensitive' },
        price: Number(body.price),
        createdAt: { gte: fourSecondsAgo }
      }
    });
    if (recent) {
      return NextResponse.json({ success: true, product: formatProductPayload(recent) });
    }

    // 2. Guaranteed collision-free unique SKU
    let sku = body.sku?.trim();
    if (!sku) {
      sku = `LS-${catClean}-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    }
    const existingSku = await prisma.product.findFirst({
      where: { sku: sku },
      select: { id: true }
    });
    if (existingSku) {
      sku = `LS-${catClean}-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    }

    // 3. Guaranteed unique slug for PostgreSQL
    const baseSlugPart = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
    let slug = body.slug || `${baseSlugPart}-${Date.now().toString().slice(-6)}`;
    const existingSlug = await prisma.product.findFirst({
      where: { slug: slug },
      select: { id: true }
    });
    if (existingSlug) {
      slug = `${baseSlugPart}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const rawImages = Array.isArray(body.images) && body.images.length > 0
      ? body.images
      : (body.image ? [body.image] : []);
    const cleanGallery = rawImages
      .flatMap((img: any) => typeof img === 'string' && img.includes('|||') ? img.split('|||') : [img])
      .map((img: any) => String(img).trim())
      .filter(Boolean);

    // Auto-convert any base64 images to Cloudinary URLs so PostgreSQL doesn't store bloated data URIs
    const processedGallery: string[] = [];
    for (const img of cleanGallery) {
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        try {
          const { uploadToCloudinary } = await import('@/lib/cloudinary');
          const uploaded = await uploadToCloudinary(img, 'products');
          if (uploaded.url) {
            processedGallery.push(uploaded.url);
          } else {
            processedGallery.push(img);
          }
        } catch (err) {
          console.error('Server auto-upload to Cloudinary failed:', err);
          processedGallery.push(img);
        }
      } else {
        processedGallery.push(img);
      }
    }
    const imageToStore = processedGallery.length > 0 ? processedGallery.join('|||') : (body.image || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80');

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug,
        category: body.category,
        brand: body.brand,
        price: Number(body.price),
        mrp: Number(body.mrp) || Number(body.price),
        discount: Number(body.discount) || 0,
        specs: body.specs || '',
        description: body.description || body.specs || '',
        image: imageToStore,
        inStock: body.inStock === false || (body.stockQuantity !== undefined && Number(body.stockQuantity) <= 0) ? false : (body.inStock ?? true),
        stockQuantity: body.stockQuantity !== undefined && body.stockQuantity !== null && !isNaN(Number(body.stockQuantity)) ? Number(body.stockQuantity) : 10,
        sku,
        rating: Number(body.rating) || 4.5,
        featured: body.featured ?? false,
        status: 'active',
        gstRate: body.gstRate !== undefined ? Number(body.gstRate) : 18,
        hsnCode: body.hsnCode || '8471',
      },
    });

    invalidateInitCache();
    return NextResponse.json({ success: true, product: formatProductPayload(product) });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();

    // 1. Bulk toggle / update across multiple IDs
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const updateData: Record<string, any> = {};
      if (body.inStock !== undefined) {
        updateData.inStock = Boolean(body.inStock);
        updateData.stockQuantity = updateData.inStock ? (Number(body.stockQuantity) > 0 ? Number(body.stockQuantity) : 10) : 0;
      }
      if (body.price !== undefined) updateData.price = Number(body.price);
      if (body.status !== undefined) updateData.status = String(body.status);

      const res = await prisma.product.updateMany({
        where: {
          OR: [
            { id: { in: body.ids } },
            { sku: { in: body.ids } }
          ]
        },
        data: updateData,
      });

      invalidateInitCache();
      return NextResponse.json({ success: true, count: res.count });
    }

    // 2. Batch update: array of individual product items in a single transaction
    if (Array.isArray(body.batch) && body.batch.length > 0) {
      const transactions = body.batch.map((item: any) => {
        const itemData: Record<string, any> = {};
        if (item.inStock !== undefined) {
          itemData.inStock = Boolean(item.inStock);
          itemData.stockQuantity = itemData.inStock ? (Number(item.stockQuantity) > 0 ? Number(item.stockQuantity) : 10) : 0;
        }
        if (item.price !== undefined) itemData.price = Number(item.price);
        if (item.mrp !== undefined) itemData.mrp = Number(item.mrp);
        if (item.status !== undefined) itemData.status = String(item.status);
        if (item.name !== undefined) itemData.name = String(item.name);

        return prisma.product.updateMany({
          where: {
            OR: [
              { id: item.id },
              ...(item.sku ? [{ sku: item.sku }] : [])
            ]
          },
          data: itemData
        });
      });

      const results = await prisma.$transaction(transactions);
      invalidateInitCache();
      return NextResponse.json({ success: true, batchCount: results.length });
    }

    const { id } = body;
    if (typeof id !== 'string') return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    const allowedFields = ['name', 'slug', 'category', 'brand', 'price', 'mrp', 'discount', 'specs', 'description', 'image', 'inStock', 'stockQuantity', 'sku', 'rating', 'featured', 'status', 'gstRate', 'hsnCode'];
    const data: Record<string, any> = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );
    if (Array.isArray(body.images) && body.images.length > 0) {
      const cleanGallery = body.images
        .flatMap((img: any) => typeof img === 'string' && img.includes('|||') ? img.split('|||') : [img])
        .map((img: any) => String(img).trim())
        .filter(Boolean);
      
      const processedGallery: string[] = [];
      for (const img of cleanGallery) {
        if (typeof img === 'string' && img.startsWith('data:image/')) {
          try {
            const { uploadToCloudinary } = await import('@/lib/cloudinary');
            const uploaded = await uploadToCloudinary(img, 'products');
            if (uploaded.url) processedGallery.push(uploaded.url);
            else processedGallery.push(img);
          } catch (err) {
            console.error('Server auto-upload to Cloudinary failed in PUT:', err);
            processedGallery.push(img);
          }
        } else {
          processedGallery.push(img);
        }
      }
      data.image = processedGallery.join('|||');
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'No valid product fields provided.' }, { status: 400 });

    if (data.price !== undefined) data.price = Number(data.price);
    if (data.mrp !== undefined) data.mrp = Number(data.mrp);
    
    // Explicit and consistent out-of-stock handling
    if (data.inStock !== undefined) {
      data.inStock = Boolean(data.inStock);
      if (data.inStock === false) {
        data.stockQuantity = 0;
      }
    }
    if (data.stockQuantity !== undefined) {
      data.stockQuantity = Number(data.stockQuantity);
      if (data.stockQuantity <= 0) {
        data.inStock = false;
        data.stockQuantity = 0;
      } else if (data.inStock === undefined) {
        data.inStock = true;
      }
    }
    if (data.inStock === true && (data.stockQuantity === undefined || data.stockQuantity <= 0)) {
      data.stockQuantity = 10;
    }

    if (data.discount !== undefined) data.discount = Number(data.discount);
    if (data.rating !== undefined) data.rating = Number(data.rating);
    if (data.gstRate !== undefined) data.gstRate = Number(data.gstRate);

    let product;
    try {
      product = await prisma.product.update({
        where: { id },
        data,
      });
    } catch {
      // Fallback: search by SKU, slug, or matching name (handles legacy ID mismatches)
      const found = await prisma.product.findFirst({
        where: {
          OR: [
            { id },
            { sku: id },
            { slug: id },
            ...(body.sku ? [{ sku: body.sku }] : []),
            ...(body.name && typeof body.name === 'string' ? [{ name: { equals: body.name.trim(), mode: 'insensitive' as const } }] : [])
          ]
        }
      });
      if (found) {
        product = await prisma.product.update({
          where: { id: found.id },
          data,
        });
      } else {
        return NextResponse.json({ error: 'Product not found in database.' }, { status: 404 });
      }
    }

    invalidateInitCache();
    return NextResponse.json({ success: true, product: formatProductPayload(product) });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';
    const emptyTrash = searchParams.get('emptyTrash') === 'true';
    const all = searchParams.get('all') === 'true';

    // 0. Wipe all products from database permanently
    if (all) {
      const res = await prisma.product.deleteMany({});
      invalidateInitCache();
      return NextResponse.json({ success: true, count: res.count, message: 'All products permanently wiped from database!' });
    }

    // 1. Empty entire dustbin permanently
    if (emptyTrash) {
      const res = await prisma.product.deleteMany({
        where: { status: 'trash' }
      });
      invalidateInitCache();
      return NextResponse.json({ success: true, count: res.count, message: 'Dustbin emptied permanently!' });
    }

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const matchFilter: Prisma.ProductWhereInput = {
      OR: [
        { id },
        { sku: id },
        { slug: id }
      ]
    };

    if (permanent) {
      // Hard delete permanently from database
      await prisma.product.deleteMany({
        where: matchFilter
      });
      invalidateInitCache();
      return NextResponse.json({ success: true, permanent: true, deletedId: id });
    } else {
      // Soft delete: Move to Dustbin (Trash) for 15 days
      const now = new Date();
      await prisma.product.updateMany({
        where: matchFilter,
        data: {
          status: 'trash',
          deletedAt: now
        }
      });
      invalidateInitCache();
      return NextResponse.json({
        success: true,
        trash: true,
        deletedId: id,
        deletedAt: now.toISOString(),
        expiresInDays: 15,
        message: 'Product moved to Dustbin. Kept safely for 15 days.'
      });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    // 1. Restore a single product from Dustbin back to Active Catalog
    if (action === 'restore') {
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
      const matchFilter: Prisma.ProductWhereInput = {
        OR: [
          { id },
          { sku: id },
          { slug: id }
        ]
      };

      await prisma.product.updateMany({
        where: matchFilter,
        data: {
          status: 'active',
          deletedAt: null
        }
      });

      invalidateInitCache();
      return NextResponse.json({ success: true, restoredId: id, message: 'Product successfully restored from Dustbin!' });
    }

    // 2. Restore all products from Dustbin back to Active Catalog
    if (action === 'restoreAll') {
      const res = await prisma.product.updateMany({
        where: { status: 'trash' },
        data: {
          status: 'active',
          deletedAt: null
        }
      });

      invalidateInitCache();
      return NextResponse.json({ success: true, count: res.count, message: 'All products restored to active catalog!' });
    }

    // 3. Trigger manual auto-purge check
    if (action === 'purgeExpired') {
      const count = await purgeExpiredTrash();
      return NextResponse.json({ success: true, purgedCount: count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in PATCH product:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
