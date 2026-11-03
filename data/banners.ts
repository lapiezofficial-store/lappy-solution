export interface DefaultBannerItem {
  id: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  badge: string;
  desktopImage: string;
  mobileImage: string;
  buttonText: string;
  buttonUrl: string;
  whatsappMsg: string;
  bgGradient: string;
  position: number;
  status: 'active' | 'inactive';
  targetDevice?: 'all' | 'desktop' | 'mobile';
  bannerType?: 'full_image' | 'custom_layout';
  fullBleedImage?: boolean;
}

/**
 * Encode targetDevice and bannerType cleanly into bgGradient without breaking DB schema
 */
export function encodeBannerConfig(
  gradient: string,
  targetDevice: 'all' | 'desktop' | 'mobile' = 'all',
  bannerType: 'full_image' | 'custom_layout' = 'full_image'
): string {
  const cleanGradient = (gradient || 'from-[#0A1633] via-[#0F2960] to-[#1A56DB]').split('__CONFIG__')[0].trim();
  const config = JSON.stringify({ targetDevice, bannerType });
  return `${cleanGradient}__CONFIG__${config}`;
}

/**
 * Decode targetDevice and bannerType from bgGradient
 */
export function decodeBannerConfig(rawGradient?: string, fallbackFullBleed: boolean = true) {
  if (!rawGradient) {
    return {
      bgGradient: 'from-[#0A1633] via-[#0F2960] to-[#1A56DB]',
      targetDevice: 'all' as const,
      bannerType: (fallbackFullBleed ? 'full_image' : 'custom_layout') as 'full_image' | 'custom_layout',
    };
  }

  if (rawGradient.includes('__CONFIG__')) {
    const parts = rawGradient.split('__CONFIG__');
    const gradient = parts[0]?.trim() || 'from-[#0A1633] via-[#0F2960] to-[#1A56DB]';
    try {
      const parsed = JSON.parse(parts[1]);
      return {
        bgGradient: gradient,
        targetDevice: (parsed.targetDevice || 'all') as 'all' | 'desktop' | 'mobile',
        bannerType: (parsed.bannerType || (fallbackFullBleed ? 'full_image' : 'custom_layout')) as 'full_image' | 'custom_layout',
      };
    } catch {
      return {
        bgGradient: gradient,
        targetDevice: 'all' as const,
        bannerType: (fallbackFullBleed ? 'full_image' : 'custom_layout') as 'full_image' | 'custom_layout',
      };
    }
  }

  return {
    bgGradient: rawGradient,
    targetDevice: 'all' as const,
    bannerType: (fallbackFullBleed ? 'full_image' : 'custom_layout') as 'full_image' | 'custom_layout',
  };
}

