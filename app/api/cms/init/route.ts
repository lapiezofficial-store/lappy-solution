import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CATEGORIES } from '@/data/categories';
import { PRODUCTS } from '@/data/products';
import { INITIAL_COUPONS } from '@/data/coupons';
import { INITIAL_BANNERS } from '@/data/banners';

// Server-side in-memory cache for ultra-low latency & database relief
interface CachedInitData {
  payload: any;
  cachedAt: number;
  etag: string;
}

let inMemoryCache: CachedInitData | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds in-memory TTL

export function invalidateInitCache() {
  inMemoryCache = null;
}

// Format product payload with rich data
function formatProduct(p: any, rich?: any) {
  const images = (p.image && typeof p.image === 'string' && p.image.includes('|||'))
    ? p.image.split('|||').map((s: string) => s.trim()).filter(Boolean)
    : (rich?.images && rich.images.length > 0)
    ? rich.images
    : (p.image ? [p.image] : (rich?.image ? [rich.image] : []));

  const isOutOfStock = p.inStock === false || (p.stockQuantity !== undefined && p.stockQuantity !== null && Number(p.stockQuantity) <= 0);

  return {
    id: p.id,
    numericId: p.numericId ?? rich?.numericId,
    name: p.name,
    slug: p.slug,
    category: p.category,
    subCategory: p.subCategory || rich?.subCategory || '',
    brand: p.brand,
    price: Number(p.price),
    mrp: Number(p.mrp) || Number(p.price),
    discount: Number(p.discount) || (p.mrp && p.price ? Math.max(0, Math.round(((p.mrp - p.price) / p.mrp) * 100)) : 0),
    specs: p.specs,
    description: p.description || p.specs,
    image: images[0] || p.image || rich?.image || '',
    images,
    inStock: !isOutOfStock,
    stockQuantity: isOutOfStock ? 0 : (p.stockQuantity !== undefined && p.stockQuantity !== null && !isNaN(Number(p.stockQuantity)) ? Number(p.stockQuantity) : 10),
    sku: p.sku,
    rating: Number(p.rating) || 4.5,
    reviewsCount: p.reviewsCount || rich?.reviewsCount || 12,
    featured: Boolean(p.featured),
    status: p.status || 'active',
    gstRate: p.gstRate !== undefined ? Number(p.gstRate) : 18,
    hsnCode: p.hsnCode || '8471',
  };
}

