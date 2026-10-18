'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, Mail, MapPin, Clock, MessageSquare, ArrowUp, 
  X, ChevronRight, FileText, ShieldCheck, 
  Truck, Receipt, Store, ExternalLink, Check,
  Smartphone, Download, HelpCircle, Info
} from 'lucide-react';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { setIsAccountOpen, setAccountTab, customPages, siteSettings, setIsAppModalOpen } = useStore();

  // Policy Modal state
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'refund' | 'shipping' | 'terms' | 'gst' | null>(null);
  const [footerLogoError, setFooterLogoError] = useState(false);

  React.useEffect(() => {
    setFooterLogoError(false);
  }, [siteSettings?.logo]);

  const handleOpenTracking = (e: React.MouseEvent) => {
    e.preventDefault();
    setAccountTab('orders');
    setIsAccountOpen(true);
  };

  const handleOpenAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    setAccountTab('orders');
    setIsAccountOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="bg-white text-[#475569] font-sans border-t border-[#E2E8F0]">
        
        {/* ========================================================= */}
        {/* 1. TOP HELP & SHOWROOM DIRECT CONNECT BAR (Light Theme)   */}
        {/* ========================================================= */}
        <div className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[12px] font-semibold text-[#059669] uppercase tracking-wider">
                    Direct Showroom Counter
                  </span>
                </div>
                <h3 className="text-[17px] sm:text-[19px] font-bold text-[#0F172A] tracking-tight">
                  Need Help Choosing Hardware or Laptop Spares in Garhwa?
                </h3>
                <p className="text-[13px] text-[#64748B]">
                  Speak directly with our hardware technicians on Chiniya Road for compatibility advice and instant quotes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`tel:${siteSettings?.phone || STORE_INFO.phone}`}
                  className="h-[40px] px-4 rounded-[8px] bg-white hover:bg-slate-50 text-[#0F172A] text-[13px] font-semibold inline-flex items-center gap-2 transition-colors border border-[#CBD5E1] shadow-2xs"
                >
                  <Phone className="w-4 h-4 text-[#2563EB]" />
                  <span>{siteSettings?.phone || STORE_INFO.phone}</span>
                </a>

                <a
                  href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent(`Hello ${siteSettings?.siteName || 'Lapiez'}, I need quick support / inquiry about hardware.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-[40px] px-4 rounded-[8px] bg-[#16A34A] hover:bg-[#15803D] text-white text-[13px] font-semibold inline-flex items-center gap-2 transition-colors shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Technician</span>
                </a>

                <a
                  href={siteSettings?.googleMapsUrl || siteSettings?.twitterUrl || STORE_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-[40px] px-3.5 rounded-[8px] bg-white hover:bg-slate-50 text-[#334155] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors border border-[#CBD5E1]"
                >
                  <MapPin className="w-4 h-4 text-[#D97706]" />
                  <span>Showroom Map</span>
                </a>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MAIN 5-COLUMN FOOTER NAVIGATION (Light Theme)          */}
        {/* ========================================================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* ----------------------------------------------------- */}
            {/* Column 1: Showroom Profile & Contact (span 4)         */}
            {/* ----------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Brand Logo */}
              <Link href="/" className="inline-flex items-center gap-3 group">
                {!footerLogoError && siteSettings?.logo && siteSettings.logo.trim() !== '' && siteSettings.logo !== '/images/logo.png' ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={siteSettings.logo} 
                      alt={siteSettings?.siteName || "Lapiez"} 
                      onError={() => setFooterLogoError(true)}
                      className="h-10 w-auto max-w-[200px] object-contain transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-[10px] bg-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
                      LP
                    </div>
                    <div>
                      <span className="font-bold text-[#0F172A] text-[19px] tracking-tight block">
                        {siteSettings?.siteName ? (
                          siteSettings.siteName.toLowerCase().includes('lapiez') ? (
                            <>LAP<span className="text-[#2563EB]">IEZ</span></>
                          ) : (
                            siteSettings.siteName
                          )
                        ) : (
                          <>LAP<span className="text-[#2563EB]">IEZ</span></>
                        )}
                      </span>
                      <span className="text-[10px] text-[#64748B] uppercase tracking-widest font-semibold block">
                        {siteSettings?.tagline || 'Technology • Security • Solutions'}
                      </span>
                    </div>
                  </>
                )}
              </Link>

              <p className="text-[13px] text-[#64748B] leading-relaxed">
                Garhwa's trusted physical retail showroom for brand-new laptops, custom workstations, original replacement spares, and authorized CP-PLUS / Hikvision CCTV installations. Serving Garhwa and Palamu since 2018.
              </p>

              {/* Showroom Physical Coordinates */}
              <div className="space-y-2 text-[12.5px] pt-1">
                <div className="flex items-start gap-2.5 text-[#334155]">
                  <MapPin className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <span>{siteSettings?.address || `${STORE_INFO.address}, Garhwa, Jharkhand - ${STORE_INFO.pincode}`}</span>
                </div>

                <div className="flex items-center gap-2.5 text-[#334155]">
                  <Clock className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                  <span>{siteSettings?.timings || STORE_INFO.timings}</span>
                </div>

                <div className="flex items-center gap-2.5 text-[#334155]">
                  <Mail className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <a href={`mailto:${siteSettings?.email || STORE_INFO.email}`} className="hover:text-[#2563EB] transition-colors">
                    {siteSettings?.email || STORE_INFO.email}
                  </a>
                </div>
              </div>

              {/* Social Media SVG Icons */}
              <div className="pt-2 flex items-center gap-2">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-8 h-8 rounded-[8px] bg-[#F8FAFC] hover:bg-[#16A34A] text-[#64748B] hover:text-white flex items-center justify-center transition-all border border-[#CBD5E1]"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.772.82 2.791.82 3.184 0 5.77-2.587 5.77-5.766.001-3.182-2.585-5.806-5.77-5.806zm7.251 5.766c0 3.998-3.255 7.253-7.252 7.253-1.22 0-2.4-.306-3.444-.887l-4.586 1.203 1.229-4.475c-.658-1.096-1.026-2.359-1.026-3.664 0-3.999 3.255-7.254 7.252-7.254s7.252 3.255 7.252 7.254z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={siteSettings?.facebookUrl || "https://facebook.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-[8px] bg-[#F8FAFC] hover:bg-[#1877F2] text-[#64748B] hover:text-white flex items-center justify-center transition-all border border-[#CBD5E1]"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href={siteSettings?.instagramUrl || "https://instagram.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-[8px] bg-[#F8FAFC] hover:bg-[#E4405F] text-[#64748B] hover:text-white flex items-center justify-center transition-all border border-[#CBD5E1]"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href={siteSettings?.youtubeUrl || "https://youtube.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-[8px] bg-[#F8FAFC] hover:bg-[#FF0000] text-[#64748B] hover:text-white flex items-center justify-center transition-all border border-[#CBD5E1]"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>

              {/* Download Our App Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsAppModalOpen(true)}
                  className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#1A56DB] text-white transition-all shadow-xs group cursor-pointer text-left"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-[10px] text-slate-300 block leading-tight font-medium">Get Official Android APK</span>
                    <span className="text-[12px] font-bold text-white block leading-tight">Download Our App</span>
                  </div>
                </button>
              </div>

            </div>

            {/* ----------------------------------------------------- */}
            {/* Column 2: Hardware Catalog (span 2)                   */}
            {/* ----------------------------------------------------- */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#E2E8F0] pb-2">
                Hardware
              </h4>
              <ul className="space-y-2 text-[13px]">
                <li>
                  <Link href="/shop?cat=Computer%20%26%20Laptops" className="hover:text-[#2563EB] transition-colors block">
                    Business Laptops
                  </Link>
                </li>
                <li>
                  <Link href="/shop?cat=Computer%20%26%20Laptops" className="hover:text-[#2563EB] transition-colors block">
                    Desktop Workstations
                  </Link>
                </li>
                <li>
                  <Link href="/shop?search=Adapter" className="hover:text-[#2563EB] transition-colors block">
                    Laptop Adapters
                  </Link>
                </li>
                <li>
                  <Link href="/shop?search=Battery" className="hover:text-[#2563EB] transition-colors block">
                    Laptop Batteries
                  </Link>
                </li>
                <li>
                  <Link href="/shop?search=SSD" className="hover:text-[#2563EB] transition-colors block">
                    NVMe SSD & RAM
                  </Link>
                </li>
                <li>
                  <Link href="/shop?search=Keyboard" className="hover:text-[#2563EB] transition-colors block">
                    Keyboards & Mice
                  </Link>
                </li>
                <li>
                  <Link href="/shop?cat=Printers%20%26%20Accessories" className="hover:text-[#2563EB] transition-colors block">
                    Printers & Toners
                  </Link>
                </li>
              </ul>
            </div>

            {/* ----------------------------------------------------- */}
            {/* Column 3: Store Guarantees & Buying Benefits (span 3) */}
            {/* ----------------------------------------------------- */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#E2E8F0] pb-2">
                Store Guarantees
              </h4>
              <ul className="space-y-2 text-[13px] text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>100% Brand Sealed Pack Boxes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Official GST Tax Invoice (18% ITC)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Direct Brand Warranty All Across India</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Free Same-Day Delivery in Garhwa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>7-Day Showroom Replacement Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Free Hardware Diagnostics & OS Setup</span>
                </li>
              </ul>
            </div>

            {/* ----------------------------------------------------- */}
            {/* Column 4: Customer Help & Policies (span 3)           */}
            {/* ----------------------------------------------------- */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#E2E8F0] pb-2">
                Customer Support & Help
              </h4>
              <ul className="space-y-2 text-[13px]">
                <li>
                  <Link href="/pages/about-us" className="flex items-center gap-1.5 text-[#1A56DB] font-bold hover:underline transition-colors block">
                    <Info className="w-3.5 h-3.5 text-[#1A56DB] flex-shrink-0" />
                    <span>About Us</span>
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="flex items-center gap-1.5 text-[#1A56DB] font-bold hover:underline transition-colors block">
                    <HelpCircle className="w-3.5 h-3.5 text-[#1A56DB] flex-shrink-0" />
                    <span>FAQ & Helpdesk</span>
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => setIsAppModalOpen(true)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-[#1A56DB] font-medium hover:underline transition-colors text-left cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#1A56DB] flex-shrink-0" />
                    <span>Download Our App</span>
                  </button>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-[#2563EB] transition-colors block">
                    Shopping Cart
                  </Link>
                </li>
                <li>
                  <Link href="/checkout" className="hover:text-[#2563EB] transition-colors block">
                    Express Checkout & QR Pay
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="hover:text-[#2563EB] transition-colors block">
                    Track Order Status & Account
                  </Link>
                </li>
                <li>
                  <Link href="/blogs" className="hover:text-[#2563EB] transition-colors block">
                    Tech Guides & Blog
                  </Link>
                </li>
                <li>
                  <Link href="/pages/terms-and-conditions" className="hover:text-[#2563EB] transition-colors block">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/pages/privacy-policy" className="hover:text-[#2563EB] transition-colors block">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/pages/warranty-policy" className="hover:text-[#2563EB] transition-colors block">
                    Warranty & Replacement
                  </Link>
                </li>
                {/* Dynamically render any additional CMS pages created in Admin */}
                {customPages && customPages
                  .filter((p) => p && !['terms-and-conditions', 'privacy-policy', 'warranty-policy', 'about-us'].includes(p.slug) && (p.status === 'published' || !p.status))
                  .map((cp) => (
                    <li key={cp.id || cp.slug}>
                      <Link href={`/pages/${cp.slug}`} className="hover:text-[#2563EB] transition-colors block">
                        {cp.title}
                      </Link>
                    </li>
                  ))}
                <li>
                  <Link href="/contact" className="text-[#2563EB] font-bold hover:underline transition-colors block">
                    Contact Us & Showroom
                  </Link>
                </li>
                <li>
                  <button onClick={() => setActivePolicy('gst')} className="hover:text-[#D97706] text-[#D97706] font-medium transition-colors text-left cursor-pointer">
                    GST 18% Input Tax Credit
                  </button>
                </li>
              </ul>

              {/* Physical Inspection Guarantee */}
              <div className="pt-2">
                <div className="p-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#0F172A] font-semibold">
                    <Store className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Physical Inspection Guarantee</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-snug">
                    Inspect physical box serial numbers and test performance live at our Chiniya Road showroom before paying.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. PAYMENT METHODS & TRUST STRIP (Light Theme)            */}
        {/* ========================================================= */}
        <div className="border-t border-[#E2E8F0] py-5 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#0F172A] block">
                Accepted Payment Methods at Showroom & Online
              </span>
              <p className="text-[11.5px] text-[#64748B]">
                Instant UPI (GPay • PhonePe • Paytm • BHIM), RuPay, Visa, MasterCard, Net Banking, and Cash on Counter.
              </p>
            </div>

            {/* Payment Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {['UPI (GPay / PhonePe)', 'RuPay', 'Visa', 'Mastercard', 'Net Banking', 'Cash on Delivery'].map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 rounded-[6px] bg-white border border-[#CBD5E1] text-[11px] text-[#334155] font-medium shadow-2xs"
                >
                  {m}
                </span>
              ))}
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. BOTTOM COPYRIGHT & LEGAL NOTICE (Light Theme)          */}
        {/* ========================================================= */}
        <div className="py-4 px-4 sm:px-8 bg-[#F1F5F9] border-t border-[#E2E8F0] text-[12px] text-[#64748B]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            
            <div>
              <span>© {new Date().getFullYear()} </span>
              <strong className="text-[#0F172A] font-semibold">Lapiez Garhwa</strong>.
              <span className="hidden sm:inline"> In front of G P Plaza, Chiniya Road, Garhwa, Jharkhand 822114.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3.5 sm:gap-4">
              <Link
                href="/pages/about-us"
                className="hover:text-[#0F172A] font-medium transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/faq"
                className="hover:text-[#0F172A] font-medium transition-colors"
              >
                FAQ
              </Link>
              <button
                onClick={() => setIsAppModalOpen(true)}
                className="hover:text-[#1A56DB] text-[#1A56DB] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Download Our App</span>
              </button>
              <button
                onClick={() => setActivePolicy('privacy')}
                className="hover:text-[#0F172A] transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => setActivePolicy('terms')}
                className="hover:text-[#0F172A] transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => setActivePolicy('refund')}
                className="hover:text-[#0F172A] transition-colors"
              >
                Refunds
              </button>
              
              <button
                onClick={scrollToTop}
                className="ml-2 px-2.5 py-1 rounded-[6px] bg-white hover:bg-slate-50 text-[#334155] hover:text-[#0F172A] border border-[#CBD5E1] transition-colors flex items-center gap-1 text-[11px] shadow-2xs"
                title="Scroll to Top"
              >
                <ArrowUp className="w-3 h-3" />
                <span>Top</span>
              </button>
            </div>

          </div>
        </div>

      </footer>

      {/* ========================================================= */}
      {/* 5. POLICY DETAILS MODAL                                   */}
      {/* ========================================================= */}
      {activePolicy && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActivePolicy(null)}
        >
          <div 
            className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto bg-white text-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActivePolicy(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content based on policy */}
            {activePolicy === 'privacy' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Customer Privacy</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Privacy Policy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  At Lapiez Garhwa, we only collect essential customer contact details (Name, Phone number, and Showroom/Delivery Address) required for issuing GST tax invoices, processing warranty claims, and scheduling on-site technician visits.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We never sell, rent, or trade your contact information. All payment transactions via UPI, Cards, or Net Banking are handled through encrypted banking channels.
                </p>
              </div>
            )}

            {activePolicy === 'refund' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Quality Guarantee</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">7-Day Replacement Policy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every certified laptop, spare part, and CCTV component purchased from our showroom is tested before handover. In the rare event of a genuine hardware defect or DOA (Dead On Arrival) within 7 days, we provide a replacement or resolution at our Chiniya Road service lab.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5">
                  <li>Original GST bill and box packaging must be retained.</li>
                  <li>Physical damage, accidental drops, or liquid spills are excluded from replacement.</li>
                </ul>
              </div>
            )}

            {activePolicy === 'shipping' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4" />
                  <span>Local Dispatch</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Delivery & Showroom Pickup Policy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We provide same-day direct delivery for orders within Garhwa Town. For surrounding areas across Palamu (Ranka, Majhiaon, Nagar Untari, Bhawanathpur, Daltonganj), delivery typically takes 24 to 48 hours.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You are welcome to select <strong>Store Pickup</strong> at checkout to inspect, benchmark, and test your device hands-on at our Chiniya Road showroom before taking delivery.
                </p>
              </div>
            )}

            {activePolicy === 'terms' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>Store Terms</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Terms of Service</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All hardware sold by Lapiez carries official brand warranty as stated on the tax invoice. On-site CCTV installations include comprehensive cabling and 1-2 years hardware warranty support.
                </p>
              </div>
            )}

            {activePolicy === 'gst' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                  <Receipt className="w-4 h-4" />
                  <span>Tax Billing</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">18% GST Input Tax Credit (ITC)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All products sold at Lapiez include authentic GST Tax Invoices with accurate HSN codes. Registered businesses, schools, colleges, and coaching centers can claim 18% input credit by providing their GSTIN during checkout or at our showroom counter.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActivePolicy(null)}
                className="px-4 py-2 rounded-[8px] bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
