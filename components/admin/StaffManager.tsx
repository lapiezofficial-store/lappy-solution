'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, RefreshCw, Key, Lock, Unlock,
  ShieldCheck, Package, Trash2, Edit2, Phone, Copy, Check,
  ExternalLink, Smartphone, Download, X, IndianRupee, Award, Filter, Calendar
} from 'lucide-react';
import { adminFetch } from '@/lib/adminApi';
import { useStore } from '@/context/StoreContext';
import StaffAttendanceRegister from './StaffAttendanceRegister';
import StaffSalaryManager from './StaffSalaryManager';

interface StaffAccount {
  id: string;
  staffCode: string;
  name: string;
  phone: string;
  role: 'COUNTER' | 'TECHNICIAN' | 'MANAGER';
  canHandleOrders: boolean;
  canHandleWarranty: boolean;
  isBlocked: boolean;
  lastActiveAt?: string | null;
  createdAt: string;
}

export default function StaffManager({ initialTab }: { initialTab?: 'ROSTER' | 'ATTENDANCE' | 'SALARY' } = {}) {
  const { orders } = useStore();
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'COUNTER' | 'TECHNICIAN' | 'MANAGER'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [mainTab, setMainTab] = useState<'ROSTER' | 'ATTENDANCE' | 'SALARY'>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const sub = p.get('sub')?.toUpperCase();
      if (sub === 'ATTENDANCE' || sub === 'SALARY' || sub === 'ROSTER') {
        return sub as 'ROSTER' | 'ATTENDANCE' | 'SALARY';
      }
      const tab = p.get('tab')?.toLowerCase();
      if (tab === 'attendance') return 'ATTENDANCE';
      if (tab === 'salary') return 'SALARY';
    }
    return 'ROSTER';
  });

  useEffect(() => {
    if (initialTab && initialTab !== mainTab) {
      setMainTab(initialTab);
    }
  }, [initialTab]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    customStaffCode: '',
    role: 'COUNTER' as 'COUNTER' | 'TECHNICIAN' | 'MANAGER',
    canHandleOrders: true,
    canHandleWarranty: true,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'COUNTER' as 'COUNTER' | 'TECHNICIAN' | 'MANAGER',
    canHandleOrders: true,
    canHandleWarranty: true,
  });

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const fetchStaff = async () => {
    try {
      const res = await adminFetch('/api/admin/staff', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStaffList(Array.isArray(data) ? data : (data?.staff || []));
      } else {
        const fallback = await fetch('/api/admin/staff');
        if (fallback.ok) {
          const fbData = await fallback.json();
          setStaffList(Array.isArray(fbData) ? fbData : (fbData?.staff || []));
        }
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    const interval = setInterval(fetchStaff, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  const getStaffMetrics = (staff: StaffAccount) => {
    const sCode = (staff.staffCode || '').toLowerCase();
    const sName = (staff.name || '').toLowerCase();

    const staffOrders = (orders || []).filter((o: any) => {
      const hBy = (o.pickupHandedBy || '').toLowerCase();
      const addr = (o.address || '').toLowerCase();
      return (
        (sCode && hBy.includes(sCode)) ||
        (sName && hBy.includes(sName)) ||
        (sCode && addr.includes(sCode)) ||
        (sName && addr.includes(sName))
      );
    });

    const totalSales = staffOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.total || 0), 0);

    return {
      orderCount: staffOrders.length,
      totalSales,
    };
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.password.trim()) {
      alert('Staff Member Name aur Login Password/PIN dalna zaroori hai.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adminFetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Staff ID Created Successfully!\n\nStaff ID: ${data.staff.staffCode}\nName: ${data.staff.name}\nPhone: ${data.staff.phone}\nPassword: ${form.password}\n\nAb ye staff counter checkout aur staff portal dono me login kar sakte hain.`);
        setShowAddModal(false);
        setForm({
          name: '',
          phone: '',
          password: '',
          customStaffCode: '',
          role: 'COUNTER',
          canHandleOrders: true,
          canHandleWarranty: true,
        });
        fetchStaff();
      } else {
        alert(data.error || 'Failed to create staff');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (s: StaffAccount) => {
    setEditingStaff(s);
    setEditForm({
      name: s.name,
      phone: s.phone,
      password: '',
      role: s.role,
      canHandleOrders: s.canHandleOrders,
      canHandleWarranty: s.canHandleWarranty,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      setIsSubmitting(true);
      const res = await adminFetch(`/api/admin/staff/${editingStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingStaff(null);
        fetchStaff();
      } else {
        alert(data.error || 'Failed to update staff account');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async (s: StaffAccount) => {
    const res = await adminFetch(`/api/admin/staff/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: !s.isBlocked }),
    });
    if (res.ok) fetchStaff();
  };

  const handleDelete = async (s: StaffAccount) => {
    if (!confirm(`Are you sure you want to delete Staff account "${s.name}" (${s.staffCode})?`)) return;
    try {
      const res = await adminFetch(`/api/admin/staff/${s.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchStaff();
      } else {
        alert(data.error || 'Failed to delete staff member.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const copyCredentials = (s: StaffAccount) => {
    const text = `Lapiez Staff App Login\nURL: https://www.lapiez.com/staff\nStaff ID: ${s.staffCode}\nPhone: ${s.phone}`;
    navigator.clipboard.writeText(text).catch(() => { });
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareOnWhatsApp = (s: StaffAccount) => {
    const text = `Namaste ${s.name},\nAapka Lapiez Showroom Staff ID create ho gaya hai:\n\nStaff ID: ${s.staffCode}\nMobile: ${s.phone}\nRole: ${s.role}\nPortal URL: https://www.lapiez.com/staff\n\nIs ID/PIN ko bill counter checkout ya staff portal login me use karein.`;
    const cleanPhone = s.phone.replace(/\D/g, '').slice(-10);
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filtered = staffList.filter((s) => {
    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.staffCode.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Staff Accounts &amp; Performance Tracker</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-extrabold">
              {staffList.length} Active Staff
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Create, manage staff login PINs, and track order billing volume per worker.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/staff"
            target="_blank"
            className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Staff Portal</span>
          </a>

          <a
            href="/downloads/lapiez-staff.apk"
            download="Lapiez-Staff-App.apk"
            className="h-9 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Staff APK</span>
          </a>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-9 px-4 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Staff ID</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar: Roster | Attendance | Salary */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold gap-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setMainTab('ROSTER')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${mainTab === 'ROSTER' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Accounts ({staffList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('ATTENDANCE')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${mainTab === 'ATTENDANCE' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Attendance Register</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('SALARY')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${mainTab === 'SALARY' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Salary &amp; Payroll Manager</span>
        </button>
      </div>

      {/* VIEW 1: ATTENDANCE REGISTER */}
      {mainTab === 'ATTENDANCE' && <StaffAttendanceRegister />}

      {/* VIEW 2: SALARY & PAYROLL MANAGER */}
      {mainTab === 'SALARY' && <StaffSalaryManager />}

      {/* VIEW 3: STAFF ACCOUNTS & ROSTER */}
      {mainTab === 'ROSTER' && (
        <div className="space-y-5">
          {/* Quick Direct Create Staff ID & Password Form */}
          <div className="bg-white border-2 border-blue-500/30 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Create New Staff ID &amp; Password / PIN</span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Billing counter staff aur workers ke liye direct Staff ID aur PIN generate karein.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  Instant Counter Billing &amp; Staff App Login
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Staff Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar, Sonu"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Staff ID / Code <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. STF-01 or leave blank for auto"
                  value={form.customStaffCode}
                  onChange={(e) => setForm({ ...form, customStaffCode: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500 font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Login Password / PIN *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1234 or Pass@123"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Mobile Number <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="Mobile number (e.g. 9876543210)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4 flex-wrap pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-600">Role:</span>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    className="h-8 px-2.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold"
                  >
                    <option value="COUNTER">Counter Billing Staff</option>
                    <option value="TECHNICIAN">Warranty Technician</option>
                    <option value="MANAGER">Showroom Manager</option>
                  </select>
                </div>

                <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.canHandleOrders}
                    onChange={(e) => setForm({ ...form, canHandleOrders: e.target.checked })}
                    className="rounded"
                  />
                  <span>Counter Billing Orders</span>
                </label>

                <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.canHandleWarranty}
                    onChange={(e) => setForm({ ...form, canHandleWarranty: e.target.checked })}
                    className="rounded"
                  />
                  <span>Warranty Portal</span>
                </label>
              </div>

              <div className="sm:col-span-2 lg:col-span-1 flex items-end justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-9 px-4 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : '+ Save Staff Account'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Staff Statistics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Staff</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{staffList.length}</span>
              <span className="text-[10px] font-semibold text-blue-600 mt-0.5 block">Accounts created</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Accounts</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {staffList.filter((s) => !s.isBlocked).length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">Ready for billing</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Counter Billing</span>
              <span className="text-xl font-black text-blue-700 mt-1 block">
                {staffList.filter((s) => s.role === 'COUNTER').length}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Showroom desk</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Technicians</span>
              <span className="text-xl font-black text-amber-600 mt-1 block">
                {staffList.filter((s) => s.role === 'TECHNICIAN').length}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Warranty repair</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Orders Billed</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {staffList.reduce((acc, s) => acc + getStaffMetrics(s).orderCount, 0)}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Staff counter bills</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Billed ₹</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block truncate">
                ₹{staffList.reduce((acc, s) => acc + getStaffMetrics(s).totalSales, 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">Total volume</span>
            </div>
          </div>

          {/* Role Filters & Search */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Role Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'COUNTER', 'TECHNICIAN', 'MANAGER'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${roleFilter === r
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {r === 'ALL'
                    ? `All (${staffList.length})`
                    : r === 'COUNTER'
                      ? 'Counter Billing'
                      : r === 'TECHNICIAN'
                        ? 'Technicians'
                        : 'Managers'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Name, ID, Phone..."
                  className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'cards' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Table
                </button>
              </div>
              <button
                type="button"
                onClick={fetchStaff}
                className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Staff List */}
          {loading && staffList.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
              Loading staff accounts...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center space-y-2">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700">No Staff accounts found</p>
              <p className="text-xs text-gray-500">Tap &quot;+ Create Staff ID&quot; to assign custom ID and passcode to each employee.</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Staff ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Orders</th>
                      <th className="py-3 px-4">Volume (₹)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((s) => {
                      const metrics = getStaffMetrics(s);
                      return (
                        <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-black text-blue-700">
                            {s.staffCode}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {s.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600">
                            {s.phone}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {s.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {metrics.orderCount}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700">
                            ₹{metrics.totalSales.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            {s.isBlocked ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Blocked</span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => shareOnWhatsApp(s)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                                title="Share on WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => copyCredentials(s)}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                                title="Copy Login Info"
                              >
                                {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(s)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold cursor-pointer"
                                title="Edit / Reset PIN"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleBlock(s)}
                                className={`p-1.5 rounded-lg font-bold cursor-pointer ${s.isBlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                  }`}
                                title={s.isBlocked ? 'Unblock' : 'Block'}
                              >
                                {s.isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(s)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => {
                const metrics = getStaffMetrics(s);
                return (
                  <div
                    key={s.id}
                    className={`bg-white border rounded-2xl p-4 shadow-2xs space-y-3 transition-all ${s.isBlocked ? 'border-rose-200 bg-rose-50/30 opacity-80' : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {s.staffCode}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {s.role}
                          </span>
                          {s.isBlocked && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                              Blocked
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm text-gray-900 mt-1.5">{s.name}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3" /> {s.phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => shareOnWhatsApp(s)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                          title="Share Login Details on WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyCredentials(s)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                          title="Copy Login Info"
                        >
                          {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Staff Work Performance Tracking */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-center">
                      <div className="border-r border-slate-200 pr-2">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                          Orders Handled
                        </span>
                        <span className="text-sm font-black text-slate-900">
                          {metrics.orderCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                          Sales Volume
                        </span>
                        <span className="text-sm font-black text-emerald-700">
                          ₹{metrics.totalSales.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
                      <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${s.canHandleOrders ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400 line-through'
                        }`}>
                        <Package className="w-3 h-3" /> Counter Orders
                      </span>
                      <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${s.canHandleWarranty ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400 line-through'
                        }`}>
                        <ShieldCheck className="w-3 h-3" /> Warranty Desk
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="flex-1 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Edit / PIN
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(s)}
                        className={`py-1.5 px-2.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${s.isBlocked
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                      >
                        {s.isBlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{s.isBlocked ? 'Unblock' : 'Block'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">Create Staff Account &amp; PIN</h3>
                <p className="text-[11px] text-gray-500">Assign a staff passcode for counter checkout &amp; app login.</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Staff Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sonu Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">10-Digit Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Passcode / PIN *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1234 or Pass@123"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Role / Designation</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    className="w-full h-9 px-2.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold"
                  >
                    <option value="COUNTER">Counter Billing Staff</option>
                    <option value="TECHNICIAN">Warranty Technician</option>
                    <option value="MANAGER">Showroom Manager</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Staff Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. STF-01 (Auto generated if blank)"
                    value={form.customStaffCode}
                    onChange={(e) => setForm({ ...form, customStaffCode: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 font-mono uppercase"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.canHandleOrders}
                    onChange={(e) => setForm({ ...form, canHandleOrders: e.target.checked })}
                  />
                  <span>Counter Orders Access</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.canHandleWarranty}
                    onChange={(e) => setForm({ ...form, canHandleWarranty: e.target.checked })}
                  />
                  <span>Warranty Management</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-[#1A56DB] text-white font-bold cursor-pointer disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">Edit Staff: {editingStaff.staffCode}</h3>
                <p className="text-[11px] text-gray-500">Update name, phone, or reset passcode/PIN.</p>
              </div>
              <button type="button" onClick={() => setEditingStaff(null)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Staff Member Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">New Passcode / PIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep current"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Role / Designation</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full h-9 px-2.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold"
                >
                  <option value="COUNTER">Counter Billing Staff</option>
                  <option value="TECHNICIAN">Warranty Technician</option>
                  <option value="MANAGER">Showroom Manager</option>
                </select>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.canHandleOrders}
                    onChange={(e) => setEditForm({ ...editForm, canHandleOrders: e.target.checked })}
                  />
                  <span>Counter Orders Access</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.canHandleWarranty}
                    onChange={(e) => setEditForm({ ...editForm, canHandleWarranty: e.target.checked })}
                  />
                  <span>Warranty Management</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setEditingStaff(null)} className="px-4 py-2 rounded-lg bg-gray-100 font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-[#1A56DB] text-white font-bold cursor-pointer disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
