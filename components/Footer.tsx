'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, Mail, MapPin, Clock, ArrowUp, 
  X, FileText, ShieldCheck, 
  Truck, Receipt, Store, Smartphone
} from 'lucide-react';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';
import { useStore } from '../context/StoreContext';
import { WhatsAppIcon } from './WhatsAppIcon';

export const Footer: React.FC = () => {
  const { setIsAccountOpen, setAccountTab, customPages, siteSettings, setIsAppModalOpen, isApp } = useStore();

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
      {isApp ? (
        <footer className="bg-white text-[#475569] font-sans border-t border-[#E2E8F0] pb-24 pt-6 px-4">
          <div className="max-w-md mx-auto text-center space-y-4">
            {/* App Brand Header */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#0A2560] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                LP
              </div>
              <span className="font-black text-[#111827] text-base tracking-tight leading-none">
                LAP<span className="text-[#1A56DB]">IEZ</span>
              </span>
            </div>

            {/* Showroom Direct Connect Card */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-slate-200 space-y-2 text-left shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#1A56DB]" />
                  Garhwa Showroom Desk
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  10 AM - 8:30 PM
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {siteSettings?.address || `${STORE_INFO.address}, ${STORE_INFO.city}, ${STORE_INFO.state} - ${STORE_INFO.pincode}`}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${siteSettings?.phone || STORE_INFO.phone}`}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  Call Desk
                </a>
                <a
                  href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent(`Hello ${siteSettings?.siteName || 'Lapiez'}, I need quick assistance from the app.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <WhatsAppIcon variant="monochrome" className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href={siteSettings?.googleMapsUrl || siteSettings?.twitterUrl || STORE_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Map
                </a>
              </div>
            </div>

            {/* Quick Policies & Store Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-[11px] text-slate-500">
              <button type="button" onClick={() => setActivePolicy('privacy')} className="hover:text-blue-600 cursor-pointer">Privacy</button>
              <span>•</span>
              <button type="button" onClick={() => setActivePolicy('terms')} className="hover:text-blue-600 cursor-pointer">Terms</button>
              <span>•</span>
              <button type="button" onClick={() => setActivePolicy('refund')} className="hover:text-blue-600 cursor-pointer">7-Day Replacement</button>
              <span>•</span>
              <button type="button" onClick={() => setActivePolicy('gst')} className="hover:text-blue-600 cursor-pointer">GST 18% ITC</button>
              <span>•</span>
              <Link href="/contact" className="hover:text-blue-600 font-semibold text-blue-700">Support</Link>
              <span>•</span>
              <Link href="/warranty" className="hover:text-emerald-600 font-bold text-emerald-700">Warranty Claim</Link>
              <span>•</span>
              <Link href="/staff" className="hover:text-blue-600 font-bold text-blue-700">Staff Desk</Link>
            </div>

            <div className="text-[10.5px] text-slate-400 space-y-0.5 pt-1">
              <p>© 2026 Lapiez • Garhwa</p>
            </div>
          </div>
        </footer>
      ) : (
      <footer className="relative bg-[#060E1E] text-slate-300 font-sans overflow-hidden">
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#1A56DB] via-[#38BDF8] to-[#25D366]" />

        {/* Subtle Ambient Background Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[780px] h-[260px] rounded-full bg-[#1A56DB]/15 blur-3xl"
        />

        {/* ========================================================= */}
        {/* 1. PREMIUM SHOWROOM SUPPORT STRIP                         */}
        {/* ========================================================= */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10">
          <div className="rounded-2xl bg-gradient-to-r from-[#0C1D3A] via-[#10264B] to-[#0C1D3A] border border-white/10 shadow-xl px-5 py-4 sm:px-7 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#1A56DB]/25 border border-[#38BDF8]/30 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-[#60A5FA]" />
              </div>
              <div>
                <h3 className="text-[15px] sm:text-[17px] font-bold text-white tracking-tight leading-snug">
                  Need Help? Contact Lapiez Showroom
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  {siteSettings?.timings || STORE_INFO.timings} • Chiniya Road, Garhwa
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={`tel:${siteSettings?.phone || STORE_INFO.phone}`}
                className="h-9.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all border border-white/15 backdrop-blur-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>{siteSettings?.phone || STORE_INFO.phone}</span>
              </a>

              <a
                href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent(`Hello ${siteSettings?.siteName || 'Lapiez'}, I need support.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/30"
              >
                <WhatsAppIcon variant="monochrome" className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <a
                href={siteSettings?.googleMapsUrl || siteSettings?.twitterUrl || STORE_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9.5 px-4 rounded-xl bg-[#1A56DB] hover:bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-lg shadow-blue-950/40"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>Directions</span>
              </a>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. BALANCED 4-COLUMN PREMIUM FOOTER                       */}
        {/* ========================================================= */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* Column 1: Brand & Contact Info */}
            <div className="col-span-2 lg:col-span-4 space-y-5">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                {!footerLogoError && siteSettings?.logo && siteSettings.logo.trim() !== '' && siteSettings.logo !== '/images/logo.png' ? (
                  <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-sm inline-flex items-center">
                    <img 
                      src={siteSettings.logo} 
                      alt={siteSettings?.siteName || "Lapiez"} 
                      onError={() => setFooterLogoError(true)}
                      className="h-8 w-auto max-w-[165px] object-contain"
                    />
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white font-black text-base shadow-md shadow-blue-950/50 border border-white/15">
                      LP
                    </div>
                    <span className="font-black text-white text-xl tracking-tight">
                      {siteSettings?.siteName ? (
                        siteSettings.siteName.toLowerCase().includes('lapiez') ? (
                          <>LAP<span className="text-[#60A5FA]">IEZ</span></>
                        ) : (
                          siteSettings.siteName
                        )
                      ) : (
                        <>LAP<span className="text-[#60A5FA]">IEZ</span></>
                      )}
                    </span>
                  </>
                )}
              </Link>

              <div className="space-y-2.5 text-[12.5px] text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#60A5FA]" />
                  </span>
                  <span className="leading-relaxed">
                    {siteSettings?.address || `${STORE_INFO.address}, Garhwa, Jharkhand - ${STORE_INFO.pincode}`}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                  <span>{siteSettings?.timings || STORE_INFO.timings}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-[#38BDF8]" />
                  </span>
                  <a href={`mailto:${siteSettings?.email || STORE_INFO.email}`} className="hover:text-white transition-colors">
                    {siteSettings?.email || STORE_INFO.email}
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center transition-all border border-white/10 hover:border-emerald-400/50"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                </a>
                <a
                  href={siteSettings?.facebookUrl || "https://facebook.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[#1877F2] text-slate-300 hover:text-white flex items-center justify-center transition-all border border-white/10"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                  </svg>
                </a>
                <a
                  href={siteSettings?.instagramUrl || "https://instagram.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[#E4405F] text-slate-300 hover:text-white flex items-center justify-center transition-all border border-white/10"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href={siteSettings?.youtubeUrl || "https://youtube.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[#FF0000] text-slate-300 hover:text-white flex items-center justify-center transition-all border border-white/10"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <button
                  type="button"
                  onClick={() => setIsAppModalOpen(true)}
                  className="ml-1 h-9 px-3.5 rounded-xl bg-white/10 hover:bg-[#1A56DB] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all border border-white/15 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Get App</span>
                </button>
              </div>
            </div>

            {/* Column 2: Shop Categories */}
            <div className="col-span-1 lg:col-span-2 space-y-3.5">
              <h4 className="text-[11.5px] font-bold uppercase tracking-widest text-white flex items-center gap-2 pb-2 border-b border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                Shop
              </h4>
              <ul className="space-y-2.5 text-[13px] text-slate-300">
                <li><Link href="/shop?cat=Computer%20%26%20Laptops" className="hover:text-white hover:translate-x-0.5 transition-all block">Laptops</Link></li>
                <li><Link href="/shop?cat=Printers" className="hover:text-white hover:translate-x-0.5 transition-all block">Printers</Link></li>
                <li><Link href="/shop?cat=CCTV%20%26%20Security" className="hover:text-white hover:translate-x-0.5 transition-all block">CCTV</Link></li>
                <li><Link href="/shop?cat=Storage%20%26%20Memory" className="hover:text-white hover:translate-x-0.5 transition-all block">Storage</Link></li>
                <li><Link href="/shop?cat=Computer%20Peripherals" className="hover:text-white hover:translate-x-0.5 transition-all block">Peripherals</Link></li>
                <li><Link href="/shop" className="text-[#60A5FA] hover:text-white font-semibold hover:translate-x-0.5 transition-all block">All Products &rarr;</Link></li>
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div className="col-span-1 lg:col-span-3 space-y-3.5">
              <h4 className="text-[11.5px] font-bold uppercase tracking-widest text-white flex items-center gap-2 pb-2 border-b border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                Support
              </h4>
              <ul className="space-y-2.5 text-[13px] text-slate-300">
                <li><Link href="/account" className="hover:text-white hover:translate-x-0.5 transition-all block">My Account &amp; Orders</Link></li>
                <li><Link href="/cart" className="hover:text-white hover:translate-x-0.5 transition-all block">Shopping Cart</Link></li>
                <li><Link href="/warranty" className="hover:text-white hover:translate-x-0.5 transition-all block">Warranty Claim</Link></li>
                <li><Link href="/faq" className="hover:text-white hover:translate-x-0.5 transition-all block">FAQ &amp; Helpdesk</Link></li>
                <li><Link href="/blogs" className="hover:text-white hover:translate-x-0.5 transition-all block">Tech Guides</Link></li>
                <li><Link href="/contact" className="hover:text-white hover:translate-x-0.5 transition-all block">Contact Us</Link></li>
              </ul>
            </div>

            {/* Column 4: Policies & Legal */}
            <div className="col-span-2 lg:col-span-3 space-y-3.5">
              <h4 className="text-[11.5px] font-bold uppercase tracking-widest text-white flex items-center gap-2 pb-2 border-b border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Policies
              </h4>
              <ul className="space-y-2.5 text-[13px] text-slate-300">
                <li><Link href="/pages/about-us" className="hover:text-white hover:translate-x-0.5 transition-all block">About Us</Link></li>
                <li><Link href="/pages/terms-and-conditions" className="hover:text-white hover:translate-x-0.5 transition-all block">Terms &amp; Conditions</Link></li>
                <li><Link href="/pages/privacy-policy" className="hover:text-white hover:translate-x-0.5 transition-all block">Privacy Policy</Link></li>
                <li><Link href="/pages/warranty-policy" className="hover:text-white hover:translate-x-0.5 transition-all block">Warranty Policy</Link></li>
                <li>
                  <button type="button" onClick={() => setActivePolicy('refund')} className="hover:text-white hover:translate-x-0.5 transition-all text-left cursor-pointer">
                    7-Day Replacement
                  </button>
                </li>
                {customPages && customPages
                  .filter((p) => p && !['terms-and-conditions', 'privacy-policy', 'warranty-policy', 'about-us'].includes(p.slug) && (p.status === 'published' || !p.status))
                  .slice(0, 3)
                  .map((cp) => (
                    <li key={cp.id || cp.slug}>
                      <Link href={`/pages/${cp.slug}`} className="hover:text-white hover:translate-x-0.5 transition-all block">
                        {cp.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. BOTTOM COPYRIGHT & PAYMENT STRIP                       */}
        {/* ========================================================= */}
        <div className="relative py-4 px-4 sm:px-8 bg-[#040914] border-t border-white/10 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            
            <div className="flex items-center gap-2 text-center md:text-left">
              <span>© {new Date().getFullYear()} <strong className="text-white font-semibold">Lapiez</strong> • Chiniya Road, Garhwa</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {['UPI', 'RuPay', 'Visa / Mastercard', 'Net Banking', 'COD'].map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300 font-medium"
                >
                  {m}
                </span>
              ))}
              <button
                type="button"
                onClick={scrollToTop}
                className="ml-1 px-3 py-1 rounded-md bg-[#1A56DB] hover:bg-[#2563EB] text-white border border-blue-400/30 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer shadow-xs"
                title="Back to Top"
              >
                <ArrowUp className="w-3 h-3" />
                <span>Top</span>
              </button>
            </div>

          </div>
        </div>
      </footer>
      )}

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
