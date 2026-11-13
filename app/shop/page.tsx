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
    <ProductCatalog 
      initialCategory={initialCategory} 
      initialSubcategory={initialSubcategory}
      initialSearch={searchParam || ''} 
      initialBrand={brandParam || 'All'}
    />
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
