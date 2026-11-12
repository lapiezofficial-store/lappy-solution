'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, RefreshCw, Key, Lock, Unlock,
  ShieldCheck, Package, Trash2, Edit2, Phone, Copy, Check,
  ExternalLink, Smartphone, Download, X
} from 'lucide-react';

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

export default function StaffManager() {
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/staff', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStaffList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) {
      alert('Name, Phone aur Password dalein.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Staff ID Created: ${data.staff.staffCode}\nPhone: ${data.staff.phone}`);
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
      const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingStaff(null);
        fetchStaff();
      } else {
        alert(data.error || 'Update fail hua');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async (s: StaffAccount) => {
    const res = await fetch(`/api/admin/staff/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: !s.isBlocked }),
    });
    if (res.ok) fetchStaff();
  };

  const handleDelete = async (s: StaffAccount) => {
    if (!confirm(`Kya aap pakka Staff "${s.name}" (${s.staffCode}) ko delete karna chahte hain?`)) return;
    try {
      const res = await fetch(`/api/admin/staff/${s.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchStaff();
      } else {
        alert(data.error || 'Staff delete nahi ho paya.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const copyCredentials = (s: StaffAccount) => {
    const text = `Lapiez Staff App Login\nURL: https://www.lapiez.com/staff\nStaff ID: ${s.staffCode}\nPhone: ${s.phone}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = staffList.filter((s) => {
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
            <span>Staff Accounts &amp; App Access</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-extrabold">
              {staffList.length}
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/staff"
            target="_blank"
            className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Staff App</span>
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

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Staff ID, Phone..."
            className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          />
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

      {/* Staff List */}
      {loading && staffList.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
          Loading staff accounts...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center space-y-2">
          <Users className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">Koi Staff ID nahi mila</p>
          <p className="text-xs text-gray-500">&quot;+ Create Staff ID&quot; par click karke har staff ka alag login ID &amp; password banayein.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className={`bg-white border rounded-2xl p-4 shadow-2xs space-y-3 ${
                s.isBlocked ? 'border-rose-200 bg-rose-50/30 opacity-80' : 'border-gray-200'
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

                <button
                  type="button"
                  onClick={() => copyCredentials(s)}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                  title="Copy Login Info"
                >
                  {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Permissions */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
                <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  s.canHandleOrders ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400 line-through'
                }`}>
                  <Package className="w-3 h-3" /> Orders
                </span>
                <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  s.canHandleWarranty ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400 line-through'
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
                  <Edit2 className="w-3 h-3" /> Edit / Pass
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleBlock(s)}
                  className={`py-1.5 px-2.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                    s.isBlocked
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
          ))}
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-gray-900">Create Staff ID &amp; Password</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Staff Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jay Prakash"
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
                  <label className="font-bold text-gray-700 block mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Min 4 chars"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    className="w-full h-9 px-2.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold"
                  >
                    <option value="COUNTER">Counter Staff</option>
                    <option value="TECHNICIAN">Warranty Technician</option>
                    <option value="MANAGER">Showroom Manager</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Custom ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto: LAP-STF-001"
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
                  <span>Orders Access</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.canHandleWarranty}
                    onChange={(e) => setForm({ ...form, canHandleWarranty: e.target.checked })}
                  />
                  <span>Warranty Power</span>
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
              </div>
              <button type="button" onClick={() => setEditingStaff(null)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Staff Name *</label>
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
                  <label className="font-bold text-gray-700 block mb-1">New Password (Optional)</label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-gray-50 border border-gray-200"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full h-9 px-2.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold"
                >
                  <option value="COUNTER">Counter Staff</option>
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
                  <span>Orders Access</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.canHandleWarranty}
                    onChange={(e) => setEditForm({ ...editForm, canHandleWarranty: e.target.checked })}
                  />
                  <span>Warranty Power</span>
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

