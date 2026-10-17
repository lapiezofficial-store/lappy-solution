'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, 
  Truck, Receipt, MessageSquare, Flame, Sparkles, 
  Camera, Laptop, Cpu, Zap, Star
} from 'lucide-react';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';
import { useStore } from '../context/StoreContext';

interface BannerSlide {
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
  fullBleedImage?: boolean;
  bgGradient: string;
  accentBorder: string;
}

const DEFAULT_BANNERS: BannerSlide[] = [
  // 00. OFFICIAL REFURBISHED LAPTOPS & PRINTERS BANNER
  {
    id: 'banner-refurbished-official',
    badge: 'CERTIFIED REFURBISHED • WORK SMARTER SPEND LESS',
    badgeIcon: <Laptop className="w-3.5 h-3.5 text-amber-400" />,
    badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
    badgeText: 'text-amber-300',
    title: 'Refurbished Laptops & Printers',
    titleHighlight: 'Tested Quality • Reliable Performance • Smart Prices',
    subtitle: 'Dell, HP, Lenovo, Acer Grade-A business laptops & commercial Canon, Epson, HP printers with showroom warranty in Garhwa.',
    perks: [
      '28-Point Quality Checked Hardware',
      'Testing Warranty + Showroom Lab Support',
      'CBIC Rule 46 GST 18% Tax Bill'
    ],
    priceTag: 'Tested Laptops from ₹14,999',
    priceNote: 'Printers starting from ₹3,499',
    ctaText: 'Shop Refurbished Now',
    ctaLink: '/shop?cat=Laptops',
    whatsappMessage: 'Hello Lapiez Garhwa, I want to inquire about certified refurbished laptops and printers.',
    image: '/images/banners/refurbished-laptops-printers.png',
    fullBleedImage: true,
    bgGradient: 'from-[#0A1633] via-[#0E2A68] to-[#1E3A8A]',
    accentBorder: 'border-amber-400/40'
  },
  // 0. FRONTECH CURVED GAMING DISPLAYS
  {
    id: 'banner-frontech-monitors',
    badge: 'OFFICIAL FRONTECH STORE • 3-YEAR WARRANTY',
    badgeIcon: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
    badgeBg: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-200',
    badgeText: 'text-yellow-300',
    title: 'Frontech Ultima Curved Displays',
    titleHighlight: '100Hz & 165Hz Frameless Monitors from ₹5,999',
    subtitle: 'Ultra-immersive curved viewing with 99% sRGB color gamut, low blue light eye care & built-in stereo speakers.',
    perks: [
      'Frameless Curved IPS Panel',
      'Dual HDMI + VGA Ports',
      '3-Year All-India Warranty'
    ],
    priceTag: 'Frontech Displays from ₹5,999',
    priceNote: '18% GST tax invoice included',
    ctaText: 'Shop Frontech Monitors',
    ctaLink: '/shop?brand=Frontech&cat=Computers',
    whatsappMessage: 'Hello Lapiez Garhwa, I want to inquire about Frontech curved gaming monitors.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&auto=format&fit=crop&q=80',
    bgGradient: 'from-[#0A1633] via-[#0D224E] to-[#1E3A8A]',
    accentBorder: 'border-yellow-400/30'
  },
  // 1. MEGA LAPTOP FESTIVAL
  {
    id: 'banner-laptop-fest',
    badge: 'FESTIVAL DHAMAKA SALE • GARHWA SHOWROOM',
    badgeIcon: <Flame className="w-3.5 h-3.5 fill-[#EF4444] text-[#EF4444]" />,
    badgeBg: 'bg-red-500/20 border-red-400/40 text-red-200',
    badgeText: 'text-red-300',
    title: 'Upgrade to 12th & 13th Gen Laptops',
    titleHighlight: 'Save Up to 45% + 18% GST Bill',
    subtitle: 'HP 15s, Dell Inspiron, Lenovo ThinkPad & ASUS with 16GB RAM + 512GB SSD. Ready for counter pickup or same-day delivery.',
    perks: [
      '100% Brand Sealed Pack',
      'Official Brand Warranty All-India',
      'No Cost EMI Available'
    ],
    priceTag: 'Laptops Starting @ ₹24,999',
    priceNote: '18% GST ITC claimable for business',
    ctaText: 'Shop Laptop Deals',
    ctaLink: '/shop?cat=Laptops',
    whatsappMessage: 'Hello Lapiez Garhwa, I want to inquire about festival laptop offers and pricing.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=700&auto=format&fit=crop&q=80',
    bgGradient: 'from-[#0A1633] via-[#0F2960] to-[#1A56DB]',
    accentBorder: 'border-blue-400/30'
  },
  // 2. CP-PLUS & HIKVISION CCTV SECURITY
  {
    id: 'banner-cctv-security',
    badge: 'HOME & BUSINESS SECURITY SPECIAL',
    badgeIcon: <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />,
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200',
    badgeText: 'text-emerald-300',
    title: 'CP-PLUS 4-Camera 5MP Night-Vision Kit',
    titleHighlight: 'Full Color 24/7 Security @ ₹18,499',
    subtitle: 'Complete package with 4x 5MP cameras, 4-Channel AI DVR, 1TB Seagate Purple HDD & mobile live view app.',
    perks: [
      'Color Night-Vision in Complete Darkness',
      'Seagate 1TB Purple HDD Included',
      'Free On-Site Guidance in Garhwa'
    ],
    priceTag: 'Complete 4-Camera Kit ₹18,499',
    priceNote: 'MRP ₹24,000 • Save ₹5,501 (23% OFF)',
    ctaText: 'View CCTV Packages',
    ctaLink: '/shop?cat=CCTV%20%26%20Security',
    whatsappMessage: 'Hello Lapiez Garhwa, I want a quote for 4-camera CP-PLUS CCTV security kit.',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=700&auto=format&fit=crop&q=80',
    bgGradient: 'from-[#03241C] via-[#064E3B] to-[#047857]',
    accentBorder: 'border-emerald-400/30'
  },
  // 3. CUSTOM CREATOR & GAMING RIGS
  {
    id: 'banner-custom-pc',
    badge: 'CUSTOM WORKSTATIONS • BUILT & TESTED IN GARHWA',
    badgeIcon: <Cpu className="w-3.5 h-3.5 text-[#A78BFA]" />,
    badgeBg: 'bg-purple-500/20 border-purple-400/40 text-purple-200',
    badgeText: 'text-purple-300',
    title: 'Intel Core i5/i7 + RTX Graphics Workstations',
    titleHighlight: 'Zero Bottleneck • Towers from ₹38,999',
    subtitle: 'Engineered for 4K video editing, AutoCAD, 3D rendering, and high-FPS gaming with benchmark reports.',
    perks: [
      'Ultra-Fast Gen4 NVMe M.2 SSD',
      'RGB High-Airflow Thermal Case',
      'Free Lifetime OS & Hardware Setup'
    ],
    priceTag: 'Creator Towers from ₹38,999',
    priceNote: 'Benchmark tested with warranty',
    ctaText: 'Explore Custom PCs',
    ctaLink: '/shop?cat=Computers',
    whatsappMessage: 'Hello Lapiez Garhwa, I want to configure a custom PC for video editing / gaming.',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&auto=format&fit=crop&q=80',
    bgGradient: 'from-[#171033] via-[#2E1065] to-[#4338CA]',
    accentBorder: 'border-purple-400/30'
  },
  // 4. ORIGINAL SPARES & SSD UPGRADES
  {
    id: 'banner-spares-upgrade',
    badge: 'INSTANT 10X SPEED BOOST • FREE SHOWROOM FITTING',
    badgeIcon: <Zap className="w-3.5 h-3.5 text-[#FCD34D]" />,
    badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
    badgeText: 'text-amber-300',
    title: 'Crucial & Kingston NVMe SSDs & Laptop Spares',
    titleHighlight: 'Genuine Adapters, Batteries & SSDs from ₹499',
    subtitle: 'Revive your slow laptop! High-speed NVMe M.2 SSDs starting at ₹1,299 with free showroom installation.',
    perks: [
      '10X Faster Boot & Smooth Multitasking',
      'Genuine OEM 65W/90W Smart Chargers',
      '30-Minute Counter Fitting in Garhwa'
    ],
    priceTag: 'High-Speed SSDs from ₹1,299',
    priceNote: 'Adapters from ₹899 • Free Installation',
    ctaText: 'Explore Spares & SSDs',
    ctaLink: '/shop?search=SSD',
    whatsappMessage: 'Hello Lapiez Garhwa, I want to upgrade my laptop SSD / buy original adapter.',
    image: '/images/categories/laptop-ssd.png',
    bgGradient: 'from-[#381504] via-[#78350F] to-[#EA580C]',
    accentBorder: 'border-orange-400/30'
  }
];

