'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, ShoppingBag, AlertTriangle } from 'lucide-react';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { STORE_INFO, getCleanWhatsAppNumber } from '../data/storeData';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client error to console
    console.error('App Router Caught Error:', error);
  }, [error]);

  const handleWhatsApp = () => {
    const waNumber = getCleanWhatsAppNumber(STORE_INFO.whatsapp);
    const text = `Hello Lapiez Support, I encountered a temporary error on the store:\n"${error?.message || 'Error loading page'}"\nPlease assist.`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-8 text-center animate-in fade-in duration-200">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2">
          Something went wrong
        </h2>

        <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
          The requested product or catalog view encountered a temporary glitch. You can reload this view or return to our live showroom inventory.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => reset()}
            className="w-full h-11 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload This Page</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back Home</span>
            </Link>

            <Link
              href="/shop"
              className="h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1A56DB] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-200"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Browse Shop</span>
            </Link>
          </div>

          <button
            onClick={handleWhatsApp}
            className="w-full h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>Contact Garhwa Helpdesk</span>
          </button>
        </div>

        {error?.digest && (
          <p className="mt-4 text-[10px] font-mono text-gray-400">
            Error Ref: {error.digest}
          </p>
        )}

      </div>
    </div>
  );
}
