'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bike, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck,
  CheckCircle, ArrowLeft, Truck, User, MapPin, Copy, Check,
  Smartphone, Share2, Sparkles, AlertCircle
} from 'lucide-react';
import { WhatsAppIcon } from '../../../components/WhatsAppIcon';

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
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [registeredRider, setRegisteredRider] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAlreadyRegistered(false);

    const trimmedName = form.name.trim();
    const digitsOnly = form.phone.trim().replace(/\D/g, '');
    const cleanPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    if (!trimmedName) {
      setError('Kripya apna pura naam bharein.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setError('Kripya sahi 10-digit mobile number dalein (e.g. 8789320345).');
      return;
    }
    if (!form.password || form.password.trim().length < 4) {
      setError('Password kam se kam 4 characters ka hona chahiye.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/rider/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: trimmedName,
          phone: cleanPhone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.rider) {
        setRegisteredRider(data.rider);
        // Automatically save session so rider can immediately proceed
        try {
          localStorage.setItem('lapiez-rider', JSON.stringify(data.rider));
        } catch { }
      } else {
        setError(data.error || 'Registration fail hua. Kripya check karein.');
        if (data.alreadyRegistered) {
          setIsAlreadyRegistered(true);
        }
      }
    } catch (err: any) {
      setError('Connection error: ' + (err.message || 'Server se connect nahi ho paya.'));
    } finally {
      setLoading(false);
    }
  };

  const copyRiderCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareOnWhatsApp = (riderCode: string, name: string) => {
    const text = `🎉 *Lapiez Delivery Partner Account Created!*\n\n👤 *Name:* ${name}\n🆔 *Rider ID:* ${riderCode}\n🛵 *Vehicle:* ${form.vehicleType} (${form.vehicleNumber || 'Registered'})\n📍 *City:* ${form.city || 'Garhwa'}\n\n📲 *Login Link:* https://www.lapiez.com/rider/login\n📦 *Garhwa Showroom Dispatch System*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header Bar */}
      <header className="max-w-lg w-full mx-auto flex items-center justify-between pt-2">
        <Link
          href="/rider/login"
          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-1.5 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Rider Login</span>
        </Link>

        <span className="text-xs font-bold text-[#1A56DB] bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#1A56DB] animate-pulse" />
          <span>Lapiez Fleet Onboarding</span>
        </span>
      </header>

      {/* Main Content Area */}
      <main className="max-w-lg w-full mx-auto my-6">
        {registeredRider ? (
          /* SUCCESS SCREEN (Clean White Flagship Style) */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Sparkles className="w-3 h-3" /> Registration Successful
              </span>
              <h2 className="text-2xl font-black text-slate-900">Rider Account Created!</h2>
              <p className="text-xs text-slate-500 font-medium">
                Welcome to Lapiez Delivery Fleet, <strong>{registeredRider.name}</strong>
              </p>
            </div>

            {/* Rider ID Display Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center relative">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                Aapki Official Rider ID Hai:
              </span>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="text-3xl font-mono font-black text-[#1A56DB] tracking-wide">
                  {registeredRider.riderCode}
                </span>
                <button
                  type="button"
                  onClick={() => copyRiderCode(registeredRider.riderCode)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shadow-2xs transition-colors"
                  title="Copy Rider ID"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Aap is Rider ID ya apne registered phone number se login kar sakte hain.
              </p>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Mobile Number</span>
                <strong className="text-slate-900 font-mono text-xs">{registeredRider.phone}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Vehicle</span>
                <strong className="text-slate-900 text-xs">
                  {registeredRider.vehicleType} {registeredRider.vehicleNumber ? `(${registeredRider.vehicleNumber})` : ''}
                </strong>
              </div>
              <div className="mt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">City Area</span>
                <strong className="text-slate-900 text-xs">{registeredRider.city || 'Garhwa'}</strong>
              </div>
              <div className="mt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Earning Rate</span>
                <strong className="text-emerald-700 font-extrabold text-xs">₹25 per Delivery</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <Link
                href="/rider"
                className="w-full bg-[#1A56DB] hover:bg-[#1E40AF] active:scale-[0.98] text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Go to Rider Console (Start Delivering)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => shareOnWhatsApp(registeredRider.riderCode, registeredRider.name)}
                className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                <span>Share Details on WhatsApp</span>
              </button>

              <Link
                href="/rider/login"
                className="inline-block text-xs font-bold text-slate-600 hover:text-[#1A56DB] hover:underline pt-1"
              >
                Already have password? Go to Login Screen &rarr;
              </Link>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM (Clean White Flagship Style) */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 text-slate-900 space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto shadow-2xs text-[#1A56DB]">
                <Bike className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Rider Account</h1>
              <p className="text-xs text-slate-500 font-medium">
                Lapiez Delivery Partner Bano • Har delivery ₹25+ cash
              </p>

              {/* Perks Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✓ Instant Approval
                </span>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  ✓ Garhwa Local
                </span>
                <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  ✓ Zero Investment
                </span>
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p>{error}</p>
                  {isAlreadyRegistered && (
                    <Link
                      href="/rider/login"
                      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                    >
                      <span>Sidhe Login Karein</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name (Pura Naam) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajeev Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Mobile & Password Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={14}
                      placeholder="10-digit number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 4 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              </div>

              {/* Vehicle Type & Number Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 transition-all font-medium cursor-pointer"
                  >
                    <option value="BIKE">Motorcycle / Bike</option>
                    <option value="SCOOTY">Scooty / Scooter</option>
                    <option value="CYCLE">Bicycle / Cycle</option>
                    <option value="RICKSHAW">E-Rickshaw / Auto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Vehicle Number (Optional)
                  </label>
                  <div className="relative">
                    <Truck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="JH-03-AB-7886"
                      value={form.vehicleNumber}
                      onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 uppercase font-mono focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Driving License & City Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Driving License (DL) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="DL Number"
                    value={form.dlNumber}
                    onChange={(e) => setForm({ ...form, dlNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 uppercase font-mono focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    City / Working Area
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Garhwa"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A56DB] hover:bg-[#1E40AF] active:scale-[0.98] text-white font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Rider ID...</span>
                  </>
                ) : (
                  <>
                    <span>Submit &amp; Generate Rider ID</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Links */}
            <div className="pt-2 border-t border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Pehle se rider account hai?{' '}
                <Link href="/rider/login" className="text-[#1A56DB] font-extrabold hover:underline">
                  Login Karein &rarr;
                </Link>
              </p>

              <a
                href="/downloads/lapiez-rider.apk"
                download="Lapiez-Rider-App.apk"
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs border border-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Download Rider Android App (.APK)</span>
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-[11px] pb-2 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Official Lapiez Logistics Fleet System • Garhwa &amp; Palamu</span>
      </footer>
    </div>
  );
}
