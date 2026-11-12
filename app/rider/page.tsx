'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Pusher from 'pusher-js';
import {
  Bike, Power, MapPin, Phone, CheckCircle, Navigation,
  Wallet, RefreshCw, User, ExternalLink, Bell, Package, Download
} from 'lucide-react';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';

interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  itemsJson?: string;
  createdAt: string;
  deliveredAt?: string;
}

function parseOrderItems(itemsJson?: string): OrderItem[] {
  if (!itemsJson) return [];
  try {
    const arr = JSON.parse(itemsJson);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function RiderApp() {
  const router = useRouter();
  const [rider, setRider] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('active');

  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    codCollectedToday: 0,
    totalCompleted: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  // 1. Check Login
  useEffect(() => {
    const localRiderStr = localStorage.getItem('lapiez-rider');
    if (!localRiderStr) {
      router.push('/rider/login');
      return;
    }
    try {
      const parsed = JSON.parse(localRiderStr);
      setRider(parsed);
      setIsOnline(parsed.isOnline ?? true);
    } catch {
      router.push('/rider/login');
    }
  }, [router]);

  // 2. Fetch Real Orders, Stats & Live Profile from PostgreSQL (Zero Flicker)
  const fetchOrders = useCallback(async (riderId: string, silent = false) => {
    if (!hasLoadedOnceRef.current && !silent) {
      setInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const res = await fetch(`/api/rider/orders?riderId=${encodeURIComponent(riderId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.rider) {
          if (data.rider.isBlocked) {
            localStorage.removeItem('lapiez-rider');
            localStorage.removeItem('lapiez-rider-token');
            router.push('/rider/login');
            return;
          }
          setRider((prev: any) => {
            const merged = { ...prev, ...data.rider };
            try { localStorage.setItem('lapiez-rider', JSON.stringify(merged)); } catch {}
            return merged;
          });
          setIsOnline(Boolean(data.rider.isOnline));
        }
        const avail = Array.isArray(data.availableOrders) ? data.availableOrders : [];
        const act = Array.isArray(data.activeOrders) ? data.activeOrders : [];
        const comp = Array.isArray(data.completedOrders) ? data.completedOrders : [];
        setAvailableOrders(avail);
        setActiveOrders(act);
        setCompletedOrders(comp);
        if (data.stats) setStats(data.stats);
        if (!hasLoadedOnceRef.current && act.length === 0 && avail.length > 0) {
          setActiveTab('available');
        }
        hasLoadedOnceRef.current = true;
      }
    } catch (err) {
      console.error('Failed to load rider orders:', err);
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    if (!rider?.id) return;
    fetchOrders(rider.id, false);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders(rider.id, true);
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [rider?.id, fetchOrders]);

  // 3. Pusher Real-time Listener
  useEffect(() => {
    if (!rider?.id) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';
    if (!pusherKey) return;

    let pusher: Pusher | null = null;
    try {
      pusher = new Pusher(pusherKey, { cluster: pusherCluster });
      const channel = pusher.subscribe('riders-channel');

      channel.bind('new-order', () => {
        try {
          new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
        } catch {}
        fetchOrders(rider.id, true);
      });

      channel.bind('order-assigned', (data: { riderId?: string }) => {
        if (data?.riderId === rider.id) {
          try {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
          } catch {}
          setActiveTab('active');
        }
        fetchOrders(rider.id, true);
      });

      channel.bind('order-taken', (data: { orderId: string; dbId: string }) => {
        setAvailableOrders((prev) => prev.filter((o) => o.orderId !== data.orderId && o.id !== data.dbId));
      });
    } catch (err) {
      console.warn('Pusher init skipped:', err);
    }

    return () => {
      if (pusher) pusher.unsubscribe('riders-channel');
    };
  }, [rider?.id, fetchOrders]);

  // 4. Live GPS Location Ping to Admin
  useEffect(() => {
    if (!rider?.id || !isOnline) return;

    const pingLocation = () => {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await fetch('/api/rider/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  riderId: rider.id,
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  locationText: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
                }),
              });
            } catch {}
          },
          () => {
            fetch('/api/rider/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                riderId: rider.id,
                locationText: rider.city ? `Near ${rider.city}` : 'Garhwa Active',
              }),
            }).catch(() => {});
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      }
    };

    pingLocation();
    const interval = setInterval(pingLocation, 30000);
    return () => clearInterval(interval);
  }, [rider?.id, rider?.city, isOnline]);

  // Toggle Online/Offline
  const handleToggleOnline = async () => {
    if (!rider) return;
    const nextState = !isOnline;
    setIsOnline(nextState);

    try {
      await fetch(`/api/admin/riders/${rider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: nextState }),
      });
      const updated = { ...rider, isOnline: nextState };
      setRider(updated);
      localStorage.setItem('lapiez-rider', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to sync online status:', err);
    }
  };

  // Accept Order
  const handleAcceptOrder = async (order: Order) => {
    if (!rider) return;
    try {
      setActionLoading(order.id);
      const res = await fetch(`/api/orders/${order.orderId || order.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId: rider.id }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveTab('active');
        await fetchOrders(rider.id, true);
      } else {
        alert(data.error || 'Order accept nahi ho paya');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Mark Delivered
  const handleMarkDelivered = async (order: Order) => {
    const rate = Number(rider?.commissionPerOrder) || 25;
    if (!confirm(`Confirm delivery of #${order.orderId} to ${order.customerName}?`)) return;

    try {
      setActionLoading(order.id);
      const res = await fetch(`/api/orders/${order.orderId || order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutAmount: rate }),
      });

      const data = await res.json();
      if (res.ok) {
        await fetchOrders(rider.id, true);
      } else {
        alert(data.error || 'Delivery mark fail hua');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lapiez-rider');
    localStorage.removeItem('lapiez-rider-token');
    router.push('/rider/login');
  };

  if (!rider) {
    return (
      <div className="min-h-screen bg-slate-50 text-gray-800 flex items-center justify-center text-sm font-semibold">
        Loading Lapiez Rider App...
      </div>
    );
  }

  const rate = Number(rider.commissionPerOrder) || 25;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 flex flex-col pb-24">
      {/* Top Header Sticky */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center justify-between max-w-lg mx-auto gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-[#1A56DB] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Bike className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm text-gray-900 truncate">{rider.name}</h1>
                {rider.riderCode && (
                  <span className="text-[10px] font-mono font-bold text-[#1A56DB] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                    {rider.riderCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 truncate">
                {rider.vehicleType || 'BIKE'} {rider.vehicleNumber ? `• ${rider.vehicleNumber}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleToggleOnline}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isOnline
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>

            <Link
              href="/rider/portal"
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200 transition-colors"
              title="Payout & Bank Portal"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        {/* Wallet & Today Stats Card */}
        <div className="bg-gradient-to-br from-[#1A56DB] via-[#1E40AF] to-[#0A2560] rounded-3xl p-4 sm:p-5 shadow-lg text-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-blue-100 block">Wallet Balance</span>
              <div className="text-3xl font-black text-white mt-0.5">
                ₹{Number(rider.walletBalance || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <Link
              href="/rider/portal"
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs text-white font-bold flex items-center gap-1 border border-white/20 transition-colors"
            >
              <span>Bank / Payouts</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15 text-center text-xs">
            <div className="bg-black/15 rounded-xl p-2 border border-white/10">
              <span className="text-[10px] text-blue-100/80 block">Today Done</span>
              <strong className="text-sm font-black text-white">{stats.todayDeliveries}</strong>
            </div>
            <div className="bg-black/15 rounded-xl p-2 border border-white/10">
              <span className="text-[10px] text-blue-100/80 block">Today Earned</span>
              <strong className="text-sm font-black text-emerald-300">₹{stats.todayEarnings}</strong>
            </div>
            <div className="bg-black/15 rounded-xl p-2 border border-white/10">
              <span className="text-[10px] text-blue-100/80 block">COD Cash Today</span>
              <strong className="text-sm font-black text-amber-200">₹{stats.codCollectedToday}</strong>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'available' ? 'bg-[#1A56DB] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Ready ({availableOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'active' ? 'bg-orange-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Active ({activeOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Done ({completedOrders.length})</span>
          </button>
        </div>

        {/* Refresh Header */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span className="font-semibold">
            {activeTab === 'available'
              ? 'Available Delivery Pool'
              : activeTab === 'active'
              ? 'Assigned to You'
              : 'Completed Deliveries'}
          </span>
          <button
            type="button"
            onClick={() => fetchOrders(rider.id, true)}
            className="flex items-center gap-1 text-[#1A56DB] hover:text-[#1E40AF] font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* TAB 1: AVAILABLE ORDERS */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            {initialLoading && availableOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">Loading orders...</div>
            ) : availableOrders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-2 shadow-xs">
                <Bike className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="font-bold text-gray-900 text-base">Abhi koi Ready order nahi hai</h3>
                <p className="text-gray-500 text-xs">Store se order ready hote hi yahan dikhega.</p>
              </div>
            ) : (
              availableOrders.map((order) => {
                const items = parseOrderItems(order.itemsJson);
                return (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-[#1A56DB] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          #{order.orderId}
                        </span>
                        <h4 className="font-bold text-gray-900 text-base mt-1.5">{order.customerName}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-600">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                        <span className="block text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5">
                          {order.paymentMethod} • {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-700">
                        {items.map((it, idx) => (
                          <span key={idx} className="bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200 font-medium">
                            {it.quantity}x {it.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs text-gray-700 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{order.address}</span>
                    </div>

                    <div className="pt-1 flex gap-2">
                      <a
                        href={`tel:${order.phone}`}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-gray-200 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#1A56DB]" />
                        <span>Call</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleAcceptOrder(order)}
                        disabled={actionLoading === order.id}
                        className="flex-[2] bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{actionLoading === order.id ? 'Accepting...' : `Accept (₹${rate})`}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE ON-ROAD ORDERS */}
        {activeTab === 'active' && (
          <div className="space-y-3">
            {activeOrders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-2 shadow-xs">
                <Navigation className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="font-bold text-gray-900 text-base">Koi active delivery nahi hai</h3>
                <p className="text-gray-500 text-xs">Ready tab se order accept karein ya Admin dispatch ka wait karein.</p>
              </div>
            ) : (
              activeOrders.map((order) => {
                const items = parseOrderItems(order.itemsJson);
                const cleanCustPhone = (order.phone || '').replace(/\D/g, '').slice(-10);
                return (
                  <div key={order.id} className="bg-white border-2 border-orange-400 rounded-3xl p-4 sm:p-5 shadow-md space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                            {order.orderStatus}
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-600">#{order.orderId}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg mt-1">{order.customerName}</h4>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 font-medium">
                          <Phone className="w-3 h-3 text-[#1A56DB]" /> {order.phone}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-600">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                        <span className={`block text-[11px] font-bold ${
                          order.paymentStatus === 'Paid' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-800 bg-amber-50'
                        } px-2 py-0.5 rounded mt-0.5 border border-gray-200`}>
                          {order.paymentMethod === 'COD' && order.paymentStatus !== 'Paid' ? 'Collect Cash (COD)' : order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-700">
                        {items.map((it, idx) => (
                          <span key={idx} className="bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1 font-medium">
                            <Package className="w-3 h-3 text-[#1A56DB]" />
                            <span>{it.quantity}x {it.name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2 text-xs">
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-medium">{order.address}</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#1A56DB] font-bold hover:underline pt-0.5"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Navigate on Google Maps</span>
                      </a>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${order.phone}`}
                        className="px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-gray-200 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[#1A56DB]" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://wa.me/91${cleanCustPhone}?text=${encodeURIComponent(`Namaste ${order.customerName} ji, main Lapiez Delivery Rider (${rider.name}) aapka Order #${order.orderId} lekar aa raha hu.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors"
                        title="Message Customer on WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleMarkDelivered(order)}
                        disabled={actionLoading === order.id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{actionLoading === order.id ? 'Saving...' : `Delivered (+₹${rate})`}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: COMPLETED DELIVERIES */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedOrders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-2 shadow-xs">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="font-bold text-gray-900 text-base">Abhi tak koi delivery complete nahi hui</h3>
                <p className="text-gray-500 text-xs">Har delivery par ₹{rate} wallet me add honge.</p>
              </div>
            ) : (
              completedOrders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-600">#{order.orderId}</span>
                      <span className="text-[10px] text-gray-500">₹{order.totalAmount.toLocaleString('en-IN')} ({order.paymentMethod})</span>
                    </div>
                    <h5 className="font-bold text-gray-900 text-sm truncate mt-0.5">{order.customerName}</h5>
                    <p className="text-[11px] text-gray-500 truncate">{order.address}</p>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex-shrink-0">
                    +₹{rate}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Bottom Floating Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2.5 z-30 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-around text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex flex-col items-center gap-1 font-bold cursor-pointer ${
              activeTab !== 'completed' ? 'text-[#1A56DB]' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Bike className="w-5 h-5" />
            <span>Orders</span>
          </button>

          <Link href="/rider/portal" className="flex flex-col items-center gap-1 font-bold text-gray-400 hover:text-gray-700">
            <Wallet className="w-5 h-5" />
            <span>Kamai / Payout</span>
          </Link>

          <a
            href="/downloads/lapiez-rider.apk"
            download="Lapiez-Rider-App.apk"
            className="flex flex-col items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
          >
            <Download className="w-5 h-5" />
            <span>APK</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
          >
            <Power className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
