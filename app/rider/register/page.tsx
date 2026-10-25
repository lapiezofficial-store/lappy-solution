'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bike, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, 
  MapPin, CheckCircle, ArrowLeft, Truck, FileText
} from 'lucide-react';

export default function RiderRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    vehicleType: 'BIKE',
    vehicleNumber: '',
    dlNumber: '',
    city: 'Garhwa',
    emergencyContact: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredRider, setRegisteredRider] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.phone || !form.password) {
      setError('Kripya Name, Mobile Number aur Password bharein.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/rider/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setRegisteredRider(data.rider);
      } else {
        setError(data.error || 'Registration fail hua.');
      }
    } catch (err: any) {
      setError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-4">
        <Link
          href="/rider/login"
          className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-800 flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Login</span>
        </Link>
        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          Lapiez Fleet Onboarding
        </span>
      </div>

      <div className="max-w-md w-full mx-auto my-6">
        {registeredRider ? (
          /* SUCCESS SCREEN */
          <div className="bg-gray-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white">Application Submitted!</h2>
            
            <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/80">
              <span className="text-xs text-gray-400 block font-semibold">Aapki Rider ID Hai:</span>
              <span className="text-2xl font-mono font-extrabold text-blue-400 mt-1 block">
                {registeredRider.riderCode || 'LAP-RD-' + registeredRider.id.slice(-4)}
              </span>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed">
              Aapka application review ke liye <strong>Lapiez Admin</strong> ko bhej diya gaya hai.
              Verification aur approval milte hi aap apne phone aur password se login karke orders deliver karna shuru kar sakte hain!
            </p>

            <div className="pt-2">
              <Link
                href="/rider/login"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <span>Go to Rider Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-5">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2">
                <Bike className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-black tracking-tight">Create Rider ID</h1>
              <p className="text-gray-400 text-xs mt-1">Lapiez Delivery Partner Bano • Har delivery ₹25+</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-2xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Full Name (Pura Naam) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-800/80 border border-gray-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-gray-800/80 border border-gray-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Create Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-gray-800/80 border border-gray-700/80 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Vehicle Type</label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full bg-gray-800/80 border border-gray-700/80 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BIKE">Motorcycle / Bike</option>
                    <option value="SCOOTY">Scooty / Scooter</option>
                    <option value="CYCLE">Bicycle / Cycle</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="JH-03-AB-1234"
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                    className="w-full bg-gray-800/80 border border-gray-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Driving License (DL)</label>
                  <input
                    type="text"
                    placeholder="DL Number"
                    value={form.dlNumber}
                    onChange={(e) => setForm({ ...form, dlNumber: e.target.value })}
                    className="w-full bg-gray-800/80 border border-gray-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">City / Area</label>
                  <input
                    type="text"
                    placeholder="Garhwa"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-gray-800/80 border border-gray-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 mt-4"
              >
                {loading ? 'Submitting Application...' : (
                  <>
                    <span>Submit & Generate Rider ID</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-xs text-gray-500">
                Pehle se account hai?{' '}
                <Link href="/rider/login" className="text-blue-400 font-bold hover:underline">
                  Login Karein
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-gray-600 text-[11px] pb-2 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Official Lapiez Logistics Fleet System</span>
      </div>
    </div>
  );
}
