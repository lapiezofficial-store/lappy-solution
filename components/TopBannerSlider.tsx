'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore, CMSBanner } from '../context/StoreContext';
import { INITIAL_BANNERS, decodeBannerConfig } from '../data/banners';

interface SlideItem {
  id: string;
  title: string;
  ctaLink: string;
  image: string;
  desktopImage: string;
  mobileImage: string;
  targetDevice: 'all' | 'desktop' | 'mobile';
}

export const TopBannerSlider: React.FC = () => {
  const { banners: cmsBanners } = useStore();
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
          const { targetDevice } = decodeBannerConfig(b.bgGradient);
          if (!targetDevice || targetDevice === 'all') return true;
          if (isMobile && targetDevice === 'mobile') return true;
          if (!isMobile && targetDevice === 'desktop') return true;
          return false;
        })
      : activeList;

    const finalBanners = deviceFiltered.length > 0 ? deviceFiltered : activeList;

    return finalBanners.map((b, idx) => {
      const { targetDevice } = decodeBannerConfig(b.bgGradient);
      const pcImage = b.desktopImage || b.mobileImage || '/images/banners/refurbished-laptops-printers.png';
      const phoneImage = b.mobileImage || b.desktopImage || '/images/banners/refurbished-laptops-printers.png';
      const chosenImage = isMobile ? phoneImage : pcImage;

      return {
        id: b.id || `banner-${idx}`,
        title: b.title || 'Promotional Banner',
        ctaLink: b.buttonUrl || '/shop',
        image: chosenImage,
        desktopImage: pcImage,
        mobileImage: phoneImage,
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
      {/* Full Page Width Container (Edge-to-edge on phone, sleek widescreen on desktop) */}
      <div className="w-full max-w-[1920px] mx-auto px-0 sm:px-4 md:px-6">
        
        {/* Banner Frame Container: 1920 × 1080 px (16:9 Full HD Resolution) */}
        <div className="relative overflow-hidden w-full rounded-none sm:rounded-2xl border-0 sm:border border-[#E5E7EB] bg-slate-900 shadow-xs">
          <div className="relative w-full aspect-[16/9] overflow-hidden">
            
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
              {slides.map((slide, index) => (
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
                      className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-[1.008]"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </Link>
                </div>
              ))}
            </div>

            {/* Left Arrow Navigation Button (Only if multiple slides) */}
            {totalSlides > 1 && (
              <button
                onClick={prevSlide}
                aria-label="Previous Slide"
                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md z-20 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Right Arrow Navigation Button (Only if multiple slides) */}
            {totalSlides > 1 && (
              <button
                onClick={nextSlide}
                aria-label="Next Slide"
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md z-20 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Bottom Dots Indicator Bar (Only if multiple slides) */}
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
