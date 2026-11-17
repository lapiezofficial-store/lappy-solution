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

  // Don't render on checkout page to avoid clutter during sensitive payment flow
  if (pathname === '/checkout') return null;

  return (
    <aside 
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-2.5 inset-x-0 z-40 flex justify-center px-3 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}
    >
      <nav 
        className="pointer-events-auto w-full max-w-sm bg-slate-950/92 dark:bg-black/95 text-white backdrop-blur-2xl border border-white/12 shadow-[0_14px_40px_rgba(0,0,0,0.45)] rounded-full px-2 py-1.5 flex items-center justify-between gap-1 transition-all duration-200"
      >
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all duration-200 active:scale-95 ${
            isHomeActive
              ? 'bg-white/15 text-white font-extrabold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className={`w-4 h-4 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[9.5px] mt-0.5 tracking-tight font-medium leading-tight">
            Home
          </span>
        </Link>

        {/* 2. Search */}
        <button
          type="button"
          onClick={handleSearchClick}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
            isSearchActive
              ? 'bg-white/15 text-white font-extrabold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className={`w-4 h-4 ${isSearchActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[9.5px] mt-0.5 tracking-tight font-medium leading-tight">
            Search
          </span>
        </button>

        {/* 3. Categories */}
        <Link
          href="/shop"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all duration-200 active:scale-95 ${
            isCategoriesActive
              ? 'bg-white/15 text-white font-extrabold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutGrid className={`w-4 h-4 ${isCategoriesActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[9.5px] mt-0.5 tracking-tight font-medium leading-tight">
            Categories
          </span>
        </Link>

        {/* 4. Cart */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all duration-200 active:scale-95 text-slate-400 hover:text-white cursor-pointer relative"
          aria-label="View Shopping Cart"
        >
          <div className="relative">
            <ShoppingCart className="w-4 h-4 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-orange-500 text-white text-[8.5px] font-black min-w-3.5 h-3.5 px-1 rounded-full flex items-center justify-center shadow-xs">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[9.5px] mt-0.5 tracking-tight font-medium leading-tight">
            Cart
          </span>
        </button>

        {/* 5. Account */}
        <Link
          href="/account"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-full transition-all duration-200 active:scale-95 ${
            isAccountActive
              ? 'bg-white/15 text-white font-extrabold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {customer?.user_metadata?.avatar_url ? (
            <img 
              src={customer.user_metadata.avatar_url} 
              alt="Account" 
              className="w-4 h-4 rounded-full object-cover border border-white/40" 
            />
          ) : (
            <User className={`w-4 h-4 ${isAccountActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          )}
          <span className="text-[9.5px] mt-0.5 tracking-tight font-medium leading-tight">
            Account
          </span>
        </Link>
      </nav>
    </aside>
  );
};
