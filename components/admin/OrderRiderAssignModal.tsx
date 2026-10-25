'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bike, CheckCircle, MapPin, Phone, User, Clock, 
  Send, X, AlertCircle, ShieldCheck, Navigation, ChevronRight,
  Search, MessageSquare, ExternalLink, Sparkles
} from 'lucide-react';

interface ActiveOrder {
  orderId: string;
  orderStatus: string;
  customerName?: string;
  totalAmount?: number;
}

interface Rider {
  id: string;
  riderCode?: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber?: string;
  city?: string;
  approvalStatus: string;
  isOnline: boolean;
  isBlocked: boolean;
  currentLat?: number;
  currentLng?: number;
  lastLocationText?: string;
  lastActiveAt?: string;
  orders?: ActiveOrder[];
  _count?: {
    orders: number;
    payouts: number;
  };
}

interface OrderRiderAssignModalProps {
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  totalAmount: number;
  currentRiderId?: string | null;
  onClose: () => void;
  onSuccess: (updatedOrder: any, assignedRider: any) => void;
}

export default function OrderRiderAssignModal({
  orderId,
  customerName,
  customerPhone,
  address,
  totalAmount,
  currentRiderId,
  onClose,
  onSuccess,
}: OrderRiderAssignModalProps) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState<string>(currentRiderId || '');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetch('/api/admin/riders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter only approved and non-blocked riders
          setRiders(data.filter((r) => r.approvalStatus === 'APPROVED' && !r.isBlocked));
        }
      })
      .catch((err) => console.error('Failed to load riders for dispatch:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedRiderId) {
      alert('Kripya ek delivery rider select karein!');
      return;
    }

    try {
      setIsAssigning(true);
      const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId: selectedRiderId, orderStatus: 'Out For Delivery' }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Order rider ko dispatch ho gaya!');
        onSuccess(data.order, data.rider);
        onClose();
      } else {
        alert(data.error || 'Assign fail hua');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm('Kya aap rider ko unassign karke order ko wapas free pool me daalna chahte hain?')) return;

    try {
      setIsAssigning(true);
      const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId: null, orderStatus: 'Ready' }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Rider unassign ho gaya. Order wapas open pool me hai.');
        onSuccess(data.order, null);
        onClose();
      } else {
        alert(data.error || 'Unassign fail hua');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return 'Inactive';
    const diffMin = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin <= 1) return 'Just now (Live 🟢)';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  };

  // Filtered riders
  const filtered = useMemo(() => {
    return riders.filter((r) => {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.riderCode && r.riderCode.toLowerCase().includes(q)) ||
        (r.vehicleType && r.vehicleType.toLowerCase().includes(q)) ||
        (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(q)) ||
        (r.lastLocationText && r.lastLocationText.toLowerCase().includes(q))
      );
    });
  }, [riders, search]);

  const onlineRiders = filtered.filter((r) => r.isOnline);
  const offlineRiders = filtered.filter((r) => !r.isOnline);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2271b1] text-white rounded-2xl shadow-xs">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                <span>Dispatch Order to Rider</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                  LIVE FLEET
                </span>
              </h3>
              <p className="text-xs text-gray-500">Select which delivery partner will deliver this order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Order Preview Strip */}
        <div className="p-4 bg-gray-50/80 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-gray-400 block font-semibold">Order ID</span>
            <span className="font-mono font-bold text-blue-700">#{orderId}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold">Customer</span>
            <span className="font-bold text-gray-800 truncate block">{customerName}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold">Bill Amount</span>
            <span className="font-black text-emerald-600">₹{totalAmount}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold">Delivery Area</span>
            <span className="text-gray-700 truncate block font-medium" title={address}>{address}</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3 bg-white border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rider by name, phone, area, vehicle..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
            />
          </div>
        </div>

        {/* Riders Selection List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Available Delivery Partners ({onlineRiders.length} Online)
            </h4>
            <span className="text-[11px] text-gray-400">Green = Currently On-Road</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading available riders...</div>
          ) : riders.length === 0 ? (
            <div className="py-12 text-center bg-gray-50 rounded-2xl p-6 text-gray-400">
              <Bike className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-gray-600">Koi approved rider nahi mila</p>
              <p className="text-xs mt-1">Pehle "Delivery Riders" tab se rider add ya approve karein.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* ONLINE RIDERS FIRST */}
              {onlineRiders.map((rider) => {
                const activeCount = rider.orders?.length || 0;
                const isSelected = selectedRiderId === rider.id;
                const isCurrentlyAssigned = currentRiderId === rider.id;

                return (
                  <label
                    key={rider.id}
                    onClick={() => setSelectedRiderId(rider.id)}
                    className={`border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2271b1] bg-blue-50/70 shadow-xs ring-2 ring-[#2271b1]/30'
                        : isCurrentlyAssigned
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="selectedRider"
                        checked={isSelected}
                        onChange={() => setSelectedRiderId(rider.id)}
                        className="w-4 h-4 text-[#2271b1] focus:ring-[#2271b1]"
                      />

                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2271b1] to-[#135e96] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {rider.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-gray-900">{rider.name}</span>
                          <span className="font-mono text-[10px] font-bold text-[#2271b1] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {rider.riderCode}
                          </span>
                          
                          {activeCount === 0 ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              FREE & READY
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              BUSY ({activeCount} on-going)
                            </span>
                          )}

                          {isCurrentlyAssigned && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.2 rounded-full font-bold">
                              Current Rider
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>🏍️ {rider.vehicleType} ({rider.vehicleNumber || 'No plate'})</span>
                          <span className="flex items-center gap-1 text-gray-700 font-medium">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <strong className="truncate max-w-[190px]">{rider.lastLocationText || rider.city || 'Garhwa Area'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="text-[10px] text-gray-400 block font-semibold">Active Status</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {formatLastActive(rider.lastActiveAt)}
                      </span>
                    </div>
                  </label>
                );
              })}

              {/* OFFLINE RIDERS */}
              {offlineRiders.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1 px-1">
                    Offline Riders ({offlineRiders.length})
                  </span>
                  <div className="space-y-2 opacity-75">
                    {offlineRiders.map((rider) => (
                      <label
                        key={rider.id}
                        onClick={() => setSelectedRiderId(rider.id)}
                        className={`border rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                          selectedRiderId === rider.id
                            ? 'border-[#2271b1] bg-blue-50 shadow-xs'
                            : 'border-gray-200 bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedRider"
                            checked={selectedRiderId === rider.id}
                            onChange={() => setSelectedRiderId(rider.id)}
                            className="w-4 h-4 text-[#2271b1]"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-gray-700">{rider.name}</span>
                              <span className="font-mono text-[10px] text-gray-500">{rider.riderCode}</span>
                              <span className="text-[10px] text-gray-400">({rider.vehicleType})</span>
                            </div>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span>{rider.lastLocationText || rider.city || 'Garhwa'} • Last active: {formatLastActive(rider.lastActiveAt)}</span>
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          {currentRiderId ? (
            <button
              type="button"
              onClick={handleUnassign}
              disabled={isAssigning}
              className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
            >
              Unassign Current Rider
            </button>
          ) : (
            <div className="text-xs text-gray-500">
              Rider select karke <strong>"Send Order to Rider"</strong> dabayein.
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAssign}
              disabled={isAssigning || !selectedRiderId}
              className="px-5 py-2.5 rounded-xl bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAssigning ? 'Sending...' : 'Send Order to Rider 🚀'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
