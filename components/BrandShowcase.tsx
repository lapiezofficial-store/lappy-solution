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

  const MOBILE_LIMIT = 9;
  const mobileBrands = showAllMobile || activeBrands.length <= MOBILE_LIMIT
    ? activeBrands
    : activeBrands.slice(0, MOBILE_LIMIT);

  const INITIAL_LIMIT = 18;
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

        {/* MOBILE VIEW: Rounded Square Brand Cards (3 Logos per Line) */}
        <div className="block sm:hidden">
          <div className="grid grid-cols-3 gap-2.5">
            {mobileBrands.map((b) => {
              const href = b.query?.startsWith('/')
                ? b.query
                : `/shop?search=${encodeURIComponent(b.query || b.name)}`;

              return (
                <Link
                  key={`mob-${b.id || b.name}`}
                  href={href}
                  title={`View all ${b.name} products`}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1A56DB] active:scale-95 transition-all min-h-[82px]"
                >
                  <div className="h-9 w-full flex items-center justify-center overflow-hidden">
                    <BrandLogoRenderer brand={b} className="max-w-full" />
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-700 mt-1 text-center truncate max-w-full leading-tight">
                    {b.name}
                  </span>
                </Link>
              );
            })}
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

        {/* TABLET & DESKTOP VIEW: Rounded Square Brand Cards */}
        <div className="hidden sm:grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
          {displayedBrands.map((b) => {
            const href = b.query?.startsWith('/')
              ? b.query
              : `/shop?search=${encodeURIComponent(b.query || b.name)}`;

            return (
              <Link
                key={b.id || b.name}
                href={href}
                title={`View all ${b.name} products`}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-[#1A56DB] hover:shadow-md shadow-2xs transition-all group min-h-[96px]"
              >
                <div className="h-11 w-full flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                  <BrandLogoRenderer brand={b} />
                </div>
                <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 group-hover:text-[#1A56DB] mt-1 text-center truncate max-w-full transition-colors">
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
