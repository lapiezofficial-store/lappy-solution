'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Pusher from 'pusher-js';
import { 
  Bike, Power, MapPin, Phone, CheckCircle, Navigation, 
  Wallet, RefreshCw, AlertTriangle, ArrowRight, User, ExternalLink,
  Clock, IndianRupee, Bell
} from 'lucide-react';

interface OrderItem {
  id: string;
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
}

export default function RiderApp() {
  const router = useRouter();
  const [rider, setRider] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');

  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // 2. Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders/ready');
      if (res.ok) {
        const data = await res.json();
        setAvailableOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load ready orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rider) {
      fetchOrders();
    }
  }, [rider]);

  // 3. Pusher Real-time Listener (Audio ding + Live order sync)
  useEffect(() => {
    if (!rider) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

    if (!pusherKey) return;

    let pusher: Pusher | null = null;
    try {
      pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
      });

      const channel = pusher.subscribe('riders-channel');

      // Jab naya order READY ho
      channel.bind('new-order', (newOrder: Order) => {
        // Ding sound
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch {}

        setAvailableOrders((prev) => {
          if (prev.some((o) => o.orderId === newOrder.orderId)) return prev;
          return [newOrder, ...prev];
        });
      });

      // Jab koi order kisi rider ne accept kar liya ho
      channel.bind('order-taken', (data: { orderId: string; dbId: string }) => {
        setAvailableOrders((prev) =>
          prev.filter((o) => o.orderId !== data.orderId && o.id !== data.dbId)
        );
      });
    } catch (err) {
      console.warn('Pusher init skipped:', err);
    }

    return () => {
      if (pusher) {
        pusher.unsubscribe('riders-channel');
      }
    };
  }, [rider]);

  // 4. Live GPS Location & Activity Ping to Admin
  useEffect(() => {
    if (!rider || !isOnline) return;

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
    const interval = setInterval(pingLocation, 30000); // Send ping every 30s
    return () => clearInterval(interval);
  }, [rider, isOnline]);

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
        alert('Order Accept Ho Gaya! Raste me niklo 🚀');
        // Remove from available and add to active
        setAvailableOrders((prev) => prev.filter((o) => o.id !== order.id && o.orderId !== order.orderId));
        setActiveOrders((prev) => [order, ...prev]);
        setActiveTab('active');
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
    const confirmDelivered = confirm(`Kya aapne order #${order.orderId} customer ko deliver kar diya hai?`);
    if (!confirmDelivered) return;

    try {
      setActionLoading(order.id);
      const res = await fetch(`/api/orders/${order.orderId || order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutAmount: 25 }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Delivered! ₹25 aapke wallet me jud gaye 🎉');
        setActiveOrders((prev) => prev.filter((o) => o.id !== order.id));
        setCompletedOrders((prev) => [order, ...prev]);
        // Update wallet balance in rider state
        const updatedBalance = (rider.walletBalance || 0) + 25;
        const updated = { ...rider, walletBalance: updatedBalance };
        setRider(updated);
        localStorage.setItem('lapiez-rider', JSON.stringify(updated));
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
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading Rider App...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col pb-24">
      {/* Top Header Sticky */}
      <header className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white">{rider.name}</h1>
              <p className="text-[11px] text-gray-400">Garhwa Express • {rider.vehicleType || 'BIKE'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleOnline}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isOnline
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-ping' : 'bg-gray-500'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </button>

            <Link
              href="/rider/portal"
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700/80"
              title="Rider Web Portal"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        {/* Wallet Balance Hero Card */}
        <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-200">Current Unpaid Earnings</span>
            <Link href="/rider/portal" className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1">
              Portal <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="text-3xl font-black text-white mt-1 flex items-baseline gap-1">
            <span>₹</span>
            <span>{rider.walletBalance || 0}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400 border-t border-blue-500/20 pt-2">
            <span>Rate: <strong>₹25 / delivery</strong></span>
            <span>Vehicle: <strong>{rider.vehicleType}</strong></span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-900 p-1 rounded-2xl border border-gray-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'available'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Ready ({availableOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Active ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Done ({completedOrders.length})</span>
          </button>
        </div>

        {/* TAB 1: AVAILABLE READY ORDERS */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>Ready for pickup at store:</span>
              <button
                onClick={fetchOrders}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500 text-sm">Checking ready orders...</div>
            ) : availableOrders.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-8 text-center space-y-2">
                <Bike className="w-12 h-12 text-gray-600 mx-auto" />
                <h3 className="font-bold text-white text-base">Abhi koi Ready order nahi hai</h3>
                <p className="text-gray-400 text-xs">Jaise hi store se order pack hoga, aapko sound alert aayega.</p>
              </div>
            ) : (
              availableOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                        #{order.orderId}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1.5">{order.customerName}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-400">₹{order.totalAmount}</span>
                      <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 p-3 rounded-2xl border border-gray-700/50 text-xs text-gray-300 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{order.address}</span>
                  </div>

                  <div className="pt-1 flex gap-2">
                    <a
                      href={`tel:${order.phone}`}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-gray-700"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>Call</span>
                    </a>

                    <button
                      onClick={() => handleAcceptOrder(order)}
                      disabled={actionLoading === order.id}
                      className="flex-[2] bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{actionLoading === order.id ? 'Accepting...' : 'Accept Delivery 🚀'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE ON-ROAD ORDERS */}
        {activeTab === 'active' && (
          <div className="space-y-3">
            {activeOrders.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-8 text-center space-y-2">
                <Navigation className="w-12 h-12 text-gray-600 mx-auto" />
                <h3 className="font-bold text-white text-base">Koi active delivery nahi hai</h3>
                <p className="text-gray-400 text-xs">Pehle "Ready" tab se koi order accept karein.</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-900 border-2 border-orange-500/50 rounded-3xl p-5 shadow-xl space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                        ON THE WAY
                      </span>
                      <h4 className="font-bold text-white text-lg mt-1">{order.customerName}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {order.phone}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-400">₹{order.totalAmount}</span>
                      <span className="block text-[11px] font-bold text-amber-300">
                        {order.paymentMethod === 'COD' ? 'Collect Cash' : 'Paid Online'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-800/80 p-3.5 rounded-2xl border border-gray-700 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-gray-200">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{order.address}</span>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-400 font-bold hover:underline pt-1"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Open Google Maps
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`tel:${order.phone}`}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-gray-700"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>Call Customer</span>
                    </a>

                    <button
                      onClick={() => handleMarkDelivered(order)}
                      disabled={actionLoading === order.id}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Updating...' : 'Mark Delivered (₹25)'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: COMPLETED DELIVERIES */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedOrders.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800/80 rounded-3xl p-8 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-gray-600 mx-auto" />
                <h3 className="font-bold text-white text-base">Aaj abhi tak koi delivery deliver nahi hui</h3>
                <p className="text-gray-400 text-xs">Har delivery par aapko ₹25 instantly milenge.</p>
              </div>
            ) : (
              completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-900 border border-gray-800 rounded-3xl p-4 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-400">#{order.orderId}</span>
                    <h5 className="font-bold text-white text-sm">{order.customerName}</h5>
                    <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{order.address}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      +₹25 Earned
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Bottom Floating Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-3 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-around text-xs">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex flex-col items-center gap-1 font-bold ${
              activeTab === 'available' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <Bike className="w-5 h-5" />
            <span>Orders</span>
          </button>

          <Link
            href="/rider/portal"
            className="flex flex-col items-center gap-1 font-bold text-gray-400 hover:text-white"
          >
            <Wallet className="w-5 h-5" />
            <span>Kamai / Payout</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 font-bold text-rose-400 hover:text-rose-300"
          >
            <Power className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
