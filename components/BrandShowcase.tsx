'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Award, ChevronDown, ChevronUp, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogoRenderer } from './BrandLogoRenderer';

const BRAND_CATEGORIES = [
  { id: 'all', label: 'All Brands' },
  { id: 'laptops', label: 'Laptops & PCs', keys: ['hp', 'dell', 'lenovo', 'acer', 'asus', 'msi', 'gigabyte'] },
  { id: 'cctv', label: 'CCTV & Security', keys: ['cpplus', 'hikvision', 'dahua', 'ezviz', 'imou', 'secureye'] },
  { id: 'storage', label: 'Storage & Processors', keys: ['wd', 'seagate', 'kingston', 'sandisk', 'crucial', 'adata', 'consistent', 'intel', 'amd'] },
  { id: 'peripherals', label: 'Accessories & Displays', keys: ['frontech', 'lapcare', 'lappypower', 'prodot', 'dlink', 'logitech', 'zebronics', 'epson', 'canon'] },
];

export const BrandShowcase: React.FC = () => {
  const { brands } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  const activeBrands = useMemo(() => {
    return (brands || [])
      .filter((b) => b.isVisible !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [brands]);

  const filteredBrands = useMemo(() => {
    if (selectedCategory === 'all') return activeBrands;
    const cat = BRAND_CATEGORIES.find(c => c.id === selectedCategory);
    if (!cat || !cat.keys) return activeBrands;
    
    return activeBrands.filter(b => {
      const key = (b.presetKey || b.name.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase();
      return cat.keys.some(k => key.includes(k) || k.includes(key));
    });
  }, [activeBrands, selectedCategory]);

  if (activeBrands.length === 0) return null;

  const INITIAL_LIMIT = 18;
  const displayedBrands = showAll || filteredBrands.length <= INITIAL_LIMIT
    ? filteredBrands
    : filteredBrands.slice(0, INITIAL_LIMIT);

  return (
    <section className="w-full pt-1 pb-2">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <h3 className="text-[18px] sm:text-[22px] font-black text-[#111827] tracking-tight leading-tight">
            Top Brands We Deal In
          </h3>

          <Link
            href="/shop"
            className="text-[12px] sm:text-[13px] font-bold text-[#1A56DB] hover:text-[#1E40AF] flex items-center gap-1 group flex-shrink-0"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Interactive Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {BRAND_CATEGORIES.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.id);
                  setShowAll(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A56DB] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MOBILE VIEW: Smooth Horizontal Dual-Row Carousel */}
        <div className="block sm:hidden">
          <div className="flex gap-2.5 overflow-x-auto pb-2.5 pt-0.5 px-0.5 no-scrollbar snap-x snap-mandatory">
            {/* Split displayedBrands into pairs of 2 per column */}
            {Array.from({ length: Math.ceil(displayedBrands.length / 2) }).map((_, colIdx) => {
              const b1 = displayedBrands[colIdx * 2];
              const b2 = displayedBrands[colIdx * 2 + 1];

              return (
                <div key={colIdx} className="flex flex-col gap-2 flex-shrink-0 w-[128px] snap-start">
                  {b1 && (
                    <Link
                      href={b1.query?.startsWith('/') ? b1.query : `/shop?search=${encodeURIComponent(b1.query || b1.name)}`}
                      className="bg-white border border-[#E5E7EB] hover:border-[#1A56DB] rounded-xl h-[54px] px-2 flex items-center justify-center shadow-2xs active:scale-95 transition-all text-center"
                    >
                      <BrandLogoRenderer brand={b1} className="scale-90" />
                    </Link>
                  )}
                  {b2 && (
                    <Link
                      href={b2.query?.startsWith('/') ? b2.query : `/shop?search=${encodeURIComponent(b2.query || b2.name)}`}
                      className="bg-white border border-[#E5E7EB] hover:border-[#1A56DB] rounded-xl h-[54px] px-2 flex items-center justify-center shadow-2xs active:scale-95 transition-all text-center"
                    >
                      <BrandLogoRenderer brand={b2} className="scale-90" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TABLET & DESKTOP VIEW: Clean Multi-Column Grid */}
        <div className="hidden sm:grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 sm:gap-2.5">
          {displayedBrands.map((b) => {
            const href = b.query?.startsWith('/')
              ? b.query
              : `/shop?search=${encodeURIComponent(b.query || b.name)}`;

            return (
              <Link
                key={b.id || b.name}
                href={href}
                title={`View all ${b.name} products`}
                className="bg-white border border-[#E5E7EB] hover:border-[#1A56DB] hover:shadow-sm rounded-xl h-[58px] sm:h-[62px] px-2.5 flex items-center justify-center transition-all shadow-2xs group"
              >
                <div className="flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 w-full overflow-hidden">
                  <BrandLogoRenderer brand={b} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All / Collapse Toggle on Desktop (if more than 18 brands) */}
        {filteredBrands.length > INITIAL_LIMIT && (
          <div className="hidden sm:block mt-3 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-[#1A56DB] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <span>
                {showAll
                  ? 'Show Less Brands'
                  : `View All ${filteredBrands.length} Brands`}
              </span>
              {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
