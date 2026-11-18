'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bike, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Smartphone, AlertCircle, ArrowLeft } from 'lucide-react';

export default function RiderLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const input = phone.trim();
    if (!input || !password) {
      setError('Mobile number / Rider ID aur password dalein.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/rider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: input, password }),
      });

      const data = await res.json();

      if (res.ok && data.rider) {
        localStorage.setItem('lapiez-rider-token', data.token);
        localStorage.setItem('lapiez-rider', JSON.stringify(data.rider));
        router.push('/rider');
      } else {
        setError(data.error || 'Login fail hua. Kripya check karein.');
      }
    } catch (err: any) {
      setError('Connection error: ' + (err.message || 'Server se connect nahi ho paya.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <Link
          href="/"
          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-1.5 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Lapiez Store</span>
        </Link>

        <span className="text-xs font-bold text-[#1A56DB] bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#1A56DB] animate-pulse" />
          <span>Delivery Partner Hub</span>
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 text-slate-900 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto shadow-2xs text-[#1A56DB]">
            <Bike className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lapiez Rider Login</h1>
          <p className="text-xs text-slate-500 font-medium">Garhwa &amp; Palamu Fleet Delivery Console</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Rider ID ya Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. LAP-RD-007 ya 8789320345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Apna password dalein"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A56DB] hover:bg-[#1E40AF] active:scale-[0.98] text-white font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying Account...</span>
              </>
            ) : (
              <>
                <span>Login &amp; Go Online</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Naye delivery partner hain?
          </p>
          <Link
            href="/rider/register"
            className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-[#1A56DB] font-extrabold rounded-xl text-xs border border-blue-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>+ Create New Rider ID (Apply Now)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <a
            href="/downloads/lapiez-rider.apk"
            download="Lapiez-Rider-App.apk"
            className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs border border-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Download Rider Android App (.APK)</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-[11px] pb-2 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Secured by Lapiez Logistics Portal • Garhwa &amp; Palamu</span>
      </footer>
    </div>
  );
}
