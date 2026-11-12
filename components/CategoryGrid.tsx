'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useStore, DEFAULT_SHOP_BY_CATEGORIES } from '../context/StoreContext';

function formatShortCategoryName(rawName?: string | null): string {
  const name = (rawName || 'Category').trim();
  const lower = name.toLowerCase();

  if (lower.includes('laptop parts') || lower.includes('spare')) return 'Spares';
  if (lower.includes('laptop')) return 'Laptops';
  if (lower.includes('peripheral')) return 'Peripherals';
  if (lower.includes('printer')) return 'Printers';
  if (lower.includes('cctv') || lower.includes('security') || lower.includes('camera')) return 'CCTV';
  if (lower.includes('storage') || lower.includes('memory') || lower.includes('ssd') || lower.includes('ram')) return 'Storage';
  if (lower.includes('antivirus') || lower.includes('software')) return 'Antivirus';
  if (lower.includes('audio') || lower.includes('electronics') || lower.includes('headset') || lower.includes('speaker')) return 'Audio';
  if (lower.includes('toner') || lower.includes('ink') || lower.includes('cartridge')) return 'Toners';
  if (lower.includes('monitor') || lower.includes('display')) return 'Monitors';
  if (lower.includes('desktop') || lower.includes('pc')) return 'Desktops';
  if (lower.includes('network') || lower.includes('router') || lower.includes('wifi')) return 'Networking';
  if (lower.includes('accessor')) return 'Accessories';

  const firstWord = name.split(/[\s&,/]+/).filter(Boolean)[0];
  return firstWord || name;
}

export const CategoryGrid: React.FC = () => {
  const { categories } = useStore();

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
        <div className="flex items-center justify-between gap-2 mb-3 pb-0.5">
          <h2 className="text-[18px] sm:text-[24px] font-black text-[#111827] tracking-tight leading-tight">
            Shop by Category
          </h2>

          <Link
            href="/shop"
            className="text-[11.5px] sm:text-[13px] font-bold text-[#1A56DB] hover:text-[#1E40AF] flex items-center gap-1 group flex-shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 1. Mobile Category Rail (Clean 1-word labels, no price) */}
        <div className="flex sm:hidden items-start gap-3 overflow-x-auto pb-2 pt-0.5 px-0.5 no-scrollbar snap-x snap-mandatory">
          {displayCategories.map((cat) => {
            const label = formatShortCategoryName(cat.name || cat.title);
            const img = cat.image || cat.imageUrl || '/images/categories/laptop-adapters.png';
            const href = cat.href || `/shop?cat=${encodeURIComponent(cat.name)}`;

            return (
              <Link
                key={`bubble-${cat.id || cat.slug}`}
                href={href}
                className="flex flex-col items-center flex-shrink-0 group active:scale-95 transition-transform w-[72px] text-center snap-start"
              >
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200/90 shadow-2xs group-hover:border-[#1A56DB] p-2.5 flex items-center justify-center transition-all">
                  <img
                    src={img}
                    alt={label}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                <span className="text-[11.5px] font-bold text-gray-800 group-hover:text-[#1A56DB] leading-tight w-full mt-2 truncate">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 2. Desktop & Tablet Category Grid (Clean white tiles, 1-word label, zero price/explore clutter) */}
        <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-2.5">
          {displayCategories.map((cat) => {
            const label = formatShortCategoryName(cat.name || cat.title);
            const img = cat.image || cat.imageUrl || '/images/categories/laptop-adapters.png';
            const href = cat.href || `/shop?cat=${encodeURIComponent(cat.name)}`;

            return (
              <Link
                key={cat.id || cat.slug}
                href={href}
                title={cat.name || label}
                className="group bg-white hover:bg-blue-50/40 border border-gray-200 hover:border-[#1A56DB] rounded-2xl p-3 flex flex-col items-center justify-center gap-2.5 text-center transition-all shadow-2xs hover:shadow-sm active:scale-[0.98]"
              >
                <div className="w-14 h-14 flex items-center justify-center">
                  <img
                    src={img}
                    alt={label}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain transform group-hover:scale-110 transition-transform duration-200"
                  />
                </div>
                <span className="text-[13px] font-bold text-[#111827] group-hover:text-[#1A56DB] transition-colors leading-none whitespace-nowrap">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