export async function GET(request: Request) {
  const now = Date.now();
  const ifNoneMatch = request.headers.get('if-none-match');

  // 1. Check if client explicitly requests fresh data (e.g., after CMS edit or manual refresh)
  const url = new URL(request.url);
  const isFreshRequested = url.searchParams.get('fresh') === 'true' || request.headers.get('cache-control')?.includes('no-cache');

  // Serve from in-memory cache if warm and fresh data is not requested
  if (!isFreshRequested && inMemoryCache && (now - inMemoryCache.cachedAt) < CACHE_TTL_MS) {
    if (ifNoneMatch && ifNoneMatch === inMemoryCache.etag) {
      return new NextResponse(null, { status: 304 });
    }
    return NextResponse.json(inMemoryCache.payload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'ETag': inMemoryCache.etag,
        'X-Cache': 'HIT-MEMORY',
      },
    });
  }

  try {
    // 2. Single-pass parallel batch fetch across all public CMS collections
    const [
      siteSettings,
      paymentSettings,
      themeSettings,
      banners,
      homepageSections,
      dbCategories,
      dbProducts,
      customPages,
      blogPosts,
      dbCoupons,
    ] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: 'default' } }).catch(() => null),
      prisma.paymentSettings.findUnique({ where: { id: 'default' } }).catch(() => null),
      prisma.themeSettings.findUnique({ where: { id: 'default' } }).catch(() => null),
      prisma.banner.findMany({ where: { status: 'active' }, orderBy: { position: 'asc' } }).catch(() => []),
      prisma.homepageSection.findMany({ where: { isVisible: true }, orderBy: { position: 'asc' } }).catch(() => []),
      prisma.category.findMany({ orderBy: { position: 'asc' } }).catch(() => []),
      prisma.product.findMany({ where: { status: 'active' }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.customPage.findMany({ where: { status: 'published' }, orderBy: { updatedAt: 'desc' } }).catch(() => []),
      prisma.blogPost.findMany({ where: { status: 'published' }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.coupon.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }).catch(() => []),
    ]);

    // Format sanitized Site Settings (Explicit allowlist - strictly no passwords)
    const cleanSiteSettings = siteSettings ? {
      id: siteSettings.id,
      siteName: siteSettings.siteName || 'Lapiez',
      tagline: siteSettings.tagline || '',
      logo: siteSettings.logo || '',
      favicon: siteSettings.favicon || '/favicon.ico',
      phone: siteSettings.phone || '',
      whatsapp: siteSettings.whatsapp || '',
      email: siteSettings.email || '',
      address: siteSettings.address || '',
      timings: siteSettings.timings || '',
      announcementText: siteSettings.announcementText || '',
      maintenanceMode: Boolean(siteSettings.maintenanceMode),
      facebookUrl: siteSettings.facebookUrl || '',
      instagramUrl: siteSettings.instagramUrl || '',
      youtubeUrl: siteSettings.youtubeUrl || '',
      twitterUrl: siteSettings.twitterUrl || '',
      updatedAt: siteSettings.updatedAt,
    } : null;

    // Format sanitized Payment Settings
    const cleanPaymentSettings = paymentSettings ? {
      id: paymentSettings.id,
      upiId: paymentSettings.upiId || 'lappy.solution@ybl',
      upiName: paymentSettings.upiName || 'LAPIEZ GARHWA',
      codEnabled: Boolean(paymentSettings.codEnabled),
      gstRate: paymentSettings.gstRate ?? 18,
      gstin: paymentSettings.gstin || '',
      bankAccountsJson: paymentSettings.bankAccountsJson || '[]',
      updatedAt: paymentSettings.updatedAt,
    } : null;

    // Format Category Tree
    let categoriesTree = CATEGORIES;
    if (dbCategories && dbCategories.length > 0) {
      const mainCategories = dbCategories.filter((c) => !c.parentId);
      const subCategories = dbCategories.filter((c) => Boolean(c.parentId));
      categoriesTree = mainCategories.map((main) => ({
        ...main,
        subcategories: subCategories
          .filter((sub) => sub.parentId === main.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      })) as any;
    }

    // Format Products with Rich Metadata
    const richSkuMap = new Map(PRODUCTS.map((p) => [p.sku, p]));
    const richIdMap = new Map(PRODUCTS.map((p) => [p.id, p]));

    const formattedProducts = (dbProducts && dbProducts.length > 0)
      ? dbProducts.map((p) => formatProduct(p, richSkuMap.get(p.sku) || richIdMap.get(p.id)))
      : PRODUCTS;

    // Format Coupons
    const coupons = (dbCoupons && dbCoupons.length > 0)
      ? dbCoupons.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minOrder: c.minOrder,
          maxDiscount: c.maxDiscount ?? undefined,
          audience: c.audience,
          description: c.description || '',
          isActive: c.isActive,
          validUntil: c.validUntil || undefined,
          timesUsed: c.timesUsed,
        }))
      : INITIAL_COUPONS;

    const effectiveBanners = (banners && banners.length > 0) ? banners : INITIAL_BANNERS;

    const payload = {
      siteSettings: cleanSiteSettings,
      paymentSettings: cleanPaymentSettings,
      themeSettings: themeSettings || null,
      banners: effectiveBanners,
      homepageSections: homepageSections || [],
      categories: categoriesTree,
      products: formattedProducts,
      customPages: customPages || [],
      blogPosts: blogPosts || [],
      coupons,
      timestamp: now,
    };

    const etag = `W/"init-${now.toString(36)}-${formattedProducts.length}"`;

    // Cache in memory for subsequent requests
    inMemoryCache = {
      payload,
      cachedAt: now,
      etag,
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'ETag': etag,
        'X-Cache': 'MISS-DATABASE',
      },
    });
  } catch (error) {
    console.error('Error in unified /api/cms/init endpoint:', error);
    // Complete resilient fallback to prevent any customer-facing 500 error
    return NextResponse.json(
      {
        siteSettings: null,
        paymentSettings: null,
        themeSettings: null,
        banners: INITIAL_BANNERS,
        homepageSections: [],
        categories: CATEGORIES,
        products: PRODUCTS,
        customPages: [],
        blogPosts: [],
        coupons: INITIAL_COUPONS,
        timestamp: now,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
