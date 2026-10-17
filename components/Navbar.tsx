'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, ShoppingCart, Heart, User, 
  Phone, Menu, X, ArrowRight, MapPin, 
  ShieldCheck, MessageSquare, ChevronDown, ChevronUp, ChevronRight,
  ShoppingBag, ExternalLink, Laptop, Printer,
  HelpCircle, Layers, CheckCircle2, Award,
  Bell, Smartphone, Download
} from 'lucide-react';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';
import { useStore, DEFAULT_SHOP_BY_CATEGORIES, CMSCategory } from '../context/StoreContext';

interface NavbarProps {
  onOpenAccount?: () => void;
  onOpenWishlist?: () => void;
}

// Fallback mega menu hierarchy
const FALLBACK_MEGA_MENU_COLUMNS = [
  {
    groups: [
      {
        title: 'Computer & Laptops',
        href: '/shop?cat=Computer%20%26%20Laptops',
        items: [
          { label: 'Computer & Laptop', href: '/shop?search=Laptop' },
          { label: 'Refurbished Laptops', href: '/shop?cat=Laptops&condition=refurbished' },
          { label: 'Custom Desktop PC Rigs', href: '/shop?search=Desktop' },
        ],
      },
      {
        title: 'Printer & Spares',
        href: '/shop?cat=Printers%20%26%20Parts',
        items: [
          { label: 'Printers (InkTank & Laser)', href: '/shop?search=Printer' },
          { label: 'Toner & Ink Bottles', href: '/shop?search=Toner' },
          { label: 'Printer Spare Parts', href: '/shop?search=Printer%20Parts' },
        ],
      },
    ],
  },
  {
    groups: [
      {
        title: 'Computer Peripherals',
        href: '/shop?cat=Computer%20Peripherals',
        items: [
          { label: 'Mouse & Keyboard', href: '/shop?search=Keyboard' },
          { label: 'Speakers & Soundbars', href: '/shop?search=Speaker' },
          { label: 'Cable & Connector (HDMI/VGA)', href: '/shop?search=Cable' },
        ],
      },
      {
        title: 'Storage & Memory',
        href: '/shop?cat=Storage%20%26%20Memory',
        items: [
          { label: 'NVMe SSD & Hard Disk', href: '/shop?search=SSD' },
          { label: 'Pendrive & SD Card', href: '/shop?search=Pendrive' },
        ],
      },
    ],
  },
  {
    groups: [
      {
        title: 'Laptop Parts & Spares',
        href: '/shop?cat=Laptop%20Parts%20%26%20Spares',
        items: [
          { label: 'Laptop Battery', href: '/shop?search=Battery' },
          { label: 'Laptop Adapter / Charger', href: '/shop?search=Adapter' },
          { label: 'Laptop Body & Hinges', href: '/shop?search=Body' },
        ],
      },
    ],
  },
  {
    groups: [
      {
        title: 'CCTV & Security',
        href: '/shop?cat=CCTV%20%26%20Security',
        items: [
          { label: 'CCTV Cameras (Dome/Bullet)', href: '/shop?search=CCTV' },
          { label: 'Biometric Attendance & Scanners', href: '/shop?search=Biometric' },
          { label: 'DVR/NVR & Cables', href: '/shop?search=DVR' },
        ],
      },
      {
        title: 'Antivirus & Software',
        href: '/shop?cat=Antivirus%20%26%20Software',
        items: [
          { label: 'Quick Heal & Total Security', href: '/shop?search=Antivirus' },
        ],
      },
    ],
  },
];

