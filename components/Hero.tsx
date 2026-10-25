'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, ShieldCheck, CheckCircle2, ShoppingCart, 
  Laptop, Camera, Cpu, Zap, MessageSquare, 
  MapPin, Store, BadgePercent, Receipt, Truck, Flame, Clock, Plus, Minus
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';

export const Hero: React.FC = () => {
  const router = useRouter();
  const { products, cart, addToCart, updateQuantity, setSelectedProduct, siteSettings } = useStore();
  const [activeTab, setActiveTab] = useState<'laptop' | 'cctv' | 'pc' | 'spares'>('laptop');

  const laptopDeal = products.find(p => p.category === 'Laptops') || {
    id: 'prod-flagship-1',
    name: 'HP 15s Intel Core i5 12th Gen (16GB RAM / 512GB NVMe SSD)',
    brand: 'HP',
    price: 52999,
    mrp: 65999,
    specs: 'Intel Core i5-1235U | 16GB DDR4 | 512GB NVMe SSD | 15.6" FHD IPS | Backlit KB | Win 11 + MSO',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
    inStock: true,
    sku: 'HP15-I5-16-512'
  };

  const cctvDeal = products.find(p => p.category === 'CCTV & Security') || {
    id: 'prod-flagship-7',
    name: 'CP-PLUS 4-Camera 5MP Full-Color Security Kit with 1TB HDD',
    brand: 'CP-PLUS',
    price: 18499,
    mrp: 24000,
    specs: '4x 5MP Color Night-Vision Cameras | 4-Ch AI DVR | 1TB Purple HDD | Power Supply & Connectors',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
    inStock: true,
    sku: 'CPP-4CAM-5MP'
  };

  const pcDeal = products.find(p => p.category === 'Computers') || {
    id: 'prod-flagship-5',
    name: 'Custom Creator & Gaming Workstation Tower (i5 12th / RTX 3050)',
    brand: 'Intel / MSI',
    price: 52999,
    mrp: 66000,
    specs: 'Intel Core i5 12400F | RTX 3050 6GB | 16GB 3200MHz RAM | 512GB Gen4 NVMe | 550W 80+ Bronze',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
    inStock: true,
    sku: 'RIG-I5-RTX3050'
  };

  const sparesDeal = {
    id: 'spares-deal-1',
    name: 'Original 65W Smart Laptop Charger / Adapter (Type-C / Round Pin)',
    brand: 'HP / Dell / Lenovo',
    price: 1199,
    mrp: 1899,
    specs: 'Genuine OEM Replacement | Surge Protection | Copper Core | 1 Year Showroom Warranty',
    image: '/images/categories/laptop-adapters.png',
    inStock: true,
    sku: 'SP-ADP-65W'
  };

  const currentDeal = activeTab === 'laptop' 
    ? laptopDeal 
    : activeTab === 'cctv' 
    ? cctvDeal 
    : activeTab === 'pc' 
    ? pcDeal 
    : sparesDeal;

  const discountPercent = Math.round(((currentDeal.mrp - currentDeal.price) / currentDeal.mrp) * 100);
  const savings = currentDeal.mrp - currentDeal.price;

  const handleInstantBuy = () => {
    addToCart(currentDeal as any);
    router.push('/checkout');
  };

  return (
    <section className="bg-white border-b border-[#E5E7EB] pt-6 pb-10 sm:py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Indian E-Commerce Banner Headline & Benefits */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Festival / Showroom Pill Badge */}
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[12px] font-bold text-[#92400E]">
              <span className="flex items-center gap-1.5 text-[#B45309]">
                <Flame className="w-3.5 h-3.5 text-[#DC2626] fill-[#DC2626]" />
                MEGA TECH FESTIVAL DEALS
              </span>
              <span className="text-[#D97706]">•</span>
              <span>Chiniya Road, Garhwa</span>
              <span className="text-[#D97706]">•</span>
              <span className="text-[#15803D] font-bold">100% Genuine Boxed</span>
            </div>

            {/* High-Impact E-Commerce Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#111827] tracking-tight leading-[1.15]">
              Save Up to 45% on Genuine Laptops, Custom PCs & CCTV Kits
            </h1>

            {/* Subtitle with Indian Trust Signals */}
            <p className="text-[14.5px] sm:text-[16px] text-[#4B5563] font-normal leading-relaxed max-w-xl">
              100% brand-new sealed electronics, genuine laptop spare parts, and CP-PLUS surveillance systems. Backed by official brand warranty, 18% GST tax invoices, and same-day delivery across Garhwa and Palamu.
            </p>

            {/* Action Buttons: Browse, WhatsApp Order, Showroom */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/shop"
                className="h-11 px-6 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-[14px] flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Browse All 280+ Deals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent(`Hello ${siteSettings?.siteName || 'Lapiez'}, I want to order / inquire about laptop and CCTV prices.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-[14px] flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Order on WhatsApp</span>
              </a>

              <a
                href={STORE_INFO.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-semibold text-[13px] flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Showroom Map</span>
              </a>
            </div>

            {/* 4 Trust Pillars (Critical for Indian Consumers) */}
            <div className="pt-4 border-t border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#374151]">
              <div className="flex items-center gap-2 bg-[#F9FAFB] p-2 rounded-lg border border-gray-100">
                <ShieldCheck className="w-4 h-4 text-[#15803D] flex-shrink-0" />
                <span className="font-semibold">Brand Sealed Pack</span>
              </div>
              <div className="flex items-center gap-2 bg-[#F9FAFB] p-2 rounded-lg border border-gray-100">
                <Receipt className="w-4 h-4 text-[#1A56DB] flex-shrink-0" />
                <span className="font-semibold">18% GST Tax Bill</span>
              </div>
              <div className="flex items-center gap-2 bg-[#F9FAFB] p-2 rounded-lg border border-gray-100">
                <Truck className="w-4 h-4 text-[#15803D] flex-shrink-0" />
                <span className="font-semibold">Free Local Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-[#F9FAFB] p-2 rounded-lg border border-gray-100">
                <Store className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                <span className="font-semibold">Store Pickup in 30m</span>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Authentic "Deal of the Day" Showcase Card  */}
          {/* ========================================================= */}
          <div className="lg:col-span-5">
            <div className="bg-white border-2 border-[#1A56DB]/30 rounded-2xl p-4 sm:p-5 shadow-md relative">
              
              {/* Deal Header with Clock */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#DC2626] text-white text-[11px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-white" />
                    DEAL OF THE DAY
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11.5px] font-semibold text-[#DC2626]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ends Tonight 11:59 PM</span>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#F1F3F6] rounded-lg mb-4 overflow-x-auto no-scrollbar">
                {[
                  { id: 'laptop', label: 'Laptops', icon: Laptop },
                  { id: 'cctv', label: 'CCTV Kits', icon: Camera },
                  { id: 'pc', label: 'Custom PCs', icon: Cpu },
                  { id: 'spares', label: 'Spares & SSD', icon: Zap }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11.5px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                      activeTab === t.id
                        ? 'bg-[#1A56DB] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                  >
                    <t.icon className="w-3 h-3" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Product Visual & Content */}
              <div className="space-y-3">
                
                {/* Visual Stage */}
                <div 
                  onClick={() => setSelectedProduct(currentDeal as any)}
                  className="relative aspect-[16/10] bg-[#F8FAFC] rounded-xl border border-gray-200 p-4 flex items-center justify-center overflow-hidden cursor-pointer group"
                >
                  <img 
                    src={currentDeal.image} 
                    alt={currentDeal.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>In Stock · Garhwa Showroom</span>
                  </div>

                  {/* Discount Badge */}
                  {discountPercent > 0 && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-[#DC2626] text-white text-[11px] font-extrabold flex items-center gap-0.5">
                      <span>{discountPercent}% OFF</span>
                    </div>
                  )}
                </div>

                {/* Product Metadata */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                    <span className="font-bold uppercase tracking-wider text-[#1A56DB]">{currentDeal.brand}</span>
                    <span className="font-medium text-gray-400">SKU: {currentDeal.sku}</span>
                  </div>

                  <h3 
                    onClick={() => setSelectedProduct(currentDeal as any)}
                    className="text-[15.5px] font-bold text-gray-900 hover:text-[#1A56DB] transition-colors cursor-pointer leading-snug line-clamp-1"
                  >
                    {currentDeal.name}
                  </h3>

                  <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-1 mt-1">
                    {currentDeal.specs}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[22px] sm:text-[24px] font-extrabold text-[#111827] tracking-tight">
                        ₹{currentDeal.price.toLocaleString('en-IN')}
                      </span>
                      {currentDeal.mrp > currentDeal.price && (
                        <span className="text-[13px] text-gray-400 line-through">
                          ₹{currentDeal.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {savings > 0 && (
                      <span className="text-[11.5px] text-[#15803D] font-bold block">
                        You Save ₹{savings.toLocaleString('en-IN')} ({discountPercent}% Discount)
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Incl. 18% GST
                  </span>
                </div>

                {/* Instant Actions (Buy Now + Add to Cart) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleInstantBuy}
                    className="h-10 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <span>Buy Now</span>
                  </button>

                  {(() => {
                    const dealInCart = currentDeal ? (cart || []).find(item => item.product.id === (currentDeal as any).id) : null;
                    const dealQty = dealInCart ? dealInCart.quantity : 0;
                    if (dealQty > 0) {
                      return (
                        <div className="h-10 rounded-lg bg-[#1A56DB] text-white flex items-center justify-between px-2 shadow-xs border border-[#1E40AF] select-none">
                          <button
                            type="button"
                            onClick={() => updateQuantity((currentDeal as any).id, dealQty - 1)}
                            className="w-7 h-7 rounded hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
                            title="Decrease"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <span className="font-extrabold text-[13px] px-1">{dealQty} in Cart</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity((currentDeal as any).id, dealQty + 1)}
                            className="w-7 h-7 rounded hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
                            title="Increase"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={() => addToCart(currentDeal as any, 1)}
                        className="h-10 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    );
                  })()}
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