export const INITIAL_BANNERS: DefaultBannerItem[] = [
  {
    id: 'banner-refurbished-official',
    title: 'Refurbished Laptops & Printers',
    titleHighlight: 'Tested Quality • Reliable Performance • Smart Prices',
    subtitle: 'Dell, HP, Lenovo, Acer Grade-A business laptops & commercial Canon, Epson, HP printers with showroom warranty in Garhwa.',
    badge: 'CERTIFIED REFURBISHED • WORK SMARTER SPEND LESS',
    desktopImage: '/images/banners/refurbished-laptops-printers.png',
    mobileImage: '/images/banners/refurbished-laptops-printers.png',
    buttonText: 'Shop Refurbished Now',
    buttonUrl: '/shop?cat=Laptops',
    whatsappMsg: 'Hello Lapiez Garhwa, I want to inquire about certified refurbished laptops and printers.',
    bgGradient: encodeBannerConfig('from-[#0A1633] via-[#0E2A68] to-[#1E3A8A]', 'all', 'full_image'),
    position: 1,
    status: 'active',
    targetDevice: 'all',
    bannerType: 'full_image',
    fullBleedImage: true,
  },
  {
    id: 'banner-frontech-monitors',
    title: 'Frontech Ultima Curved Displays',
    titleHighlight: '100Hz & 165Hz Frameless Monitors from ₹5,999',
    subtitle: 'Ultra-immersive curved viewing with 99% sRGB color gamut, low blue light eye care & built-in stereo speakers.',
    badge: 'OFFICIAL FRONTECH STORE • 3-YEAR WARRANTY',
    desktopImage: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200&auto=format&fit=crop&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    buttonText: 'Shop Frontech Monitors',
    buttonUrl: '/shop?brand=Frontech&cat=Computers',
    whatsappMsg: 'Hello Lapiez Garhwa, I want to inquire about Frontech curved gaming monitors.',
    bgGradient: encodeBannerConfig('from-[#0A1633] via-[#0D224E] to-[#1E3A8A]', 'all', 'custom_layout'),
    position: 2,
    status: 'active',
    targetDevice: 'all',
    bannerType: 'custom_layout',
  },
  {
    id: 'banner-laptop-fest',
    title: 'Upgrade to 12th & 13th Gen Laptops',
    titleHighlight: 'Save Up to 45% + 18% GST Bill',
    subtitle: 'HP 15s, Dell Inspiron, Lenovo ThinkPad & ASUS with 16GB RAM + 512GB SSD. Ready for counter pickup or same-day delivery.',
    badge: 'FESTIVAL DHAMAKA SALE • GARHWA SHOWROOM',
    desktopImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1200&auto=format&fit=crop&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
    buttonText: 'Shop Laptop Deals',
    buttonUrl: '/shop?cat=Laptops',
    whatsappMsg: 'Hello Lapiez Garhwa, I want to inquire about festival laptop offers and pricing.',
    bgGradient: encodeBannerConfig('from-[#0A1633] via-[#0F2960] to-[#1A56DB]', 'all', 'custom_layout'),
    position: 3,
    status: 'active',
    targetDevice: 'all',
    bannerType: 'custom_layout',
  },
  {
    id: 'banner-cctv-security',
    title: 'CP-PLUS 4-Camera 5MP Night-Vision Kit',
    titleHighlight: 'Full Color 24/7 Security @ ₹18,499',
    subtitle: 'Complete package with 4x 5MP cameras, 4-Channel AI DVR, 1TB Seagate Purple HDD & mobile live view app.',
    badge: 'HOME & BUSINESS SECURITY SPECIAL',
    desktopImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&auto=format&fit=crop&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
    buttonText: 'View CCTV Packages',
    buttonUrl: '/shop?cat=CCTV%20%26%20Security',
    whatsappMsg: 'Hello Lapiez Garhwa, I want a quote for 4-camera CP-PLUS CCTV security kit.',
    bgGradient: encodeBannerConfig('from-[#03241C] via-[#064E3B] to-[#047857]', 'all', 'custom_layout'),
    position: 4,
    status: 'active',
    targetDevice: 'all',
    bannerType: 'custom_layout',
  },
  {
    id: 'banner-custom-pc',
    title: 'Intel Core i5/i7 + RTX Graphics Workstations',
    titleHighlight: 'Zero Bottleneck • Towers from ₹38,999',
    subtitle: 'Engineered for 4K video editing, AutoCAD, 3D rendering, and high-FPS gaming with benchmark reports.',
    badge: 'CUSTOM WORKSTATIONS • BUILT & TESTED IN GARHWA',
    desktopImage: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&auto=format&fit=crop&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
    buttonText: 'Explore Custom PCs',
    buttonUrl: '/shop?cat=Computers',
    whatsappMsg: 'Hello Lapiez Garhwa, I want to configure a custom PC for video editing / gaming.',
    bgGradient: encodeBannerConfig('from-[#171033] via-[#2E1065] to-[#4338CA]', 'all', 'custom_layout'),
    position: 5,
    status: 'active',
    targetDevice: 'all',
    bannerType: 'custom_layout',
  },
  {
    id: 'banner-spares-upgrade',
    title: 'Crucial & Kingston NVMe SSDs & Laptop Spares',
    titleHighlight: 'Genuine Adapters, Batteries & SSDs from ₹499',
    subtitle: 'Revive your slow laptop! High-speed NVMe M.2 SSDs starting at ₹1,299 with free showroom installation.',
    badge: 'INSTANT 10X SPEED BOOST • FREE SHOWROOM FITTING',
    desktopImage: '/images/categories/laptop-ssd.png',
    mobileImage: '/images/categories/laptop-ssd.png',
    buttonText: 'Explore Spares & SSDs',
    buttonUrl: '/shop?search=SSD',
    whatsappMsg: 'Hello Lapiez Garhwa, I want to upgrade my laptop SSD / buy original adapter.',
    bgGradient: encodeBannerConfig('from-[#381504] via-[#78350F] to-[#EA580C]', 'all', 'custom_layout'),
    position: 6,
    status: 'active',
    targetDevice: 'all',
    bannerType: 'custom_layout',
  },
];
