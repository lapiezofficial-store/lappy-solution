'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, ShieldCheck, CheckCircle2, 
  ArrowDownToLine, MessageSquare, AlertCircle, 
  ExternalLink, Sparkles, QrCode, Download, PlusSquare
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../context/StoreContext';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  const { siteSettings, showToast, isApp } = useStore();
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'guide'>('download');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen || isApp) return null;

  const downloadUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/download/app`
    : '/api/download/app';

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    showToast('Starting Lapiez Android App APK download...');
    
    // Direct location redirect for optimal mobile browser APK handling
    const downloadEndpoint = '/api/download/app';
    const link = document.createElement('a');
    link.href = downloadEndpoint;
    link.download = 'Lapiez-Garhwa-App.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloadStarted(false), 4500);
  };

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('Lapiez App installed successfully to your home screen!');
        setDeferredPrompt(null);
        setIsInstallable(false);
        onClose();
      }
    } else {
      showToast('To install: Tap your browser menu (⋮) and choose "Add to Home screen".');
    }
  };

  const whatsappApkUrl = `https://wa.me/919608828288?text=${encodeURIComponent(
    'Hello Lapiez Garhwa Team! Please send me the official Lapiez Android App APK file directly on WhatsApp.'
  )}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1A56DB] p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#0B1528] border border-blue-400/30 p-1.5 flex items-center justify-center shadow-lg flex-shrink-0">
              <img 
                src="/icon-192.png" 
                alt="Lapiez App Icon" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Official Android App
                </span>
                <span className="text-[10px] text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">v1.0.0 (Fast &amp; Safe)</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                Download Lapiez Garhwa App
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Garhwa's Official Hardware, Laptops &amp; CCTV Mobile Store
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => setActiveTab('download')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'download'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              Download App
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <span>Install Help (आसान तरीका)</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {activeTab === 'download' ? (
            <>
              {/* Main Action 1: Direct APK Download Button */}
              <div className="space-y-1.5">
                <button
                  onClick={handleDownloadApk}
                  className="w-full h-13 px-5 rounded-2xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <ArrowDownToLine className="w-5 h-5" />
                  <span>{downloadStarted ? 'Downloading Lapiez APK...' : 'Download Android App (APK)'}</span>
                </button>
                <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                  <span>Size: ~145 KB • Android 5.0+</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Clean &amp; Safe
                  </span>
                </div>
              </div>

              {/* Main Action 2: 1-Tap Home Screen / PWA Option */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">
                      Install Without APK (1-Tap Instant)
                    </h4>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Adds Lapiez directly to phone home screen with zero download warnings.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePwaInstall}
                  className="px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  {isInstallable ? 'Add to Home' : 'Add App'}
                </button>
              </div>

              {/* Main Action 3: Send on WhatsApp */}
              <a
                href={whatsappApkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Get APK on WhatsApp (+91 96088 28288)</span>
              </a>

              {/* QR Code Scan Section for Desktop users */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0">
                  <QRCodeSVG 
                    value={downloadUrl} 
                    size={76}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    Scan from Mobile Camera
                  </span>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Open Camera or Google Lens to instantly download and open Lapiez on your mobile phone.
                  </p>
                </div>
              </div>

              {/* App Benefits Grid */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                  Exclusive App Features:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="text-slate-700 text-[11px] font-medium">1-Tap Direct UPI Payment</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 text-[11px] font-medium">Live Showroom WhatsApp Chat</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span className="text-slate-700 text-[11px] font-medium">Instant Invoice Downloads</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span className="text-slate-700 text-[11px] font-medium">Works Smoothly on 4G &amp; 5G</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Guide Tab: How to Install Cleanly */
            <div className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-amber-900 leading-snug">
                  <p className="font-bold">Android Security Message Notice:</p>
                  <p className="mt-0.5 text-amber-800">
                    Kyunki yeh app direct Lapiez showroom website se download ho raha hai, aapka phone ek safety warning dikha sakta hai. Yeh bilkul normal aur safe hai.
                  </p>
                </div>
              </div>

              {/* 4 Steps */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Step 1: Download APK</h5>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                      Upar diye gaye <span className="font-semibold text-blue-700">"Download Android App"</span> button par click karein.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Step 2: "Download anyway" par click karein</h5>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                      Agar Chrome bole <em>"File might be harmful"</em>, toh darne ki jarurat nahi hai, <span className="font-semibold text-gray-900">"Download anyway"</span> par tap karein.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Step 3: Allow Unknown Sources &amp; Install</h5>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                      Downloaded file par tap karein. Agar <span className="font-semibold">Settings</span> mange toh <span className="font-semibold text-emerald-700">"Allow from this source"</span> on karein aur <span className="font-semibold text-blue-700">"Install"</span> karein.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">Step 4: Open &amp; Enjoy!</h5>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                      App open ho jayega aur aap Garhwa showroom ke genuine laptops, CCTV aur offers dekh payenge.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action back to download */}
              <button
                onClick={() => setActiveTab('download')}
                className="w-full h-11 rounded-xl bg-[#1A56DB] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Go Back to Download</span>
              </button>
            </div>
          )}

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Clean APK (CBIC &amp; BIS Compliant)
            </span>
            <span>Lapiez Garhwa Official</span>
          </div>
        </div>
      </div>
    </div>
  );
};
