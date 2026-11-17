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
  const { cart, isCartOpen, setIsCartOpen, customer } = useStore();

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
  const isSearchActive = (pathname === '/shop' && !pathname.includes('cat')) || pathname.startsWith('/product');
  const isCategoriesActive = pathname.startsWith('/shop') && (pathname.includes('cat') || pathname.includes('category'));
  const isAccountActive = pathname.startsWith('/account');
  const isCartActive = isCartOpen;

  return (
    <div className="md:hidden fixed bottom-3 inset-x-3.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[390px] z-40 pointer-events-none">
      <nav 
        aria-label="iPhone Dynamic Island Navigation"
        className="pointer-events-auto bg-white/94 backdrop-blur-2xl border border-slate-200/90 rounded-full px-2 py-1.5 flex items-center justify-between shadow-[0_14px_38px_-6px_rgba(15,23,42,0.22),0_4px_14px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5 transition-all duration-300"
      >
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
            isHomeActive
              ? 'bg-[#0F172A] text-white shadow-sm rounded-full px-3.5 py-1.5 gap-1.5 font-bold'
              : 'text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100/70'
          }`}
          title="Home"
        >
          <Home className={`w-4 h-4 ${isHomeActive ? 'text-white stroke-[2.2]' : 'text-slate-600 stroke-[1.8]'}`} />
          {isHomeActive && (
            <span className="text-[11.5px] tracking-tight leading-none animate-in fade-in zoom-in-95 duration-200">
              Home
            </span>
          )}
        </Link>

        {/* 2. Search / Shop */}
        <button
          type="button"
          onClick={handleSearchClick}
          className={`flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
            isSearchActive
              ? 'bg-[#0F172A] text-white shadow-sm rounded-full px-3.5 py-1.5 gap-1.5 font-bold'
              : 'text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100/70'
          }`}
          title="Search Catalog"
        >
          <Search className={`w-4 h-4 ${isSearchActive ? 'text-white stroke-[2.2]' : 'text-slate-600 stroke-[1.8]'}`} />
          {isSearchActive && (
            <span className="text-[11.5px] tracking-tight leading-none animate-in fade-in zoom-in-95 duration-200">
              Search
            </span>
          )}
        </button>

        {/* 3. Categories */}
        <Link
          href="/shop"
          className={`flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
            isCategoriesActive
              ? 'bg-[#0F172A] text-white shadow-sm rounded-full px-3.5 py-1.5 gap-1.5 font-bold'
              : 'text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100/70'
          }`}
          title="All Categories"
        >
          <LayoutGrid className={`w-4 h-4 ${isCategoriesActive ? 'text-white stroke-[2.2]' : 'text-slate-600 stroke-[1.8]'}`} />
          {isCategoriesActive && (
            <span className="text-[11.5px] tracking-tight leading-none animate-in fade-in zoom-in-95 duration-200">
              Categories
            </span>
          )}
        </Link>

        {/* 4. Cart */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className={`flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
            isCartActive
              ? 'bg-[#0F172A] text-white shadow-sm rounded-full px-3.5 py-1.5 gap-1.5 font-bold'
              : 'text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100/70'
          }`}
          title="Shopping Cart"
          aria-label="Shopping Cart"
        >
          <div className="relative flex items-center justify-center">
            <ShoppingCart className={`w-4 h-4 ${isCartActive ? 'text-white stroke-[2.2]' : 'text-slate-600 stroke-[1.8]'}`} />
            {cartCount > 0 && !isCartActive && (
              <span className="absolute -top-1.5 -right-2 bg-[#1A56DB] text-white text-[8.5px] font-black min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-xs ring-1 ring-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          {isCartActive && (
            <span className="text-[11.5px] tracking-tight leading-none animate-in fade-in zoom-in-95 duration-200">
              Cart ({cartCount})
            </span>
          )}
        </button>

        {/* 5. Account */}
        <Link
          href="/account"
          className={`flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
            isAccountActive
              ? 'bg-[#0F172A] text-white shadow-sm rounded-full px-3.5 py-1.5 gap-1.5 font-bold'
              : 'text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100/70'
          }`}
          title="Customer Account"
        >
          {customer?.user_metadata?.avatar_url ? (
            <img 
              src={customer.user_metadata.avatar_url} 
              alt="Account" 
              className="w-4 h-4 rounded-full object-cover border border-slate-300" 
            />
          ) : (
            <User className={`w-4 h-4 ${isAccountActive ? 'text-white stroke-[2.2]' : 'text-slate-600 stroke-[1.8]'}`} />
          )}
          {isAccountActive && (
            <span className="text-[11.5px] tracking-tight leading-none animate-in fade-in zoom-in-95 duration-200">
              Account
            </span>
          )}
        </Link>
      </nav>
    </div>
  );
};
