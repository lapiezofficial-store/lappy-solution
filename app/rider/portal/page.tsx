'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bike, Wallet, ArrowLeft, Building2, Phone, User, 
  CreditCard, CheckCircle, Clock, ShieldCheck, Save, LogOut
} from 'lucide-react';

interface RiderData {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  isOnline: boolean;
  walletBalance: number;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankUpi?: string;
}

interface PayoutRecord {
  id: string;
  amount: number;
  paymentMode: string;
  utrNumber?: string;
  status: string;
  note?: string;
  createdAt: string;
}

export default function RiderPortalPage() {
  const router = useRouter();
  const [rider, setRider] = useState<RiderData | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Bank Form State
  const [bankUpi, setBankUpi] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  useEffect(() => {
    const localRiderStr = localStorage.getItem('lapiez-rider');
    if (!localRiderStr) {
      router.push('/rider/login');
      return;
    }
    try {
      const parsed: RiderData = JSON.parse(localRiderStr);
      setRider(parsed);
      setBankUpi(parsed.bankUpi || '');
      setBankAccountNo(parsed.bankAccountNo || '');
      setBankIfsc(parsed.bankIfsc || '');

      // Fetch Payout History
      fetch(`/api/admin/payouts?riderId=${parsed.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setPayouts(data);
        })
        .catch((err) => console.error('Failed to load payouts:', err))
        .finally(() => setLoading(false));
    } catch {
      router.push('/rider/login');
    }
  }, [router]);

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider) return;

    try {
      setIsSavingBank(true);
      const res = await fetch(`/api/admin/riders/${rider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankUpi: bankUpi.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankIfsc: bankIfsc.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Bank / UPI details update ho gayi! 🎉');
        const updated = {
          ...rider,
          bankUpi: bankUpi.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankIfsc: bankIfsc.trim().toUpperCase(),
        };
        setRider(updated);
        localStorage.setItem('lapiez-rider', JSON.stringify(updated));
      } else {
        alert(data.error || 'Update fail hua');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lapiez-rider');
    localStorage.removeItem('lapiez-rider-token');
    router.push('/rider/login');
  };

  if (!rider) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading Portal...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/rider"
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700"
              title="Back to Rider App"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-base text-gray-900">Rider Partner Portal</h1>
              <p className="text-xs text-gray-500">Lapiez Logistics • Self-Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/rider"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Bike className="w-4 h-4" /> Go to Delivery App
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Profile & Wallet Hero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Wallet Balance */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unpaid Earnings</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Wallet className="w-5 h-5" />
                </span>
              </div>
              <div className="text-4xl font-black text-emerald-600 mt-2">
                ₹{rider.walletBalance || 0}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 border-t border-gray-100 pt-3">
              Admin dwara har hafte UPI / Bank me transfer kiya jata hai.
            </p>
          </div>

          {/* Card 2: Partner Profile */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rider Profile</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-2xl">
                  <User className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-2">
                <h3 className="font-extrabold text-xl text-gray-900">{rider.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Phone className="w-3.5 h-3.5" /> {rider.phone}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-3 flex justify-between text-xs text-gray-600 font-semibold">
              <span>Vehicle: {rider.vehicleType}</span>
              <span className={rider.isOnline ? 'text-emerald-600' : 'text-gray-400'}>
                {rider.isOnline ? '● Online' : '○ Offline'}
              </span>
            </div>
          </div>

          {/* Card 3: Payout Summary */}
          <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Settlement Mode</span>
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-400 block">Linked UPI ID:</span>
                <span className="text-base font-mono font-bold text-amber-300">
                  {rider.bankUpi || 'Not Added Yet'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 border-t border-gray-800 pt-3">
              Payout direct aapke diye huye UPI par bheja jayega.
            </p>
          </div>
        </div>

        {/* Bank & UPI Account Settings */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">Payment & Bank Details</h3>
              <p className="text-xs text-gray-500">Kamai receive karne ke liye apna UPI ya Bank Account update karein</p>
            </div>
          </div>

          <form onSubmit={handleSaveBankDetails} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">UPI ID (Google Pay / PhonePe) *</label>
              <input
                type="text"
                placeholder="e.g. mobile@ybl ya mobile@okaxis"
                value={bankUpi}
                onChange={(e) => setBankUpi(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Bank Account Number (Optional)</label>
              <input
                type="text"
                placeholder="Bank Account No."
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">IFSC Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
            </div>

            <div className="md:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingBank}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingBank ? 'Saving...' : 'Save Bank Details'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Payout History Receipts */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-gray-900">Payout Settlements History</h3>
                <p className="text-xs text-gray-500">Lapiez Store dwara ki gayi payments ke records</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading settlements...</div>
          ) : payouts.length === 0 ? (
            <div className="py-10 text-center bg-gray-50 rounded-2xl border border-gray-100 p-6">
              <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <h4 className="font-bold text-gray-700 text-sm">Koi purana payout nahi mila</h4>
              <p className="text-xs text-gray-400 mt-1">Jab Admin aapke wallet balance ko settle karega, yahan receipt dikhegi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">UTR / Ref</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-600 text-sm">
                        ₹{p.amount}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-700">{p.paymentMode}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{p.utrNumber || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
                          PAID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
