'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Lock, Key, AlertCircle, Eye, EyeOff, 
  Store, CheckCircle2, ArrowRight, RefreshCw
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function PortalAccessPage() {
  const router = useRouter();
  const { siteSettings, showToast } = useStore();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((response) => response.json())
      .then((data) => {
        if (data.authenticated) router.replace('/admin');
      })
      .catch(() => undefined);
  }, [router]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setFailedAttempts(0);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut || isAuthenticating) return;

    const trimmed = password.trim();
    if (!trimmed) {
      setError('Please enter master passkey / PIN');
      return;
    }

    setIsAuthenticating(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      });

      if (response.ok) {
        showToast('Master passkey accepted! Redirecting to Merchant Portal...');
        router.push('/admin');
      } else {
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        if (attempts >= 5) {
          setIsLockedOut(true);
          setLockoutTimer(30);
          setError('Too many failed security attempts. Portal locked for 30 seconds.');
        } else {
          const data = await response.json().catch(() => null);
          setError(data?.error || `Access denied. (${5 - attempts} attempts left)`);
        }
      }
    } catch {
      setError('Connection error. Please check your network.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D1E] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Ambient Security Elements */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -top-24 -left-24" />
      <div className="absolute w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -bottom-24 -right-24" />

      <div className="max-w-md w-full bg-[#0F1D3D] border border-blue-900/60 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 text-white">
        
        {/* Header Security Badge */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A56DB] to-[#0F2960] border border-blue-400/30 flex items-center justify-center mx-auto shadow-xl">
            <ShieldCheck className="w-9 h-9 text-[#4ADE80]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3 text-blue-400" />
            <span>Restricted Merchant Portal</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            {siteSettings?.siteName || 'Lapiez'} Console
          </h1>
          
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Chiniya Road, Garhwa • 413+ SKUs Inventory • 18% GST Invoicing. Please authenticate with high security passkey.
          </p>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11.5px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
              Showroom Master Passkey / PIN
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter master passkey..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLockedOut}
                className="w-full bg-[#0A1633] border border-blue-800/80 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300/40 focus:outline-none focus:border-[#4ADE80] transition-colors pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}

            {isLockedOut && (
              <p className="text-xs text-amber-300 font-semibold mt-1">
                Retry in {lockoutTimer}s
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLockedOut || !password.trim() || isAuthenticating}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#1A56DB] to-[#2563EB] hover:from-[#1E40AF] hover:to-[#1D4ED8] text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAuthenticating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating Console...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Authenticate & Access Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Footnote */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center space-y-2">
          <div className="text-[11px] text-blue-300/60 font-mono">
            Garhwa Showroom Server • 256-bit Encrypted Session
          </div>
          <div>
            <Link 
              href="/" 
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
            >
              <span>← Return to Public Storefront</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
