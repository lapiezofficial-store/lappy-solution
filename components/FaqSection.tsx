'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  HelpCircle, ChevronDown, ChevronUp, Search, 
  MessageSquare, ShieldCheck, CheckCircle2, Phone, Sparkles 
} from 'lucide-react';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';
import { useStore } from '../context/StoreContext';

export interface FAQItem {
  id: string;
  category: 'general' | 'warranty' | 'refurbished' | 'billing' | 'delivery' | 'cctv';
  question: string;
  questionHindi?: string;
  answer: string;
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'billing',
    question: 'Do you provide 18% GST Invoices with ITC for all products?',
    questionHindi: 'क्या सभी प्रोडक्ट्स पर 18% GST बिल और ITC मिलता है?',
    answer: 'Yes, 100%! Every purchase from Lapiez Garhwa comes with an official computer-generated 18% GST Tax Invoice mentioning valid HSN codes, product serial numbers, and store GSTIN (20AABCL1234F1Z5). Business buyers can provide their GSTIN during checkout to claim full Input Tax Credit (ITC).'
  },
  {
    id: 'faq-2',
    category: 'refurbished',
    question: 'How are Certified Refurbished laptops tested before handover?',
    questionHindi: 'सर्टिफाइड रीफर्बिश्ड लैपटॉप्स की टेस्टिंग कैसे की जाती है?',
    answer: 'Every refurbished laptop undergoes our strict 24-Point Hardware Diagnostic check: Motherboard thermal stress testing, battery health check (minimum 80%+ capacity), NVMe SSD health & speed test, FHD IPS panel dead-pixel inspection, all ports (USB, HDMI, Type-C), webcam, mic, and keyboard key testing.'
  },
  {
    id: 'faq-3',
    category: 'warranty',
    question: 'What warranty is provided on Brand New vs Refurbished laptops?',
    questionHindi: 'ब्रांड न्यू और रीफर्बिश्ड लैपटॉप्स पर क्या वारंटी मिलती है?',
    answer: 'Brand New Laptops (HP, Dell, Lenovo, Asus, Acer) come with 1-Year Official All-India On-Site Manufacturer Warranty valid across India. Certified Refurbished laptops include a 3 to 6-Month Lapiez Showroom Testing & Replacement Warranty for complete peace of mind.'
  },
  {
    id: 'faq-4',
    category: 'delivery',
    question: 'How fast is delivery across Garhwa and Palamu?',
    questionHindi: 'गढ़वा और पलामू में डिलीवरी कितने समय में होती है?',
    answer: 'We provide Free Same-Day Hand-Delivery within Garhwa city (Chiniya Road, Bus Stand, Ranka Road, Majhiaon). For Palamu, Daltonganj, and neighboring districts, orders are dispatched with express courier or local transport reaching within 24 to 48 hours.'
  },
  {
    id: 'faq-5',
    category: 'general',
    question: 'Which payment methods are accepted at the store and online?',
    questionHindi: 'दुकान और ऑनलाइन पर पेमेंट के कौन-से तरीके उपलब्ध हैं?',
    answer: 'We accept all standard payment modes: Instant UPI QR Code (PhonePe, Google Pay, Paytm, BHIM), Cash at Showroom Counter, Net Banking (IMPS/NEFT/RTGS), and Debit/Credit Cards. Cash on Delivery (COD) is also available for local deliveries.'
  },
  {
    id: 'faq-6',
    category: 'cctv',
    question: 'Do you provide CCTV camera installation and mobile view setup?',
    questionHindi: 'क्या आप CCTV कैमरा इंस्टालेशन और मोबाइल व्यू सेटअप करते हैं?',
    answer: 'Yes! We supply CP-PLUS, Hikvision, Dahua, and EZVIZ HD and IP cameras, 4/8/16 channel DVRs/NVRs, and surveillance hard disks. Our certified technicians handle on-site cabling, camera mounting, and mobile app configuration for 24/7 live viewing.'
  },
  {
    id: 'faq-7',
    category: 'general',
    question: 'Can I upgrade my old laptop RAM or SSD at your showroom?',
    questionHindi: 'क्या मैं अपने पुराने लैपटॉप का RAM या SSD अपग्रेड करवा सकता हूँ?',
    answer: 'Absolutely! We stock high-speed M.2 NVMe SSDs (Kingston, Crucial, WD) and DDR4/DDR5 RAM. Bring your laptop to our Chiniya Road showroom for instant same-day upgrade, Windows OS migration, and thermal paste servicing.'
  },
  {
    id: 'faq-8',
    category: 'delivery',
    question: 'Where is the Lapiez physical showroom located in Garhwa?',
    questionHindi: 'लापिएज़ का फिजिकल शोरूम गढ़वा में कहाँ स्थित है?',
    answer: 'Our main showroom is centrally located: In front of G P Plaza, Chiniya Road, Garhwa, Jharkhand - 822114. We are open Monday to Saturday, 10:00 AM to 8:30 PM. You can contact us anytime at +91 9608828288.'
  }
];

export const FaqSection: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { siteSettings } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'faq-1': true, // Keep first open by default
    'faq-2': true,
  });

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'refurbished', label: 'Refurbished Laptops' },
    { id: 'billing', label: '18% GST Billing' },
    { id: 'warranty', label: 'Warranty & Testing' },
    { id: 'delivery', label: 'Delivery in Garhwa' },
    { id: 'cctv', label: 'CCTV Security' },
  ];

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery.trim() || 
        item.question.toLowerCase().includes(q) ||
        (item.questionHindi && item.questionHindi.toLowerCase().includes(q)) ||
        item.answer.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section id="faq" className="w-full py-8 sm:py-12 bg-gradient-to-b from-gray-50/50 to-white border-t border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Frequently Asked Questions
          </h2>

          {/* Search Bar */}
          <div className="mt-5 relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search warranty, GST bill, refurbished, delivery..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A56DB] shadow-xs transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap mt-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#1A56DB] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = Boolean(openIds[faq.id]);
              return (
                <div
                  key={faq.id}
                  className="bg-white border border-gray-200 hover:border-blue-200 rounded-2xl overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-snug">
                        {faq.question}
                      </h3>
                      {faq.questionHindi && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {faq.questionHindi}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center mt-0.5">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-blue-50/20">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">No questions found matching your search.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="mt-2 text-xs text-[#1A56DB] font-bold underline"
              >
                Reset search filter
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp & Call Helpdesk Box */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0A1633] text-white rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-white">
                Have a specific question not answered here?
              </h4>
              <p className="text-xs text-blue-200 mt-0.5">
                Our Garhwa showroom specialists are live to help with hardware, quotes, and repairs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={`https://wa.me/${getCleanWhatsAppNumber(siteSettings?.whatsapp)}?text=${encodeURIComponent('Hello Lapiez Garhwa, I have a question regarding laptops and store services.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask on WhatsApp</span>
            </a>

            <a
              href={`tel:${siteSettings?.phone || STORE_INFO.phone}`}
              className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-yellow-300" />
              <span>Call Showroom</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
