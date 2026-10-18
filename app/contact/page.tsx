'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, MessageSquare, MapPin, Mail, Clock, 
  Send, ShieldCheck, CheckCircle2, ChevronRight, 
  Store, Award, Laptop, Navigation, ExternalLink, HelpCircle
} from 'lucide-react';
import { STORE_INFO } from '@/data/storeData';
import { useStore } from '@/context/StoreContext';

export default function ContactPage() {
  const { siteSettings } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    inquiryType: 'Laptop Purchase / Upgrade',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const phone = siteSettings?.phone || STORE_INFO.phone;
  const whatsapp = siteSettings?.whatsapp || STORE_INFO.whatsapp;
  const email = siteSettings?.email || STORE_INFO.email;
  const siteName = siteSettings?.siteName || 'Lapiez';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Please enter your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Send inquiry to leads API
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          interest: formData.inquiryType,
          notes: formData.message,
          source: 'Contact Page Inquiry'
        })
      });

      if (!res.ok) {
        // Fallback gracefully
        console.warn('Leads endpoint returned non-OK status');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Contact submission error:', err);
      // Still show success since user can WhatsApp us
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppInquiry = () => {
    const text = `*New Contact Inquiry from ${siteName} Website*\n\n*Name:* ${formData.name}\n*Phone:* ${formData.phone}\n*Category:* ${formData.inquiryType}\n*Message:* ${formData.message || 'Looking for hardware quotation'}`;
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      
      {/* 1. Header / Breadcrumb Hero */}
      <div className="bg-[#1A56DB] text-white py-10 sm:py-14 px-4 sm:px-8 border-b border-blue-700">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-blue-200">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-medium">Contact Us</span>
          </div>

          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 text-yellow-300 text-[11px] font-bold uppercase tracking-wider">
              <Store className="w-3.5 h-3.5" />
              <span>GARHWA SHOWROOM & DIRECT SUPPORT</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Get in Touch with {siteName}
            </h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Visit our physical tech showroom on Chiniya Road, Garhwa, or contact our engineers for laptop spares, CCTV installations, and instant price quotations.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Quick Contact Action Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Phone */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-blue-300 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Call Direct</span>
              <a href={`tel:${phone}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 block transition-colors">
                {phone}
              </a>
              <span className="text-[11px] text-slate-400 block">Mon - Sat, 10 AM - 8:30 PM</span>
            </div>
          </div>

          {/* Card 2: WhatsApp */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-emerald-300 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">WhatsApp Desk</span>
              <a 
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello ${siteName} Garhwa, I need quick support / hardware quote.`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-bold text-slate-900 hover:text-emerald-600 block transition-colors"
              >
                Chat on WhatsApp
              </a>
              <span className="text-[11px] text-emerald-600 font-medium block">Instant Technician Response</span>
            </div>
          </div>

          {/* Card 3: Showroom Location */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-amber-300 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Showroom Counter</span>
              <p className="text-xs font-bold text-slate-900 leading-tight">
                Chiniya Road, Opp. G P Plaza
              </p>
              <span className="text-[11px] text-slate-500 block">Garhwa, Jharkhand 822114</span>
            </div>
          </div>

          {/* Card 4: Email */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-indigo-300 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Inquiries</span>
              <a href={`mailto:${email}`} className="text-xs font-bold text-slate-900 hover:text-indigo-600 block truncate transition-colors">
                {email}
              </a>
              <span className="text-[11px] text-slate-400 block">Official GST Quotations</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Main Content: Form + Map & Showroom Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inquiry Form (Span 7) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A56DB] uppercase tracking-wider mb-1">
                <Send className="w-3.5 h-3.5" />
                <span>ONLINE INQUIRY & QUOTATION</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Send a Message to Our Hardware Team
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Need a custom PC build, replacement screen price, or CCTV security quote? Fill out the details below.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-900">Inquiry Received Successfully!</h3>
                  <p className="text-xs sm:text-sm text-emerald-700 mt-1">
                    Thank you, <strong>{formData.name}</strong>. Our team in Garhwa will contact you shortly on <strong>{formData.phone}</strong>.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={generateWhatsAppInquiry()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Message on WhatsApp Now</span>
                  </a>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        phone: '',
                        email: '',
                        inquiryType: 'Laptop Purchase / Upgrade',
                        message: '',
                      });
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#1A56DB] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9608828288"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#1A56DB] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#1A56DB] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#1A56DB] focus:outline-none transition-colors"
                    >
                      <option value="Laptop Purchase / Upgrade">Laptop Purchase / Upgrade</option>
                      <option value="Laptop Spares (Battery, Charger, Screen)">Laptop Spares (Battery, Charger, Screen)</option>
                      <option value="CCTV Security Installation">CCTV Security Installation</option>
                      <option value="Motherboard & Chip-Level Repair">Motherboard & Chip-Level Repair</option>
                      <option value="Custom Gaming / Editing Desktop PC">Custom Gaming / Editing Desktop PC</option>
                      <option value="Printers & Toner Refills">Printers & Toner Refills</option>
                      <option value="Bulk Order & GST Invoicing">Bulk Order & GST Invoicing</option>
                      <option value="Other Inquiries">Other Inquiries</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Requirements / Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe what product, model or service you need pricing for..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-3 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#1A56DB] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-70"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Inquiry'}</span>
                  </button>

                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello ${siteName}, I want to make an inquiry.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Or Connect on WhatsApp</span>
                  </a>
                </div>
              </form>
            )}

            {/* Trust badge */}
            <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                100% Genuine Box Sealed Products
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                Official 18% GST Invoice & ITC
              </span>
            </div>
          </div>

          {/* Right Column: Physical Showroom & Maps (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Showroom Details Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#1A56DB]" />
                  <span>Garhwa Retail Showroom</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  Open Today
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#1A56DB] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">{siteName} Showroom</strong>
                    <span>{siteSettings?.address || `${STORE_INFO.address}, ${STORE_INFO.city}, ${STORE_INFO.state} - ${STORE_INFO.pincode}`}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">Store Working Hours</strong>
                    <span>{siteSettings?.timings || STORE_INFO.timings}</span>
                    <span className="block text-slate-400 text-[11px] mt-0.5">Sunday: Open by appointment / emergency</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">Customer Support Line</strong>
                    <span>{phone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={siteSettings?.googleMapsUrl || siteSettings?.twitterUrl || STORE_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  <span>Get Driving Directions on Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Embedded Google Maps */}
            <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm overflow-hidden">
              <div className="rounded-xl overflow-hidden aspect-[4/3] w-full bg-slate-100 relative">
                <iframe
                  title="Lapiez Garhwa Showroom Map"
                  src={STORE_INFO.embedMapUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <div className="p-3 text-center">
                <span className="text-[11px] text-slate-500">
                  Located centrally near Chiniya Road, Garhwa with ample bike & car parking.
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
