'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bike, Plus, Search, RefreshCw, CheckCircle, XCircle, 
  Wallet, Shield, ShieldAlert, Phone, User, DollarSign,
  AlertCircle, Check, MapPin, Truck, ChevronRight, Edit2,
  Trash2, ShieldCheck, Key, FileText, Ban, UserCheck, UserX,
  CreditCard, Navigation, ExternalLink, AlertTriangle, Radar,
  Map, Eye, Compass, Activity, Send, MessageSquare
} from 'lucide-react';

interface Rider {
  id: string;
  riderCode?: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType: string;
  vehicleNumber?: string;
  dlNumber?: string;
  city?: string;
  emergencyContact?: string;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
  isOnline: boolean;
  isBlocked: boolean;
  blockReason?: string;
  commissionPerOrder: number;
  walletBalance: number;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankUpi?: string;
  currentLat?: number;
  currentLng?: number;
  lastLocationText?: string;
  lastActiveAt?: string;
  lastDeliveryAt?: string;
  orders?: {
    orderId: string;
    orderStatus: string;
    customerName?: string;
    address?: string;
    totalAmount?: number;
  }[];
  _count?: {
    orders: number;
    payouts: number;
  };
  createdAt: string;
}

export default function RidersManager() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'tracking' | 'pending' | 'approved' | 'blocked'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  // Forms
  const [addForm, setAddForm] = useState({
    name: '',
    phone: '',
    password: '',
    vehicleType: 'BIKE',
    vehicleNumber: '',
    dlNumber: '',
    city: 'Garhwa',
    commissionPerOrder: '25',
    customRiderCode: '',
    approvalStatus: 'APPROVED',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'BIKE',
    vehicleNumber: '',
    dlNumber: '',
    city: 'Garhwa',
    commissionPerOrder: '25',
    password: '',
    bankUpi: '',
  });

  // Payout Form
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMode, setPayoutMode] = useState('UPI');
  const [utrNumber, setUtrNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRiders = async (showInitialLoader = false) => {
    try {
      if (showInitialLoader) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const res = await fetch('/api/admin/riders');
      if (res.ok) {
        const data = await res.json();
        setRiders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load riders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiders(true);
    // Auto-refresh GPS pings every 30s silently without unmounting UI or flickering
    const interval = setInterval(() => {
      fetchRiders(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format Relative Timestamp ("2 min ago", "Just now", etc.)
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'No activity yet';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin <= 1) return 'Just now (Live 🟢)';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  };

  // 1. ADD NEW RIDER
  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.phone || !addForm.password) {
      alert('Kripya Name, Phone aur Password bharein!');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Rider safalta se create ho gaya! 🎉\nRider ID: ${data.rider.riderCode || data.rider.id}`);
        setShowAddModal(false);
        setAddForm({
          name: '',
          phone: '',
          password: '',
          vehicleType: 'BIKE',
          vehicleNumber: '',
          dlNumber: '',
          city: 'Garhwa',
          commissionPerOrder: '25',
          customRiderCode: '',
          approvalStatus: 'APPROVED',
        });
        fetchRiders();
      } else {
        alert(data.error || 'Rider add karne me error aaya');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. APPROVE RIDER
  const handleApproveRider = async (rider: Rider) => {
    if (!confirm(`Kya aap ${rider.name} (${rider.riderCode || rider.phone}) ko APPROVE karna chahte hain?`)) return;

    try {
      const res = await fetch(`/api/admin/riders/${rider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: 'APPROVED' }),
      });

      if (res.ok) {
        alert(`${rider.name} ko approve kar diya gaya hai! Ab wo login aur delivery kar sakta hai.`);
        fetchRiders();
      } else {
        alert('Approve fail hua.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 3. REJECT RIDER
  const handleRejectRider = async (rider: Rider) => {
    const reason = prompt(`Reject karne ka karan dalein:`, 'Incomplete or unverified documents');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/admin/riders/${rider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: 'REJECTED', rejectionReason: reason }),
      });

      if (res.ok) {
        alert(`${rider.name} ka application REJECT kar diya gaya.`);
        fetchRiders();
      } else {
        alert('Reject fail hua.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 4. BLOCK / UNBLOCK RIDER
  const handleToggleBlock = async (rider: Rider) => {
    let reason = '';
    if (!rider.isBlocked) {
      const input = prompt(`Block karne ka reason dalein (optional):`, 'Policy violation or inactive');
      if (input === null) return;
      reason = input;
    } else {
      if (!confirm(`Kya aap ${rider.name} ko Unblock karna chahte hain?`)) return;
    }

    try {
      const res = await fetch(`/api/admin/riders/${rider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !rider.isBlocked, blockReason: reason }),
      });

      if (res.ok) {
        fetchRiders();
      } else {
        alert('Action fail hua.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 5. EDIT RIDER
  const handleOpenEdit = (rider: Rider) => {
    setSelectedRider(rider);
    setEditForm({
      name: rider.name,
      phone: rider.phone,
      email: rider.email || '',
      vehicleType: rider.vehicleType || 'BIKE',
      vehicleNumber: rider.vehicleNumber || '',
      dlNumber: rider.dlNumber || '',
      city: rider.city || 'Garhwa',
      commissionPerOrder: String(rider.commissionPerOrder || 25),
      password: '',
      bankUpi: rider.bankUpi || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRider) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/riders/${selectedRider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Rider details safalta se update ho gayi! 🎉');
        setShowEditModal(false);
        fetchRiders();
      } else {
        alert(data.error || 'Update fail hua');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. DELETE / REMOVE RIDER
  const handleDeleteRider = async (rider: Rider) => {
    const confirmName = prompt(`⚠️ WARNING: Kya aap pakka "${rider.name}" ko permanently delete karna chahte hain?\nConfirm karne ke liye rider ka naam likhein:`);
    if (confirmName !== rider.name) {
      if (confirmName !== null) alert('Naam match nahi kiya. Deletion cancel ho gaya.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/riders/${rider.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        alert('Rider permanently delete ho gaya.');
        fetchRiders();
      } else {
        alert(data.error || 'Delete fail hua');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 7. SETTLE PAYOUT
  const handleSettlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRider || !payoutAmount || Number(payoutAmount) <= 0) {
      alert('Sahi amount dalein');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: selectedRider.id,
          amount: Number(payoutAmount),
          paymentMode: payoutMode,
          utrNumber,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`₹${payoutAmount} Payout settle ho gaya!`);
        setShowPayoutModal(false);
        setPayoutAmount('');
        setUtrNumber('');
        fetchRiders();
      } else {
        alert(data.error || 'Payout fail hua');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Counts & Filter
  const pendingCount = riders.filter((r) => r.approvalStatus === 'PENDING').length;
  const approvedCount = riders.filter((r) => r.approvalStatus === 'APPROVED' && !r.isBlocked).length;
  const blockedCount = riders.filter((r) => r.isBlocked).length;
  const onlineCount = riders.filter((r) => r.isOnline && r.approvalStatus === 'APPROVED' && !r.isBlocked).length;
  const totalBalanceDue = riders.reduce((acc, r) => acc + (r.walletBalance || 0), 0);

  const filteredRiders = riders.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      (r.riderCode && r.riderCode.toLowerCase().includes(search.toLowerCase())) ||
      (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(search.toLowerCase())) ||
      (r.lastLocationText && r.lastLocationText.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return r.approvalStatus === 'PENDING';
    if (filterTab === 'approved') return r.approvalStatus === 'APPROVED' && !r.isBlocked;
    if (filterTab === 'blocked') return r.isBlocked;
    if (filterTab === 'tracking') return r.isOnline || r.lastLocationText;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Fleet Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Fleet */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Fleet</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Bike className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{riders.length}</div>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Total delivery partners</span>
        </div>

        {/* Card 2: Live Tracking & Online */}
        <div 
          onClick={() => setFilterTab('tracking')}
          className={`border rounded-2xl p-4 shadow-xs transition-all cursor-pointer ${
            filterTab === 'tracking' ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : 'bg-white border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase">Live On-Road GPS</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Radar className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{onlineCount}</div>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Live tracked in Garhwa/Palamu</span>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className={`border rounded-2xl p-4 shadow-xs transition-all ${
          pendingCount > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase">Pending Review</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{pendingCount}</div>
          <span className="text-[11px] text-amber-600 mt-0.5 block">Awaiting admin approve</span>
        </div>

        {/* Card 4: Unpaid Earnings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Pending Payouts</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">₹{totalBalanceDue.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Unsettled wallet balance</span>
        </div>

        {/* Card 5: Action Button */}
        <div className="bg-gradient-to-br from-[#2271b1] to-[#135e96] rounded-2xl p-4 shadow-sm text-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-blue-100">Quick Fleet Action</span>
            <h4 className="font-extrabold text-sm text-white mt-1">+ Create Rider ID</h4>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 bg-white text-[#135e96] hover:bg-blue-50 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Rider</span>
          </button>
        </div>
      </div>

      {/* Control Bar & Filter Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Rider ID, Name, Phone, Area..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'all' ? 'bg-white shadow-xs text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              All Fleet ({riders.length})
            </button>

            <button
              onClick={() => setFilterTab('tracking')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTab === 'tracking' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-700 hover:text-emerald-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Live GPS Tracking ({onlineCount})</span>
            </button>

            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterTab === 'pending' ? 'bg-amber-500 text-white shadow-xs font-bold' : 'text-amber-700 hover:text-amber-800'
              }`}
            >
              Pending ({pendingCount})
            </button>

            <button
              onClick={() => setFilterTab('approved')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'approved' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Approved ({approvedCount})
            </button>

            <button
              onClick={() => setFilterTab('blocked')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'blocked' ? 'bg-white shadow-xs text-red-600 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Blocked ({blockedCount})
            </button>
          </div>

          <button
            onClick={() => fetchRiders(false)}
            className="p-2 text-gray-500 hover:text-gray-800 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 shrink-0 cursor-pointer"
            title="Refresh Fleet List & GPS Locations"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* SPECIAL VIEW: LIVE GPS RADAR & TRACKING VIEW */}
      {filterTab === 'tracking' && (
        <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-6 shadow-xl border border-gray-800 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Radar className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Live Delivery Fleet Radar</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    REALTIME GPS
                  </span>
                </h3>
                <p className="text-xs text-gray-400">Track kon rider kahan hai, kab active hua, aur unki live location</p>
              </div>
            </div>

            <span className="text-xs text-gray-400 bg-gray-800/80 px-3 py-1.5 rounded-xl border border-gray-700/80 font-mono">
              Auto-sync: 30s
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {riders.map((rider) => {
              const mapsUrl = rider.currentLat && rider.currentLng 
                ? `https://www.google.com/maps?q=${rider.currentLat},${rider.currentLng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((rider.lastLocationText || rider.city || 'Garhwa') + ', Jharkhand')}`;

              return (
                <div
                  key={rider.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    rider.isOnline
                      ? 'bg-gray-800/80 border-emerald-500/40 shadow-lg'
                      : 'bg-gray-800/40 border-gray-700/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {rider.riderCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rider.isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {rider.isOnline ? '● LIVE ON-ROAD' : '○ OFFLINE'}
                        </span>
                      </div>
                      <h4 className="font-black text-white text-base mt-1.5">{rider.name}</h4>
                      <p className="text-xs text-gray-400">📞 {rider.phone}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-300 block">
                        {rider.vehicleType}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {rider.vehicleNumber || 'No plate'}
                      </span>
                    </div>
                  </div>

                  {/* Location Strip */}
                  <div className="mt-3 bg-gray-900/80 p-3 rounded-xl border border-gray-700/60 space-y-1.5 text-xs">
                    <div className="flex items-start gap-2 text-gray-200">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white block">
                          {rider.lastLocationText || rider.city || 'Garhwa Area'}
                        </span>
                        {rider.currentLat && rider.currentLng && (
                          <span className="text-[10px] font-mono text-gray-500 block">
                            GPS: {rider.currentLat.toFixed(4)}, {rider.currentLng.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-800">
                      <span>Kab Active Hua:</span>
                      <strong className="text-emerald-400 font-mono">{formatTimeAgo(rider.lastActiveAt)}</strong>
                    </div>
                  </div>

                  {/* Active Delivery Status */}
                  {rider.orders && rider.orders.length > 0 ? (
                    <div className="mt-2 bg-amber-500/20 border border-amber-500/30 rounded-xl p-2 text-xs flex items-center justify-between text-amber-200">
                      <span className="flex items-center gap-1.5 font-bold truncate max-w-[190px]">
                        <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Delivering #{rider.orders[0].orderId}</span>
                      </span>
                      <span className="text-[10px] bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded shrink-0">
                        ₹{rider.orders[0].totalAmount || ''}
                      </span>
                    </div>
                  ) : rider.isOnline ? (
                    <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-1.5 text-[11px] text-emerald-300 flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Ready for Delivery (No Active Orders)</span>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Live Google Maps</span>
                    </a>

                    <a
                      href={`https://wa.me/91${rider.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${rider.name}, Lapiez Admin here regarding order delivery dispatch.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                      title="Chat on WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={`tel:${rider.phone}`}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-bold"
                      title="Direct Call Rider"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RIDERS LIST / GRID */}
      {loading && riders.length === 0 ? (
        <div className="py-20 text-center text-gray-400">Loading delivery fleet...</div>
      ) : filteredRiders.length === 0 ? (
        <div className="py-16 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <Bike className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700">Koi Rider Nahi Mila</h3>
          <p className="text-gray-400 text-xs mt-1">Upar diye gaye "+ Add New Rider" button se naya rider add karein.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredRiders.map((rider) => {
            const mapsUrl = rider.currentLat && rider.currentLng 
              ? `https://www.google.com/maps?q=${rider.currentLat},${rider.currentLng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((rider.lastLocationText || rider.city || 'Garhwa') + ', Jharkhand')}`;

            return (
              <div
                key={rider.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between h-full ${
                  rider.approvalStatus === 'PENDING'
                    ? 'border-amber-300 bg-amber-50/15'
                    : rider.isBlocked
                    ? 'border-red-200 bg-red-50/15'
                    : 'border-gray-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Rider Code + Status Badge (Full width, zero wrapping) */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 whitespace-nowrap shrink-0 tracking-wide">
                        {rider.riderCode || 'ID: ' + rider.id.slice(-6)}
                      </span>
                      {rider.city && (
                        <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 truncate" title={rider.city}>
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span className="truncate">{rider.city}</span>
                        </span>
                      )}
                    </div>

                    {/* Status Badges - Guaranteed whitespace-nowrap */}
                    <div className="shrink-0">
                      {rider.approvalStatus === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          PENDING APPROVAL
                        </span>
                      ) : rider.approvalStatus === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 border border-rose-300 whitespace-nowrap shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          REJECTED
                        </span>
                      ) : rider.isBlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-300 whitespace-nowrap shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          BLOCKED
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shadow-2xs ${
                            rider.isOnline
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              rider.isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                          {rider.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rider Profile: Avatar + Name + Phone */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2271b1] to-[#135e96] text-white flex items-center justify-center font-extrabold text-lg shadow-sm shrink-0">
                      {rider.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-gray-900 text-base leading-snug truncate" title={rider.name}>
                        {rider.name}
                      </h3>
                      <a
                        href={`tel:${rider.phone}`}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors mt-0.5"
                        title="Call rider"
                      >
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span className="font-mono">{rider.phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Live Location Strip (Kahan Hai & Kab Gaya) */}
                  <div className="bg-gray-50/90 p-2.5 rounded-xl border border-gray-100 text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">CURRENT LOCATION</span>
                          <span className="font-semibold text-gray-800 leading-snug truncate block" title={rider.lastLocationText || rider.city || 'Garhwa'}>
                            {rider.lastLocationText || rider.city || 'Garhwa'}
                          </span>
                        </div>
                      </div>

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-600 rounded-lg border border-gray-200 text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-2xs hover:border-blue-300 transition-all"
                        title="Open on Google Maps"
                      >
                        <Compass className="w-3 h-3 text-blue-500" />
                        <span>Maps</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                      <span className="text-gray-400 font-medium">Kab Active Hua:</span>
                      <strong className="text-emerald-700 font-mono font-bold text-xs">
                        {formatTimeAgo(rider.lastActiveAt)}
                      </strong>
                    </div>
                  </div>

                  {/* Uniform Status Strip - Guaranteed equal height on all cards */}
                  <div>
                    {rider.approvalStatus === 'PENDING' ? (
                      <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-800 flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 truncate">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">Approval Pending - Review Details</span>
                        </span>
                        <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded shrink-0">
                          NEW
                        </span>
                      </div>
                    ) : rider.isBlocked ? (
                      <div className="bg-red-50 border border-red-200/80 rounded-xl px-2.5 py-1.5 text-[11px] text-red-700 flex items-center gap-1.5 font-semibold">
                        <Ban className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="truncate">Account Suspended / Blocked</span>
                      </div>
                    ) : rider.approvalStatus === 'REJECTED' ? (
                      <div className="bg-rose-50 border border-rose-200/80 rounded-xl px-2.5 py-1.5 text-[11px] text-rose-700 flex items-center gap-1.5 font-semibold">
                        <UserX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">Application Rejected</span>
                      </div>
                    ) : rider.orders && rider.orders.length > 0 ? (
                      <div className="bg-blue-50 border border-blue-200/80 rounded-xl px-2.5 py-1.5 text-[11px] text-blue-900 flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 truncate">
                          <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">On Delivery #{rider.orders[0].orderId}</span>
                        </span>
                        <span className="text-[10px] bg-blue-200/80 text-blue-800 font-bold px-1.5 py-0.5 rounded shrink-0">
                          {rider.orders[0].orderStatus}
                        </span>
                      </div>
                    ) : rider.isOnline ? (
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl px-2.5 py-1.5 text-[11px] text-emerald-800 flex items-center gap-1.5 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">Ready & Free for Delivery</span>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl px-2.5 py-1.5 text-[11px] text-gray-600 flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                        <span className="truncate">Offline / Off Duty</span>
                      </div>
                    )}
                  </div>

                  {/* Details Grid: Wallet, Rate/Order, Vehicle */}
                  <div className="grid grid-cols-3 gap-2 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 text-center">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">WALLET</span>
                      <span className="text-sm font-black text-emerald-600">
                        ₹{rider.walletBalance || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">RATE/ORDER</span>
                      <span className="text-xs font-black text-gray-700">
                        ₹{rider.commissionPerOrder || 25}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">VEHICLE</span>
                      <span className="text-xs font-black text-gray-700 uppercase truncate block">
                        {rider.vehicleType}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle & DL info */}
                  <div className="text-[11px] text-gray-600 space-y-1 bg-white p-2.5 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Plate:</span>
                      <span className="font-mono font-bold text-gray-800 text-[11px] truncate max-w-[180px] text-right">
                        {rider.vehicleNumber || 'No plate'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">DL:</span>
                      <span className="font-mono font-bold text-gray-800 text-[11px] truncate max-w-[180px] text-right" title={rider.dlNumber}>
                        {rider.dlNumber || 'Not entered'}
                      </span>
                    </div>
                  </div>

                  {/* Rejection or Block Reason Notice */}
                  {rider.isBlocked && rider.blockReason && (
                    <div className="text-[11px] bg-red-50 text-red-700 p-2 rounded-lg border border-red-200">
                      <strong>Block Reason:</strong> {rider.blockReason}
                    </div>
                  )}
                  {rider.approvalStatus === 'REJECTED' && rider.rejectionReason && (
                    <div className="text-[11px] bg-rose-50 text-rose-700 p-2 rounded-lg border border-rose-200">
                      <strong>Rejection Reason:</strong> {rider.rejectionReason}
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS FOOTER - Unified 1-Row layout */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  {rider.approvalStatus === 'PENDING' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApproveRider(rider)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-all whitespace-nowrap"
                        title="Approve and activate rider"
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Approve Rider</span>
                      </button>
                      <button
                        onClick={() => handleRejectRider(rider)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-all whitespace-nowrap shrink-0"
                        title="Reject rider application"
                      >
                        <UserX className="w-3.5 h-3.5 shrink-0" />
                        <span>Reject</span>
                      </button>
                      <a
                        href={`https://wa.me/91${rider.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${rider.name}, Lapiez Admin here regarding your rider registration.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 shrink-0 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleOpenEdit(rider)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold shrink-0 transition-colors"
                        title="Edit Rider Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRider(rider)}
                        className="p-2 bg-gray-100 hover:bg-rose-100 text-gray-400 hover:text-rose-600 rounded-xl text-xs font-bold shrink-0 transition-colors"
                        title="Permanently Delete Rider"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : rider.approvalStatus === 'REJECTED' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApproveRider(rider)}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-all whitespace-nowrap"
                        title="Re-approve rider"
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Re-Approve</span>
                      </button>
                      <a
                        href={`https://wa.me/91${rider.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${rider.name}, Lapiez Admin here.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 shrink-0 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleOpenEdit(rider)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold shrink-0 transition-colors"
                        title="Edit Rider Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRider(rider)}
                        className="p-2 bg-gray-100 hover:bg-rose-100 text-gray-400 hover:text-rose-600 rounded-xl text-xs font-bold shrink-0 transition-colors"
                        title="Permanently Delete Rider"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedRider(rider);
                          setPayoutAmount(rider.walletBalance > 0 ? String(rider.walletBalance) : '');
                          setShowPayoutModal(true);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-all whitespace-nowrap"
                        title="Pay Rider Earnings"
                      >
                        <DollarSign className="w-3.5 h-3.5 shrink-0" />
                        <span>Payout</span>
                      </button>

                      <a
                        href={`https://wa.me/91${rider.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${rider.name}, Lapiez Admin here regarding order delivery dispatch.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 shrink-0 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleOpenEdit(rider)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold shrink-0 transition-colors"
                        title="Edit Rider Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleBlock(rider)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all whitespace-nowrap ${
                          rider.isBlocked
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                        title={rider.isBlocked ? 'Unblock Rider' : 'Block Rider'}
                      >
                        {rider.isBlocked ? 'Unblock' : 'Block'}
                      </button>

                      <button
                        onClick={() => handleDeleteRider(rider)}
                        className="p-2 bg-gray-100 hover:bg-rose-100 text-gray-400 hover:text-rose-600 rounded-xl text-xs font-bold shrink-0 transition-colors"
                        title="Permanently Delete Rider"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD / CREATE RIDER ID */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900">Create New Rider ID</h3>
                  <p className="text-xs text-gray-400">Lapiez Delivery Fleet Registration</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRider} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Rider Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2271b1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit phone number"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2271b1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Login Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Password for Rider App Login"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2271b1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Vehicle Type</label>
                  <select
                    value={addForm.vehicleType}
                    onChange={(e) => setAddForm({ ...addForm, vehicleType: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2271b1] bg-white"
                  >
                    <option value="BIKE">Motorcycle / Bike</option>
                    <option value="SCOOTY">Scooter / Scooty</option>
                    <option value="CYCLE">Bicycle / Cycle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. JH-03-AB-1234"
                    value={addForm.vehicleNumber}
                    onChange={(e) => setAddForm({ ...addForm, vehicleNumber: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Driving License (DL)</label>
                  <input
                    type="text"
                    placeholder="e.g. DL-1234567890"
                    value={addForm.dlNumber}
                    onChange={(e) => setAddForm({ ...addForm, dlNumber: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">City / Area</label>
                  <input
                    type="text"
                    placeholder="Garhwa"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Custom Rider ID</label>
                  <input
                    type="text"
                    placeholder="Auto (LAP-RD-xxx)"
                    value={addForm.customRiderCode}
                    onChange={(e) => setAddForm({ ...addForm, customRiderCode: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Rate / Order (₹)</label>
                  <input
                    type="number"
                    value={addForm.commissionPerOrder}
                    onChange={(e) => setAddForm({ ...addForm, commissionPerOrder: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold py-2.5 rounded-xl text-xs shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating ID...' : 'Create & Approve Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT RIDER DETAILS */}
      {showEditModal && selectedRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900">Edit Rider Details</h3>
                  <p className="text-xs text-gray-400">{selectedRider.riderCode || selectedRider.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Rider Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Vehicle Type</label>
                  <select
                    value={editForm.vehicleType}
                    onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="BIKE">Motorcycle / Bike</option>
                    <option value="SCOOTY">Scooter / Scooty</option>
                    <option value="CYCLE">Bicycle / Cycle</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={editForm.vehicleNumber}
                    onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Driving License (DL)</label>
                  <input
                    type="text"
                    value={editForm.dlNumber}
                    onChange={(e) => setEditForm({ ...editForm, dlNumber: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Rate Per Delivery (₹)</label>
                  <input
                    type="number"
                    value={editForm.commissionPerOrder}
                    onChange={(e) => setEditForm({ ...editForm, commissionPerOrder: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. name@upi"
                    value={editForm.bankUpi}
                    onChange={(e) => setEditForm({ ...editForm, bankUpi: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Reset Password (Leave blank to keep same)</label>
                  <input
                    type="password"
                    placeholder="New password if resetting"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold py-2.5 rounded-xl text-xs shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SETTLE PAYOUT */}
      {showPayoutModal && selectedRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900">Settle Rider Payout</h3>
                  <p className="text-xs text-gray-500">{selectedRider.name} (📞 {selectedRider.phone})</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettlePayout} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <div className="text-xs text-emerald-700 font-semibold">Current Unpaid Earnings</div>
                <div className="text-2xl font-black text-emerald-800 mt-1">₹{selectedRider.walletBalance || 0}</div>
                {selectedRider.bankUpi && (
                  <div className="text-xs text-emerald-600 mt-1">Linked UPI: <strong>{selectedRider.bankUpi}</strong></div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Amount to Pay (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Payment Method</label>
                <select
                  value={payoutMode}
                  onChange={(e) => setPayoutMode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="UPI">Google Pay / PhonePe (UPI)</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer (IMPS/NEFT)</option>
                  <option value="CASH">Cash in Hand</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">UTR / Transaction Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="UPI Ref No or Bank UTR"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Mark as Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
