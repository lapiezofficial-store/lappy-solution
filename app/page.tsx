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

  // Sorted list of active homepage sections (excludes hero, trust_bar, blogs_preview, faq)
  const sortedSections = useMemo(() => {
    let sectionsList: CMSSection[] = [];
    const excludedKeys = new Set(['hero', 'trust_bar', 'blogs_preview', 'faq']);
    if (homepageSections && homepageSections.length > 0) {
      sectionsList = [...homepageSections]
        .filter((s) => s.isVisible && !excludedKeys.has(s.sectionKey))
        .sort((a, b) => a.position - b.position);
    } else {
      sectionsList = [
        { sectionKey: 'banners', title: 'Banner Slider', position: 1, isVisible: true },
        { sectionKey: 'brands', title: 'Brands Showcase', position: 2, isVisible: true },
        { sectionKey: 'categories', title: 'Categories', position: 3, isVisible: true },
        { sectionKey: 'trending', title: 'Trending Products', position: 4, isVisible: true },
        { sectionKey: 'bestsellers', title: 'Best Sellers', position: 5, isVisible: true },
        { sectionKey: 'premium', title: 'Premium Segment', position: 6, isVisible: true },
        { sectionKey: 'refurbished_laptops', title: 'Refurbished Laptops & Printers', position: 7, isVisible: true },
        { sectionKey: 'promo', title: 'Promotional Deals', position: 8, isVisible: true },
        { sectionKey: 'cctv_spotlight', title: 'CCTV & Security Surveillance', position: 9, isVisible: true },
        { sectionKey: 'catalog_cta', title: 'Catalog CTA', position: 10, isVisible: true },
        { sectionKey: 'showroom', title: 'Showroom Guarantee', position: 11, isVisible: true },
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
        return null;

      case 'categories':
        return <CategoryGrid key="categories" />;

      // 1. TRENDING PRODUCTS SECTION
      case 'trending':
      case 'featured': {
        const trendingItems = getSectionProducts(sec, defaultTrendingProducts).filter(p => !isDemoProduct(p));
        if (trendingItems.length === 0) return null;
        return (
          <div key={sec.id || 'trending'} className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4.5">
              <h2 className="text-[20px] sm:text-[26px] font-extrabold text-[#111827] tracking-tight">
                {sec.title || 'Trending Products'}
              </h2>

              <Link
                href="/shop"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs flex-shrink-0"
              >
                <span>View All</span>
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
            <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4.5">
              <h2 className="text-[20px] sm:text-[26px] font-extrabold text-[#111827] tracking-tight">
                {sec.title || 'Best Sellers'}
              </h2>

              <Link
                href="/shop?sort=bestseller"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs flex-shrink-0"
              >
                <span>View All</span>
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
            <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4.5">
              <h2 className="text-[20px] sm:text-[26px] font-extrabold text-[#111827] tracking-tight">
                {sec.title || 'Premium Segment'}
              </h2>

              <Link
                href="/shop?cat=Computers"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs flex-shrink-0"
              >
                <span>Explore All</span>
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
            <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4.5">
              <h2 className="text-[20px] sm:text-[26px] font-extrabold text-[#111827] tracking-tight">
                {sec.title || 'Refurbished Laptops & Printers'}
              </h2>

              <Link
                href="/shop?cat=Laptops"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs flex-shrink-0"
              >
                <span>View All</span>
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
                <div className="z-10 max-w-md">
                  <h3 className="text-[16px] sm:text-[22px] font-extrabold text-[#111827] tracking-tight leading-snug">
                    NVMe SSD &amp; RAM Upgrades
                  </h3>
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
                <div className="z-10 max-w-md">
                  <h3 className="text-[16px] sm:text-[22px] font-extrabold text-[#111827] tracking-tight leading-snug">
                    Business &amp; Student Laptops
                  </h3>
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
            <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4.5">
              <h2 className="text-[20px] sm:text-[26px] font-extrabold text-[#111827] tracking-tight">
                {sec.title || 'CCTV & Security Surveillance'}
              </h2>

              <Link
                href="/shop?cat=CCTV%20%26%20Security"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs flex-shrink-0"
              >
                <span>View All</span>
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

      // 7. BLOGS PREVIEW REMOVED FROM HOMEPAGE (Dedicated /blogs page)
      case 'blogs_preview':
        return null;

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
                <div className="max-w-2xl">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    Browse Complete Hardware Catalog
                  </h2>
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
                    <span>Browse Laptops</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );

      // SHOWROOM CONTACT
      case 'showroom':
        return (
          <div key="showroom" className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
                <div>
                  <h3 className="text-base sm:text-xl font-extrabold text-[#111827]">
                    Visit Lapiez Showroom, Garhwa
                  </h3>
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
        return null;

      // GENERIC PRODUCT SECTION CREATED/EDITED BY ADMIN
      default: {
        const genericProducts = getSectionProducts(sec, products.slice(0, 8));
        return (
          <div key={sec.id || sec.sectionKey} className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4.5">
              <h2 className="text-[20px] sm:text-[26px] font-extrabold text-[#111827] tracking-tight">
                {sec.title}
              </h2>

              <Link
                href="/shop"
                className="h-8.5 sm:h-9.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11.5px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-colors w-fit shadow-xs flex-shrink-0"
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
    </div>
  );
}
