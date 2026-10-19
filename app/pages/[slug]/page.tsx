'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronRight, ArrowLeft, ShieldCheck, 
  MessageSquare, FileText, Calendar, Clock,
  AlertTriangle, Video, Banknote, Store, Phone, CheckCircle2, Lock
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { STORE_INFO, getCleanWhatsAppNumber } from '../../../data/storeData';

// Built-in verified showroom policies to ensure instant loading & zero downtime
const BUILTIN_PAGES: Record<string, { title: string; content: string }> = {
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    content: `## 1. Introduction & Showroom Overview
Welcome to **Lapiez IT Showroom** (Opposite G P Plaza, Near Old Bus Stand, Chiniya Road, Garhwa, Jharkhand - 822114). By placing an order online, requesting a showroom estimate, or purchasing products on this platform or at our physical counter, you agree to comply with and be bound by the following official terms and conditions.

## 2. 100% Genuine Hardware & 18% GST Invoicing
All products sold by Lapiez (Laptops, Frontech Monitors, CP-PLUS CCTV kits, Crucial/Kingston SSDs, original adapters, and laptop batteries) are **100% genuine, brand-certified, and showroom verified**. Every transaction includes a valid **CBIC Rule 46 compliant 18% GST Tax Invoice** bearing our legal GSTIN (20AABCL1234F1Z5) which allows legitimate Input Tax Credit (ITC) claims for business accounts.

## 3. Order Processing & Showroom Pickup
* **Showroom Pickup:** Ready within 30 minutes of placing the order. Customers can inspect the hardware live on our Chiniya Road testing bench before handover.
* **Local Delivery:** Orders across Garhwa and Palamu districts are dispatched within 2-4 hours via our local showroom logistics team.
* **Interstate Delivery:** Shipped securely via DTDC, Bluedart, or India Post Express with real-time tracking numbers provided over WhatsApp and SMS.

## 4. Strict Unboxing & Transit Verification Policy
* **Mandatory 360° Unboxing Video:** For all courier-delivered packages, customers MUST record an uncut 360-degree video from the initial outer courier seal opening through device power-on.
* **Zero Damage Claims Without Video:** Any transit damage claim must be reported within 24 hours of delivery accompanied by the uncut unboxing video.

## 5. Testing & Brand Manufacturer Warranty
* **Brand New Hardware:** Carries the official manufacturer warranty (1 to 3 years depending on the brand: Frontech, HP, Dell, CP-PLUS, Crucial, Kingston).
* **Certified Refurbished Hardware:** Includes a **7-day unconditional testing warranty** and up to **1-year local service warranty support** directly at our Garhwa tech laboratory.
* **Warranty Void Conditions:** Physical breakage, liquid spillage, burned ICs, electrical surges, or tampering with showroom warranty stickers will void warranty coverage.

## 6. Pricing & Transparent Payments
All prices listed on the website include applicable 18% GST unless explicitly stated otherwise. We accept UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking, RTGS/NEFT for wholesale orders, and Cash on Counter for showroom pickups. Zero hidden fees or convenience surcharges.

## 7. Showroom Location & Grievance Redressal
For any inquiries, bill corrections, order tracking, or service lab appointments:
* **Showroom Address:** Opposite G P Plaza, Near Old Bus Stand, Chiniya Road, Garhwa, Jharkhand - 822114
* **Phone / WhatsApp:** +91 9608828288
* **Email:** lapiezofficial@gmail.com`
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    content: `## 1. Information We Collect
We collect necessary customer details to fulfill orders, generate GST tax invoices, and provide warranty support. This includes your Name, Mobile/WhatsApp Number, Delivery Address, Pincode, and optional Business Name / GSTIN.

## 2. Use of Information
Your details are used exclusively for:
* Generating statutory GST bills and order tracking updates.
* WhatsApp notifications regarding order confirmation and dispatch.
* Manufacturer warranty registration and showroom service history.

## 3. Payment Data Security
All payments are processed directly through UPI QR codes or authorized bank transfers. We never store debit/credit card numbers or UPI MPINs on our servers.

## 4. Zero Spam & Data Protection
We respect your privacy. We never sell, trade, or share your contact information with third-party advertisers or telemarketers.`
  },
  'warranty-policy': {
    title: 'Warranty & Replacement Policy',
    content: `## 1. Brand Manufacturer Warranty
All brand-new laptops, monitors, surveillance systems, and accessories carry full manufacturer warranty backed by authorized service centers across India.

## 2. Certified Refurbished Testing Warranty
* 7-day replacement warranty for hardware defects.
* 1-year service labor warranty at our Garhwa showroom tech lab.
* Genuine replacement parts provided at discounted showroom rates.

## 3. How to Claim Warranty
Visit our showroom at Chiniya Road, Garhwa with your original 18% GST invoice, or contact our WhatsApp helpline at +91 9608828288.`
  },
  'about-us': {
    title: 'About Lapiez IT Showroom',
    content: `## Welcome to Lapiez
**Lapiez** is Garhwa's premier IT hardware showroom and authorized computer technology destination, located opposite G P Plaza on Chiniya Road, Garhwa, Jharkhand (822114).

## What We Offer
* Brand-new laptops from HP, Dell, Lenovo, ASUS, and Acer.
* High-performance desktop rigs, AIO PCs, and Frontech FHD monitors.
* Crucial, Kingston & Western Digital NVMe SSDs and high-speed RAM.
* CP-PLUS and Dahua CCTV security surveillance solutions.
* 100% Genuine adapters, batteries, keyboards, and laptop spares.
* Every purchase backed by legal 18% GST Invoicing and local showroom warranty.`
  }
};

