'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, 
  Truck, Receipt, MessageSquare, Flame, Sparkles, 
  Camera, Laptop, Cpu, Zap, Star
} from 'lucide-react';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';
import { useStore, CMSBanner } from '../context/StoreContext';
import { INITIAL_BANNERS, decodeBannerConfig } from '../data/banners';

interface SlideItem {
  id: string;
  badge: string;
  badgeIcon: React.ReactNode;
  badgeBg: string;
  badgeText: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  perks: string[];
  priceTag: string;
  priceNote: string;
  ctaText: string;
  ctaLink: string;
  whatsappMessage: string;
  image: string;
  desktopImage: string;
  mobileImage: string;
  isFullGraphic: boolean;
  bgGradient: string;
  targetDevice: 'all' | 'desktop' | 'mobile';
}

export const TopBannerSlider: React.FC = () => {
  const { banners: cmsBanners, siteSettings } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Detect mobile viewport (SSR safe)
  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter active banners and target device
  const slides: SlideItem[] = useMemo(() => {
    const rawList: (CMSBanner | typeof INITIAL_BANNERS[0])[] = 
      (cmsBanners && cmsBanners.length > 0) ? cmsBanners : INITIAL_BANNERS;

    const activeList = rawList
      .filter((b) => b.status !== 'inactive')
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // Device filtering (only after client mount to prevent SSR hydration mismatch)
    const deviceFiltered = isMounted
      ? activeList.filter((b) => {
          const { targetDevice } = decodeBannerConfig(b.bgGradient, (b as any).fullBleedImage);
          if (!targetDevice || targetDevice === 'all') return true;
          if (isMobile && targetDevice === 'mobile') return true;
          if (!isMobile && targetDevice === 'desktop') return true;
          return false;
        })
      : activeList;

    const finalBanners = deviceFiltered.length > 0 ? deviceFiltered : activeList;

    return finalBanners.map((b, idx) => {
      const { bgGradient, targetDevice, bannerType } = decodeBannerConfig(
        b.bgGradient, 
        (b as any).fullBleedImage ?? (b.id === 'banner-refurbished-official')
      );

      const isFullGraphic = bannerType === 'full_image' || Boolean((b as any).fullBleedImage);
      const pcImage = b.desktopImage || b.mobileImage || '/images/banners/refurbished-laptops-printers.png';
      const phoneImage = b.mobileImage || b.desktopImage || '/images/banners/refurbished-laptops-printers.png';
      const chosenImage = isMobile ? phoneImage : pcImage;

      // Extract perks if available or default
      const perks = (b as any).perks || [
        '100% Brand Sealed Pack',
        'Official Brand Warranty All-India',
        'Same-Day Garhwa Delivery'
      ];

      return {
        id: b.id || `banner-${idx}`,
        badge: b.badge || 'OFFICIAL SHOWROOM • GARHWA',
        badgeIcon: <Flame className="w-3.5 h-3.5 fill-[#EF4444] text-[#EF4444]" />,
        badgeBg: 'bg-red-500/20 border-red-400/40 text-red-200',
        badgeText: 'text-red-300',
        title: b.title,
        titleHighlight: b.titleHighlight || '',
        subtitle: b.subtitle || 'Authorized sales & repair center on Chiniya Road, Garhwa.',
        perks,
        priceTag: 'Verified Showroom Price',
        priceNote: '18% GST ITC Bill Included',
        ctaText: b.buttonText || 'Shop Deals',
        ctaLink: b.buttonUrl || '/shop',
        whatsappMessage: b.whatsappMsg || `Hello Lapiez Garhwa, I want to inquire about: ${b.title}`,
        image: chosenImage,
        desktopImage: pcImage,
        mobileImage: phoneImage,
        isFullGraphic,
        bgGradient,
        targetDevice,
      };
    });
  }, [cmsBanners, isMounted, isMobile]);

  const totalSlides = slides.length;

  // Safe slide index clamping if slides list shrinks
  useEffect(() => {
    if (currentSlide >= totalSlides && totalSlides > 0) {
      setCurrentSlide(0);
    }
  }, [totalSlides, currentSlide]);

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay timer (5 seconds) - STRICTLY DISABLED IF ONLY 1 SLIDE TO PREVENT FLICKER
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, totalSlides]);

  // Touch Swipe Handlers for mobile users
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (totalSlides === 0) return null;

  return (
    <section 
      className="w-full relative py-0.5 sm:py-2 select-none overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Promotional Banners Carousel"
    >
      {/* Full Page Width Container (Edge-to-edge on phone, widescreen on desktop) */}
      <div className="w-full max-w-[1920px] mx-auto px-0 sm:px-4 md:px-6">
        
        {/* Banner Frame Container with Fixed Aspect Ratio to prevent layout jumps / flickers */}
        <div className="relative overflow-hidden w-full rounded-none sm:rounded-2xl border-0 sm:border border-[#E5E7EB] bg-slate-900 shadow-xs">
          
          {/* Unified Aspect Ratio Frame for ALL Slides:
              Mobile: aspect-[16/8] (~2:1) or min-h-[170px]
              Tablet/Desktop: aspect-[22/7] (~3.1:1) min-h-[220px] md:min-h-[320px] max-h-[480px]
          */}
          <div className="relative w-full aspect-[16/8] sm:aspect-[20/8] md:aspect-[22/7] lg:aspect-[24/7] min-h-[170px] sm:min-h-[230px] md:min-h-[300px] max-h-[460px] overflow-hidden">
            
            {/* Slides Track with Hardware-Accelerated 3D Transforms */}
            <div 
              className="flex h-full w-full transition-transform duration-500 ease-out"
              style={{ 
                transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
                WebkitTransform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {slides.map((slide, index) => {
                // MODE 1: FULL GRAPHIC BANNER (FULL PAGE IMAGE WITH CLICKTHROUGH)
                if (slide.isFullGraphic) {
                  return (
                    <div 
                      key={slide.id} 
                      className="min-w-full h-full relative flex-shrink-0 bg-slate-950 overflow-hidden"
                    >
                      <Link
                        href={slide.ctaLink}
                        aria-label={slide.title}
                        className="block w-full h-full relative group cursor-pointer"
                      >
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-[1.01]"
                          loading={index === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                        {/* Subtle Floating CTA Pill if customized */}
                        {slide.ctaText && slide.ctaText !== 'Shop Deals' && slide.ctaText !== 'Shop Now' && (
                          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-6 z-10">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold shadow-md border border-white/20 transition-transform active:scale-95">
                              <span>{slide.ctaText}</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                }

                // MODE 2: TEXT + GRADIENT + PRODUCT SHOWCASE LAYOUT
                return (
                  <div 
                    key={slide.id}
                    className={`min-w-full h-full relative flex-shrink-0 bg-gradient-to-r ${slide.bgGradient} text-white px-3.5 py-3 sm:px-7 sm:py-5 md:px-10 md:py-7 flex flex-col justify-center overflow-hidden`}
                  >
                    {/* Subtle Background Glow Accent */}
                    <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-15 pointer-events-none flex items-center justify-end pr-6">
                      <div className="w-72 h-72 rounded-full border-4 border-white/20 blur-xl" />
                    </div>

                    {/* Main Grid: Responsive 2-column layout */}
                    <div className="grid grid-cols-12 gap-3 sm:gap-6 items-center relative z-10 w-full">
                      
                      {/* Left Column: Copy & CTAs */}
                      <div className="col-span-12 sm:col-span-8 space-y-1.5 sm:space-y-3">
                        
                        {/* Top Eyebrow Pill */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {slide.badge && (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] sm:text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${slide.badgeBg}`}>
                              {slide.badgeIcon}
                              <span className="truncate max-w-[220px] sm:max-w-none">{slide.badge}</span>
                            </div>
                          )}
                          
                          {totalSlides > 1 && (
                            <span className="text-[9px] sm:text-[10px] font-semibold text-white/70 bg-black/30 px-1.5 py-0.5 rounded-full">
                              {index + 1}/{totalSlides}
                            </span>
                          )}
                        </div>

                        {/* Headline + Price Highlight */}
                        <div>
                          <h2 className="text-[14px] sm:text-lg md:text-xl lg:text-2xl font-black text-white tracking-tight leading-tight line-clamp-1">
                            {slide.title}
                          </h2>
                          {slide.titleHighlight && (
                            <p className="text-[12px] sm:text-[15px] md:text-[17px] font-extrabold text-[#FDE047] tracking-tight mt-0.5 leading-snug line-clamp-1">
                              {slide.titleHighlight}
                            </p>
                          )}
                        </div>

                        {/* Subtitle */}
                        {slide.subtitle && (
                          <p className="text-[10.5px] sm:text-[12.5px] text-white/80 line-clamp-1 sm:line-clamp-2 leading-relaxed max-w-xl">
                            {slide.subtitle}
                          </p>
                        )}

                        {/* Quick Perks */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9.5px] sm:text-xs text-white/90 font-medium">
                          {slide.perks.slice(0, 2).map((perk, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] flex-shrink-0" />
                              <span className="truncate">{perk}</span>
                            </span>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            href={slide.ctaLink}
                            className="h-7 sm:h-9 px-3 sm:px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-extrabold text-[11px] sm:text-[12.5px] flex items-center gap-1.5 transition-all shadow-md active:scale-95 flex-shrink-0"
                          >
                            <span>{slide.ctaText}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          <a
                            href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent(slide.whatsappMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-[12.5px] flex items-center gap-1.5 transition-all shadow-md active:scale-95 flex-shrink-0"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp</span>
                          </a>
                        </div>

                      </div>

                      {/* Right Column: High Quality Product Cutout (Tablet/Desktop) */}
                      <div className="hidden sm:flex sm:col-span-4 items-center justify-center relative">
                        <div className="relative w-full aspect-[4/3] max-w-[240px] rounded-xl bg-white/10 backdrop-blur-md p-2.5 border border-white/20 flex items-center justify-center shadow-lg">
                          <img 
                            src={slide.image} 
                            alt={slide.title}
                            className="max-h-full max-w-full object-contain filter drop-shadow-lg"
                            loading={index === 0 ? 'eager' : 'lazy'}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Left Arrow Navigation Button (Hidden if totalSlides <= 1) */}
            {totalSlides > 1 && (
              <button
                onClick={prevSlide}
                aria-label="Previous Slide"
                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md z-20 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Right Arrow Navigation Button (Hidden if totalSlides <= 1) */}
            {totalSlides > 1 && (
              <button
                onClick={nextSlide}
                aria-label="Next Slide"
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md z-20 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Bottom Indicators & Thumb Navigation Bar (Hidden if totalSlides <= 1) */}
            {totalSlides > 1 && (
              <div className="absolute bottom-2 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`pointer-events-auto transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
                      currentSlide === i 
                        ? 'w-6 bg-[#FDE047] shadow-xs' 
                        : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
