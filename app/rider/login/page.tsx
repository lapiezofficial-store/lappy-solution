'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bike, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex flex-col justify-between p-6">
      <div className="pt-8 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-4 shadow-xl">
          <Bike className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">LAPIEZ RIDER</h1>
        <p className="text-gray-400 text-sm mt-1">Official Delivery Partner Login</p>
      </div>

      <div className="max-w-sm w-full mx-auto bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Rider ID or Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. LAP-RD-002 or 9123456780"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700/80 rounded-2xl pl-11 pr-11 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Verifying Account...' : (
              <>
                <span>Login & Go Online</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-800/80 text-center space-y-2">
          <p className="text-xs text-gray-400">
            Naye delivery partner hain?
          </p>
          <Link
            href="/rider/register"
            className="inline-block w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-blue-400 hover:text-blue-300 font-bold rounded-2xl text-xs border border-gray-700 transition-all"
          >
            + Create New Rider ID (Apply Now)
          </Link>
        </div>
      </div>

      <div className="text-center text-gray-600 text-[11px] pb-4 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Secured by Lapiez Logistics Portal • Garhwa</span>
      </div>
    </div>
  );
}
