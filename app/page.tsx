'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, ShieldCheck, Truck, Receipt, 
  Store, Sparkles, MessageSquare, Phone,
  Layers, CheckCircle2, ChevronRight,
  Star, Crown, Laptop, BookOpen, Clock, Tag
} from 'lucide-react';
import { TopBannerSlider } from '../components/TopBannerSlider';
import { Hero } from '../components/Hero';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProductCard } from '../components/ProductCard';
import { BrandShowcase } from '../components/BrandShowcase';
import { FaqSection } from '../components/FaqSection';
import { useStore, CMSSection, isDemoProduct } from '../context/StoreContext';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';
import { Product } from '../data/products';

export default function Home() {
  const { products, homepageSections, siteSettings, blogPosts } = useStore();

  const [activeTrendingTab, setActiveTrendingTab] = useState<'all' | 'monitors' | 'printers' | 'memory' | 'laptops' | 'cctv' | 'accessories'>('all');

  // Curated collections from live showroom database
  const trendingMonitors = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes('monitor'));
  }, [products]);

  const trendingPrinters = useMemo(() => {
    return products.filter(p => (p.category || '').toLowerCase().includes('printer'));
  }, [products]);

  const trendingMemory = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes('ram') || (p.category || '').toLowerCase().includes('storage') || (p.category || '').toLowerCase().includes('memory'));
  }, [products]);

  const trendingLaptops = useMemo(() => {
    return products.filter(p => (p.category || '').toLowerCase().includes('laptop'));
  }, [products]);

  const trendingCctv = useMemo(() => {
    return products.filter(p => (p.category || '').toLowerCase().includes('cctv') || (p.category || '').toLowerCase().includes('security'));
  }, [products]);

  const trendingAccessories = useMemo(() => {
    return products.filter(p => {
      const cat = (p.category || '').toLowerCase();
      return (p.brand === 'Frontech' || cat.includes('accessories') || cat.includes('parts') || cat.includes('peripheral')) &&
        !p.name.toLowerCase().includes('monitor') &&
        !p.name.toLowerCase().includes('ram');
    });
  }, [products]);

  // Mixed Trending showcasing Frontech Displays + Printers + RAM & Memory
  const defaultTrendingProducts = useMemo(() => {
    if (activeTrendingTab === 'monitors') return trendingMonitors.slice(0, 8);
    if (activeTrendingTab === 'printers') return trendingPrinters.slice(0, 8);
    if (activeTrendingTab === 'memory') return trendingMemory.slice(0, 8);
    if (activeTrendingTab === 'laptops') return trendingLaptops.slice(0, 8);
    if (activeTrendingTab === 'cctv') return trendingCctv.slice(0, 8);
    if (activeTrendingTab === 'accessories') return trendingAccessories.slice(0, 8);

    const monitors = trendingMonitors.slice(0, 3);
    const printers = trendingPrinters.slice(0, 3);
    const memory = trendingMemory.slice(0, 2);
    const combined = [...monitors, ...printers, ...memory];
    return combined.length > 0 ? combined.slice(0, 8) : products.slice(0, 8);
  }, [activeTrendingTab, trendingMonitors, trendingPrinters, trendingMemory, trendingLaptops, trendingCctv, trendingAccessories, products]);

  // Quick category tags
  const quickCategories = useMemo(() => [
    { name: 'Frontech Monitors', count: products.filter(p => p.name.toLowerCase().includes('monitor')).length, href: '/shop?search=Monitor' },
    { name: 'Printers & Inks', count: products.filter(p => (p.category || '').toLowerCase().includes('printer') || (p.category || '').toLowerCase().includes('ink') || (p.category || '').toLowerCase().includes('toner')).length, href: '/shop?cat=Printers' },
    { name: 'Desktop & Laptop RAM', count: products.filter(p => p.name.toLowerCase().includes('ram')).length, href: '/shop?search=RAM' },
    { name: 'Laptops', count: products.filter(p => (p.category || '').toLowerCase().includes('laptop')).length, href: '/shop?cat=Computer%20%26%20Laptops' },
    { name: 'CCTV Security', count: products.filter(p => (p.category || '').toLowerCase().includes('cctv') || (p.category || '').toLowerCase().includes('security')).length, href: '/shop?cat=CCTV%20%26%20Security' },
  ], [products]);

  // Sorted list of active homepage sections (Brands placed directly below banners)
  const sortedSections = useMemo(() => {
    let sectionsList: CMSSection[] = [];
    if (homepageSections && homepageSections.length > 0) {
      sectionsList = [...homepageSections]
        .filter((s) => s.isVisible && s.sectionKey !== 'hero')
        .sort((a, b) => a.position - b.position);
    } else {
      sectionsList = [
        { sectionKey: 'banners', title: 'Banner Slider', position: 1, isVisible: true },
        { sectionKey: 'brands', title: 'Brands Showcase', position: 2, isVisible: true },
        { sectionKey: 'trust_bar', title: 'Trust Bar', position: 3, isVisible: true },
        { sectionKey: 'categories', title: 'Categories', position: 4, isVisible: true },
        { sectionKey: 'trending', title: 'Trending Products', position: 5, isVisible: true },
        { sectionKey: 'bestsellers', title: 'Best Sellers', position: 6, isVisible: true },
        { sectionKey: 'premium', title: 'Premium Segment', position: 7, isVisible: true },
        { sectionKey: 'refurbished_laptops', title: 'Refurbished Laptops & Printers', position: 8, isVisible: true },
        { sectionKey: 'promo', title: 'Promotional Deals', position: 9, isVisible: true },
        { sectionKey: 'cctv_spotlight', title: 'CCTV & Security Surveillance', position: 10, isVisible: true },
        { sectionKey: 'blogs_preview', title: 'Latest Tech Guides', position: 11, isVisible: true },
        { sectionKey: 'catalog_cta', title: 'Catalog CTA', position: 12, isVisible: true },
        { sectionKey: 'showroom', title: 'Showroom Guarantee', position: 13, isVisible: true },
      ] as CMSSection[];
    }

    return sectionsList;
  }, [homepageSections]);

  // Helper to extract products assigned to a section or provide fallback
  const getSectionProducts = (sec: CMSSection, defaultFallback: Product[]): Product[] => {
    let ids: string[] = [];
    if (sec.productIds) {
      if (Array.isArray(sec.productIds)) {
        ids = sec.productIds;
      } else if (typeof sec.productIds === 'string') {
        try {
          ids = JSON.parse(sec.productIds);
        } catch {
          ids = [];
        }
      }
    }

    if (ids.length > 0) {
      const selected = ids
        .map((id) => products.find((p) => p.id === id && !isDemoProduct(p)))
        .filter(Boolean) as Product[];
      if (selected.length > 0) return selected;
    }
    return defaultFallback.filter(p => !isDemoProduct(p));
  };

  const renderSection = (sec: CMSSection) => {
    const key = sec.sectionKey;

    switch (key) {
      case 'banners':
        return <TopBannerSlider key="banners" />;

      case 'hero':
        return <Hero key="hero" />;

      case 'trust_bar':
        return (
          <div key="trust_bar" className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
                <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A56DB] flex-shrink-0">
                    <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[12px] sm:text-[14px] font-bold text-[#111827] truncate">18% GST Invoicing</h4>
                    <p className="text-[10px] sm:text-[11.5px] text-[#4B5563] truncate">Claim ITC for business</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-[#15803D] flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[12px] sm:text-[14px] font-bold text-[#111827] truncate">Brand Warranty</h4>
                    <p className="text-[10px] sm:text-[11.5px] text-[#4B5563] truncate">HP, Dell, Lenovo verified</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-[#D97706] flex-shrink-0">
                    <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[12px] sm:text-[14px] font-bold text-[#111827] truncate">30-Min Store Pickup</h4>
                    <p className="text-[10px] sm:text-[11.5px] text-[#4B5563] truncate">Chiniya Road, Garhwa</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7C3AED] flex-shrink-0">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[12px] sm:text-[14px] font-bold text-[#111827] truncate">Free Local Delivery</h4>
                    <p className="text-[10px] sm:text-[11.5px] text-[#4B5563] truncate">Garhwa & Palamu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'categories':
        return <CategoryGrid key="categories" />;

      // 1. TRENDING PRODUCTS SECTION
      case 'trending':
      case 'featured': {
        const trendingItems = getSectionProducts(sec, defaultTrendingProducts).filter(p => !isDemoProduct(p));
        if (trendingItems.length === 0) return null;
        return (
          <div key={sec.id || 'trending'} className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 sm:mb-4.5">
              <div>
                <h2 className="text-[20px] sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
                  {sec.title || 'Trending Products'}
                </h2>
                <p className="text-[11.5px] sm:text-[13px] text-[#4B5563] mt-0.5 max-w-2xl leading-relaxed">
                  {sec.subtitle || 'Featuring genuine Frontech frameless & curved monitors, 12th/13th Gen laptops, and showroom verified hardware.'}
                </p>
              </div>

              <Link
                href="/shop"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs self-start sm:self-auto flex-shrink-0"
              >
                <span>View All {products.length > 0 ? `${products.length} Products` : 'Products'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Interactive Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 no-scrollbar">
              {[
                { id: 'all', label: 'All Trending', count: trendingItems.length },
                { id: 'monitors', label: 'Frontech Displays', count: trendingMonitors.length },
                { id: 'printers', label: 'Printers & All-In-Ones', count: trendingPrinters.length },
                { id: 'memory', label: 'RAM & Memory', count: trendingMemory.length },
                ...(trendingLaptops.length > 0 ? [{ id: 'laptops', label: 'Laptops', count: trendingLaptops.length }] : []),
                ...(trendingCctv.length > 0 ? [{ id: 'cctv', label: 'CCTV Security', count: trendingCctv.length }] : []),
              ].map((tab) => {
                const isSelected = activeTrendingTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTrendingTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1A56DB] text-white shadow-xs font-bold'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-blue-800/60 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {trendingItems.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        );
      }

      case 'bestsellers': {
        const bestSellerFiltered = products.filter(p => !isDemoProduct(p) && ((p.rating && p.rating >= 4.4) || p.featured)).slice(0, 8);
        const bestSellerFallback = bestSellerFiltered.length > 0 ? bestSellerFiltered : products.slice(0, 8);
        const bestsellerItems = getSectionProducts(sec, bestSellerFallback).filter(p => !isDemoProduct(p));
        if (bestsellerItems.length === 0) return null;
        return (
          <div key={sec.id || 'bestsellers'} className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 sm:mb-4.5">
              <div>
                <h2 className="text-[20px] sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
                  {sec.title || 'Best Sellers'}
                </h2>
                <p className="text-[11.5px] sm:text-[13px] text-[#4B5563] mt-0.5 max-w-2xl leading-relaxed">
                  {sec.subtitle || 'Top-selling laptops, printers, and computer essentials trusted by 10,000+ customers across Garhwa.'}
                </p>
              </div>

              <Link
                href="/shop?sort=bestseller"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs self-start sm:self-auto flex-shrink-0"
              >
                <span>View All Best Sellers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {bestsellerItems.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        );
      }

      // 3. PREMIUM SEGMENT SECTION
      case 'premium': {
        const premiumFiltered = products.filter(p => 
          !isDemoProduct(p) && (
            p.price >= 14000 || 
            p.name.toLowerCase().includes('200hz') || 
            p.name.toLowerCase().includes('165hz') ||
            p.name.toLowerCase().includes('gaming') ||
            p.name.toLowerCase().includes('curved')
          )
        ).slice(0, 8);
        const premiumFallback = premiumFiltered.length > 0 ? premiumFiltered : [...products].sort((a, b) => b.price - a.price).slice(0, 8);
        const premiumItems = getSectionProducts(sec, premiumFallback).filter(p => !isDemoProduct(p));
        if (premiumItems.length === 0) return null;
        return (
          <div key={sec.id || 'premium'} className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 sm:mb-4.5">
              <div>
                <h2 className="text-[20px] sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
                  {sec.title || 'Premium Segment'}
                </h2>
                <p className="text-[11.5px] sm:text-[13px] text-[#4B5563] mt-0.5 max-w-2xl leading-relaxed">
                  {sec.subtitle || 'High-performance gaming monitors, flagship workstations, and 200Hz IPS curved displays for power users.'}
                </p>
              </div>

              <Link
                href="/shop?cat=Computers"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs self-start sm:self-auto flex-shrink-0"
              >
                <span>Explore Premium</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {premiumItems.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        );
      }

      // 4. REFURBISHED LAPTOPS & PRINTERS SECTION
      case 'refurbished_laptops': {
        const refCandidate = [
          ...trendingLaptops.filter(p => !isDemoProduct(p)).slice(0, 4),
          ...trendingPrinters.filter(p => !isDemoProduct(p)).slice(0, 4)
        ];
        const refurbishedFallback = refCandidate.length > 0 
          ? refCandidate 
          : products.filter(p => p.category === 'Laptops' || p.category === 'Printers').slice(0, 8).length > 0
          ? products.filter(p => p.category === 'Laptops' || p.category === 'Printers').slice(0, 8)
          : products.slice(0, 8);
        const refItems = getSectionProducts(sec, refurbishedFallback).filter(p => !isDemoProduct(p));
        if (refItems.length === 0) return null;
        return (
          <div key={sec.id || 'refurbished_laptops'} className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 sm:mb-4.5">
              <div>
                <h2 className="text-[20px] sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
                  {sec.title || 'Refurbished Laptops & Printers'}
                </h2>
                <p className="text-[11.5px] sm:text-[13px] text-[#4B5563] mt-0.5 max-w-2xl leading-relaxed">
                  {sec.subtitle || 'Tested quality Dell Latitude, HP EliteBook, Lenovo ThinkPad & commercial printers with local warranty support.'}
                </p>
              </div>

              <Link
                href="/shop?cat=Laptops"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs self-start sm:self-auto flex-shrink-0"
              >
                <span>View Refurbished Stock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {refItems.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        );
      }

      // 5. PROMOTIONAL BANNERS
      case 'promo':
        return (
          <div key="promo" className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              
              {/* Banner A: SSD & Memory Upgrade */}
              <div className="rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] p-4 sm:p-6 flex flex-col justify-between shadow-2xs relative overflow-hidden group">
                <div className="space-y-1.5 sm:space-y-2 z-10 max-w-md">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-[#1D4ED8] px-2 py-0.5 rounded bg-white/90 border border-blue-200 inline-block">
                    GENUINE NVME & RAM UPGRADES
                  </span>
                  <h3 className="text-[16px] sm:text-[22px] font-extrabold text-[#111827] tracking-tight leading-snug">
                    Boost Your Laptop Speed by up to 10X
                  </h3>
                  <p className="text-[11.5px] sm:text-[12.5px] text-[#374151] leading-relaxed">
                    Crucial, Kingston & WD NVMe M.2 SSDs in stock from ₹1,299 with free showroom installation and data transfer.
                  </p>
                </div>
                <div className="pt-3 sm:pt-4 z-10">
                  <Link
                    href="/shop?search=SSD"
                    className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Explore SSD Upgrades</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Banner B: Business & Student Laptops */}
              <div className="rounded-xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border border-[#BBF7D0] p-4 sm:p-6 flex flex-col justify-between shadow-2xs relative overflow-hidden group">
                <div className="space-y-1.5 sm:space-y-2 z-10 max-w-md">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-[#15803D] px-2 py-0.5 rounded bg-white/90 border border-emerald-200 inline-block">
                    SEALED BOX WITH GST INVOICE
                  </span>
                  <h3 className="text-[16px] sm:text-[22px] font-extrabold text-[#111827] tracking-tight leading-snug">
                    Certified Business Laptops Under ₹55,000
                  </h3>
                  <p className="text-[11.5px] sm:text-[12.5px] text-[#374151] leading-relaxed">
                    HP 15s, Dell Inspiron, Lenovo ThinkPad & IdeaPad loaded with 16GB RAM, fast NVMe storage, and manufacturer warranty.
                  </p>
                </div>
                <div className="pt-3 sm:pt-4 z-10">
                  <Link
                    href="/shop?cat=Laptops"
                    className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-[11.5px] sm:text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>View Laptop Deals</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        );

      // 6. CCTV SPOTLIGHT
      case 'cctv_spotlight': {
        const cctvFallback = trendingCctv.filter(p => !isDemoProduct(p)).slice(0, 8);
        const cctvItems = getSectionProducts(sec, cctvFallback).filter(p => !isDemoProduct(p));
        if (cctvItems.length === 0) return null;
        return (
          <div key={sec.id || 'cctv_spotlight'} className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 sm:mb-4.5">
              <div>
                <h2 className="text-[20px] sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
                  {sec.title || 'CCTV & Security Surveillance'}
                </h2>
                <p className="text-[11.5px] sm:text-[13px] text-[#4B5563] mt-0.5 max-w-2xl leading-relaxed">
                  {sec.subtitle || 'Complete security camera setups, bullet & dome cameras, DVRs for homes & shops in Garhwa.'}
                </p>
              </div>

              <Link
                href="/shop?cat=CCTV%20%26%20Security"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs self-start sm:self-auto flex-shrink-0"
              >
                <span>View CCTV Setups</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {cctvItems.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        );
      }

      // 7. BLOGS PREVIEW SECTION
      case 'blogs_preview': {
        const latestBlogs = blogPosts.slice(0, 3);
        if (latestBlogs.length === 0) return null;

        return (
          <div key={sec.id || 'blogs_preview'} className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 sm:mb-4.5">
              <div>
                <h2 className="text-[20px] sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
                  {sec.title || 'Latest Tech Guides & Hardware News'}
                </h2>
                <p className="text-[11.5px] sm:text-[13px] text-[#4B5563] mt-0.5 max-w-2xl leading-relaxed">
                  {sec.subtitle || 'Expert advice on buying refurbished laptops, Frontech monitors, and repair tutorials.'}
                </p>
              </div>

              <Link
                href="/blogs"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs self-start sm:self-auto flex-shrink-0"
              >
                <span>Read All Articles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestBlogs.map((b) => (
                <Link
                  key={b.id}
                  href={`/blogs/${b.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-[#1A56DB] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="w-full h-44 bg-slate-900 relative overflow-hidden">
                    <img
                      src={b.coverImage}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#1A56DB] text-white">
                      {b.category}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1A56DB] transition-colors line-clamp-2 leading-snug">
                        {b.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {b.excerpt}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{b.readTime}</span>
                      </div>
                      <span className="text-[#1A56DB] font-bold group-hover:underline">Read Guide &rarr;</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      }

      // BRANDS SHOWCASE
      case 'brands':
        return <BrandShowcase key="brands" />;

      // FULL CATALOG CTA BANNER
      case 'catalog_cta':
        return (
          <div key="catalog_cta" className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-gradient-to-br from-[#0A1633] via-[#0F2960] to-[#1A56DB] text-white rounded-2xl p-5 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none flex items-center justify-end pr-6">
                <div className="w-72 h-72 rounded-full border-8 border-white/30 blur-2xl" />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-blue-200 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 inline-flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#4ADE80]" />
                    COMPLETE GARHWA SHOWROOM INVENTORY
                  </span>
                </div>

                <div className="max-w-2xl">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    Looking for Specific Hardware, CCTV or Spare Parts?
                  </h2>
                  <p className="text-xs sm:text-[13.5px] text-blue-100 mt-1 leading-relaxed">
                    Explore all {products.length || 413}+ in-stock products with advanced filters by brand, category, and price in ₹ with same-day showroom dispatch.
                  </p>
                </div>

                {/* Quick Category Chips */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                  {quickCategories.map((c) => (
                    <Link
                      key={c.name}
                      href={c.href}
                      className="px-2.5 sm:px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] sm:text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] text-blue-200 opacity-80">({c.count})</span>
                    </Link>
                  ))}
                </div>

                {/* Primary Action Button */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/shop"
                    className="h-10 sm:h-11 px-5 sm:px-6 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-extrabold text-xs sm:text-[13.5px] inline-flex items-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <span>Open Store Catalog ({products.length || 413} Products)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/shop?cat=Laptops"
                    className="h-10 sm:h-11 px-4 sm:px-5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-semibold text-xs sm:text-[13.5px] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Browse Laptops Only</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );

      // SHOWROOM VERIFICATION
      case 'showroom':
        return (
          <div key="showroom" className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
                <div className="space-y-1 sm:space-y-1.5 max-w-xl">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#1A56DB] block">
                    GARHWA SHOWROOM VERIFICATION
                  </span>
                  <h3 className="text-base sm:text-xl font-extrabold text-[#111827]">
                    Need Hands-On Hardware Inspection Before Paying?
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#4B5563] leading-relaxed">
                    Visit our physical showroom opposite G P Plaza, Chiniya Road, Garhwa. Test display quality, keyboard travel, and specifications on the counter before making payment.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`tel:${siteSettings?.phone || STORE_INFO.phone}`}
                    className="flex-1 sm:flex-none h-9 sm:h-10 px-3.5 sm:px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Store</span>
                  </a>

                  <a
                    href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent('Hello Lapiez Garhwa, I want to inquire about in-stock products.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none h-9 sm:h-10 px-3.5 sm:px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp Store</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      case 'faq':
        return <FaqSection key={sec.id || 'faq'} />;

      // GENERIC PRODUCT SECTION CREATED/EDITED BY ADMIN
      default: {
        const genericProducts = getSectionProducts(sec, products.slice(0, 8));
        return (
          <div key={sec.id || sec.sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 sm:mb-4.5">
              <div>
                <h2 className="text-[20px] sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
                  {sec.title}
                </h2>
                {sec.subtitle && (
                  <p className="text-[11.5px] sm:text-[13px] text-[#4B5563] mt-0.5 max-w-2xl leading-relaxed">
                    {sec.subtitle}
                  </p>
                )}
              </div>

              <Link
                href="/shop"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs self-start sm:self-auto flex-shrink-0"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {genericProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-9 pb-20 sm:pb-14 bg-[#F1F3F6] overflow-x-hidden">
      {sortedSections.map((sec) => renderSection(sec))}
      {!sortedSections.some((s) => s.sectionKey === 'faq') && <FaqSection />}
    </div>
  );
}
