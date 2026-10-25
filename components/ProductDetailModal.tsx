'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, Heart, ShoppingCart, MessageSquare, Star, 
  ShieldCheck, Truck, Store, ExternalLink, Plus, Minus
} from 'lucide-react';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';
import { useStore } from '../context/StoreContext';

export const ProductDetailModal: React.FC = () => {
  const router = useRouter();
  const { 
    selectedProduct, 
    setSelectedProduct, 
    cart,
    addToCart, 
    updateQuantity,
    toggleWishlist, 
    wishlistIds,
    siteSettings
  } = useStore();

  const cartItem = selectedProduct ? (cart || []).find(
    (item) => item.product.id === selectedProduct.id || (selectedProduct.sku && item.product.sku === selectedProduct.sku)
  ) : null;
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Reset active image on product switch
  React.useEffect(() => {
    setActiveImage(null);
  }, [selectedProduct?.id]);

  const imagesList = React.useMemo(() => {
    if (!selectedProduct) return [];
    let list: string[] = [];
    if (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0) {
      list = selectedProduct.images
        .flatMap((s: any) => typeof s === 'string' && s.includes('|||') ? s.split('|||') : [s])
        .map((s: string) => String(s).trim())
        .filter(Boolean);
    }
    if (list.length === 0 && selectedProduct.image) {
      if (typeof selectedProduct.image === 'string' && selectedProduct.image.includes('|||')) {
        list = selectedProduct.image.split('|||').map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof selectedProduct.image === 'string' && selectedProduct.image.startsWith('[')) {
        try {
          const parsed = JSON.parse(selectedProduct.image);
          if (Array.isArray(parsed)) list = parsed.map((s: string) => String(s).trim()).filter(Boolean);
        } catch (e) {}
      } else {
        list = [String(selectedProduct.image).trim()];
      }
    }
    return list.length > 0 ? list : (selectedProduct.image ? [selectedProduct.image] : []);
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const currentImg = activeImage || imagesList[0] || selectedProduct.image || '/images/product-placeholder.svg';
  const isWishlisted = Array.isArray(wishlistIds) && wishlistIds.includes(selectedProduct.id);
  const isOutOfStock = selectedProduct.inStock === false || (selectedProduct.stockQuantity !== undefined && selectedProduct.stockQuantity !== null && Number(selectedProduct.stockQuantity) <= 0);
  const priceNum = Number(selectedProduct.price || 0);
  const mrpNum = Number(selectedProduct.mrp || 0);

  const displaySpecs = typeof selectedProduct.specs === 'object' && selectedProduct.specs !== null
    ? Object.entries(selectedProduct.specs).map(([k, v]) => `${k}: ${v}`).join(' | ')
    : String(selectedProduct.specs || selectedProduct.description || 'Genuine Hardware Specifications');

  const topReview = Array.isArray(selectedProduct.reviews) && selectedProduct.reviews.length > 0 && typeof selectedProduct.reviews[0] === 'object'
    ? selectedProduct.reviews[0]
    : null;

  const handleWhatsApp = () => {
    const storeTitle = siteSettings?.siteName || 'Lapiez Garhwa';
    const text = isOutOfStock
      ? `Hello ${storeTitle}, I am interested in:\n*${selectedProduct.name}*\nPrice: ₹${priceNum.toLocaleString('en-IN')}\nSKU: ${selectedProduct.sku}\nThis product is currently marked as Out of Stock on your website. When will it be available for purchase at your showroom?`
      : `Hello ${storeTitle}, I want to inquire about:\n*${selectedProduct.name}*\nPrice: ₹${priceNum.toLocaleString('en-IN')}\nSKU: ${selectedProduct.sku}\nCan I inspect or pick this up at your Chiniya Road showroom?`;
    const waNumber = getCleanWhatsAppNumber(siteSettings?.whatsapp);
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(selectedProduct);
    setSelectedProduct(null);
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setSelectedProduct(null);
            setActiveImage(null);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors z-10"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Gallery (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="relative aspect-square rounded-xl bg-slate-50 p-4 border border-slate-200 flex items-center justify-center overflow-hidden">
              {isOutOfStock && (
                <span className="absolute top-3 left-3 z-10 text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2.5 py-1 rounded shadow-xs">
                  Out of Stock
                </span>
              )}
              <img 
                src={currentImg} 
                alt={selectedProduct.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {imagesList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imagesList.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`w-14 h-14 rounded-lg bg-slate-50 p-1 border transition-all flex-shrink-0 ${
                      currentImg === img ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedProduct.brand} • {selectedProduct.category}
                </span>
                <div className="flex items-center gap-2">
                  {isOutOfStock && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      OUT OF STOCK
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">
                    SKU: {selectedProduct.sku}
                  </span>
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 leading-snug">
                {selectedProduct.name}
              </h2>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="ml-1 text-xs font-bold text-slate-700">{Number(selectedProduct.rating || 4.8).toFixed(1)}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">{selectedProduct.reviewsCount || 18} Verified Local Reviews</span>
              </div>
            </div>

            {/* Price */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  ₹{priceNum.toLocaleString('en-IN')}
                </span>
                {mrpNum > priceNum && (
                  <span className="text-sm text-slate-400 line-through font-mono">
                    ₹{mrpNum.toLocaleString('en-IN')}
                  </span>
                )}
                {selectedProduct.discount > 0 && !isOutOfStock && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedProduct.discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Inclusive of all taxes + GST 18% ITC Invoicing Available
              </p>
            </div>

            {/* Specs */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Specifications</h4>
              <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100 font-mono">
                {displaySpecs}
              </p>
            </div>

            {/* Top Verified Review */}
            {topReview && (
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <span>{topReview.author || 'Verified Buyer'}</span>
                    {topReview.location && (
                      <span className="text-slate-400 font-normal text-[10px]">({topReview.location})</span>
                    )}
                    <span className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded text-[9.5px] font-semibold">Verified Buyer</span>
                  </div>
                  <div className="flex items-center text-amber-500">
                    {[...Array(Math.max(1, Math.min(5, Math.round(Number(topReview.rating) || 5))))].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-700 italic leading-relaxed">
                  "{topReview.comment}"
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2 pt-2">
              {isOutOfStock ? (
                <div className="space-y-2">
                  <div className="h-10 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed select-none">
                    <span>Currently Out of Stock at Garhwa Showroom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleWhatsApp}
                      className="flex-1 h-9 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Inquire Availability on WhatsApp</span>
                    </button>
                    <Link
                      href={`/product/${selectedProduct.id}`}
                      onClick={() => setSelectedProduct(null)}
                      className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Full Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {inCartQty > 0 ? (
                      <div className="h-10 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-between px-2 shadow-xs border border-blue-700 select-none">
                        <button
                          type="button"
                          onClick={() => updateQuantity(selectedProduct.id, inCartQty - 1)}
                          className="w-7 h-7 rounded-lg hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center font-bold transition-colors"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <span className="font-extrabold text-sm px-1">{inCartQty} in Cart</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(selectedProduct.id, inCartQty + 1)}
                          className="w-7 h-7 rounded-lg hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center font-bold transition-colors"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(selectedProduct, 1)}
                        className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer active:scale-95"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    )}

                    <button
                      onClick={handleBuyNow}
                      className="h-10 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Buy Now</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleWhatsApp}
                      className="flex-1 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Inquire on WhatsApp</span>
                    </button>

                    <Link
                      href={`/product/${selectedProduct.id}`}
                      onClick={() => setSelectedProduct(null)}
                      className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Full Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Guarantees */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-[10px] text-slate-500 text-center">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Genuine Boxed</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>Counter Testing</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Garhwa Express</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
