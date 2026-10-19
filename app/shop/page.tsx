'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCatalog } from '../../components/ProductCatalog';

function ShopContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  const subcatParam = searchParams.get('subcat');
  const searchParam = searchParams.get('search');
  const brandParam = searchParams.get('brand');
  const initialCategory = catParam || 'All';
  const initialSubcategory = subcatParam || 'All';

  return (
    <div className="py-6 sm:py-8 bg-[#F1F3F6]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
              {brandParam ? `${brandParam} Products` : searchParam ? `Search: "${searchParam}"` : initialSubcategory !== 'All' ? `${initialSubcategory} Collection` : initialCategory === 'All' ? 'Complete Technology Catalog' : `${initialCategory} Collection`}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {brandParam
                ? `Certified authentic ${brandParam} hardware & accessories with 100% brand warranty in Garhwa.`
                : searchParam
                ? `Search results for "${searchParam}" across verified Garhwa showroom inventory.`
                : initialSubcategory !== 'All'
                ? `Handpicked ${initialSubcategory} hardware & accessories in stock at Chiniya Road showroom.`
                : initialCategory !== 'All'
                ? `Original ${initialCategory} inventory with official warranty & 18% GST invoice.`
                : 'Certified authentic hardware & accessories available for same-day delivery in Garhwa or showroom pickup.'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D] bg-green-50 border border-green-200 px-3 py-1 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse"></span>
            <span>In Stock at Chiniya Road, Garhwa</span>
          </div>
        </div>
      </div>
      <ProductCatalog 
        initialCategory={initialCategory} 
        initialSubcategory={initialSubcategory}
        initialSearch={searchParam || ''} 
        initialBrand={brandParam || 'All'}
      />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A56DB]"></div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
