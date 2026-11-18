'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, CreditCard, RefreshCw, Plus, Edit2, CheckCircle2,
  AlertCircle, Building2, Copy, Check, ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface StaffProfile {
  staffId: string;
  staffCode: string;
  staffName: string;
  role: string;
  phone: string;
  monthlySalary: number;
  totalPaidThisMonth: number;
  pendingBalance: number;
  joiningDate?: string;
  bankDetails?: string;
}

interface PaymentRecord {
  id: string;
  staffId: string;
  staffCode: string;
  staffName: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  utrNumber?: string;
  note?: string;
  month: string;
  paymentDate: string;
  createdAt: string;
}

interface SalaryStats {
  totalMonthlyPayroll: number;
  totalPaidThisMonth: number;
  totalPendingBalance: number;
  totalStaffCount: number;
}

export default function StaffSalaryManager() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<SalaryStats>({
    totalMonthlyPayroll: 0,
    totalPaidThisMonth: 0,
    totalPendingBalance: 0,
    totalStaffCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Modal States
  const [payingStaff, setPayingStaff] = useState<StaffProfile | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'UPI' | 'BANK_TRANSFER' | 'CASH'>('UPI');
  const [payUtr, setPayUtr] = useState('');
  const [payNote, setPayNote] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  const [settingSalaryStaff, setSettingSalaryStaff] = useState<StaffProfile | null>(null);
  const [salaryInput, setSalaryInput] = useState('');
  const [isSubmittingSalary, setIsSubmittingSalary] = useState(false);

  const fetchSalaryData = useCallback(async (monthStr?: string) => {
    const target = monthStr || selectedMonth;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/staff/salary?month=${target}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.staffProfiles)) setProfiles(data.staffProfiles);
        if (Array.isArray(data.paymentHistory)) setPayments(data.paymentHistory);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load salary data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchSalaryData(selectedMonth);
  }, [selectedMonth, fetchSalaryData]);

  const changeMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextY}-${nextM}`);
  };

  const handleOpenPay = (staff: StaffProfile) => {
    setPayingStaff(staff);
    setPayAmount(String(staff.pendingBalance > 0 ? staff.pendingBalance : staff.monthlySalary));
    setPayMode('UPI');
    setPayUtr('');
    setPayNote(`Salary payout for ${selectedMonth}`);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStaff || !payAmount || Number(payAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    try {
      setIsSubmittingPay(true);
      const res = await fetch('/api/admin/staff/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_PAYMENT',
          staffId: payingStaff.staffId,
          amount: Number(payAmount),
          paymentMode: payMode,
          utrNumber: payUtr.trim() || undefined,
          month: selectedMonth,
          note: payNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Payment recorded successfully!');
        setPayingStaff(null);
        await fetchSalaryData(selectedMonth);
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleOpenSetSalary = (staff: StaffProfile) => {
    setSettingSalaryStaff(staff);
    setSalaryInput(String(staff.monthlySalary || ''));
  };

  const handleSubmitSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingSalaryStaff || !salaryInput) return;

    try {
      setIsSubmittingSalary(true);
      const res = await fetch('/api/admin/staff/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_SALARY',
          staffId: settingSalaryStaff.staffId,
          monthlySalary: Number(salaryInput),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettingSalaryStaff(null);
        await fetchSalaryData(selectedMonth);
      } else {
        alert(data.error || 'Failed to set salary');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmittingSalary(false);
    }
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const filteredProfiles = profiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.staffName.toLowerCase().includes(q) ||
      p.staffCode.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner & Month Selector */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Staff Salary &amp; Payroll Management</h3>
            <p className="text-xs text-slate-500 font-medium">
              Track monthly salaries, payments recorded, and pending balances per worker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 px-2 py-1 focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchSalaryData(selectedMonth)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Refresh Salary Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Salary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Monthly Payroll</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{stats.totalMonthlyPayroll.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">
            For {stats.totalStaffCount} staff members
          </span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Total Paid This Month</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            ₹{stats.totalPaidThisMonth.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 mt-0.5 block">Disbursed successfully</span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Pending Balance</span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">
            ₹{stats.totalPendingBalance.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] font-semibold text-rose-700 mt-0.5 block">Awaiting payment</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Staff on Roster</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{stats.totalStaffCount}</span>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">Counter &amp; technicians</span>
        </div>
      </div>

      {/* Staff Salary Profiles Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">Staff Salary Profiles &amp; Payout</h4>
            <p className="text-[11px] text-slate-500">Month: {selectedMonth}</p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Filter by staff name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-800"
            />
          </div>
        </div>

        {loading && profiles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-900" />
            <p>Loading salary records...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Koi staff salary record nahi mila
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Monthly Salary</th>
                  <th className="py-3 px-4">Paid This Month</th>
                  <th className="py-3 px-4">Pending Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((p) => {
                  const isFullyPaid = p.monthlySalary > 0 && p.pendingBalance === 0;
                  return (
                    <tr key={p.staffId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900">{p.staffName}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded font-bold">{p.staffCode}</span>
                          <span>•</span>
                          <span>{p.phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {p.role === 'COUNTER' ? 'Counter Billing' : p.role === 'TECHNICIAN' ? 'Technician' : 'Manager'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">
                            ₹{p.monthlySalary.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenSetSalary(p)}
                            className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Edit Monthly Salary"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-700">
                        ₹{p.totalPaidThisMonth.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            isFullyPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.pendingBalance > 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isFullyPaid ? '✓ Fully Paid' : `₹${p.pendingBalance.toLocaleString('en-IN')}`}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenPay(p)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Pay / Settle ₹
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">Salary Payment History</h4>
            <p className="text-[11px] text-slate-500">Recent salary disbursements and bank reference records</p>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {payments.length} Payments Recorded
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Is mahine ke liye koi payment record nahi hai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">UTR / Reference</th>
                  <th className="py-3 px-4">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{pmt.paymentDate}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{pmt.staffName}</div>
                      <span className="text-[10px] font-mono text-slate-500">{pmt.staffCode}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">{pmt.month}</td>
                    <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                      ₹{pmt.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                        {pmt.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {pmt.utrNumber ? (
                        <div className="flex items-center gap-1.5">
                          <span>{pmt.utrNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyUtr(pmt.utrNumber!)}
                            className="text-slate-400 hover:text-slate-800"
                            title="Copy UTR"
                          >
                            {copiedUtr === pmt.utrNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{pmt.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {payingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Record Salary Payment</h3>
                <p className="text-xs text-slate-500">
                  {payingStaff.staffName} ({payingStaff.staffCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayingStaff(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Monthly Salary:</span>
                  <strong className="text-slate-900 font-bold">₹{payingStaff.monthlySalary.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Already Paid this month:</span>
                  <span className="text-emerald-700 font-bold">₹{payingStaff.totalPaidThisMonth.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-700 font-bold">
                  <span>Pending Balance:</span>
                  <span className="text-rose-700 font-black">₹{payingStaff.pendingBalance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount to Pay (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
                >
                  <option value="UPI">Google Pay / PhonePe / Paytm (UPI)</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer (IMPS / NEFT)</option>
                  <option value="CASH">Cash in Hand</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Bank Reference / UTR Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456321456"
                  value={payUtr}
                  onChange={(e) => setPayUtr(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. November salary full settlement"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPayingStaff(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPay ? 'Recording...' : 'Confirm & Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SET MONTHLY SALARY MODAL */}
      {settingSalaryStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Set Monthly Salary</h3>
                <p className="text-xs text-slate-500">
                  {settingSalaryStaff.staffName} ({settingSalaryStaff.staffCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingSalaryStaff(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSalary} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Monthly Salary (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 15000"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-base text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSettingSalaryStaff(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSalary}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSalary ? 'Saving...' : 'Save Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
