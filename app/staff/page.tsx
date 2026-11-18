'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Package, Truck, CheckCircle2, Phone,
  Search, RefreshCw, Printer, Store,
  ShieldCheck, AlertCircle, ArrowRight, Check, X, Key,
  Lock, ArrowDownLeft, ArrowUpRight,
  Calendar, User, Smartphone, Download, Shield,
  Bike, MapPin, Navigation, Compass, ExternalLink, Clock, MessageSquare, Plus
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';
import WarrantyManager from '../../components/admin/WarrantyManager';
import RiderActivityModal from '../../components/admin/RiderActivityModal';

interface StaffRider {
  id: string;
  riderCode?: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  dlNumber?: string;
  city?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  isOnline: boolean;
  isBlocked: boolean;
  walletBalance: number;
  commissionPerOrder: number;
  currentLat?: number | null;
  currentLng?: number | null;
  lastLocationText?: string | null;
  lastActiveAt?: string | null;
  lastDeliveryAt?: string | null;
  createdAt: string;
  deliveredCount?: number;
  codCollected?: number;
  orders?: Array<{
    id: string;
    orderId: string;
    orderStatus: string;
    customerName: string;
    address: string;
    totalAmount: number;
    paymentMethod: string;
  }>;
}

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

  // Console Main Section: 'orders' | 'warranty' | 'fleet'
  const [activeSection, setActiveSection] = useState<'orders' | 'warranty' | 'fleet'>('orders');

  // Fleet & Rider Management State
  const [riders, setRiders] = useState<StaffRider[]>([]);
  const [fleetActivities, setFleetActivities] = useState<any[]>([]);
  const [isLoadingFleet, setIsLoadingFleet] = useState(false);
  const [selectedTimelineRider, setSelectedTimelineRider] = useState<StaffRider | null>(null);
  const [approvingRiderId, setApprovingRiderId] = useState<string | null>(null);
  const [assigningToRiderId, setAssigningToRiderId] = useState<string | null>(null);
  const [orderToDispatchMap, setOrderToDispatchMap] = useState<Record<string, string>>({});

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
      .catch(() => { })
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

  // Fetch Fleet & Real-time Milestone Activities
  const fetchFleetData = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingFleet(true);
    try {
      const [ridersRes, actRes] = await Promise.all([
        fetch('/api/admin/riders?includeQueue=true', { cache: 'no-store' }),
        fetch('/api/rider/activity?limit=30', { cache: 'no-store' }),
      ]);
      if (ridersRes.ok) {
        const ridersData = await ridersRes.json();
        setRiders(Array.isArray(ridersData) ? ridersData : (ridersData?.riders || []));
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        if (Array.isArray(actData?.activities)) {
          setFleetActivities(actData.activities);
        }
      }
    } catch {
      // silent
    } finally {
      if (!silent) setIsLoadingFleet(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchFleetData(false);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchFleetData(true);
      }
    }, 15000); // 15s auto-refresh for real-time fleet GPS & status
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchFleetData]);

  // Approve Rider Application (Direct from Staff Console)
  const handleApproveRider = async (rider: StaffRider) => {
    try {
      setApprovingRiderId(rider.id);
      const res = await fetch(`/api/admin/riders/${rider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus: 'APPROVED',
          isOnline: true,
        }),
      });

      if (res.ok) {
        // Log milestone in RiderActivity
        await fetch('/api/rider/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            riderId: rider.id,
            activityType: 'RIDER_APPROVED',
            title: 'Rider Approved by Showroom Staff',
            description: `Rider ${rider.name} (${rider.riderCode}) ko Staff '${currentStaffName}' dwara verify & approve kar diya gaya. Account activate ho chuka hai.`,
            locationText: 'Lapiez Showroom, Chiniya Road, Garhwa',
          }),
        }).catch(() => {});

        showToast(`✅ Rider ${rider.name} approved! Ab rider console me login kar sakte hain.`);
        await fetchFleetData(true);
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Approval failed.');
      }
    } catch {
      showToast('Network error during rider approval.');
    } finally {
      setApprovingRiderId(null);
    }
  };

  // Reject Rider Application
  const handleRejectRider = async (rider: StaffRider) => {
    const reason = prompt(`Kripya '${rider.name}' ke rejection ka karan dalein:`, 'Document verify nahi ho paya.');
    if (!reason) return;

    try {
      setApprovingRiderId(rider.id);
      const res = await fetch(`/api/admin/riders/${rider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus: 'REJECTED',
          rejectionReason: reason.trim(),
        }),
      });

      if (res.ok) {
        showToast(`Rider application for ${rider.name} rejected.`);
        await fetchFleetData(true);
      }
    } catch {
      showToast('Error rejecting rider.');
    } finally {
      setApprovingRiderId(null);
    }
  };

  // Quick Dispatch Order to Rider
  const handleDispatchOrderToRider = async (orderId: string, riderId: string) => {
    if (!orderId || !riderId) return;
    try {
      setAssigningToRiderId(riderId);
      const res = await fetch(`/api/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId }),
      });

      if (res.ok) {
        showToast(`Order #${orderId} rider ko successfully dispatch ho gaya!`);
        await Promise.all([fetchStaffOrders(true), fetchFleetData(true)]);
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Order dispatch nahi ho paya.');
      }
    } catch {
      showToast('Error dispatching order.');
    } finally {
      setAssigningToRiderId(null);
    }
  };

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
        setAuthError(data.error || 'Login failed. Please verify your credentials.');
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

  // Submit Handover to Customer (MANDATORY STAFF NAME)
  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverModalOrder) return;

    const staff = handoverStaffName.trim() || currentStaffName.trim();
    if (!staff) {
      showToast('Staff Name / Handovered By is MANDATORY! Please enter staff name.');
      return;
    }
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
      `Hello *${order.customerName}*,\n` +
      `Your order *#${order.orderId}* is packed and ready for pickup at our showroom counter!\n\n` +
      `Items: ${order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}\n` +
      `Total: ₹${order.totalAmount.toLocaleString('en-IN')}\n` +
      `Showroom Address: In front of G P Plaza, Chiniya Road, Garhwa\n` +
      `Lapiez Team Garhwa`
    );
    window.open(`https://wa.me/91${order.phone.replace(/\D/g, '').slice(-10)}?text=${text}`, '_blank');
  };

  const sendWhatsAppDispatchMessage = (order: StaffOrder) => {
    const text = encodeURIComponent(
      `*LAPIEZ GARHWA - ORDER DISPATCHED*\n\n` +
      `Hello *${order.customerName}*,\n` +
      `Your order *#${order.orderId}* has been dispatched for delivery!\n` +
      (order.rider ? `Delivery Rider: ${order.rider.name} (${order.rider.phone})\n` : '') +
      `Total Payable: ₹${order.totalAmount.toLocaleString('en-IN')} (${order.paymentStatus})\n\n` +
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

  const pendingRiders = useMemo(() => {
    return riders.filter((r) => r.approvalStatus === 'PENDING');
  }, [riders]);

  const activeOnRoadRiders = useMemo(() => {
    return riders.filter((r) => r.approvalStatus === 'APPROVED');
  }, [riders]);

  const undispatchedOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        ['Ready', 'Packed', 'Confirmed', 'Ready for Pickup'].includes(o.orderStatus) &&
        !o.isStorePickup &&
        !o.rider
    );
  }, [orders]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-800">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1A56DB]" />
          <p className="text-sm font-semibold text-slate-500">Loading Lapiez Staff Portal...</p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN FOR STAFF
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 text-slate-900 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto shadow-2xs">
              <Store className="w-7 h-7 text-[#1A56DB]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lapiez Staff Portal</h1>
            <p className="text-xs text-slate-500 font-medium">Showroom Counter Billing &amp; Dispatch Console</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setLoginMode('credentials'); setAuthError(''); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${loginMode === 'credentials' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Staff ID &amp; Password
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('pin'); setAuthError(''); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${loginMode === 'pin' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Quick Counter PIN
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === 'credentials' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Staff ID ya Mobile Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. LAP-STF-001 ya 9876543210"
                      value={staffIdentifier}
                      onChange={(e) => setStaffIdentifier(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password / PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Apna password dalein"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Staff Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Counter 1 / Jay Prakash"
                    value={staffNameInput}
                    onChange={(e) => setStaffNameInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Counter PIN / Admin Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter PIN (e.g. 1234)"
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </>
            )}

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-extrabold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Login to Staff Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Direct APK & Return links */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-center">
            <a
              href="/downloads/lapiez-staff.apk"
              download="Lapiez-Staff-App.apk"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Download Android Staff App (.APK)</span>
            </a>

            <div className="flex items-center justify-between text-xs pt-1">
              <Link href="/" className="text-slate-500 hover:text-slate-900 font-semibold">← Storefront</Link>
              <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-bold">Admin Console →</Link>
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
      <header className="bg-white text-slate-900 border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Store className="w-5 h-5 text-[#1A56DB]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight truncate text-slate-900">LAPIEZ STAFF</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold font-mono">
                  {currentStaffCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {currentStaffName} • {currentStaffRole}
              </p>
            </div>
          </div>

          {/* Desktop Mode Switcher */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSection('orders')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeSection === 'orders' ? 'bg-[#1A56DB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders Desk ({metrics.aayaCount})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveSection('fleet'); fetchFleetData(true); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeSection === 'fleet' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Riders &amp; Fleet</span>
              {pendingRiders.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] animate-pulse">
                  {pendingRiders.length} Pending
                </span>
              ) : (
                <span className="text-[10px] opacity-75">({riders.length})</span>
              )}
            </button>

            {canHandleWarranty && (
              <button
                type="button"
                onClick={() => setActiveSection('warranty')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeSection === 'warranty' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
              title="Download Staff Android APK"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>APK</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (activeSection === 'fleet') fetchFleetData(false);
                else fetchStaffOrders(true);
              }}
              disabled={isRefreshing || isLoadingFleet}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoadingFleet ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Top Section Toggle */}
      <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2 sticky top-16 z-20">
        <div className={`grid gap-1.5 bg-slate-100 p-1 rounded-xl ${canHandleWarranty ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button
            type="button"
            onClick={() => setActiveSection('orders')}
            className={`py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${activeSection === 'orders' ? 'bg-[#1A56DB] text-white shadow-xs' : 'text-slate-600'
              }`}
          >
            <Package className="w-3 h-3" />
            <span>Orders ({metrics.aayaCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSection('fleet'); fetchFleetData(true); }}
            className={`py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${activeSection === 'fleet' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600'
              }`}
          >
            <Bike className="w-3 h-3" />
            <span>Riders {pendingRiders.length > 0 && `(${pendingRiders.length})`}</span>
          </button>

          {canHandleWarranty && (
            <button
              type="button"
              onClick={() => setActiveSection('warranty')}
              className={`py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${activeSection === 'warranty' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Warranty</span>
            </button>
          )}
        </div>
      </div>

      {activeSection === 'warranty' ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5">
          <WarrantyManager staffMode staffName={`${currentStaffName} (${currentStaffCode})`} />
        </div>
      ) : activeSection === 'fleet' ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 space-y-6">

          {/* Top Banner & Quick Metrics */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Bike className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Showroom Fleet &amp; Rider Verification</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  New rider verification, live on-road GPS monitoring, multi-delivery dispatch, and real-time milestone progress.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchFleetData(false)}
                  disabled={isLoadingFleet}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFleet ? 'animate-spin text-blue-600' : ''}`} />
                  <span>Refresh Fleet</span>
                </button>

                <a
                  href="/rider/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Onboard Rider</span>
                </a>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Registered Fleet</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{riders.length}</span>
                <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Delivery partners</span>
              </div>

              <div className="bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Online &amp; Active Duty</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  {riders.filter((r) => r.isOnline && r.approvalStatus === 'APPROVED').length}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 mt-0.5 block">Ready for orders</span>
              </div>

              <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">Active Deliveries in Transit</span>
                <span className="text-2xl font-black text-[#1A56DB] mt-1 block">
                  {riders.reduce((acc, r) => acc + (r.orders?.length || 0), 0)}
                </span>
                <span className="text-[10px] font-semibold text-blue-600 mt-0.5 block">On the road</span>
              </div>

              <div className={`rounded-2xl p-3.5 border ${
                pendingRiders.length > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Pending Verification</span>
                <span className={`text-2xl font-black mt-1 block ${pendingRiders.length > 0 ? 'text-amber-700 animate-pulse' : 'text-slate-800'}`}>
                  {pendingRiders.length}
                </span>
                <span className="text-[10px] font-semibold text-amber-700 mt-0.5 block">
                  {pendingRiders.length > 0 ? 'Action required' : 'All verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Pending Rider Verification Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Rider Verification &amp; Approval Queue</span>
                {pendingRiders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                    {pendingRiders.length} PENDING
                  </span>
                )}
              </h3>
            </div>

            {pendingRiders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2 shadow-2xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">All Rider Applications Verified</h4>
                <p className="text-xs text-slate-500">
                  Naye delivery partner register hote hi verification ke liye yahan dikhenge.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRiders.map((r) => {
                  const cleanPhone = (r.phone || '').replace(/\D/g, '').slice(-10);
                  const isProcessing = approvingRiderId === r.id;
                  return (
                    <div
                      key={r.id}
                      className="bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-3.5 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                            {r.riderCode || 'PENDING'}
                          </span>
                          <h4 className="text-base font-black text-slate-900 mt-1">{r.name}</h4>
                          <a
                            href={`tel:${r.phone}`}
                            className="text-xs text-blue-600 hover:underline font-mono font-bold flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3 text-blue-500" />
                            <span>{r.phone}</span>
                          </a>
                        </div>

                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          Pending Review
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Vehicle:</span>
                          <strong className="text-slate-800">{r.vehicleType || 'BIKE'} {r.vehicleNumber ? `(${r.vehicleNumber})` : ''}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">City / Area:</span>
                          <strong className="text-slate-800">{r.city || 'Garhwa'}</strong>
                        </div>
                        {r.dlNumber && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">DL Number:</span>
                            <strong className="text-slate-800 font-mono">{r.dlNumber}</strong>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-500">Applied:</span>
                          <span className="text-slate-700 text-[11px]">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleApproveRider(r)}
                          disabled={isProcessing}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{isProcessing ? 'Approving...' : '✓ Approve & Activate Rider'}</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Namaste ${r.name} ji, Lapiez Showroom se aapki Rider application mil gayi hai.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleRejectRider(r)}
                            disabled={isProcessing}
                            className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Active Fleet Live On-Road Tracking & GPS Radar */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>On-Road Fleet Live Tracking ({activeOnRoadRiders.length})</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                Auto-refreshes live GPS coordinates every 15s
              </span>
            </div>

            {activeOnRoadRiders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2 shadow-2xs">
                <Bike className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Approved Riders Yet</h4>
                <p className="text-xs text-slate-500">Riders approve hone ke baad yahan live track honge.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOnRoadRiders.map((rider) => {
                  const mapsUrl = rider.currentLat && rider.currentLng
                    ? `https://www.google.com/maps?q=${rider.currentLat},${rider.currentLng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((rider.lastLocationText || rider.city || 'Garhwa') + ', Jharkhand')}`;

                  const cleanPhone = (rider.phone || '').replace(/\D/g, '').slice(-10);
                  const isAssigned = rider.orders && rider.orders.length > 0;
                  const isAssigning = assigningToRiderId === rider.id;

                  return (
                    <div
                      key={rider.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Top: Status & Code */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              rider.isOnline
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${rider.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span>{rider.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                          </span>

                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            {rider.riderCode}
                          </span>
                        </div>

                        {/* Name & Phone */}
                        <div>
                          <h4 className="text-base font-black text-slate-900">{rider.name}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {rider.vehicleType || 'BIKE'} {rider.vehicleNumber ? `• ${rider.vehicleNumber}` : ''}
                          </p>
                        </div>

                        {/* Live Location / GPS Radar */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 text-xs space-y-1.5">
                          <div className="flex items-start gap-1.5 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="font-mono text-[11px] font-bold truncate">
                              {rider.lastLocationText || 'Showroom Base, Garhwa'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                            <span className="text-slate-500">
                              {rider.lastActiveAt ? `Active ${new Date(rider.lastActiveAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Recent'}
                            </span>
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                            >
                              <span>Google Maps</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Carrying Orders (Multi-Delivery support) */}
                        <div className="rounded-2xl p-3 border text-xs space-y-2 bg-slate-50 border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase text-slate-700">
                              {isAssigned ? `Carrying ${rider.orders?.length} Deliveries` : 'Available (No Active Orders)'}
                            </span>
                            {isAssigned && (
                              <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                                In Transit
                              </span>
                            )}
                          </div>

                          {isAssigned && (
                            <div className="space-y-1.5 pt-1">
                              {rider.orders?.map((o) => (
                                <div key={o.id} className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between">
                                  <div className="min-w-0">
                                    <span className="font-mono font-bold text-blue-700">#{o.orderId}</span>
                                    <span className="text-slate-600 ml-1.5 truncate">{o.customerName}</span>
                                  </div>
                                  <strong className="text-emerald-700 shrink-0">₹{o.totalAmount}</strong>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick Showroom Dispatch Dropdown */}
                          {undispatchedOrders.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-200 space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">Dispatch Ready Order</span>
                              <div className="flex gap-1.5">
                                <select
                                  value={orderToDispatchMap[rider.id] || ''}
                                  onChange={(e) => setOrderToDispatchMap({ ...orderToDispatchMap, [rider.id]: e.target.value })}
                                  className="flex-1 h-8 text-[11px] bg-white border border-slate-300 rounded-lg px-2 font-medium"
                                >
                                  <option value="">Select Ready Order...</option>
                                  {undispatchedOrders.map((uo) => (
                                    <option key={uo.id} value={uo.orderId}>
                                      #{uo.orderId} - {uo.customerName} (₹{uo.totalAmount})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const oid = orderToDispatchMap[rider.id];
                                    if (oid) handleDispatchOrderToRider(oid, rider.id);
                                    else showToast('Pehle order select karein.');
                                  }}
                                  disabled={isAssigning}
                                  className="h-8 px-2.5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {isAssigning ? '...' : 'Assign'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2">
                        <a
                          href={`tel:${rider.phone}`}
                          className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <span>Call</span>
                        </a>

                        <a
                          href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${rider.name}, Lapiez Showroom Staff desk here.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1 transition-colors"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setSelectedTimelineRider(rider)}
                          className="py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Timeline</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Live Milestone Activity Feed */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Live Rider Milestone Reports Stream</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">
                Updated in real time from rider apps
              </span>
            </div>

            {fleetActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Koi activity records nahi hain abhi tak.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {fleetActivities.map((act) => {
                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 text-xs flex items-start justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-slate-900 font-bold">{act.title}</strong>
                          {act.rider?.riderCode && (
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                              {act.rider.riderCode}
                            </span>
                          )}
                          <span className="text-slate-500 font-medium">({act.rider?.name || 'Rider'})</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{act.description}</p>
                        {act.locationText && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            <span>{act.locationText}</span>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                        {new Date(act.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 space-y-5">

          {/* METRICS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div
              onClick={() => setActiveTab('aaya')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${activeTab === 'aaya'
                ? 'bg-[#1A56DB] text-white border-[#1A56DB] shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase flex items-center gap-1 ${activeTab === 'aaya' ? 'text-blue-100' : 'text-blue-600'
                  }`}>
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Incoming Orders</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'aaya' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                  }`}>
                  Pending
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1.5">{metrics.aayaCount}</div>
            </div>

            <div
              onClick={() => setActiveTab('gya')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${activeTab === 'gya'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase flex items-center gap-1 ${activeTab === 'gya' ? 'text-emerald-100' : 'text-emerald-600'
                  }`}>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Dispatched Orders</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'gya' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                  Done
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1.5">{metrics.gyaCount}</div>
            </div>

            <div
              onClick={() => { setActiveTab('all'); setFilterType('all'); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${activeTab === 'all' && filterType === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase ${activeTab === 'all' && filterType === 'all' ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                  Today
                </span>
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1.5">{metrics.todayTotal}</div>
            </div>

            <div
              onClick={() => { setActiveTab('all'); setFilterType('pickup'); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${filterType === 'pickup'
                ? 'bg-purple-700 text-white border-purple-700 shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase flex items-center gap-1 ${filterType === 'pickup' ? 'text-purple-100' : 'text-purple-700'
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
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'aaya' ? 'bg-[#1A56DB] text-white shadow-xs' : 'text-slate-600'
                  }`}
              >
                Incoming ({metrics.aayaCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gya')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'gya' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
              >
                Dispatched ({metrics.gyaCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
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
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${filterType === f.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${isDelivered ? 'border-slate-200 bg-slate-50/60' : 'border-blue-200 hover:border-blue-400'
                      }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-black text-blue-700">#{order.orderId}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase ${isDelivered
                            ? 'bg-slate-200 text-slate-700'
                            : isOutForDelivery
                              ? 'bg-purple-100 text-purple-800'
                              : isPacked
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                            {order.orderStatus}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1 ${order.isStorePickup ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                            {order.isStorePickup ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                            <span>{order.isStorePickup ? 'Counter Pickup' : 'Delivery'}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
      {/* RIDER ACTIVITY & MILESTONE TIMELINE MODAL */}
      {selectedTimelineRider && (
        <RiderActivityModal
          rider={selectedTimelineRider}
          isOpen={Boolean(selectedTimelineRider)}
          onClose={() => setSelectedTimelineRider(null)}
        />
      )}
    </div>
  );
}
