'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Package, Truck, CheckCircle2, Phone,
  Search, RefreshCw, Printer, Store,
  ShieldCheck, AlertCircle, ArrowRight, Check, X, Key,
  Lock, ArrowDownLeft, ArrowUpRight,
  Calendar, User, Smartphone, Download, Shield
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';
import WarrantyManager from '../../components/admin/WarrantyManager';

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
  const { showToast } = useStore();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginMode, setLoginMode] = useState<'credentials' | 'pin'>('credentials');
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [staffNameInput, setStaffNameInput] = useState('');
  const [currentStaffName, setCurrentStaffName] = useState('Staff Desk');
  const [currentStaffCode, setCurrentStaffCode] = useState('COUNTER');
  const [currentStaffRole, setCurrentStaffRole] = useState('COUNTER');
  const [canHandleWarranty, setCanHandleWarranty] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Console Main Section: 'orders' | 'warranty'
  const [activeSection, setActiveSection] = useState<'orders' | 'warranty'>('orders');

  // Orders State (Zero-flicker silent polling)
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    todayTotal: 0,
    aayaCount: 0,
    gyaCount: 0,
    cancelledCount: 0,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasFetchedOnceRef = useRef(false);

  // Active Order View Tab
  const [activeTab, setActiveTab] = useState<'aaya' | 'gya' | 'all'>('aaya');
  const [filterType, setFilterType] = useState<'all' | 'pickup' | 'delivery' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handover Modal State
  const [handoverModalOrder, setHandoverModalOrder] = useState<StaffOrder | null>(null);
  const [handoverStaffName, setHandoverStaffName] = useState('');
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  // Check existing session once on mount
  useEffect(() => {
    let active = true;
    fetch('/api/staff/auth', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.authenticated) {
          setIsAuthenticated(true);
          const name = data.staffName || 'Showroom Staff';
          setCurrentStaffName(name);
          setCurrentStaffCode(data.staffCode || 'COUNTER');
          setCurrentStaffRole(data.role || 'COUNTER');
          setCanHandleWarranty(data.canHandleWarranty !== false);
          setHandoverStaffName(data.staffCode && data.staffCode !== 'PIN-DESK' ? `${name} (${data.staffCode})` : name);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsCheckingAuth(false);
      });
    return () => { active = false; };
  }, []);

  // Silent non-flickering fetch
  const fetchStaffOrders = useCallback(async (silent = false) => {
    if (!hasFetchedOnceRef.current && !silent) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const res = await fetch('/api/staff/orders', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
        if (data.metrics) setMetrics(data.metrics);
        hasFetchedOnceRef.current = true;
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch {
      if (!silent) showToast('Network error loading orders.');
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStaffOrders(false);
    const interval = setInterval(() => {
      // Skip background fetch if user is not on orders tab or modal open
      if (document.visibilityState === 'visible') {
        fetchStaffOrders(true);
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchStaffOrders]);

  // Handle Login (ID/Phone + Password or PIN fallback)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (loginMode === 'credentials') {
      if (!staffIdentifier.trim() || !staffPassword.trim()) {
        setAuthError('Staff ID/Phone aur Password dono dalein.');
        return;
      }
    } else if (!staffPin.trim()) {
      setAuthError('Counter PIN dalein.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const payload =
        loginMode === 'credentials'
          ? { identifier: staffIdentifier.trim(), password: staffPassword.trim() }
          : { pin: staffPin.trim(), staffName: staffNameInput.trim() || 'Showroom Staff' };

      const res = await fetch('/api/staff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const name = data.staffName || 'Showroom Staff';
        const code = data.staffCode || 'COUNTER';
        setIsAuthenticated(true);
        setCurrentStaffName(name);
        setCurrentStaffCode(code);
        setCurrentStaffRole(data.role || 'COUNTER');
        setCanHandleWarranty(data.canHandleWarranty !== false);
        setHandoverStaffName(code && code !== 'PIN-DESK' ? `${name} (${code})` : name);
        hasFetchedOnceRef.current = false;
        showToast(`Welcome ${name}! Staff App unlocked.`);
      } else {
        setAuthError(data.error || 'Login failed. Details check karein.');
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
    setStaffPassword('');
    hasFetchedOnceRef.current = false;
    setOrders([]);
    showToast('Staff App locked.');
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
        fetchStaffOrders(true);
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
        fetchStaffOrders(true);
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
      `Items: ${order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}\n` +
      `Total: ₹${order.totalAmount.toLocaleString('en-IN')}\n` +
      `Address: In front of G P Plaza, Chiniya Road, Garhwa\n` +
      `Lapiez Team Garhwa`
    );
    window.open(`https://wa.me/91${order.phone.replace(/\D/g, '').slice(-10)}?text=${text}`, '_blank');
  };

  const sendWhatsAppDispatchMessage = (order: StaffOrder) => {
    const text = encodeURIComponent(
      `*LAPIEZ GARHWA - ORDER DISPATCHED*\n\n` +
      `Namaste *${order.customerName}* ji,\n` +
      `Aapka order *#${order.orderId}* delivery ke liye nikal chuka hai!\n` +
      (order.rider ? `Rider: ${order.rider.name} (${order.rider.phone})\n` : '') +
      `Amount: ₹${order.totalAmount.toLocaleString('en-IN')} (${order.paymentStatus})\n\n` +
      `Help: +91 9608828288 • Lapiez Garhwa`
    );
    window.open(`https://wa.me/91${order.phone.replace(/\D/g, '').slice(-10)}?text=${text}`, '_blank');
  };

  // Filtered Orders Calculation
  const displayedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab === 'aaya') {
        const isAaya = ['Confirmed', 'Packed', 'Ready', 'Ready for Pickup'].includes(o.orderStatus) && o.orderStatus !== 'Cancelled';
        if (!isAaya) return false;
      } else if (activeTab === 'gya') {
        const isGya = ['Out For Delivery', 'Delivered'].includes(o.orderStatus) && o.orderStatus !== 'Cancelled';
        if (!isGya) return false;
      }

      if (filterType === 'pickup' && !o.isStorePickup) return false;
      if (filterType === 'delivery' && o.isStorePickup) return false;
      if (filterType === 'unpaid' && o.paymentStatus === 'Paid') return false;

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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400" />
          <p className="text-sm font-semibold text-blue-200">Loading Lapiez Staff App...</p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN FOR STAFF
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#070D1E] via-[#0A1432] to-[#060B18] flex items-center justify-center p-4 relative font-sans">
        <div className="max-w-md w-full bg-[#0F1D3D] border border-blue-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-white space-y-5">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30 flex items-center justify-center mx-auto shadow-xl">
              <Store className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Lapiez Staff App</h1>
            <p className="text-xs text-blue-200/75">Showroom Dispatch &amp; Warranty Terminal</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="grid grid-cols-2 bg-[#070D1E] p-1 rounded-xl border border-blue-900/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setLoginMode('credentials'); setAuthError(''); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                loginMode === 'credentials' ? 'bg-[#1A56DB] text-white shadow-xs' : 'text-blue-200/70 hover:text-white'
              }`}
            >
              Staff ID &amp; Password
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('pin'); setAuthError(''); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                loginMode === 'pin' ? 'bg-[#1A56DB] text-white shadow-xs' : 'text-blue-200/70 hover:text-white'
              }`}
            >
              Counter PIN
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === 'credentials' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-blue-200 mb-1.5">
                    Staff ID ya Mobile Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. LAP-STF-001 ya 9876543210"
                      value={staffIdentifier}
                      onChange={(e) => setStaffIdentifier(e.target.value)}
                      className="w-full bg-[#070D1E] border border-blue-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-emerald-400"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-200 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Apna password dalein"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full bg-[#070D1E] border border-blue-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-blue-200 mb-1.5">
                    Staff Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Counter 1 / Jay Prakash"
                    value={staffNameInput}
                    onChange={(e) => setStaffNameInput(e.target.value)}
                    className="w-full bg-[#070D1E] border border-blue-800 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-200 mb-1.5">
                    Counter PIN / Admin Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter PIN"
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    className="w-full bg-[#070D1E] border border-blue-800 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white placeholder-blue-300/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </>
            )}

            {authError && (
              <div className="p-3 bg-rose-950/70 border border-rose-700/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
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
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Login to Staff App</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Direct APK & Return links */}
          <div className="pt-4 border-t border-white/10 space-y-2.5 text-center">
            <a
              href="/downloads/lapiez-staff.apk"
              download="Lapiez-Staff-App.apk"
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download Android Staff App (.APK)</span>
            </a>

            <div className="flex items-center justify-between text-xs pt-1">
              <Link href="/" className="text-slate-400 hover:text-white">← Storefront</Link>
              <Link href="/admin" className="text-blue-400 hover:text-blue-300 font-semibold">Admin Panel →</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN STAFF APP CONSOLE
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans pb-24 sm:pb-12">

      {/* Top Executive App Header */}
      <header className="bg-[#0A1328] text-white border-b border-blue-900/60 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Store className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight truncate">LAPIEZ STAFF</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {currentStaffCode}
                </span>
              </div>
              <p className="text-[11px] text-blue-200/75 truncate">
                {currentStaffName} • {currentStaffRole}
              </p>
            </div>
          </div>

          {/* Desktop Mode Switcher */}
          <div className="hidden md:flex items-center gap-1.5 bg-white/10 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveSection('orders')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'orders' ? 'bg-[#1A56DB] text-white shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders Desk ({metrics.aayaCount})</span>
            </button>
            {canHandleWarranty && (
              <button
                type="button"
                onClick={() => setActiveSection('warranty')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeSection === 'warranty' ? 'bg-emerald-600 text-white shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Warranty &amp; RMA</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/downloads/lapiez-staff.apk"
              download="Lapiez-Staff-App.apk"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-bold border border-white/10 transition-colors"
              title="Download Staff Android APK"
            >
              <Download className="w-3.5 h-3.5" />
              <span>APK</span>
            </a>

            {activeSection === 'orders' && (
              <button
                type="button"
                onClick={() => fetchStaffOrders(true)}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Refresh Orders"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Top Section Toggle */}
      {canHandleWarranty && (
        <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2 sticky top-16 z-20">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSection('orders')}
              className={`py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'orders' ? 'bg-[#1A56DB] text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders ({metrics.aayaCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('warranty')}
              className={`py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'warranty' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Warranty Desk</span>
            </button>
          </div>
        </div>
      )}

      {activeSection === 'warranty' ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5">
          <WarrantyManager staffMode staffName={`${currentStaffName} (${currentStaffCode})`} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 space-y-5">

          {/* METRICS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div
              onClick={() => setActiveTab('aaya')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                activeTab === 'aaya'
                  ? 'bg-[#1A56DB] text-white border-[#1A56DB] shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase flex items-center gap-1 ${
                  activeTab === 'aaya' ? 'text-blue-100' : 'text-blue-600'
                }`}>
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>ऑर्डर आया</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'aaya' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                }`}>
                  Pending
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1.5">{metrics.aayaCount}</div>
            </div>

            <div
              onClick={() => setActiveTab('gya')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                activeTab === 'gya'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase flex items-center gap-1 ${
                  activeTab === 'gya' ? 'text-emerald-100' : 'text-emerald-600'
                }`}>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>ऑर्डर गया</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'gya' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  Done
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1.5">{metrics.gyaCount}</div>
            </div>

            <div
              onClick={() => { setActiveTab('all'); setFilterType('all'); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                activeTab === 'all' && filterType === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase ${
                  activeTab === 'all' && filterType === 'all' ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Today
                </span>
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1.5">{metrics.todayTotal}</div>
            </div>

            <div
              onClick={() => { setActiveTab('all'); setFilterType('pickup'); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                filterType === 'pickup'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase flex items-center gap-1 ${
                  filterType === 'pickup' ? 'text-purple-100' : 'text-purple-700'
                }`}>
                  <Store className="w-4 h-4" />
                  <span>Counter</span>
                </span>
                <Shield className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1.5">
                {orders.filter((o) => o.isStorePickup).length}
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('aaya')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'aaya' ? 'bg-[#1A56DB] text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Incoming ({metrics.aayaCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gya')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'gya' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Dispatched ({metrics.gyaCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({orders.length})
              </button>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Order ID, Name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'pickup', label: 'Pickup' },
                { id: 'delivery', label: 'Delivery' },
                { id: 'unpaid', label: 'Unpaid' },
              ].map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    filterType === f.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ORDERS LIST (Never unmounts during background refresh!) */}
          <div className="space-y-3.5">
            {isInitialLoading && orders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                <p className="text-xs font-semibold">Loading orders...</p>
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Koi matching order nahi hai</p>
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
                    className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${
                      isDelivered ? 'border-slate-200 bg-slate-50/60' : 'border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-black text-blue-700">#{order.orderId}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase ${
                            isDelivered
                              ? 'bg-slate-200 text-slate-700'
                              : isOutForDelivery
                              ? 'bg-purple-100 text-purple-800'
                              : isPacked
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.orderStatus}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1 ${
                            order.isStorePickup ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {order.isStorePickup ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                            <span>{order.isStorePickup ? 'Counter Pickup' : 'Delivery'}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                            order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {order.paymentStatus} • {order.paymentMethod}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs text-slate-600 pt-0.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
                          <span>•</span>
                          <a href={`tel:${order.phone}`} className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                            <Phone className="w-3 h-3" />
                            <span>{order.phone}</span>
                          </a>
                          <span>•</span>
                          <span className="text-slate-400">{order.date}</span>
                        </div>

                        {order.address && (
                          <p className="text-[11px] text-slate-500 max-w-2xl line-clamp-1" title={order.address}>
                            {order.address}
                          </p>
                        )}
                      </div>

                      {order.handedOverBy && (
                        <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div>
                            <div className="text-[10px] text-emerald-700 uppercase font-bold">Handled By</div>
                            <div className="font-extrabold">{order.handedOverBy}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Items List & Total */}
                    <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800"
                          >
                            <span className="font-extrabold text-blue-600">{item.quantity}x</span>
                            <span className="max-w-[200px] truncate">{item.name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                        <div className="text-lg font-black text-slate-900">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`tel:${order.phone}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <span>Call</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => sendWhatsAppReadyMessage(order)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                          <span>WhatsApp Alert</span>
                        </button>

                        <Link
                          href={`/invoice/${order.orderId}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Bill</span>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isConfirmed && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.orderId, 'Packed')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Mark Packed</span>
                          </button>
                        )}

                        {!isDelivered && (
                          <button
                            type="button"
                            onClick={() => {
                              setHandoverModalOrder(order);
                              setHandoverStaffName(
                                currentStaffCode && currentStaffCode !== 'PIN-DESK'
                                  ? `${currentStaffName} (${currentStaffCode})`
                                  : currentStaffName
                              );
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Hand Over &amp; Deliver</span>
                          </button>
                        )}

                        {!isDelivered && !order.isStorePickup && !isOutForDelivery && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateOrderStatus(order.orderId, 'Out For Delivery');
                              sendWhatsAppDispatchMessage(order);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* HANDOVER RECORD MODAL */}
      {handoverModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Customer Handover</h3>
                <p className="text-xs text-slate-500">Order #{handoverModalOrder.orderId} • {handoverModalOrder.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setHandoverModalOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmHandover} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1">
                <div className="font-extrabold text-sm">Amount: ₹{handoverModalOrder.totalAmount.toLocaleString('en-IN')}</div>
                <div>{handoverModalOrder.paymentMethod} • {handoverModalOrder.paymentStatus}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Staff Name *</label>
                <input
                  type="text"
                  required
                  value={handoverStaffName}
                  onChange={(e) => setHandoverStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
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
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingHandover ? 'Saving...' : 'Confirm & Deliver'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
