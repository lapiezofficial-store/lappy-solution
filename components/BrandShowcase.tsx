'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogoRenderer } from './BrandLogoRenderer';

export const BrandShowcase: React.FC = () => {
  const { brands } = useStore();
  const [showAll, setShowAll] = useState(false);
  const [showAllMobile, setShowAllMobile] = useState(false);

  const activeBrands = useMemo(() => {
    return (brands || [])
      .filter((b) => b.isVisible !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [brands]);

  if (activeBrands.length === 0) return null;

  const MOBILE_LIMIT = 7;
  const mobileBrands = showAllMobile || activeBrands.length <= MOBILE_LIMIT
    ? activeBrands
    : activeBrands.slice(0, MOBILE_LIMIT);

  const INITIAL_LIMIT = 20;
  const displayedBrands = showAll || activeBrands.length <= INITIAL_LIMIT
    ? activeBrands
    : activeBrands.slice(0, INITIAL_LIMIT);

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
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* MOBILE VIEW: Circular Brand Badges (4-column grid) */}
        <div className="block sm:hidden">
          <div className="grid grid-cols-4 gap-2.5">
            {mobileBrands.map((b) => {
              const href = b.query?.startsWith('/')
                ? b.query
                : `/shop?search=${encodeURIComponent(b.query || b.name)}`;

              return (
                <Link
                  key={`mob-${b.id || b.name}`}
                  href={href}
                  title={`View all ${b.name} products`}
                  className="flex flex-col items-center justify-center group active:scale-95 transition-transform"
                >
                  <div className="w-14 h-14 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-2 overflow-hidden hover:border-[#1A56DB]">
                    <BrandLogoRenderer brand={b} className="scale-90" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 mt-1 text-center truncate max-w-[68px] leading-tight">
                    {b.name}
                  </span>
                </Link>
              );
            })}

            {/* View More circular card in 8th slot when collapsed */}
            {!showAllMobile && activeBrands.length > MOBILE_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllMobile(true)}
                className="flex flex-col items-center justify-center group active:scale-95 transition-transform cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-blue-50/90 border border-blue-200 shadow-2xs flex flex-col items-center justify-center p-1 text-[#1A56DB] hover:bg-blue-100">
                  <span className="text-[10px] font-black leading-tight">More</span>
                  <span className="text-[8.5px] font-bold text-blue-600">+{activeBrands.length - MOBILE_LIMIT}</span>
                </div>
                <span className="text-[10px] font-bold text-blue-700 mt-1 text-center leading-tight">
                  View All
                </span>
              </button>
            )}
          </div>

          {showAllMobile && activeBrands.length > MOBILE_LIMIT && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowAllMobile(false)}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-[#1A56DB] shadow-2xs cursor-pointer"
              >
                <span>Show Less</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* TABLET & DESKTOP VIEW: Circular Brand Badges */}
        <div className="hidden sm:grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {displayedBrands.map((b) => {
            const href = b.query?.startsWith('/')
              ? b.query
              : `/shop?search=${encodeURIComponent(b.query || b.name)}`;

            return (
              <Link
                key={b.id || b.name}
                href={href}
                title={`View all ${b.name} products`}
                className="flex flex-col items-center justify-center group p-1 transition-all"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border border-slate-200/90 group-hover:border-[#1A56DB] group-hover:shadow-md shadow-2xs flex items-center justify-center p-2.5 sm:p-3 transition-all overflow-hidden group-hover:scale-105">
                  <BrandLogoRenderer brand={b} />
                </div>
                <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 group-hover:text-[#1A56DB] mt-1.5 text-center truncate max-w-[85px] sm:max-w-[100px] transition-colors">
                  {b.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* View All / Collapse Toggle on Desktop (if more than 20 brands) */}
        {activeBrands.length > INITIAL_LIMIT && (
          <div className="hidden sm:block mt-3 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-[#1A56DB] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <span>
                {showAll
                  ? 'Show Less Brands'
                  : `View All ${activeBrands.length} Brands`}
              </span>
              {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
