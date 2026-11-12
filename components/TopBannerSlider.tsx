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
      const isCloudinaryDesktop = b.desktopImage && (b.desktopImage.startsWith('http://') || b.desktopImage.startsWith('https://'));
      const pcImage = b.desktopImage || b.mobileImage || '/images/banners/refurbished-laptops-printers.png';
      // If mobileImage is dummy fallback or empty while desktopImage is an uploaded image, use desktopImage on mobile
      const phoneImage = (b.mobileImage && !b.mobileImage.startsWith('/images/banners/'))
        ? b.mobileImage
        : (isCloudinaryDesktop ? b.desktopImage : (b.mobileImage || pcImage));
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

  // Autoplay timer (5 seconds) - strictly disabled if only 1 slide
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
      className="w-full relative pt-2 sm:pt-4 pb-1 select-none px-2.5 sm:px-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Promotional Banners Carousel"
    >
      {/* Sleek, responsive Hero Slider Frame matching e-commerce standards for Web & Mobile */}
      <div className="relative w-full max-w-[1240px] mx-auto aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] max-h-[220px] sm:max-h-[300px] md:max-h-[360px] lg:max-h-[400px] overflow-hidden rounded-2xl md:rounded-[2rem] shadow-sm bg-[#071A33] border border-[#E5E7EB]">
        
        {/* Smooth Crossfade Slide Deck: 100% active slide visible, zero half-cutoff glitches */}
        <div className="relative w-full h-full">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div 
                key={slide.id} 
                className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <Link
                  href={slide.ctaLink}
                  aria-label={slide.title}
                  className="block w-full h-full relative group cursor-pointer"
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Left Arrow Navigation Button */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="hidden sm:flex absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md z-20 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow Navigation Button */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="hidden sm:flex absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md z-20 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Bottom Dots Indicator Bar */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
            {slides.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`pointer-events-auto transition-all duration-300 rounded-full h-1.5 sm:h-2 cursor-pointer ${
                  currentSlide === i 
                    ? 'w-7 sm:w-8 bg-[#FDE047] shadow-xs' 
                    : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
