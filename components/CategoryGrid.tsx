'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Layers, Sparkles, Tag, ChevronRight } from 'lucide-react';
import { useStore, DEFAULT_SHOP_BY_CATEGORIES } from '../context/StoreContext';

function formatCategoryStartingPrice(raw?: string | null): string {
  if (!raw || !raw.trim()) return 'From Showroom';
  const val = raw.trim();

  if (/^(Starting|From)\s*₹/i.test(val)) {
    return val;
  }

  if (/^\d+$/.test(val)) {
    return `From ₹${Number(val).toLocaleString('en-IN')}`;
  }

  if (/^₹\s*[\d,]+$/.test(val)) {
    return `From ${val.replace(/\s+/g, '')}`;
  }

  if (/^(Starting|From)\s*\d+/i.test(val)) {
    return val.replace(/^(Starting|From)\s*(\d[\d,]*)/i, 'From ₹$2');
  }

  if (/^\d/.test(val)) {
    return `From ₹${val}`;
  }

  return val;
}

// Category visual theme mapping for soft, modern e-commerce cards
const CATEGORY_THEMES: Record<string, { bg: string; border: string; badge: string }> = {
  'laptops': { bg: 'from-blue-50/70 to-indigo-50/40', border: 'border-blue-100', badge: 'Popular' },
  'cctv': { bg: 'from-emerald-50/70 to-teal-50/40', border: 'border-emerald-100', badge: 'Top Security' },
  'computers': { bg: 'from-purple-50/70 to-violet-50/40', border: 'border-purple-100', badge: 'Custom Rig' },
  'printers': { bg: 'from-amber-50/70 to-orange-50/40', border: 'border-amber-100', badge: 'All Brands' },
  'accessories': { bg: 'from-slate-50 to-gray-50', border: 'border-slate-200/80', badge: 'Genuine Spares' },
  'storage': { bg: 'from-cyan-50/70 to-sky-50/40', border: 'border-cyan-100', badge: '10X Speed' },
  'monitors': { bg: 'from-blue-50/80 to-sky-50/50', border: 'border-blue-100', badge: 'Curved IPS' }
};

export const CategoryGrid: React.FC = () => {
  const { categories, products } = useStore();

  const displayCategories = useMemo(() => {
    const visible = (categories || []).filter((c) => c.status !== 'inactive' && !c.parentId);
    if (visible.length > 0) {
      return [...visible].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    return DEFAULT_SHOP_BY_CATEGORIES;
  }, [categories]);

  return (
    <section className="w-full pt-1 pb-2">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6">
        
        {/* Header section matching Indian e-commerce style */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3.5 pb-0.5">
          <div>
            <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11.5px] font-bold text-[#1A56DB] uppercase tracking-wider mb-0.5">
              <Layers className="w-3.5 h-3.5" />
              <span>GARHWA SHOWROOM INVENTORY</span>
            </div>
            <h2 className="text-[18px] sm:text-[24px] font-black text-[#111827] tracking-tight leading-tight">
              Shop by Category
            </h2>
            <p className="text-[11.5px] sm:text-[13px] text-[#4B5563] mt-0.5">
              Original laptops, CCTV setups, custom gaming rigs, monitors &amp; spares with 18% GST bill.
            </p>
          </div>

          <Link
            href="/shop"
            className="text-[12px] sm:text-[13px] font-bold text-[#1A56DB] hover:text-[#1E40AF] flex items-center gap-1 self-start sm:self-auto group flex-shrink-0"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 1. Quick Story Bubbles for Mobile & Tablets (Horizontal Rail) */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-2 no-scrollbar pt-0.5 px-0.5">
          {displayCategories.map((cat) => {
            const title = cat.name || cat.title || 'Category';
            const img = cat.image || cat.imageUrl || '/images/categories/laptop-adapters.png';
            const cleanSearchQuery = (cat.name || '').replace(/^Laptop\s*/i, '').trim();
            const href = cat.href || `/shop?search=${encodeURIComponent(cleanSearchQuery || cat.slug)}`;

            return (
              <Link
                key={`bubble-${cat.id || cat.slug}`}
                href={href}
                className="flex flex-col items-center flex-shrink-0 group active:scale-95 transition-transform w-[72px] sm:w-[84px] text-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-gray-200/90 shadow-2xs group-hover:border-blue-500 p-1.5 flex items-center justify-center transition-all">
                  <img
                    src={img}
                    alt={title}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="text-[10.5px] sm:text-[11px] font-bold text-gray-800 group-hover:text-blue-600 truncate w-full mt-1.5 leading-tight">
                  {title}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 2. Main Visual Category Grid (2 cols on mobile, 3 on tablet, 5 on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {displayCategories.map((cat) => {
            const title = cat.name || cat.title || 'Category';
            const price = formatCategoryStartingPrice(cat.startingPrice);
            const img = cat.image || cat.imageUrl || '/images/categories/laptop-adapters.png';
            const cleanSearchQuery = (cat.name || '').replace(/^Laptop\s*/i, '').trim();
            const href = cat.href || `/shop?search=${encodeURIComponent(cleanSearchQuery || cat.slug)}`;

            // Determine matching theme
            const slugKey = (cat.slug || cat.name || '').toLowerCase();
            const themeKey = Object.keys(CATEGORY_THEMES).find(k => slugKey.includes(k)) || 'accessories';
            const theme = CATEGORY_THEMES[themeKey];

            return (
              <Link
                key={cat.id || cat.slug}
                href={href}
                title={cat.title || cat.name}
                className={`group bg-gradient-to-br ${theme.bg} hover:bg-white border ${theme.border} hover:border-[#1A56DB] rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between min-h-[84px] sm:min-h-[96px] transition-all shadow-2xs hover:shadow-sm relative overflow-hidden active:scale-[0.98]`}
              >
                {/* Left side text and starting price */}
                <div className="pr-1.5 z-10 flex-1 min-w-0">
                  <span className="block text-[12.5px] sm:text-[14px] font-extrabold text-[#111827] group-hover:text-[#1A56DB] transition-colors leading-snug truncate">
                    {title}
                  </span>
                  {price && (
                    <span className="inline-block text-[10.5px] sm:text-[11px] font-bold text-[#15803D] mt-0.5">
                      {price}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 text-[9.5px] text-blue-600 font-bold mt-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Shop</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                </div>

                {/* Right side product cutout image */}
                <div className="w-13 h-13 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center z-10 bg-white/70 rounded-xl p-1 shadow-2xs border border-white/60">
                  <img
                    src={img}
                    alt={title}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain transform group-hover:scale-110 transition-transform duration-200"
                  />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
