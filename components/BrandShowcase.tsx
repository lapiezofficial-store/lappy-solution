'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogoRenderer } from './BrandLogoRenderer';
import { CMSBrand } from '../data/brands';

export const BrandShowcase: React.FC = () => {
  const { brands, brandsConfig } = useStore();

  const activeBrands = useMemo(() => {
    return (brands || [])
      .filter((b) => b.isVisible !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [brands]);

  // Split brands into two rows for dual-direction continuous rotation
  const { row1, row2 } = useMemo(() => {
    const r1: CMSBrand[] = [];
    const r2: CMSBrand[] = [];
    activeBrands.forEach((b, idx) => {
      if (idx % 2 === 0) r1.push(b);
      else r2.push(b);
    });
    // If odd or single row, duplicate into second row to ensure balance
    if (r2.length === 0) r2.push(...r1);
    return { row1: r1, row2: r2 };
  }, [activeBrands]);

  // Duplicate items enough times so that 0% -> -50% translate3d loop is completely seamless
  const duplicateList = (list: CMSBrand[]) => {
    if (list.length === 0) return [];
    let res = [...list];
    while (res.length < 12) {
      res = [...res, ...list];
    }
    // Seamless 50% split requires doubling the list
    return [...res, ...res];
  };

  const row1List = useMemo(() => duplicateList(row1), [row1]);
  const row2List = useMemo(() => duplicateList(row2), [row2]);

  // Speed duration in seconds (lower is faster, higher is slower)
  const durationSeconds = useMemo(() => {
    if (brandsConfig?.speedSeconds && brandsConfig.speedSeconds >= 5) {
      return brandsConfig.speedSeconds;
    }
    switch (brandsConfig?.speed) {
      case 'slow':
        return 45;
      case 'fast':
        return 16;
      case 'superfast':
        return 10;
      case 'normal':
      default:
        return 28;
    }
  }, [brandsConfig]);

  if (activeBrands.length === 0) return null;

  const isAutoScroll = brandsConfig?.autoScroll !== false;
  const direction = brandsConfig?.direction || 'dual';
  const pauseOnHover = brandsConfig?.pauseOnHover !== false;

  // Direction animation classes:
  // Row 1: default left (<-), Row 2: default right (->)
  const row1Class = direction === 'right' ? 'animate-marquee-right' : 'animate-marquee-left';
  const row2Class = direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right';

  const renderBrandCard = (b: CMSBrand, key: string) => {
    const href = b.query?.startsWith('/')
      ? b.query
      : `/shop?search=${encodeURIComponent(b.query || b.name)}`;

    return (
      <Link
        key={key}
        href={href}
        title={`View all ${b.name} products`}
        className="flex-shrink-0 w-[122px] sm:w-[144px] md:w-[152px] flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-[#1A56DB] hover:shadow-md shadow-2xs transition-all group min-h-[86px] sm:min-h-[96px] cursor-pointer"
      >
        <div className="h-9 sm:h-11 w-full flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
          <BrandLogoRenderer brand={b} className="max-w-full" />
        </div>
        <span className="text-[10.5px] sm:text-[11.5px] font-bold text-slate-700 group-hover:text-[#1A56DB] mt-1 text-center truncate max-w-full transition-colors">
          {b.name}
        </span>
      </Link>
    );
  };

  return (
    <section className="w-full pt-1 pb-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] sm:text-[22px] font-black text-[#111827] tracking-tight leading-tight">
              Top Brands We Deal In
            </h3>
            <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1A56DB] border border-blue-200/60">
              {activeBrands.length} Official Brands
            </span>
          </div>

          <Link
            href="/shop"
            className="text-[12px] sm:text-[13px] font-bold text-[#1A56DB] hover:text-[#1E40AF] flex items-center gap-1 group flex-shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* BRANDS DISPLAY: Dual-Direction Infinite Continuous Rotating Marquee */}
        {isAutoScroll ? (
          <div className="relative w-full overflow-hidden py-1">
            {/* Smooth edge gradient masks so brands fade gracefully on edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-20 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-20 bg-gradient-to-l from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent z-10" />

            {/* Row 1: Continuous Smooth Scroll (Default LEFT <-) */}
            <div className="flex overflow-hidden mb-2.5 sm:mb-3">
              <div
                className={`flex items-center gap-2.5 sm:gap-3 ${row1Class} ${
                  pauseOnHover ? 'hover:[animation-play-state:paused]' : ''
                }`}
                style={{ '--marquee-duration': `${durationSeconds}s` } as React.CSSProperties}
              >
                {row1List.map((b, i) => renderBrandCard(b, `row1-${b.id || b.name}-${i}`))}
              </div>
            </div>

            {/* Row 2: Continuous Smooth Scroll (Default RIGHT ->) */}
            <div className="flex overflow-hidden">
              <div
                className={`flex items-center gap-2.5 sm:gap-3 ${row2Class} ${
                  pauseOnHover ? 'hover:[animation-play-state:paused]' : ''
                }`}
                style={{ '--marquee-duration': `${durationSeconds}s` } as React.CSSProperties}
              >
                {row2List.map((b, i) => renderBrandCard(b, `row2-${b.id || b.name}-${i}`))}
              </div>
            </div>
          </div>
        ) : (
          /* Static Clean Grid Fallback (When Admin Disables Auto-Scroll) */
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2.5 sm:gap-3">
            {activeBrands.map((b) => renderBrandCard(b, `static-${b.id || b.name}`))}
          </div>
        )}

      </div>
    </section>
  );
};
