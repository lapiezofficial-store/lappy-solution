'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCatalog } from '../../components/ProductCatalog';

function ShopContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat') || searchParams.get('category');
  const subcatParam = searchParams.get('subcat') || searchParams.get('sub');
  const searchParam = searchParams.get('search');
  const brandParam = searchParams.get('brand');
  const initialCategory = catParam || 'All';
  const initialSubcategory = subcatParam || 'All';

  return (
    <div className="py-6 sm:py-8 bg-[#F1F3F6]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
            {brandParam ? `${brandParam} Products` : searchParam ? `Search: "${searchParam}"` : initialSubcategory !== 'All' ? `${initialSubcategory}` : initialCategory === 'All' ? 'All Products' : `${initialCategory}`}
          </h1>
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
