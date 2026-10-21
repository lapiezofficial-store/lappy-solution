'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, ShoppingCart, MessageSquare, Star, 
  ShieldCheck, Truck, Store, ArrowLeft, ArrowRight, 
  Check, RefreshCw, Phone, Share2, Award, Zap
} from 'lucide-react';
import { PRODUCTS, Product } from '../../../data/products';
import { STORE_INFO, getCleanWhatsAppNumber } from '../../../data/storeData';
import { useStore } from '../../../context/StoreContext';
import { ProductCard } from '../../../components/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : ((params?.id as string) || '');
  let productId = rawId;
  try {
    productId = decodeURIComponent(rawId).trim();
  } catch (e) {
    productId = String(rawId || '').trim();
  }

  const { products, addToCart, toggleWishlist, wishlistIds, showToast, siteSettings } = useStore();

  const [dbProduct, setDbProduct] = useState<Product | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);
  const attemptedFetchRef = React.useRef<string | null>(null);

  // 1. Static catalog item reference
  const staticItem = useMemo(() => {
    if (!productId) return undefined;
    return PRODUCTS.find(p => p.id === productId || String(p.numericId) === productId);
  }, [productId]);

  const targetSku = staticItem?.sku?.toLowerCase();
  const targetName = staticItem?.name?.trim().toLowerCase();

  // 2. Synchronous local storage lookup (ensures instant 0ms product recovery on browser refresh)
  const [cachedProduct, setCachedProduct] = useState<Product | null>(() => {
    if (typeof window === 'undefined' || !productId) return null;
    try {
      const saved = localStorage.getItem('ls_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const target = productId.toLowerCase();
          return parsed.find((p: any) => 
            p.id === productId || 
            p.dbId === productId ||
            p.slug?.toLowerCase() === target || 
            p.sku?.toLowerCase() === target || 
            (targetSku && p.sku?.toLowerCase() === targetSku) ||
            (targetName && p.name?.trim().toLowerCase() === targetName) ||
            String(p.numericId) === productId
          ) || null;
        }
      }
    } catch (e) {}
    return null;
  });

  // Track whether initial checks (static, cache, or direct DB query) have resolved
  const [hasCompletedCheck, setHasCompletedCheck] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && productId) {
      if (PRODUCTS.some(p => p.id === productId || String(p.numericId) === productId)) return true;
      try {
        const saved = localStorage.getItem('ls_products');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const target = productId.toLowerCase();
            return parsed.some((p: any) => 
              p.id === productId || 
              p.dbId === productId || 
              p.slug?.toLowerCase() === target || 
              p.sku?.toLowerCase() === target || 
              String(p.numericId) === productId
            );
          }
        }
      } catch (e) {}
    }
    return false;
  });

  // 3. Dynamic product matching across useStore products (DB + admin added), cached items, direct DB query, and static catalog
  const product: Product | undefined = useMemo(() => {
    if (!productId) return undefined;
    const searchTarget = productId.toLowerCase();

    // Check dynamic products list first (has DB + added products)
    const foundInStore = products.find(
      p => p.id === productId || 
           (p as any).dbId === productId ||
           p.slug?.toLowerCase() === searchTarget || 
           p.sku?.toLowerCase() === searchTarget || 
           (targetSku && p.sku?.toLowerCase() === targetSku) ||
           (targetName && p.name?.trim().toLowerCase() === targetName) ||
           String(p.numericId) === productId
    );
    if (foundInStore) return foundInStore;

    // Check synchronous localStorage cache (prevents 1s refresh flicker)
    if (cachedProduct) return cachedProduct;

    // Check static catalog fallback
    if (staticItem) return staticItem;

    // Check direct database queried product
    return dbProduct || undefined;
  }, [productId, products, cachedProduct, staticItem, dbProduct, targetSku, targetName]);

  // 4. Direct database query fallback if product is not yet in memory
  React.useEffect(() => {
    if (product) {
      setHasCompletedCheck(true);
      return;
    }

    if (productId && !isFetchingDirect && !dbProduct && attemptedFetchRef.current !== productId) {
      attemptedFetchRef.current = productId;
      setIsFetchingDirect(true);
      fetch(`/api/cms/products?id=${encodeURIComponent(productId)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
            setDbProduct(data.products[0]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch product directly from DB:', err);
        })
        .finally(() => {
          setIsFetchingDirect(false);
          setHasCompletedCheck(true);
        });
    }
  }, [product, productId, isFetchingDirect, dbProduct]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'whatsapp' | 'warranty'>('specs');

  // Loading skeleton while verifying or fetching directly from database (Never flash "Product Not Found")
  if (!product) {
    if (!hasCompletedCheck || isFetchingDirect) {
      return (
        <div className="bg-[#F1F3F6] py-6 sm:py-10 min-h-[80vh]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            {/* Breadcrumb Skeleton */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-3.5 w-12 bg-slate-200 rounded animate-pulse" />
              <span className="text-slate-300">/</span>
              <div className="h-3.5 w-16 bg-slate-200 rounded animate-pulse" />
              <span className="text-slate-300">/</span>
              <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse" />
            </div>

            {/* Hero Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-12">
              {/* Left Column: Image Skeleton */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-8 h-[380px] sm:h-[460px] flex items-center justify-center relative shadow-xs">
                  <div className="w-44 h-44 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#1A56DB]" />
                    <span className="text-xs font-medium text-slate-500">Loading Product...</span>
                  </div>
                </div>
                {/* Thumbnails row */}
                <div className="flex gap-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-[#E5E7EB] animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Right Column: Info Skeleton */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 sm:p-6 shadow-xs space-y-4">
                  {/* Brand & Stock */}
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-20 bg-blue-100 rounded animate-pulse" />
                    <div className="h-5 w-32 bg-green-100 rounded animate-pulse" />
                  </div>
                  {/* Title & SKU */}
                  <div className="space-y-2">
                    <div className="h-7 w-full bg-slate-200 rounded animate-pulse" />
                    <div className="h-7 w-3/4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-40 bg-slate-100 rounded animate-pulse mt-1" />
                  </div>
                  {/* Reviews */}
                  <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
                  {/* Price */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 space-y-2">
                    <div className="h-8 w-36 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
                  </div>
                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="h-12 bg-blue-200 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Product Not Found</h1>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          The requested hardware item may have been updated, sold out, or moved to our showroom archives.
        </p>
        <Link
          href="/shop"
          className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Available Products</span>
        </Link>
      </div>
    );
  }

  const isWishlisted = Array.isArray(wishlistIds) && wishlistIds.includes(product.id);
  const images = useMemo(() => {
    if (!product) return [];
    let list: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      list = product.images
        .flatMap((s: any) => typeof s === 'string' && s.includes('|||') ? s.split('|||') : [s])
        .map((s: string) => String(s).trim())
        .filter(Boolean);
    }
    if (list.length === 0 && product.image) {
      if (typeof product.image === 'string' && product.image.includes('|||')) {
        list = product.image.split('|||').map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof product.image === 'string' && product.image.startsWith('[')) {
        try {
          const parsed = JSON.parse(product.image);
          if (Array.isArray(parsed)) list = parsed.map((s: string) => String(s).trim()).filter(Boolean);
        } catch (e) {}
      } else {
        list = [String(product.image).trim()];
      }
    }
    return list.length > 0 ? list : (product.image ? [product.image] : []);
  }, [product]);
  const activeImage = images[activeImageIndex] || images[0] || product.image || '';

  const priceNum = Number(product.price || 0);
  const mrpNum = Number(product.mrp || 0);
  const savings = mrpNum > priceNum ? mrpNum - priceNum : 0;

  // Related products from same category or brand
  const allCatalog = products.length > 0 ? products : PRODUCTS;
  const relatedProducts = allCatalog.filter(
    p => (p.category === product.category || p.brand === product.brand) && p.id !== product.id
  ).slice(0, 4);

  const isOutOfStock = product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity !== null && Number(product.stockQuantity) <= 0);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      showToast('This product is currently out of stock.');
      return;
    }
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      showToast('This product is currently out of stock.');
      return;
    }
    addToCart(product, quantity);
    router.push('/checkout');
  };

  const handleWhatsApp = () => {
    const storeTitle = siteSettings?.siteName || 'Lapiez Garhwa';
    const text = isOutOfStock
      ? `Hello ${storeTitle}! I am interested in:\n\n*Product:* ${product.name}\n*SKU:* ${product.sku}\n*Price:* ₹${priceNum.toLocaleString('en-IN')}\n\nThis item is currently marked Out of Stock on your website. When is it expected back in stock at your Chiniya Road showroom?`
      : `Hello ${storeTitle}! I am interested in purchasing:\n\n*Product:* ${product.name}\n*SKU:* ${product.sku}\n*Price:* ₹${priceNum.toLocaleString('en-IN')}\n\nIs this in stock for same-day pickup at your showroom?`;
    const waNumber = getCleanWhatsAppNumber(siteSettings?.whatsapp);
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} at Lapiez Garhwa for ₹${priceNum.toLocaleString('en-IN')}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!');
    }
  };

  return (
    <div className="bg-[#F1F3F6] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-5 overflow-x-auto pb-1">
          <Link href="/" className="hover:text-[#1A56DB] transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/shop" className="hover:text-[#1A56DB] transition-colors">Catalog</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/shop?cat=${encodeURIComponent(product.category)}`} className="hover:text-[#1A56DB] transition-colors">
            {product.category}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-12">
          
          {/* Left Column: Gallery & Highlights (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Image Display Card */}
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 sm:p-8 flex items-center justify-center relative shadow-xs aspect-[4/3] overflow-hidden group">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-[360px] w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />

              {/* Discount Chip */}
              {product.discount > 0 && (
                <span className="absolute top-4 left-4 bg-[#DC2626] text-white font-extrabold text-xs px-2.5 py-1 rounded-md shadow-xs">
                  {product.discount}% OFF
                </span>
              )}

              {/* Action Buttons: Share & Wishlist */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 shadow-2xs transition-colors"
                  title="Share Product"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-2 rounded-lg border shadow-2xs transition-colors ${
                    isWishlisted
                      ? 'bg-red-50 border-red-200 text-[#DC2626]'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-500 hover:text-[#DC2626]'
                  }`}
                  title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#DC2626]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white p-1.5 border-2 transition-all flex-shrink-0 flex items-center justify-center ${
                      activeImageIndex === idx
                        ? 'border-[#1A56DB] shadow-xs'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.name} thumb ${idx}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Assurance Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl bg-white border border-[#E5E7EB] p-3.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A56DB] flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Direct Brand Warranty</h4>
                  <p className="text-[11px] text-gray-500">100% Authorized & Certified</p>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-[#E5E7EB] p-3.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-[#15803D] flex-shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Same-Day Garhwa Delivery</h4>
                  <p className="text-[11px] text-gray-500">Free door delivery in town</p>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-[#E5E7EB] p-3.5 flex items-center gap-2.5 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-[#D97706] flex-shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Showroom Inspection</h4>
                  <p className="text-[11px] text-gray-500">Try before paying at Chiniya Rd</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Pricing, Specs & Purchase Actions (5 Cols Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 sm:p-6 shadow-xs space-y-4">
              
              {/* Brand & Stock Status Badge */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A56DB] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                  {product.brand}
                </span>

                {isOutOfStock ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                    <span>Out of Stock at Garhwa Showroom</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D] bg-green-50 border border-green-200 px-2.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                    <span>In Stock at Garhwa ({product.stockQuantity ?? 1} units)</span>
                  </div>
                )}
              </div>

              {/* Title & SKU */}
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight leading-snug">
                  {product.name}
                </h1>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  SKU: {product.sku} • Category: {product.category}
                </p>
              </div>

              {/* Reviews Star Rating */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="bg-[#15803D] text-white text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span>{(product.rating || 4.4).toFixed(1)}</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>
                <span className="text-xs text-gray-500">({product.reviewsCount || 42} verified ratings & reviews)</span>
              </div>

              {/* Pricing Block */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 space-y-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
                    ₹{priceNum.toLocaleString('en-IN')}
                  </span>
                  {mrpNum > priceNum && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{mrpNum.toLocaleString('en-IN')}
                    </span>
                  )}
                  {product.discount > 0 && !isOutOfStock && (
                    <span className="text-xs font-bold text-[#15803D]">
                      {product.discount}% OFF
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Currently Unavailable
                    </span>
                  )}
                </div>
                {savings > 0 && !isOutOfStock && (
                  <p className="text-xs font-bold text-[#15803D]">
                    Special Price: You Save ₹{savings.toLocaleString('en-IN')}
                  </p>
                )}
                <p className="text-[11px] text-gray-500 pt-0.5">
                  Inclusive of 18% GST + Official Tax Invoice for business ITC claim.
                </p>
              </div>

              {/* Short Specs Highlight */}
              {product.specs && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                    Configuration Summary
                  </label>
                  <p className="text-xs text-gray-700 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 leading-relaxed font-medium">
                    {product.specs}
                  </p>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-gray-700">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    className="w-7 h-7 rounded bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-gray-900">{isOutOfStock ? 0 : quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock}
                    className="w-7 h-7 rounded bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Primary Call-to-Actions (Flipkart / Amazon Style) */}
              <div className="space-y-2.5 pt-1">
                {isOutOfStock ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full h-11 px-4 rounded-lg bg-gray-100 border border-gray-300 text-gray-400 font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 cursor-not-allowed select-none"
                    >
                      <span>OUT OF STOCK</span>
                    </button>
                    <p className="text-[11.5px] text-gray-500 text-center">
                      This item is temporarily out of stock. Contact us below to inquire about restock date or pre-order.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={handleAddToCart}
                      className="h-11 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>ADD TO CART</span>
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="h-11 px-4 rounded-lg bg-[#FB641B] hover:bg-[#E0530F] text-white font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
                    >
                      <Zap className="w-4 h-4" />
                      <span>BUY NOW</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={handleWhatsApp}
                  className={`w-full h-10 px-4 rounded-lg font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] ${
                    isOutOfStock
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#25D366] hover:bg-[#1EBE5B] text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Inquire Restock Date on WhatsApp' : 'Chat with Garhwa Counter on WhatsApp'}</span>
                </button>
              </div>

              {/* Showroom Direct Pick-up Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <Store className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block font-semibold">Chiniya Road Showroom Pickup</strong>
                  <span className="text-[11px] text-amber-800">
                    Order online and collect within 30 minutes with live hardware test and software setup.
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Detailed Information Tabs (Specs, Description, Reviews) */}
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 sm:p-8 shadow-xs mb-10">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('specs')}
              className={`py-2 px-4 rounded-lg text-xs sm:text-[13px] font-bold transition-all ${
                activeTab === 'specs'
                  ? 'bg-[#1A56DB] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Full Specifications
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`py-2 px-4 rounded-lg text-xs sm:text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'whatsapp' || activeTab === 'warranty'
                  ? 'bg-[#25D366] text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp: +91 9608828288</span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-2 px-4 rounded-lg text-xs sm:text-[13px] font-bold transition-all ${
                activeTab === 'reviews'
                  ? 'bg-[#1A56DB] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Customer Reviews ({product.reviews?.length || 0})
            </button>
          </div>

          {/* TAB 1: Specs & Overview */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Product Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
                  {product.description}
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-4">Technical Specifications</h3>
                <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200 text-xs sm:text-sm">
                  <div className="grid grid-cols-3 p-3 bg-slate-50">
                    <span className="font-semibold text-slate-500">Brand</span>
                    <span className="col-span-2 text-slate-900 font-bold">{product.brand}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-white">
                    <span className="font-semibold text-slate-500">Model Name</span>
                    <span className="col-span-2 text-slate-900 font-medium">{product.name}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-slate-50">
                    <span className="font-semibold text-slate-500">Category</span>
                    <span className="col-span-2 text-slate-900 font-medium">{product.category}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-white">
                    <span className="font-semibold text-slate-500">Stock Keeping Unit (SKU)</span>
                    <span className="col-span-2 text-slate-900 font-mono text-xs">{product.sku}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-slate-50">
                    <span className="font-semibold text-slate-500">Configuration</span>
                    <span className="col-span-2 text-slate-900 font-medium">{product.specs || 'Certified Genuine Box Package'}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-white">
                    <span className="font-semibold text-slate-500">Condition</span>
                    <span className="col-span-2 text-slate-900 font-medium">100% Brand New Box Pack with Seal</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-slate-50">
                    <span className="font-semibold text-slate-500">Showroom Availability</span>
                    <span className="col-span-2 text-emerald-700 font-bold">Ready for Instant Pickup in Garhwa</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WhatsApp Direct Order & Showroom Assistance */}
          {(activeTab === 'whatsapp' || activeTab === 'warranty') && (
            <div className="space-y-5 text-xs sm:text-sm">
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50/50 border border-emerald-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Garhwa Showroom Live WhatsApp Help
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Direct WhatsApp Assistance & Order: +91 9608828288
                    </h3>
                    <p className="text-xs text-slate-600 max-w-xl">
                      Have questions about <span className="font-bold text-slate-800">{product.name}</span>? Chat directly with our Garhwa showroom team for live photos, counter pickup, best price, or same-day delivery.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <a
                      href={`https://wa.me/919608828288?text=${encodeURIComponent(`Hello Lapiez Garhwa, I want to inquire about / buy: ${product.name} (SKU: ${product.sku}, Price: ₹${priceNum.toLocaleString('en-IN')})`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 fill-white" />
                      <span>Chat on WhatsApp</span>
                    </a>
                    <a
                      href="tel:+919608828288"
                      className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call +91 9608828288</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Showroom Warranty & Purchase Protection */}
              <div className="pt-2 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Garhwa Showroom Warranty & Purchase Protection</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700">
                  <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Official Brand Warranty:</strong> Minimum 1 to 3 years warranty valid across India.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>7-Day Showroom Replacement:</strong> Instant replacement at Chiniya Road showroom for defects.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Free Lifetime Support:</strong> Store support for software, BIOS update, or diagnostics.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>GST Tax Invoice:</strong> Official printed invoice with 18% GSTIN for business tax credit.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900">{product.rating || 5.0}</span>
                    <span className="text-sm text-slate-400">/ 5.0</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {product.reviews && product.reviews.length > 0 
                      ? `Based on ${product.reviews.length} customer reviews` 
                      : 'Verified Showroom Hardware Quality (Garhwa)'}
                  </p>
                </div>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Product Reviews List */}
              <div className="space-y-3.5">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev, idx) => (
                    <div key={rev.id || idx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{rev.author}</span>
                          {rev.verified && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400">{rev.date}</span>
                      </div>
                      <div className="flex items-center text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{rev.title}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center mx-auto">
                      <Award className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Showroom Tested Genuine Guarantee</h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      This item is in stock at our Chiniya Road showroom with brand sealed box, 18% GST invoice, and manufacturer warranty.
                    </p>
                    <div className="pt-2">
                      <a
                        href={`https://wa.me/919608828288?text=${encodeURIComponent(`Hello Lapiez Garhwa, I want to submit feedback / ask about: ${product.name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4 fill-white" />
                        <span>Submit Feedback / Review on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight">
                  Similar & Related Products
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Explore other high-performance options in {product.category}
                </p>
              </div>
              <Link
                href={`/shop?cat=${encodeURIComponent(product.category)}`}
                className="text-xs font-bold text-[#1A56DB] hover:text-[#1E40AF] flex items-center gap-1"
              >
                <span>View All in {product.category}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
