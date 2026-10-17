'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, MessageSquare, Star, Truck, Check } from 'lucide-react';
import { Product } from '../data/products';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 
    addToCart, 
    toggleWishlist, 
    wishlistIds,
    siteSettings
  } = useStore();

  const isWishlisted = wishlistIds.includes(product.id);
  const isOutOfStock = product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity !== null && Number(product.stockQuantity) <= 0);

  const savings = product.mrp > product.price ? product.mrp - product.price : 0;
  const ratingValue = (product.rating || 4.4).toFixed(1);

  const handleWhatsAppInquiry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const storeTitle = siteSettings?.siteName || 'Lapiez Garhwa';
    const text = isOutOfStock
      ? `Hello ${storeTitle}, I am interested in:\n*${product.name}*\nPrice: ₹${Number(product.price || 0).toLocaleString('en-IN')}\nSKU: ${product.sku}\nThis product is currently marked as Out of Stock on your website. When will it be available for purchase at your showroom?`
      : `Hello ${storeTitle}, I want to purchase:\n*${product.name}*\nPrice: ₹${Number(product.price || 0).toLocaleString('en-IN')}\nSKU: ${product.sku}\nIs this in stock at your Chiniya Road showroom?`;
    const waNumber = getCleanWhatsAppNumber(siteSettings?.whatsapp);
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const primaryImage = product.image?.includes('|||')
    ? product.image.split('|||')[0].trim()
    : (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image);

  return (
    <div 
      className={`group relative bg-white border rounded-2xl p-2.5 sm:p-3.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg shadow-xs ${
        isOutOfStock ? 'border-gray-200 opacity-95' : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
      }`}
    >
      <div>
        
        {/* Product Image Stage with Overlay Badges */}
        <div className="relative aspect-[4/3] rounded-xl bg-[#F8FAFC] p-2 sm:p-2.5 overflow-hidden mb-2.5 border border-[#F1F5F9] group-hover:border-blue-100 transition-colors">
          
          {/* Floating Discount / Out-of-Stock Badge */}
          {isOutOfStock ? (
            <span className="absolute top-2 left-2 z-10 text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded shadow-xs">
              Out of Stock
            </span>
          ) : product.discount > 0 ? (
            <span className="absolute top-2 left-2 z-10 text-[10px] font-extrabold bg-[#15803D] text-white px-1.5 py-0.5 rounded shadow-xs">
              {product.discount}% OFF
            </span>
          ) : null}

          {/* Floating Wishlist Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xs cursor-pointer ${
              isWishlisted
                ? 'bg-red-50 text-[#DC2626] border border-red-200'
                : 'bg-white/90 hover:bg-white text-gray-500 hover:text-gray-900 border border-gray-200/80'
            }`}
            title={isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
            aria-label="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#DC2626]' : ''}`} />
          </button>

          {/* Product Image Link */}
          <Link 
            href={`/product/${product.id}`} 
            className="w-full h-full flex items-center justify-center"
          >
            <img 
              src={primaryImage || '/images/categories/laptop-adapters.png'} 
              alt={product.name}
              className={`max-h-full max-w-full object-contain mx-auto transition-transform duration-300 group-hover:scale-105 ${
                isOutOfStock ? 'grayscale-[0.4] opacity-80' : ''
              }`}
              loading="lazy"
            />
          </Link>
        </div>

        {/* Brand Name + Rating Pill (Clean 2-item row that NEVER wraps) */}
        <div className="flex items-center justify-between gap-1.5 mb-1 px-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 truncate">
            {product.brand}
          </span>
          <span className="bg-[#15803D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
            <span>{ratingValue}</span>
            <Star className="w-2.5 h-2.5 fill-white" />
          </span>
        </div>

        {/* Product Title (Clean 2-line clamp with stable min-height) */}
        <Link href={`/product/${product.id}`} className="block mb-1 px-0.5">
          <h3 className="text-[13px] sm:text-[14px] font-semibold text-[#111827] group-hover:text-[#1A56DB] transition-colors line-clamp-2 leading-snug min-h-[36px]">
            {product.name}
          </h3>
        </Link>

        {/* Technical Specs snippet */}
        <p className="text-[11px] sm:text-[11.5px] text-[#6B7280] line-clamp-1 mb-2 px-0.5 font-normal">
          {product.specs}
        </p>

      </div>

      <div className="pt-2 border-t border-[#F3F4F6]">
        
        {/* Price & Savings Display */}
        <div className="mb-2 px-0.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[16px] sm:text-[18px] font-black text-[#111827] tracking-tight">
              ₹{Number(product.price || 0).toLocaleString('en-IN')}
            </span>
            {Number(product.mrp || 0) > Number(product.price || 0) && (
              <span className="text-[11px] sm:text-[12px] text-gray-400 line-through">
                ₹{Number(product.mrp || 0).toLocaleString('en-IN')}
              </span>
            )}
            {savings > 0 && !isOutOfStock && (
              <span className="text-[10px] font-bold text-[#15803D]">
                Save ₹{Number(savings || 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] mt-0.5">
            {isOutOfStock ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                Out of Stock
              </span>
            ) : (
              <span className="text-[#15803D] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                In Stock · Garhwa
              </span>
            )}
            <span className="hidden sm:inline text-gray-400">18% GST Bill</span>
          </div>
        </div>

        {/* Action Buttons: Add to Cart + WhatsApp Buy */}
        <div className="grid grid-cols-4 gap-1.5">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="col-span-3 h-8.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-not-allowed select-none"
            >
              <span>Out of Stock</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="col-span-3 h-8.5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[12px] sm:text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
              title="Add to Shopping Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleWhatsAppInquiry}
            className={`col-span-1 h-8.5 rounded-lg border flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
              isOutOfStock
                ? 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700'
                : 'border-[#A7F3D0] bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#15803D]'
            }`}
            title={isOutOfStock ? "Inquire availability on WhatsApp" : "Order / Inquire on WhatsApp"}
            aria-label="Order on WhatsApp"
          >
            <MessageSquare className={`w-3.5 h-3.5 ${isOutOfStock ? 'text-amber-600' : 'text-[#16A34A]'}`} />
          </button>
        </div>

      </div>
    </div>
  );
};
