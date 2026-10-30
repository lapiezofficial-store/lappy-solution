'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package, ShoppingBag, Truck, CheckCircle2, Clock, Phone,
  MessageSquare, Search, RefreshCw, Printer, User, Store,
  ShieldCheck, AlertCircle, ArrowRight, Check, X, Key,
  Lock, ArrowDownLeft, ArrowUpRight, ChevronRight, Eye,
  Calendar, MapPin, DollarSign, ExternalLink, Sparkles, Filter
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface StaffOrder {
  id: string;
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  items: Array<{
    id?: string;
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  subtotalAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  utrNumber?: string;
  date: string;
  createdAt: string;
  handedOverBy?: string;
  isStorePickup?: boolean;
  rider?: {
    id: string;
    name: string;
    phone: string;
    riderCode?: string;
  } | null;
}

export default function StaffPage() {
  const router = useRouter();
  const { siteSettings, showToast } = useStore();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [staffPin, setStaffPin] = useState('');
  const [staffNameInput, setStaffNameInput] = useState('');
  const [currentStaffName, setCurrentStaffName] = useState('Staff Desk');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    todayTotal: 0,
    aayaCount: 0,
    gyaCount: 0,
    cancelledCount: 0,
  });
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Active View Tab: 'aaya' (Incoming) | 'gya' (Outgoing) | 'search' | 'all'
  const [activeTab, setActiveTab] = useState<'aaya' | 'gya' | 'search' | 'all'>('aaya');
  const [filterType, setFilterType] = useState<'all' | 'pickup' | 'delivery' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handover Modal State
  const [handoverModalOrder, setHandoverModalOrder] = useState<StaffOrder | null>(null);
  const [handoverStaffName, setHandoverStaffName] = useState('');
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  // Check existing session
  useEffect(() => {
    fetch('/api/staff/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setCurrentStaffName(data.staffName || 'Showroom Staff');
          setHandoverStaffName(data.staffName || 'Showroom Staff');
        }
      })
      .catch(() => {})
      .finally(() => setIsCheckingAuth(false));
  }, []);

  // Fetch orders when authenticated
  const fetchStaffOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/staff/orders');
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
        if (data.metrics) setMetrics(data.metrics);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch {
      showToast('Network error loading orders.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStaffOrders();
      // Auto-refresh every 20 seconds for showroom live order counter
      const interval = setInterval(fetchStaffOrders, 20000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffPin.trim()) {
      setAuthError('Please enter Staff PIN');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');

    try {
      const res = await fetch('/api/staff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: staffPin.trim(),
          staffName: staffNameInput.trim() || 'Showroom Staff',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        const name = data.staffName || 'Showroom Staff';
        setCurrentStaffName(name);
        setHandoverStaffName(name);
        showToast(`Welcome ${name}! Terminal unlocked.`);
      } else {
        setAuthError(data.error || 'Invalid Staff PIN');
      }
    } catch {
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/staff/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setStaffPin('');
    showToast('Staff desk locked.');
  };

  // Quick Status Update
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string, staff?: string) => {
    try {
      const res = await fetch('/api/staff/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderStatus: nextStatus,
          staffName: staff || currentStaffName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Order #${orderId} marked as ${nextStatus}!`);
        fetchStaffOrders();
      } else {
        showToast(data.error || 'Failed to update order');
      }
    } catch {
      showToast('Network error updating order.');
    }
  };

  // Submit Handover to Customer
  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverModalOrder) return;

    const staff = handoverStaffName.trim() || currentStaffName;
    setIsSubmittingHandover(true);

    try {
      const res = await fetch('/api/staff/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: handoverModalOrder.orderId,
          orderStatus: 'Delivered',
          paymentStatus: 'Paid',
          staffName: staff,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Order #${handoverModalOrder.orderId} handed over by ${staff}!`);
        setHandoverModalOrder(null);
        fetchStaffOrders();
      } else {
        showToast(data.error || 'Failed to record handover');
      }
    } catch {
      showToast('Error recording handover');
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  // WhatsApp Customer Helpers
  const sendWhatsAppReadyMessage = (order: StaffOrder) => {
    const text = encodeURIComponent(
      `*LAPIEZ GARHWA - ORDER READY FOR PICKUP*\n\n` +
      `Namaste *${order.customerName}* ji,\n` +
      `Aapka order *#${order.orderId}* pack ho gaya hai aur showroom counter pe pickup ke liye ready hai!\n\n` +
      `📦 Items: ${order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}\n` +
      `💰 Total Amount: ₹${order.totalAmount.toLocaleString('en-IN')}\n` +
      `📍 Showroom Address: In front of G P Plaza, Chiniya Road, Garhwa\n` +
      `⏰ Timings: 10:00 AM - 8:30 PM\n\n` +
      `Shukriya!\nLapiez Team Garhwa`
    );
    window.open(`https://wa.me/91${order.phone.replace(/\D/g, '').slice(-10)}?text=${text}`, '_blank');
  };

  const sendWhatsAppDispatchMessage = (order: StaffOrder) => {
    const text = encodeURIComponent(
      `*LAPIEZ GARHWA - ORDER DISPATCHED*\n\n` +
      `Namaste *${order.customerName}* ji,\n` +
      `Aapka order *#${order.orderId}* delivery rider ko de diya gaya hai aur aapke address pe nikal chuka hai!\n\n` +
      (order.rider ? `🛵 Rider Name: ${order.rider.name} (${order.rider.phone})\n` : '') +
      `💰 Payable Amount: ₹${order.totalAmount.toLocaleString('en-IN')} (${order.paymentStatus})\n\n` +
      `Kisi bhi sahayata ke liye call karein: +91 9608828288\n` +
      `Lapiez Team Garhwa`
    );
    window.open(`https://wa.me/91${order.phone.replace(/\D/g, '').slice(-10)}?text=${text}`, '_blank');
  };

  // Filtered Orders Calculation
  const displayedOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab filter
      if (activeTab === 'aaya') {
        const isAaya = ['Confirmed', 'Packed', 'Ready', 'Ready for Pickup'].includes(o.orderStatus) && o.orderStatus !== 'Cancelled';
        if (!isAaya) return false;
      } else if (activeTab === 'gya') {
        const isGya = ['Out For Delivery', 'Delivered'].includes(o.orderStatus) && o.orderStatus !== 'Cancelled';
        if (!isGya) return false;
      }

      // Sub-filter
      if (filterType === 'pickup' && !o.isStorePickup) return false;
      if (filterType === 'delivery' && o.isStorePickup) return false;
      if (filterType === 'unpaid' && o.paymentStatus === 'Paid') return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          o.orderId.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.address.toLowerCase().includes(q) ||
          (o.handedOverBy && o.handedOverBy.toLowerCase().includes(q)) ||
          o.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [orders, activeTab, filterType, searchQuery]);

  // Loading Screen
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400" />
          <p className="text-sm font-semibold text-blue-200">Loading Staff Terminal...</p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN FOR STAFF
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A1128] flex items-center justify-center p-4 relative font-sans">
        
        {/* Glow */}
        <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
        <div className="absolute w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

        <div className="max-w-md w-full bg-[#0F1D3D] border border-blue-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-white">
          
          <div className="text-center space-y-2 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400/30 flex items-center justify-center mx-auto shadow-xl">
              <Store className="w-9 h-9 text-emerald-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-bold uppercase tracking-wider">
              <span>Showroom Counter Terminal</span>
            </div>

            <h1 className="text-2xl font-black text-white">
              Lapiez Staff Desk
            </h1>
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Order Inflow & Outflow Portal (आया और गया ऑर्डर डेस्क) • Chiniya Road, Garhwa
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5">
                Staff Member Name (आपका नाम)
              </label>
              <input
                type="text"
                placeholder="e.g. Jay Prakash / Rohit / Counter 1"
                value={staffNameInput}
                onChange={(e) => setStaffNameInput(e.target.value)}
                className="w-full bg-[#070D1E] border border-blue-800 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-emerald-400"
              />
              {/* Quick staff chips */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {['Jay Prakash', 'Rohit', 'Suraj', 'Counter Desk'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setStaffNameInput(name)}
                    className="text-[10.5px] px-2.5 py-1 rounded-lg bg-blue-900/50 hover:bg-blue-800/80 text-blue-300 border border-blue-700/50 font-medium cursor-pointer"
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5">
                Staff Passkey / PIN (पासकोड)
              </label>
              <input
                type="password"
                required
                placeholder="Enter 4-digit PIN (default 1234)"
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value)}
                className="w-full bg-[#070D1E] border border-blue-800 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-emerald-400 font-mono tracking-widest text-center text-lg"
                autoFocus
              />
              <p className="text-[10.5px] text-blue-300/60 mt-1 text-center">
                Default PIN: <strong className="text-emerald-300">1234</strong> (or Admin Master Key)
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Unlocking Terminal...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Unlock Staff Desk (लॉग इन करें)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center space-y-2">
            <div>
              <Link href="/admin" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
                Super Admin Login →
              </Link>
            </div>
            <div>
              <Link href="/" className="text-xs text-slate-400 hover:text-slate-300">
                ← Return to Public Storefront
              </Link>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // MAIN STAFF CONSOLE SCREEN
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans pb-16">

      {/* Top Header Bar */}
      <header className="bg-[#0F1D3D] text-white border-b border-blue-900 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight">LAPIEZ STAFF DESK</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                  Live Dispatch
                </span>
              </div>
              <p className="text-[10px] text-blue-200/70 hidden sm:block">
                Garhwa Showroom Counter • Inflow & Outflow Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            
            {/* Warranty Desk Quick Link */}
            <Link
              href="/admin?tab=warranty"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 hover:text-white text-xs font-bold border border-blue-700/60 flex items-center gap-1.5 transition-colors"
              title="Open Warranty Claims Desk"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Warranty Desk</span>
            </Link>

            {/* Current Staff Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-slate-300 text-[11px]">Staff:</span>
              <strong className="text-white">{currentStaffName}</strong>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchStaffOrders}
              disabled={isLoadingOrders}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Desk</span>
            </button>
          </div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* METRICS ROW (Kiska Aaya & Kiska Gya Overview) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* 1. Kiska Order Aaya (Incoming / Pending) */}
          <div
            onClick={() => setActiveTab('aaya')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeTab === 'aaya'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]'
                : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                activeTab === 'aaya' ? 'text-blue-100' : 'text-blue-600'
              }`}>
                <ArrowDownLeft className="w-4 h-4" />
                <span>ऑर्डर आया (Incoming)</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'aaya' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
              }`}>
                Pending
              </span>
            </div>
            <div className="text-3xl font-black mt-2">{metrics.aayaCount}</div>
            <p className={`text-[11px] mt-1 ${activeTab === 'aaya' ? 'text-blue-100' : 'text-slate-500'}`}>
              New, In-Packing & Ready for Pickup
            </p>
          </div>

          {/* 2. Kiska Order Gya (Outgoing / Dispatched) */}
          <div
            onClick={() => setActiveTab('gya')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeTab === 'gya'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.01]'
                : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                activeTab === 'gya' ? 'text-emerald-100' : 'text-emerald-600'
              }`}>
                <ArrowUpRight className="w-4 h-4" />
                <span>ऑर्डर गया (Dispatched)</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'gya' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}>
                Completed
              </span>
            </div>
            <div className="text-3xl font-black mt-2">{metrics.gyaCount}</div>
            <p className={`text-[11px] mt-1 ${activeTab === 'gya' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Delivered or Out for Delivery
            </p>
          </div>

          {/* 3. Today's Total Volume */}
          <div
            onClick={() => { setActiveTab('all'); setFilterType('all'); }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                activeTab === 'all' ? 'text-slate-300' : 'text-slate-500'
              }`}>
                Today's Orders
              </span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black mt-2">{metrics.todayTotal}</div>
            <p className={`text-[11px] mt-1 ${activeTab === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
              Total Bookings Today
            </p>
          </div>

          {/* 4. Store Counter Pickups */}
          <div
            onClick={() => { setActiveTab('all'); setFilterType('pickup'); }}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:border-purple-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-4 h-4 text-purple-600" />
                <span>Showroom Pickups</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                Counter
              </span>
            </div>
            <div className="text-3xl font-black mt-2 text-slate-900">
              {orders.filter((o) => o.isStorePickup).length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Customers collecting at store
            </p>
          </div>

        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('aaya')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'aaya'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>ऑर्डर आया ({metrics.aayaCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('gya')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'gya'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>ऑर्डर गया ({metrics.gyaCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 md:flex-initial px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>सभी Orders</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Customer, Mobile, or Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sub Filters */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'pickup', label: 'Counter Pickup' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'unpaid', label: 'Payment Due' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  filterType === f.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>

        {/* ORDERS LIST */}
        <div className="space-y-4">
          {isLoadingOrders ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="text-xs font-semibold">Updating live order queue...</p>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-3">
              <Package className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-base font-bold text-slate-700">No matching orders found</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {activeTab === 'aaya'
                  ? 'Great job! No pending incoming orders in queue right now.'
                  : 'No dispatched or delivered orders found under this filter.'}
              </p>
            </div>
          ) : (
            displayedOrders.map((order) => {
              const isDelivered = order.orderStatus === 'Delivered';
              const isPacked = order.orderStatus === 'Packed';
              const isConfirmed = order.orderStatus === 'Confirmed';
              const isOutForDelivery = order.orderStatus === 'Out For Delivery';

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                    isDelivered
                      ? 'border-slate-200 bg-slate-50/50'
                      : 'border-blue-200 hover:border-blue-400 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    
                    {/* Customer & Order ID */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm font-black text-blue-700">
                          #{order.orderId}
                        </span>

                        {/* Order Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          isDelivered
                            ? 'bg-slate-200 text-slate-700'
                            : isOutForDelivery
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : isPacked
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {order.orderStatus}
                        </span>

                        {/* Store Pickup vs Home Delivery */}
                        {order.isStorePickup ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            <span>Store Pickup (काउंटर डिलीवरी)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            <span>Home Delivery</span>
                          </span>
                        )}

                        {/* Payment Status */}
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {order.paymentStatus} • {order.paymentMethod}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
                        <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
                        <span>•</span>
                        <a
                          href={`tel:${order.phone}`}
                          className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.phone}</span>
                        </a>
                        <span>•</span>
                        <span className="text-slate-400">Date: {order.date}</span>
                      </div>

                      {order.address && (
                        <p className="text-[11px] text-slate-500 max-w-2xl line-clamp-1" title={order.address}>
                          📍 {order.address}
                        </p>
                      )}
                    </div>

                    {/* Order Handed Over By Badge (Audit Trail) */}
                    {order.handedOverBy && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div>
                          <div className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold">
                            Handed Over / Dispatched By
                          </div>
                          <div className="font-extrabold">{order.handedOverBy}</div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Items List & Price */}
                  <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    <div className="space-y-1.5 flex-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Ordered Items ({order.items.length})
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800"
                          >
                            <span className="font-extrabold text-blue-600">{item.quantity}x</span>
                            <span className="max-w-[200px] truncate">{item.name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Bill</div>
                      <div className="text-xl font-black text-slate-900">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                  </div>

                  {/* Staff Action Buttons Toolbar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    
                    {/* Left: Communication */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${order.phone}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Call Customer</span>
                      </a>

                      <button
                        onClick={() => sendWhatsAppReadyMessage(order)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Send WhatsApp Ready for Pickup"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Ready Alert</span>
                      </button>

                      <Link
                        href={`/invoice/${order.orderId}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Invoice / Slip</span>
                      </Link>
                    </div>

                    {/* Right: Status Flow Action Buttons */}
                    <div className="flex items-center gap-2">
                      {isConfirmed && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.orderId, 'Packed')}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Mark as Packed (पैक हो गया)</span>
                        </button>
                      )}

                      {!isDelivered && (
                        <button
                          onClick={() => {
                            setHandoverModalOrder(order);
                            setHandoverStaffName(currentStaffName);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>Hand Over & Deliver (सामान दे दिया)</span>
                        </button>
                      )}

                      {!isDelivered && !order.isStorePickup && !isOutForDelivery && (
                        <button
                          onClick={() => {
                            handleUpdateOrderStatus(order.orderId, 'Out For Delivery');
                            sendWhatsAppDispatchMessage(order);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Send for Delivery</span>
                        </button>
                      )}

                      {isDelivered && (
                        <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Completed & Handed Over</span>
                        </span>
                      )}
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* HANDOVER RECORD MODAL */}
      {handoverModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Record Customer Handover
                </h3>
                <p className="text-xs text-slate-500">
                  Order #{handoverModalOrder.orderId} • {handoverModalOrder.customerName}
                </p>
              </div>
              <button
                onClick={() => setHandoverModalOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmHandover} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1">
                <div className="font-extrabold text-sm">
                  Total Collectible: ₹{handoverModalOrder.totalAmount.toLocaleString('en-IN')}
                </div>
                <div>Payment Method: {handoverModalOrder.paymentMethod}</div>
                <div>Current Payment Status: {handoverModalOrder.paymentStatus}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Who is handing over the product? (Staff Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jay Prakash / Rohit / Counter Staff"
                  value={handoverStaffName}
                  onChange={(e) => setHandoverStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirmPayment"
                  defaultChecked
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="confirmPayment" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Confirm payment is received & verified (Paid)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setHandoverModalOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingHandover}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  {isSubmittingHandover ? (
                    'Recording Handover...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Mark Delivered</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
