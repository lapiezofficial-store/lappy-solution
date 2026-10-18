'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Search, LayoutGrid, ShoppingCart, User
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, setIsCartOpen, customer } = useStore();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchClick = () => {
    // If on homepage or shop, smoothly scroll to top and focus mobile search input
    const searchInput = document.getElementById('mobile-header-search-input') as HTMLInputElement | null;
    if (searchInput) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        searchInput.focus();
      }, 150);
    } else {
      router.push('/shop?focus=search');
    }
  };

  const isHomeActive = pathname === '/';
  const isSearchActive = pathname === '/shop' && !pathname.includes('cat');
  const isCategoriesActive = pathname.startsWith('/shop') && (pathname.includes('cat') || pathname.includes('category'));
  const isAccountActive = pathname.startsWith('/account');

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-[#E5E7EB] px-1 py-1.5 flex items-center justify-around shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
    >
      {/* 1. Home */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all active:scale-95 ${
          isHomeActive
            ? 'text-[#EA580C] font-extrabold'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        </div>
        <span className={`text-[10px] mt-0.5 tracking-tight ${isHomeActive ? 'font-bold' : 'font-medium'}`}>
          Home
        </span>
      </Link>

      {/* 2. Search */}
      <button
        type="button"
        onClick={handleSearchClick}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all active:scale-95 cursor-pointer ${
          isSearchActive
            ? 'text-[#EA580C] font-extrabold'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Search className={`w-5 h-5 ${isSearchActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        </div>
        <span className={`text-[10px] mt-0.5 tracking-tight ${isSearchActive ? 'font-bold' : 'font-medium'}`}>
          Search
        </span>
      </button>

      {/* 3. Categories */}
      <Link
        href="/shop"
        className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all active:scale-95 ${
          isCategoriesActive
            ? 'text-[#EA580C] font-extrabold'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <LayoutGrid className={`w-5 h-5 ${isCategoriesActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        </div>
        <span className={`text-[10px] mt-0.5 tracking-tight ${isCategoriesActive ? 'font-bold' : 'font-medium'}`}>
          Categories
        </span>
      </Link>

      {/* 4. Cart */}
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center justify-center flex-1 py-1 text-center transition-all active:scale-95 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
        aria-label="View Shopping Cart"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 stroke-[1.8]" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-[#EA580C] text-white text-[9px] font-extrabold min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-[#64748B] mt-0.5 tracking-tight">
          Cart
        </span>
      </button>

      {/* 5. Account / Customer */}
      <Link
        href="/account"
        className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all active:scale-95 ${
          isAccountActive
            ? 'text-[#EA580C] font-extrabold'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          {customer?.user_metadata?.avatar_url ? (
            <img 
              src={customer.user_metadata.avatar_url} 
              alt="Account" 
              className="w-5 h-5 rounded-full object-cover border border-gray-300" 
            />
          ) : (
            <User className={`w-5 h-5 ${isAccountActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          )}
        </div>
        <span className={`text-[10px] mt-0.5 tracking-tight ${isAccountActive ? 'font-bold' : 'font-medium'}`}>
          Account
        </span>
      </Link>
    </nav>
  );
};