export default function DynamicCustomPage() {
  const params = useParams();
  const router = useRouter();
  const rawParam = params?.slug;
  const rawSlug = Array.isArray(rawParam) ? (rawParam[0] || '') : (typeof rawParam === 'string' ? rawParam : '');
  
  // Normalize slug to handle aliases (e.g. terms-conditions -> terms-and-conditions)
  const slug = useMemo(() => {
    const s = decodeURIComponent(rawSlug).toLowerCase().trim();
    if (s === 'terms-conditions' || s === 'terms' || s === 'tnc' || s === 'terms-and-condition' || s === 'terms-and-conditions' || s.includes('term')) {
      return 'terms-and-conditions';
    }
    if (s === 'privacy' || s === 'privacy-policies' || s === 'privacy-policy' || s.includes('privacy')) {
      return 'privacy-policy';
    }
    if (s === 'warranty' || s === 'replacement' || s === 'warranty-policy' || s.includes('warranty')) {
      return 'warranty-policy';
    }
    if (s === 'about' || s === 'about-us' || s.includes('about')) {
      return 'about-us';
    }
    return s;
  }, [rawSlug]);

  const { customPages, siteSettings } = useStore();
  const [remotePage, setRemotePage] = React.useState<any>(null);
  const [isFetchingRemote, setIsFetchingRemote] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!slug) return;
    if (BUILTIN_PAGES[slug]) return; // Builtin already exists, no need to fetch
    setIsFetchingRemote(true);
    fetch(`/api/cms/pages`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (Array.isArray(d?.pages)) {
          const match = d.pages.find((p: any) => p.slug === slug || p.slug === rawSlug);
          if (match) setRemotePage(match);
        }
      })
      .catch(() => null)
      .finally(() => setIsFetchingRemote(false));
  }, [slug, rawSlug]);

  const page = useMemo(() => {
    // 1. Try finding in DB/CMS customPages first
    const fromStore = customPages.find((p) => p.slug === slug || p.slug === rawSlug);
    if (fromStore && fromStore.content) {
      return fromStore;
    }
    if (remotePage && remotePage.content) {
      return remotePage;
    }
    // 2. Fallback to comprehensive built-in page definitions
    if (BUILTIN_PAGES[slug]) {
      return {
        id: `builtin-${slug}`,
        slug,
        title: BUILTIN_PAGES[slug].title,
        content: BUILTIN_PAGES[slug].content,
        status: 'published'
      };
    }
    return null;
  }, [customPages, remotePage, slug, rawSlug]);

  if (!rawSlug || (isFetchingRemote && !page)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6 text-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-gray-500">Loading showroom policy...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-4 border border-blue-100 shadow-xs">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Page Not Located</h1>
        <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
          The requested page &quot;{rawSlug}&quot; could not be located in our system or might have been updated.
        </p>
        <Link
          href="/"
          className="h-10 px-5 rounded-xl bg-[#1A56DB] text-white font-bold text-xs inline-flex items-center gap-2 hover:bg-[#1E40AF] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  // Parse inline markdown bold: **text** -> <strong>text</strong>
  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // High-End Structured Content Renderer
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        elements.push(<div key={`space-${i}`} className="h-2" />);
        continue;
      }

      // H2 Headings
      if (trimmed.startsWith('## ')) {
        const titleText = trimmed.replace(/^##\s+/, '');
        const isAlertHeading = titleText.includes('No Return') || titleText.includes('Refund') || titleText.includes('No COD') || titleText.includes('Unboxing');
        
        elements.push(
          <div key={`h2-${i}`} className="mt-8 mb-4 pt-4 first:mt-2 first:pt-0 border-t border-gray-100 first:border-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`w-2 h-5 rounded-full ${isAlertHeading ? 'bg-rose-600' : 'bg-[#1A56DB]'}`} />
              <h2 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight">
                {titleText}
              </h2>
            </div>
          </div>
        );
        continue;
      }

      // H3 Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm sm:text-base font-bold text-gray-900 mt-5 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A56DB]" />
            <span>{trimmed.replace(/^###\s+/, '')}</span>
          </h3>
        );
        continue;
      }

      // Bullet points
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const bulletText = trimmed.replace(/^[\*\-]\s+/, '');
        const isStrictRule = bulletText.includes('No Return') || bulletText.includes('Strictly') || bulletText.includes('Single-Take') || bulletText.includes('MUST') || bulletText.includes('Important Notice');

        elements.push(
          <div 
            key={`bullet-${i}`} 
            className={`my-2 p-3 sm:p-3.5 rounded-xl border text-xs sm:text-[13.5px] leading-relaxed transition-all ${
              isStrictRule 
                ? 'bg-rose-50/70 border-rose-200/80 text-rose-950 font-medium' 
                : 'bg-white border-gray-200/90 text-gray-700 shadow-2xs hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                isStrictRule ? 'bg-rose-200 text-rose-800' : 'bg-blue-100 text-[#1A56DB]'
              }`}>
                ✓
              </span>
              <div className="flex-1">
                {formatInlineText(bulletText)}
              </div>
            </div>
          </div>
        );
        continue;
      }

      // Regular Paragraphs
      elements.push(
        <p key={`p-${i}`} className="text-xs sm:text-[13.5px] text-gray-700 leading-relaxed mb-3">
          {formatInlineText(trimmed)}
        </p>
      );
    }

    return elements;
  };

  const isTermsOrPolicy = slug.includes('terms') || slug.includes('policy') || slug.includes('return') || slug.includes('warranty');

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 font-medium">
          <Link href="/" className="hover:text-[#1A56DB] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link href="/pages/terms-and-conditions" className="hover:text-[#1A56DB] transition-colors">Store Policies</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-bold text-gray-900 truncate">{page.title}</span>
        </nav>

        {/* Main Clean Document Card */}
        <article className="bg-white border border-[#E2E8F0] rounded-3xl shadow-sm p-6 sm:p-10 space-y-6">
          
          {/* Header (Share and Print buttons removed as requested) */}
          <div className="border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1A56DB] px-3 py-1 rounded-full bg-blue-50 border border-blue-100 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1A56DB]" />
                Official Garhwa Showroom Policy
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Active & Enforced
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
              {page.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 mt-3 pt-3 border-t border-gray-50">
              <span className="flex items-center gap-1.5 font-medium">
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>Showroom: Chiniya Road, Garhwa, Jharkhand (822114)</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>GSTIN: 20AABCL1234F1Z5</span>
              </span>
            </div>
          </div>

          {/* Quick Notice Highlight for Strict Policies */}
          {isTermsOrPolicy && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gradient-to-r from-rose-50/80 via-amber-50/60 to-blue-50/80 border border-rose-200/80 rounded-2xl text-xs">
              <div className="flex items-start gap-2.5 text-rose-950 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block font-black">STRICT NO RETURN / NO REFUND</span>
                  <span className="font-normal text-rose-800 text-[11px]">All hardware sales are final. Zero return, exchange, or refund post-dispatch.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-blue-950 font-bold">
                <Video className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block font-black">MANDATORY 360° UNBOXING VIDEO</span>
                  <span className="font-normal text-blue-800 text-[11px]">Uncut video required from outer seal opening for any damage claim.</span>
                </div>
              </div>
            </div>
          )}

          {/* Formatted Content */}
          <div className="text-gray-800 leading-relaxed space-y-1">
            {renderFormattedContent(page.content)}
          </div>

          {/* Direct WhatsApp Helpline Card */}
          <div className="mt-10 pt-6 border-t border-gray-100 bg-[#F8FAFC] border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                  Need Help or Have Questions About Your Order?
                </h4>
              </div>
              <p className="text-[11.5px] sm:text-xs text-gray-500 leading-relaxed max-w-lg">
                For transit queries, unboxing video submissions, or warranty support, contact our Garhwa showroom team directly on WhatsApp.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent(`Hello Lapiez Garhwa, I have an inquiry regarding: ${page.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap cursor-pointer active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Helpline</span>
              </a>

              <a
                href={`tel:${siteSettings?.phone || STORE_INFO.phone}`}
                className="h-10 px-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors border border-gray-200 shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Call Showroom</span>
              </a>
            </div>
          </div>

        </article>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A56DB] hover:text-[#1E40AF] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        </div>

      </div>
    </div>
  );
}
