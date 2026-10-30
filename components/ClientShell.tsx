'use client';

import React from 'react';
import { StoreProvider, useStore } from '../context/StoreContext';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { ProductDetailModal } from './ProductDetailModal';
import { CustomerAccountModal } from './CustomerAccountModal';
import { CustomerAuthModal } from './CustomerAuthModal';
import { MobileBottomNav } from './MobileBottomNav';
import { AppDownloadModal } from './AppDownloadModal';
import { CheckCircle2 } from 'lucide-react';

import { usePathname } from 'next/navigation';

const ToastNotification: React.FC = () => {
  const { toast } = useStore();
  if (!toast) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-6 sm:bottom-24 z-50 bg-white text-slate-900 px-5 py-3 rounded-2xl shadow-xl border border-slate-200 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-4 duration-200">
      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <span>{toast}</span>
    </div>
  );
};

const AppDownloadModalContainer: React.FC = () => {
  const { isAppModalOpen, setIsAppModalOpen } = useStore();
  return <AppDownloadModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />;
};

const DynamicHeadSync: React.FC = () => {
  const { siteSettings } = useStore();

  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const targetFavicon = siteSettings?.favicon && siteSettings.favicon.trim() !== ''
      ? siteSettings.favicon
      : '/icon.svg';

    const links = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    if (links.length > 0) {
      links.forEach((l) => {
        l.href = targetFavicon;
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = targetFavicon;
      document.head.appendChild(link);
    }
  }, [siteSettings?.favicon]);

  return null;
};

export const ClientShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isInvoicePage = pathname?.startsWith('/invoice');
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/portal-access') || pathname?.startsWith('/staff');

  // For Admin Portal and Invoice pages, render pure standalone screen without customer website headers or footers
  if (isInvoicePage || isAdminPage) {
    return (
      <StoreProvider>
        <DynamicHeadSync />
        <div className="min-h-screen bg-[#F1F3F6] print:bg-white">
          {children}
          <ToastNotification />
        </div>
      </StoreProvider>
    );
  }

  return (
    <StoreProvider>
      <DynamicHeadSync />
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        {/* Global Sticky Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>

        {/* Global Footer */}
        <Footer />

        {/* Mobile Fixed Bottom Navigation Bar (Phone Optimized) */}
        <MobileBottomNav />

        {/* Global Modals & Drawers */}
        <CartDrawer />
        <ProductDetailModal />
        <CustomerAccountModal />
        <CustomerAuthModal />
        <AppDownloadModalContainer />
        <ToastNotification />
      </div>
    </StoreProvider>
  );
};

