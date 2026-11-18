'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, CheckCircle2, XCircle, Clock, AlertCircle,
  RefreshCw, Check, Sparkles, UserCheck, ShieldCheck, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';

interface AttendanceSheetItem {
  staffId: string;
  staffCode: string;
  staffName: string;
  role: string;
  phone: string;
  isBlocked: boolean;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'NOT_MARKED';
  checkInTime?: string | null;
  checkOutTime?: string | null;
  notes?: string;
  markedBy?: string | null;
}

interface AttendanceStats {
  totalStaff: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  leaveCount: number;
  notMarkedCount: number;
}

export default function StaffAttendanceRegister() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sheet, setSheet] = useState<AttendanceSheetItem[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalStaff: 0,
    presentCount: 0,
    absentCount: 0,
    halfDayCount: 0,
    leaveCount: 0,
    notMarkedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingStaffId, setUpdatingStaffId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'NOT_MARKED'>('ALL');

  const fetchAttendance = useCallback(async (dateStr?: string) => {
    const target = dateStr || selectedDate;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/staff/attendance?date=${target}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.todaySheet)) {
          setSheet(data.todaySheet);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, fetchAttendance]);

  const handleMark = async (
    staffId: string,
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE',
    notes?: string
  ) => {
    try {
      setUpdatingStaffId(staffId);
      const res = await fetch('/api/admin/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          status,
          date: selectedDate,
          notes,
          adminKey: 'true',
        }),
      });

      if (res.ok) {
        await fetchAttendance(selectedDate);
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
    } finally {
      setUpdatingStaffId(null);
    }
  };

  const handleMarkAllPresent = async () => {
    const unMarked = sheet.filter((s) => s.status === 'NOT_MARKED' && !s.isBlocked);
    if (unMarked.length === 0) {
      alert('All active staff already have attendance marked for this date.');
      return;
    }
    if (!confirm(`Mark all ${unMarked.length} remaining active staff members as PRESENT for ${selectedDate}?`)) {
      return;
    }

    try {
      setLoading(true);
      for (const s of unMarked) {
        await fetch('/api/admin/staff/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: s.staffId,
            status: 'PRESENT',
            date: selectedDate,
            notes: 'Bulk roll call',
            adminKey: 'true',
          }),
        });
      }
      await fetchAttendance(selectedDate);
    } catch (err) {
      console.error('Bulk attendance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const filteredSheet = sheet.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.staffName.toLowerCase().includes(q) ||
        s.staffCode.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Top Controls: Date Picker & Bulk Actions */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Daily Attendance Register</h3>
            <p className="text-xs text-slate-500 font-medium">
              Daily staff roll call, present/absent tracking, and check-in times
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 px-2 py-1 focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => changeDateByDays(1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => fetchAttendance(selectedDate)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Refresh Attendance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-900' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleMarkAllPresent}
            disabled={loading || stats.notMarkedCount === 0}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-40"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mark All Present</span>
          </button>
        </div>
      </div>

      {/* Attendance Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Staff</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalStaff}</span>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Showroom team</span>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Present</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.presentCount}</span>
          <span className="text-[10px] font-semibold text-emerald-700 mt-0.5 block">Checked in</span>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Absent</span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{stats.absentCount}</span>
          <span className="text-[10px] font-semibold text-rose-700 mt-0.5 block">Did not report</span>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Half Day</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{stats.halfDayCount}</span>
          <span className="text-[10px] font-semibold text-amber-700 mt-0.5 block">Partial shift</span>
        </div>

        <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">On Leave</span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">{stats.leaveCount}</span>
          <span className="text-[10px] font-semibold text-purple-700 mt-0.5 block">Approved leave</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Not Marked</span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">{stats.notMarkedCount}</span>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Pending roll call</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'NOT_MARKED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Staff' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search staff name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-800"
          />
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
        {loading && sheet.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-900" />
            <p>Loading attendance sheet...</p>
          </div>
        ) : filteredSheet.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-1">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">Koi record nahi mila</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role / Designation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4 text-center">Mark Attendance</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSheet.map((item) => {
                  const isUpdating = updatingStaffId === item.staffId;
                  return (
                    <tr key={item.staffId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900">{item.staffName}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded font-bold">{item.staffCode}</span>
                          <span>•</span>
                          <span>{item.phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {item.role === 'COUNTER' ? 'Counter Billing' : item.role === 'TECHNICIAN' ? 'Technician' : 'Manager'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            item.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : item.status === 'HALF_DAY'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : item.status === 'LEAVE'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {item.status === 'PRESENT' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                          {item.status === 'ABSENT' && <XCircle className="w-3 h-3 text-rose-700" />}
                          {item.status === 'HALF_DAY' && <Clock className="w-3 h-3 text-amber-700" />}
                          {item.status === 'LEAVE' && <FileText className="w-3 h-3 text-purple-700" />}
                          <span>{item.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {item.checkInTime || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMark(item.staffId, 'PRESENT')}
                            disabled={isUpdating}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              item.status === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                            title="Mark Present"
                          >
                            ✓ Present
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMark(item.staffId, 'ABSENT')}
                            disabled={isUpdating}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              item.status === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                            title="Mark Absent"
                          >
                            ✕ Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMark(item.staffId, 'HALF_DAY')}
                            disabled={isUpdating}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              item.status === 'HALF_DAY'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                            title="Mark Half Day"
                          >
                            ½ Half
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMark(item.staffId, 'LEAVE')}
                            disabled={isUpdating}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              item.status === 'LEAVE'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                            }`}
                            title="Mark On Leave"
                          >
                            Leave
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {item.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