export const TopBannerSlider: React.FC = () => {
  const { banners: cmsBanners, siteSettings } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const banners: BannerSlide[] = useMemo(() => {
    if (cmsBanners && cmsBanners.length > 0) {
      const active = cmsBanners
        .filter((b) => b.status !== 'inactive')
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      if (active.length > 0) {
        return active.map((b, idx) => {
          const defaultMatch = DEFAULT_BANNERS.find((d) => d.id === b.id);
          if (defaultMatch) {
            return {
              ...defaultMatch,
              title: b.title || defaultMatch.title,
              titleHighlight: b.titleHighlight !== undefined ? b.titleHighlight : defaultMatch.titleHighlight,
              subtitle: b.subtitle || defaultMatch.subtitle,
              badge: b.badge || defaultMatch.badge,
              image: b.desktopImage || defaultMatch.image,
              ctaText: b.buttonText || defaultMatch.ctaText,
              ctaLink: b.buttonUrl || defaultMatch.ctaLink,
              whatsappMessage: b.whatsappMsg || defaultMatch.whatsappMessage,
              bgGradient: b.bgGradient || defaultMatch.bgGradient,
            };
          }

          return {
            id: b.id || `banner-${idx}`,
            badge: b.badge || 'FESTIVAL SPECIAL • GARHWA SHOWROOM',
            badgeIcon: <Flame className="w-3.5 h-3.5 fill-[#EF4444] text-[#EF4444]" />,
            badgeBg: 'bg-red-500/20 border-red-400/40 text-red-200',
            badgeText: 'text-red-300',
            title: b.title,
            titleHighlight: b.titleHighlight || '',
            subtitle: b.subtitle || 'Authorized sales & repair center on Chiniya Road, Garhwa.',
            perks: [
              '100% Brand Sealed Pack',
              'Official Brand Warranty All-India',
              'Same-Day Garhwa Delivery'
            ],
            priceTag: 'Verified Showroom Price',
            priceNote: '18% GST ITC Bill Included',
            ctaText: b.buttonText || 'Shop Now',
            ctaLink: b.buttonUrl || '/shop',
            whatsappMessage: b.whatsappMsg || 'Hello Lapiez Garhwa, I want to inquire about this offer.',
            image: b.desktopImage || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=700&auto=format&fit=crop&q=80',
            bgGradient: b.bgGradient || 'from-[#0A1633] via-[#0F2960] to-[#1A56DB]',
            accentBorder: 'border-blue-400/30'
          };
        });
      }
    }
    return DEFAULT_BANNERS;
  }, [cmsBanners]);

  const totalSlides = banners.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay timer (5 seconds)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

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
    if (diff > 40) {
      nextSlide();
    } else if (diff < -40) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section 
      className="w-full relative pt-1.5 pb-1 sm:pt-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Promotional Banners Carousel"
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6">
        
        {/* Banner Frame Container */}
        <div className="relative overflow-hidden rounded-2xl shadow-sm border border-[#E5E7EB]">
          
          {/* Slides Track */}
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {banners.map((slide, index) => {
              if (slide.fullBleedImage) {
                return (
                  <Link
                    key={slide.id}
                    href={slide.ctaLink}
                    aria-label={slide.ctaText}
                    className="min-w-full block bg-white aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] overflow-hidden"
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </Link>
                );
              }

              return (
                <div 
                  key={slide.id}
                  className={`min-w-full relative bg-gradient-to-r ${slide.bgGradient} text-white px-3.5 py-4 sm:p-7 md:p-8 lg:p-9 flex flex-col justify-between overflow-hidden`}
                >
                  {/* Subtle Background Glow Accent */}
                  <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-15 pointer-events-none flex items-center justify-end pr-6">
                    <div className="w-72 h-72 rounded-full border-4 border-white/20 blur-xl" />
                  </div>

                  {/* Main Grid: Responsive 2-column layout on all viewports */}
                  <div className="grid grid-cols-12 gap-3 sm:gap-6 items-center relative z-10">
                    
                    {/* Left Column: Copy & CTAs (Full width on mobile or 8 cols on desktop) */}
                    <div className="col-span-12 sm:col-span-8 space-y-2 sm:space-y-3">
                      
                      {/* Top Eyebrow Pill */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${slide.badgeBg}`}>
                          {slide.badgeIcon}
                          <span className="truncate max-w-[200px] sm:max-w-none">{slide.badge}</span>
                        </div>
                        
                        <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-white/70 bg-black/30 px-1.5 py-0.5 rounded-full">
                          {index + 1}/{totalSlides}
                        </span>
                      </div>

                      {/* Headline + Price Highlight */}
                      <div>
                        <h2 className="text-[15px] sm:text-xl md:text-2xl lg:text-[28px] font-black text-white tracking-tight leading-tight">
                          {slide.title}
                        </h2>
                        <p className="text-[12.5px] sm:text-[16px] md:text-[18px] font-extrabold text-[#FDE047] tracking-tight mt-0.5 leading-snug">
                          {slide.titleHighlight}
                        </p>
                      </div>

                      {/* Subtitle (Concise 1 line on mobile, 2 lines on desktop) */}
                      <p className="text-[11px] sm:text-[13px] text-white/80 line-clamp-1 sm:line-clamp-2 leading-relaxed max-w-xl">
                        {slide.subtitle}
                      </p>

                      {/* Quick Perks (2 perks on mobile, 3 on desktop) */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-xs text-white/90 font-medium">
                        {slide.perks.slice(0, 2).map((perk, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] flex-shrink-0" />
                            <span className="truncate">{perk}</span>
                          </span>
                        ))}
                        {slide.perks[2] && (
                          <span className="hidden sm:flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] flex-shrink-0" />
                            <span className="truncate">{slide.perks[2]}</span>
                          </span>
                        )}
                      </div>

                      {/* Action Buttons & Pricing */}
                      <div className="flex items-center gap-2 pt-1 pb-1">
                        <Link
                          href={slide.ctaLink}
                          className="h-8 sm:h-10 px-3.5 sm:px-5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-extrabold text-[11.5px] sm:text-[13.5px] flex items-center gap-1.5 transition-all shadow-md active:scale-95 flex-shrink-0"
                        >
                          <span>{slide.ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <a
                          href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent(slide.whatsappMessage)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 sm:h-10 px-2.5 sm:px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11.5px] sm:text-[13px] flex items-center gap-1.5 transition-all shadow-md active:scale-95 flex-shrink-0"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-white" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Desktop price pill */}
                        <div className="hidden md:flex flex-col pl-2 border-l border-white/20">
                          <span className="text-[12px] font-black text-white leading-tight">
                            {slide.priceTag}
                          </span>
                          <span className="text-[10px] text-white/70">
                            {slide.priceNote}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: High Quality Product Cutout (Shown cleanly on tablet/desktop) */}
                    <div className="hidden sm:flex sm:col-span-4 items-center justify-center relative">
                      <div className="relative w-full aspect-[4/3] max-w-[260px] rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <img 
                          src={slide.image} 
                          alt={slide.title}
                          className="max-h-full max-w-full object-contain filter drop-shadow-lg"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                        <div className="absolute -bottom-2 -left-2 bg-[#0F172A] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-white/20 shadow-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          <span>In Stock @ Garhwa</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Clean bottom padding clearance for dots */}
                  <div className="h-3 sm:h-2" />
                </div>
              );
            })}
          </div>

          {/* Left Arrow Navigation Button (Hidden on small mobile to avoid text obstruction) */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md z-20 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Right Arrow Navigation Button (Hidden on small mobile to avoid text obstruction) */}
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md z-20 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Bottom Indicators & Thumb Navigation Bar */}
          <div className="absolute bottom-2 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
                  currentSlide === i 
                    ? 'w-6 bg-[#FDE047] shadow-xs' 
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
