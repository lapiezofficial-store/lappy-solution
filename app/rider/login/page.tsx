'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bike, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Smartphone } from 'lucide-react';

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

    if (!phone || !password) {
      setError('Mobile number aur password dalein.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/rider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (res.ok && data.rider) {
        // Save token and rider details locally
        localStorage.setItem('lapiez-rider-token', data.token);
        localStorage.setItem('lapiez-rider', JSON.stringify(data.rider));
        router.push('/rider');
      } else {
        setError(data.error || 'Login fail hua. Kripya check karein.');
      }
    } catch (err: any) {
      setError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 flex flex-col justify-between p-6">
      <div className="pt-8 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-blue-50 border border-blue-200 text-[#1A56DB] mb-4 shadow-sm">
          <Bike className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">LAPIEZ RIDER</h1>
        <p className="text-gray-500 text-sm mt-1">Official Delivery Partner Login</p>
      </div>

      <div className="max-w-sm w-full mx-auto bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-2xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Rider ID or Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. LAP-RD-002 or 9123456780"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-11 py-3 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A56DB] hover:bg-[#1E40AF] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Verifying Account...' : (
              <>
                <span>Login & Go Online</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="text-xs text-gray-500">
            Naye delivery partner hain?
          </p>
          <Link
            href="/rider/register"
            className="inline-block w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-[#1A56DB] font-bold rounded-2xl text-xs border border-gray-200 transition-all"
          >
            + Create New Rider ID (Apply Now)
          </Link>

          <a
            href="/downloads/lapiez-rider.apk"
            download="Lapiez-Rider-App.apk"
            className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl text-xs border border-emerald-200 flex items-center justify-center gap-2 transition-all"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Download Rider Android App (.APK)</span>
          </a>
        </div>
      </div>

      <div className="text-center text-gray-400 text-[11px] pb-4 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
        <span>Secured by Lapiez Logistics Portal • Garhwa</span>
      </div>
    </div>
  );
}
