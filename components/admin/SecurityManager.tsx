'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Laptop,
  Smartphone,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Lock,
  Key,
  Copy,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface DeviceItem {
  deviceId: string;
  deviceName?: string;
  deviceInfo?: string;
  deviceCode?: string;
  ip?: string;
  approvedAt?: string;
  approvedBy?: string;
  requestedAt?: string;
  lastUsedAt?: string;
  status?: string;
}

export const SecurityManager: React.FC = () => {
  const [approvedDevices, setApprovedDevices] = useState<DeviceItem[]>([]);
  const [pendingDevices, setPendingDevices] = useState<DeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showOwnerPin, setShowOwnerPin] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/devices', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setApprovedDevices(data.approved || []);
        setPendingDevices(data.pending || []);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 15000); // Poll every 15s for new pending logins
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (deviceId: string, deviceName?: string) => {
    setIsProcessing(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'approve', deviceId, deviceName }),
      });
      if (res.ok) {
        setStatusMessage('Device approved successfully! It can now login seamlessly.');
        await fetchDevices();
      }
    } catch {
      setStatusMessage('Error approving device.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (deviceId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'remove', deviceId }),
      });
      if (res.ok) {
        setStatusMessage('Device request rejected.');
        await fetchDevices();
      }
    } catch {
      setStatusMessage('Error rejecting device.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to revoke access for this device? It will be logged out immediately.')) {
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'revoke', deviceId }),
      });
      if (res.ok) {
        setStatusMessage('Device authorization revoked.');
        await fetchDevices();
      }
    } catch {
      setStatusMessage('Error revoking device.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setStatusMessage(`Code ${code} copied to clipboard!`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. TOP 256-BIT SECURITY PROTOCOL STATUS BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#1A56DB] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6 text-[#1A56DB]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  256-Bit Hardware & Session Protection
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Har naya computer ya phone bina Store Owner (Malik) approval ke login nahi kar sakta, chahe unhe password malum bhi ho.
              </p>
            </div>
          </div>

          {/* Owner Master PIN Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 flex-shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Owner Master PIN
              </span>
              <span className="font-mono font-bold text-sm text-slate-900 tracking-widest">
                {showOwnerPin ? '960882' : '••••••'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowOwnerPin(!showOwnerPin)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={showOwnerPin ? 'Hide PIN' : 'Reveal PIN'}
            >
              {showOwnerPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => copyCode('960882')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#1A56DB] hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Copy PIN"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-3.5 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#1A56DB] flex items-center justify-between animate-in fade-in">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
          </div>
        )}
      </div>

      {/* 2. PENDING DEVICE APPROVAL REQUESTS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              Pending Device Authorizations ({pendingDevices.length})
            </h3>
          </div>
          <button
            onClick={fetchDevices}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A56DB] hover:text-[#1E40AF] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {pendingDevices.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
            <p className="text-xs font-semibold text-slate-600">
              Koi pending authorization request nahi hai.
            </p>
            <p className="text-[11px] text-slate-400">
              Jab koi naya device login karega, uska code yahan dikhayi dega aur aap use 1-click me approve kar sakte hain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingDevices.map((dev) => (
              <div
                key={dev.deviceId}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Requires Approval
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      IP: {dev.ip || 'Unknown'}
                    </span>
                  </div>

                  {/* 6-Digit Code */}
                  <div className="my-2.5 p-3 rounded-xl bg-white border border-amber-200 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Verification Code
                    </span>
                    <div className="text-2xl font-mono font-black text-slate-900 tracking-widest">
                      {dev.deviceCode}
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 font-medium">
                    {dev.deviceInfo || 'Web Browser'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    ID: {dev.deviceId}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                  <button
                    onClick={() => handleApprove(dev.deviceId, dev.deviceInfo)}
                    disabled={isProcessing}
                    className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Device</span>
                  </button>
                  <button
                    onClick={() => handleReject(dev.deviceId)}
                    disabled={isProcessing}
                    className="h-9 px-3 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. AUTHORIZED / WHITELISTED DEVICES */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              Whitelisted Devices ({approvedDevices.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            256-bit Persistent Token Active
          </span>
        </div>

        {approvedDevices.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">
              Abhi tak koi device whitelist register nahi hua hai.
            </p>
            <p className="text-[11px] text-slate-400">
              Aap apne device ko login screen par Owner PIN daalkar whitelist kar sakte hain.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {approvedDevices.map((dev) => (
              <div
                key={dev.deviceId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {dev.deviceInfo?.toLowerCase().includes('mobile') ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {dev.deviceName || dev.deviceInfo || 'Authorized Device'}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Whitelisted
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5 font-mono">
                      <span>IP: {dev.ip || 'Verified'}</span>
                      <span>•</span>
                      <span>Approved: {dev.approvedAt ? new Date(dev.approvedAt).toLocaleDateString() : 'Active'}</span>
                      {dev.approvedBy && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500">{dev.approvedBy}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleRevoke(dev.deviceId)}
                    disabled={isProcessing}
                    className="h-8 px-3 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Revoke device access"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Access</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SURAKSHA DIRECTIVES NOTE */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
        <strong className="text-slate-900 font-black block uppercase tracking-wider text-[11px]">
          Suraksha Nirdesh (Admin Security Rules)
        </strong>
        <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-slate-600">
          <li>Koi bhi doosra vyakti agar master password jaan bhi jata hai, to wo bina aapki anumati (device verification) ke console open nahi kar sakta.</li>
          <li>Aap kisi bhi unchahe ya purane device ko upar diye gaye list me se kabhi bhi <strong>Revoke Access</strong> karke turant logout kar sakte hain.</li>
          <li>Naye device ko verify karne ke liye aap apna <strong>Owner Master PIN (960882)</strong> direct us device par daal sakte hain.</li>
        </ul>
      </div>
    </div>
  );
};