export const Navbar: React.FC<NavbarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    cart, 
    wishlistIds, 
    setIsCartOpen, 
    products, 
    setSelectedProduct,
    siteSettings,
    customer,
    categories,
    setIsAppModalOpen,
    signInWithGoogle
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileRefurbishedOpen, setMobileRefurbishedOpen] = useState(false);
  
  type ActiveNavMenu = 'shop' | 'refurbished' | 'more' | null;
  const [activeNavMenu, setActiveNavMenu] = useState<ActiveNavMenu>(null);

  const isShopMenuOpen = activeNavMenu === 'shop';
  const isRefurbishedMenuOpen = activeNavMenu === 'refurbished';
  const isMoreMenuOpen = activeNavMenu === 'more';

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [siteSettings?.logo]);

  const headerRef = useRef<HTMLElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveNavMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setActiveNavMenu(null);
    setIsSearchOpen(false);
    setMobileMenuOpen(false);
    setMobileShopOpen(false);
    setMobileRefurbishedOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
      setIsSearchOpen(false);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Main Parent categories (excluding child subcategories & inactive)
  const parentCategories = useMemo(() => {
    const list = (categories || []).filter((c) => c.status !== 'inactive' && !c.parentId);
    if (list.length > 0) {
      return [...list].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    return DEFAULT_SHOP_BY_CATEGORIES;
  }, [categories]);

  const [selectedNavCategory, setSelectedNavCategory] = useState<CMSCategory | null>(null);
  const [mobileExpandedCatId, setMobileExpandedCatId] = useState<string | null>(null);

  // Auto-select first category when opened or changed
  useEffect(() => {
    if (parentCategories.length > 0) {
      if (!selectedNavCategory || !parentCategories.some(c => c.id === selectedNavCategory.id)) {
        setSelectedNavCategory(parentCategories[0]);
      }
    }
  }, [parentCategories, selectedNavCategory]);

  // Instant Search Suggestions
  const searchResults = searchQuery.trim().length > 1
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full bg-white shadow-xs">
      
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#1A56DB] text-white text-[11px] sm:text-[12px] py-1 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FEF08A] flex-shrink-0" />
            <span className="text-blue-100 hidden sm:inline">Deliver to:</span>
            <strong className="text-white font-semibold">Garhwa & Palamu (822114)</strong>
            <span className="hidden md:inline-block ml-2 text-blue-200">
              | Free Same-Day Delivery
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <span className="hidden lg:inline-flex items-center gap-1.5 text-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
              {siteSettings?.announcementText || '100% Asli Samaan • 18% GST Bill • Lapiez Garhwa'}
            </span>
            <span className="hidden sm:inline text-blue-300">|</span>
            <button 
              type="button"
              onClick={() => setIsAppModalOpen(true)}
              className="flex items-center gap-1 text-white hover:text-yellow-200 font-semibold transition-colors cursor-pointer"
              title="Download Android App"
            >
              <Smartphone className="w-3 h-3 text-emerald-300" />
              <span>Download App</span>
            </button>
            <span className="hidden md:inline text-blue-300">|</span>
            <a 
              href={`tel:${siteSettings?.phone || STORE_INFO.phone}`} 
              className="hidden md:flex items-center gap-1 text-white hover:text-yellow-200 font-medium transition-colors"
            >
              <Phone className="w-3 h-3 text-yellow-300" />
              <span>{siteSettings?.phone || STORE_INFO.phone}</span>
            </a>
            <span className="hidden sm:inline text-blue-300">|</span>
            <Link 
              href="/account" 
              className="hidden sm:inline-block text-white hover:text-yellow-200 font-medium transition-colors"
            >
              Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main E-Commerce Header Bar */}
      <div className="border-b border-[#E5E7EB] bg-white px-4 sm:px-8 py-3 relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative">
          
          {/* LEFT: Nav Links (Home, Categories ^, Refurbished v, Support, More v) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-[14.5px] font-semibold text-[#1E3A8A] flex-1 justify-start">
            
            {/* Home Link */}
            <Link 
              href="/" 
              className={`hover:text-[#2563EB] transition-colors ${pathname === '/' ? 'text-[#2563EB] font-bold' : ''}`}
            >
              Home
            </Link>

            {/* Categories Flyout (Header -> Category -> Subcategory) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveNavMenu(activeNavMenu === 'shop' ? null : 'shop')}
                className={`flex items-center gap-1.5 hover:text-[#2563EB] transition-colors py-1 cursor-pointer ${
                  isShopMenuOpen ? 'text-[#2563EB] font-bold' : ''
                }`}
              >
                <span>Categories</span>
                {isShopMenuOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#2563EB] stroke-[2.5]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 stroke-[2.5]" />
                )}
              </button>
            </div>

            {/* Refurbished Dropdown (Laptops & Others) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveNavMenu(activeNavMenu === 'refurbished' ? null : 'refurbished')}
                className={`flex items-center gap-1.5 hover:text-[#2563EB] transition-colors py-1 cursor-pointer ${
                  isRefurbishedMenuOpen || pathname.includes('refurbished') ? 'text-[#2563EB] font-bold' : ''
                }`}
              >
                <span>Refurbished</span>
                {isRefurbishedMenuOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#2563EB] stroke-[2.5]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 stroke-[2.5]" />
                )}
              </button>

              {isRefurbishedMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="space-y-1">
                    {/* Item 1: Laptops */}
                    <Link
                      href="/shop?cat=Computer%20%26%20Laptops"
                      onClick={() => setActiveNavMenu(null)}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors border border-transparent hover:border-blue-200"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#1A56DB] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-[13.5px] text-gray-900 group-hover:text-[#1A56DB] block">
                          Refurbished Laptops
                        </span>
                        <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                          HP, Dell, Lenovo Business Series (6-Month Warranty)
                        </span>
                      </div>
                    </Link>

                    {/* Item 2: Others */}
                    <Link
                      href="/shop?cat=Printers%20%26%20Accessories"
                      onClick={() => setActiveNavMenu(null)}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-amber-50/80 transition-colors border border-transparent hover:border-amber-200"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Printer className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-[13.5px] text-gray-900 group-hover:text-amber-800 block">
                          Others (Printers & Desktops)
                        </span>
                        <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                          LaserJet Printers, Monitors & Custom Desktop Rigs
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Quality Assurance Footer */}
                  <div className="mt-2 pt-2 border-t border-gray-100 px-2 flex items-center justify-between text-[10.5px] text-emerald-700 font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      24-Point Tested
                    </span>
                    <span>•</span>
                    <span>Showroom Warranty</span>
                  </div>
                </div>
              )}
            </div>

            {/* Support Link */}
            <Link 
              href="/contact" 
              className="hover:text-[#2563EB] transition-colors"
            >
              Support
            </Link>

            {/* More with dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveNavMenu(activeNavMenu === 'more' ? null : 'more')}
                className="flex items-center gap-1 hover:text-[#2563EB] transition-colors py-1 cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 text-xs">
                  <Link 
                    href="/blogs" 
                    className="block px-4 py-2 hover:bg-blue-50 text-gray-700 hover:text-[#1A56DB] font-medium"
                  >
                    Tech Guides & Tutorials
                  </Link>
                  <Link 
                    href="/faq" 
                    className="block px-4 py-2 hover:bg-blue-50 text-gray-700 hover:text-[#1A56DB] font-medium"
                  >
                    Showroom FAQ & Helpdesk
                  </Link>
                  <Link 
                    href="/contact" 
                    className="block px-4 py-2 hover:bg-blue-50 text-gray-700 hover:text-[#1A56DB] font-medium"
                  >
                    Showroom Location & Counter
                  </Link>
                  <Link 
                    href="/account?tab=gst" 
                    className="block px-4 py-2 hover:bg-blue-50 text-gray-700 hover:text-[#1A56DB] font-medium"
                  >
                    18% GST Invoicing & ITC
                  </Link>
                  <Link 
                    href="/pages/terms-and-conditions" 
                    className="block px-4 py-2 hover:bg-blue-50 text-gray-700 hover:text-[#1A56DB] font-medium"
                  >
                    Terms & Conditions
                  </Link>
                  <Link 
                    href="/pages/privacy-policy" 
                    className="block px-4 py-2 hover:bg-blue-50 text-gray-700 hover:text-[#1A56DB] font-medium"
                  >
                    Privacy Policy
                  </Link>
                </div>
              )}
            </div>

          </nav>

          {/* CENTER: Dynamic Site Logo - Guaranteed Dead Center on Desktop */}
          <div className="flex items-center justify-center lg:absolute lg:left-1/2 lg:-translate-x-1/2 z-10 flex-shrink-0">
            <Link href="/" className="flex flex-col items-center justify-center group">
              {!logoError && siteSettings?.logo && siteSettings.logo.trim() !== '' && siteSettings.logo !== '/images/logo.png' ? (
                <div className="flex items-center gap-2 py-0.5">
                  <img 
                    src={siteSettings.logo} 
                    alt={siteSettings?.siteName || "Lapiez"} 
                    onError={() => setLogoError(true)}
                    className="h-8 sm:h-9 w-auto max-w-[150px] sm:max-w-[200px] object-contain group-hover:scale-[1.02] transition-transform"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#0A2560] text-white flex items-center justify-center shadow-sm transform group-hover:scale-105 transition-transform">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[20px] sm:text-[22px] font-black tracking-tight text-[#111827] leading-none">
                      {siteSettings?.siteName ? (
                        siteSettings.siteName.toLowerCase().includes('lapiez') ? (
                          <>LAP<span className="text-[#1A56DB]">IEZ</span></>
                        ) : (
                          <span className="text-[#111827]">{siteSettings.siteName}</span>
                        )
                      ) : (
                        <>LAP<span className="text-[#1A56DB]">IEZ</span></>
                      )}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold leading-none mt-0.5">
                      {siteSettings?.tagline || 'Garhwa Hardware Store'}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* RIGHT: Action Icons (Search, User, WhatsApp, Cart) */}
          <div className="flex items-center gap-2 sm:gap-3.5 flex-1 justify-end">
            
            {/* Search Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-full text-gray-600 hover:text-[#1A56DB] hover:bg-gray-100 transition-colors cursor-pointer"
              title="Search store"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Customer Account Button */}
            <Link
              href="/account"
              className="p-2 rounded-full text-gray-700 hover:text-[#1A56DB] hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer group"
              title={customer ? `Signed in as ${customer.user_metadata?.full_name || customer.email}` : "Customer Account & Orders"}
              aria-label="Customer Account"
            >
              {customer?.user_metadata?.avatar_url ? (
                <img 
                  src={customer.user_metadata.avatar_url} 
                  alt="Account" 
                  className="w-5 h-5 rounded-full object-cover border border-blue-400 group-hover:scale-105 transition-transform"
                />
              ) : (
                <User className="w-5 h-5 text-gray-700 group-hover:text-[#1A56DB] transition-colors" />
              )}
            </Link>

            {/* WhatsApp Support Button (Visible on tablet/desktop, docked on mobile bottom bar) */}
            <a
              href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent(`Hello ${siteSettings?.siteName || 'Lapiez'}, I want to inquire about products.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-[#16A34A] hover:bg-emerald-50 transition-colors hidden sm:flex"
              title="Chat on WhatsApp"
            >
              <MessageSquare className="w-5 h-5" />
            </a>

            {/* App Download Notification-Style Icon Button */}
            <button
              type="button"
              onClick={() => setIsAppModalOpen(true)}
              className="relative p-2 rounded-full text-gray-700 hover:text-[#1A56DB] hover:bg-blue-50 transition-colors cursor-pointer group"
              title="Download Lapiez Android App"
              aria-label="Download Android App"
            >
              <Bell className="w-5 h-5 text-gray-700 group-hover:text-[#1A56DB] transition-colors" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 text-white text-[8px] font-extrabold items-center justify-center shadow-xs">
                  ↓
                </span>
              </span>
            </button>

            {/* Wishlist Button */}
            <Link
              href="/account?tab=wishlist"
              className="relative p-2 rounded-full text-gray-600 hover:text-[#DC2626] hover:bg-red-50 transition-colors hidden sm:flex"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#DC2626] text-white text-[9.5px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full text-gray-800 hover:text-[#1A56DB] hover:bg-gray-100 transition-colors cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#FB641B] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Drawer Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>

        {/* Search Bar Flyout */}
        {isSearchOpen && (
          <div className="max-w-2xl mx-auto mt-3 pt-3 border-t border-gray-100">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                autoFocus
                placeholder="Search genuine laptops, SSDs, CP-PLUS CCTV, keyboards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                className="w-full h-11 pl-4 pr-12 rounded-xl bg-gray-50 border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#1A56DB] focus:outline-none shadow-xs"
              />
              <button
                type="submit"
                className="absolute right-2 h-8 px-3 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-xs font-bold transition-colors"
              >
                Search
              </button>
            </form>

            {/* Instant Search Suggestions */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 divide-y divide-gray-50">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setIsSearchFocused(false);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setSelectedProduct(null);
                      router.push(`/product/${encodeURIComponent(p.id)}`);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    className="p-2.5 hover:bg-blue-50/60 rounded-lg cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center">
                        <img 
                          src={p.image || '/images/categories/laptop-adapters.png'} 
                          alt={p.name} 
                          className="max-h-full max-w-full object-contain" 
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 group-hover:text-[#1A56DB] transition-colors truncate">{p.name}</div>
                        <div className="text-[10px] text-gray-500 font-semibold truncate">{p.category} • {p.brand}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-extrabold text-[#1A56DB]">
                        ₹{Number(p.price || 0).toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsSearchFocused(false);
                          setIsSearchOpen(false);
                          setSelectedProduct(p);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className="hidden sm:inline-flex text-[10px] font-bold text-gray-500 hover:text-blue-700 bg-gray-100 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                        title="Quick View"
                      >
                        Quick View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. MEGA DROPDOWN MENU (LIVE CMS CATEGORIES) */}
        {isShopMenuOpen && (
          <div 
            className="hidden lg:block absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-2xl z-50 transition-all animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="max-w-7xl mx-auto px-6 py-6">
              
              {/* 2-STAGE HIERARCHICAL PANEL: Header -> Category -> Subcategory */}
              <div className="flex bg-gray-50/50 rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs min-h-[420px]">
                
                {/* 1. LEFT COLUMN: Categories List */}
                <div className="w-80 bg-white border-r border-gray-200/80 p-3.5 flex flex-col justify-between flex-shrink-0">
                  <div className="space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                      <span>Select Category</span>
                      <span className="text-[10px] bg-blue-50 text-[#1A56DB] px-1.5 py-0.5 rounded-full font-bold">
                        {parentCategories.length} Categories
                      </span>
                    </div>

                    <div className="space-y-0.5 max-h-[360px] overflow-y-auto pr-1">
                      {parentCategories.map((cat) => {
                        const isSelected = (selectedNavCategory?.id || parentCategories[0]?.id) === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedNavCategory(cat)}
                            onMouseEnter={() => setSelectedNavCategory(cat)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1A56DB] text-white font-bold shadow-xs'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-semibold'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {cat.image || cat.imageUrl ? (
                                  <img src={cat.image || cat.imageUrl} alt="" className="w-6 h-6 object-contain" />
                                ) : (
                                  <Layers className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] truncate">{cat.name}</div>
                                {cat.startingPrice && (
                                  <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-emerald-700 font-bold'}`}>
                                    {cat.startingPrice}
                                  </div>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                              isSelected ? 'text-white translate-x-0.5' : 'text-gray-400'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* View All Categories Link */}
                  <div className="pt-2 border-t border-gray-100 px-2 mt-2">
                    <Link
                      href="/shop"
                      onClick={() => setActiveNavMenu(null)}
                      className="text-xs font-bold text-[#1A56DB] hover:text-[#1E40AF] flex items-center justify-between py-1"
                    >
                      <span>Explore Full Inventory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* 2. RIGHT PANEL: Subcategories of the Selected Category */}
                <div className="flex-1 bg-white p-6 flex flex-col justify-between min-w-0">
                  {selectedNavCategory ? (
                    <div>
                      {/* Category Header */}
                      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 p-1 flex items-center justify-center flex-shrink-0">
                            <img
                              src={selectedNavCategory.image || selectedNavCategory.imageUrl || '/images/categories/laptop-adapters.png'}
                              alt={selectedNavCategory.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-lg text-gray-900 tracking-tight">
                                {selectedNavCategory.name}
                              </h3>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {selectedNavCategory.subcategories?.length || 0} Subcategories
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {selectedNavCategory.shortDesc || `Browse certified ${selectedNavCategory.name} with showroom warranty & GST bill.`}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={selectedNavCategory.href || `/shop?cat=${encodeURIComponent(selectedNavCategory.name)}`}
                          onClick={() => setActiveNavMenu(null)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs flex-shrink-0"
                        >
                          <span>View All {selectedNavCategory.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Subcategories Grid */}
                      {selectedNavCategory.subcategories && selectedNavCategory.subcategories.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[290px] overflow-y-auto pr-1">
                          {selectedNavCategory.subcategories.map((sub) => (
                            <Link
                              key={sub.id || sub.slug}
                              href={`/shop?cat=${encodeURIComponent(selectedNavCategory.name)}&sub=${encodeURIComponent(sub.name)}`}
                              onClick={() => setActiveNavMenu(null)}
                              className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/40 transition-all shadow-2xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-xs text-gray-800 group-hover:text-[#1A56DB] block truncate transition-colors">
                                  {sub.name}
                                </span>
                                {sub.startingPrice ? (
                                  <span className="text-[10.5px] font-bold text-emerald-600 block mt-0.5">
                                    {sub.startingPrice}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 block mt-0.5">
                                    Showroom Stock
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#1A56DB] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-3">
                          <Layers className="w-8 h-8 text-gray-400 mx-auto" />
                          <div>
                            <p className="text-sm font-bold text-gray-700">Browse {selectedNavCategory.name}</p>
                            <p className="text-xs text-gray-400 mt-1">Directly view all available products and models in this category.</p>
                          </div>
                          <Link
                            href={`/shop?cat=${encodeURIComponent(selectedNavCategory.name)}`}
                            onClick={() => setActiveNavMenu(null)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A56DB] text-white text-xs font-bold hover:bg-[#1E40AF]"
                          >
                            <span>Open {selectedNavCategory.name} Catalog</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Select a category on the left to view subcategories.
                    </div>
                  )}

                  {/* Quality Assurance Footer */}
                  <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>100% Genuine Certified Hardware • Opp G P Plaza, Chiniya Road Garhwa • 18% GST Invoice</span>
                    </div>
                    <Link
                      href="/shop"
                      onClick={() => setActiveNavMenu(null)}
                      className="font-bold text-[#1A56DB] hover:underline"
                    >
                      All Showroom Products &rarr;
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* 4. Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          
          <div className="space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-800 hover:text-[#1A56DB]"
            >
              Home
            </Link>

            {/* Mobile Categories Accordion (Header -> Category -> Subcategory) */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setMobileShopOpen(!mobileShopOpen);
                  if (!mobileShopOpen) setMobileRefurbishedOpen(false);
                }}
                className="w-full flex items-center justify-between py-2 text-sm font-bold text-[#1A56DB]"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1A56DB]" />
                  <span>Categories</span>
                </div>
                {mobileShopOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {mobileShopOpen && (
                <div className="pl-2 py-2 space-y-2 border-l-2 border-blue-200 mt-1">
                  {parentCategories.map((cat) => {
                    const isExpanded = mobileExpandedCatId === cat.id;
                    const hasSubs = cat.subcategories && cat.subcategories.length > 0;
                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-blue-50/50">
                          <Link
                            href={cat.href || `/shop?cat=${encodeURIComponent(cat.name)}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="font-bold text-xs text-gray-900 hover:text-[#1A56DB] flex items-center gap-2"
                          >
                            <span>{cat.name}</span>
                            {cat.startingPrice && (
                              <span className="text-[10px] text-emerald-700 font-bold">
                                ({cat.startingPrice})
                              </span>
                            )}
                          </Link>
                          {hasSubs && (
                            <button
                              type="button"
                              onClick={() => setMobileExpandedCatId(isExpanded ? null : cat.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                              aria-label="Toggle subcategories"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>

                        {/* Indented Subcategories */}
                        {isExpanded && hasSubs && (
                          <div className="pl-4 py-1 space-y-1 border-l border-gray-200 ml-2">
                            {cat.subcategories.map((sub) => (
                              <Link
                                key={sub.id || sub.slug}
                                href={`/shop?cat=${encodeURIComponent(cat.name)}&sub=${encodeURIComponent(sub.name)}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold"
                              >
                                &bull; {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile Refurbished Accordion */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setMobileRefurbishedOpen(!mobileRefurbishedOpen);
                  if (!mobileRefurbishedOpen) setMobileShopOpen(false);
                }}
                className="w-full flex items-center justify-between py-2 text-sm font-bold text-amber-700"
              >
                <span>Refurbished</span>
                {mobileRefurbishedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {mobileRefurbishedOpen && (
                <div className="pl-3 py-2 space-y-2 border-l-2 border-amber-300 mt-1 text-xs font-semibold">
                  <Link
                    href="/shop?cat=Computer%20%26%20Laptops"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1 text-gray-800 hover:text-[#1A56DB]"
                  >
                    Refurbished Laptops (HP, Dell, ThinkPad)
                  </Link>
                  <Link
                    href="/shop?cat=Printers%20%26%20Accessories"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1 text-gray-800 hover:text-amber-800"
                  >
                    Others (Printers, Desktops, Displays)
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile FAQ Link */}
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-800 hover:text-[#1A56DB] flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-[#1A56DB]" />
              <span>FAQ & Helpdesk</span>
            </Link>

            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-800 hover:text-[#1A56DB]"
            >
              About Us
            </Link>

            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-800 hover:text-[#1A56DB]"
            >
              Support & Contact
            </Link>

            <Link
              href="/blogs"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gray-800 hover:text-[#1A56DB]"
            >
              Tech Blogs & Tutorials
            </Link>

            {!customer ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signInWithGoogle('/account');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs font-bold text-gray-800 hover:text-[#1A56DB] transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  Login
                </span>
              </button>
            ) : null}

            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-bold text-gray-800 hover:text-[#1A56DB] flex items-center justify-between"
            >
              <span>{customer ? 'My Account & Orders' : 'My Account & Guest Access'}</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsAppModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download Our App (APK)</span>
            </button>

            <a
              href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent(`Hello ${siteSettings?.siteName || 'Lapiez'}, I need quick support.`)}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Showroom Desk</span>
            </a>
            <a
              href={`tel:${siteSettings?.phone || STORE_INFO.phone}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-100 text-gray-800 font-bold text-xs"
            >
              <Phone className="w-4 h-4" />
              <span>Call ({siteSettings?.phone || STORE_INFO.phone})</span>
            </a>
          </div>

        </div>
      )}

    </header>
  );
};
