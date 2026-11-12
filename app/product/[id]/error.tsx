'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ShoppingBag, ArrowLeft, AlertCircle } from 'lucide-react';
import { WhatsAppIcon } from '../../../components/WhatsAppIcon';
import { STORE_INFO, getCleanWhatsAppNumber } from '../../../data/storeData';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Product Page Error:', error);
  }, [error]);

  const handleWhatsApp = () => {
    const waNumber = getCleanWhatsAppNumber(STORE_INFO.whatsapp);
    const text = `Hello Lapiez Support, I encountered an issue viewing a product:\n"${error?.message || 'Product failed to load'}"\nPlease help me find this item.`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-8 text-center animate-in fade-in duration-200">
        
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
          Unable to Load Product
        </h2>

        <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
          The requested hardware product details couldn't be displayed. It may have been archived or is undergoing inventory sync.
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => reset()}
            className="w-full h-11 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/shop"
            className="w-full h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Full Catalog</span>
          </Link>

          <button
            onClick={handleWhatsApp}
            className="w-full h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>Inquire on WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
}
