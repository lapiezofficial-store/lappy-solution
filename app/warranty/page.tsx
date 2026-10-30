'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Wrench, Search, Phone, CheckCircle2, Clock,
  Laptop, AlertCircle, ArrowRight, Store, Calendar, HelpCircle,
  FileText, MessageSquare, ChevronRight, RefreshCw, Send, Check,
  Upload, Camera, Globe, History, FileCheck, Eye, Sparkles, User
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface ClaimResult {
  id: string;
  claimId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  brand?: string;
  serialNumber?: string;
  invoiceNumber?: string;
  orderId?: string;
  purchaseChannel?: string;
  status: string;
  verificationStatus?: string;
  issueDescription: string;
  faultCategory?: string;
  estimatedReadyDate?: string;
  technicianNotes?: string;
  brandRmaNumber?: string;
  billDocumentUrl?: string;
  createdAt: string;
}

const STATUS_STEPS = [
  { key: 'RECEIVED', label: '1. Received at Desk', hindi: 'दुकान में जमा' },
  { key: 'UNDER_INSPECTION', label: '2. Under Diagnosis', hindi: 'जाँच और टेस्टिंग चालू' },
  { key: 'SENT_TO_BRAND', label: '3. Brand Service Center', hindi: 'कंपनी सर्विस सेंटर भेजा गया' },
  { key: 'REPAIRED_READY', label: '4. Repaired & Ready', hindi: 'कलेक्शन के लिए तैयार है' },
  { key: 'DELIVERED_CLOSED', label: '5. Delivered', hindi: 'कस्टमर को दे दिया गया' },
];

export default function WarrantyPage() {
  const { siteSettings, showToast } = useStore();

  // Active Main Tab: 'claim' (Naya Claim Darj Karein) | 'track' (Status Check Karein)
  const [activeMainTab, setActiveMainTab] = useState<'claim' | 'track'>('claim');

  // Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<ClaimResult[]>([]);
  const [trackError, setTrackError] = useState('');

  // Claim Form State (3 Channels)
  const [purchaseChannel, setPurchaseChannel] = useState<'OFFLINE_STORE' | 'ONLINE_WEBSITE' | 'PAST_LEGACY'>('OFFLINE_STORE');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderId, setOrderId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('HP');
  const [category, setCategory] = useState('Laptop');
  const [serialNumber, setSerialNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [accessoriesReceived, setAccessoriesReceived] = useState('Device + Original Charger');
  
  // File upload state
  const [billFileBase64, setBillFileBase64] = useState<string | null>(null);
  const [billFileName, setBillFileName] = useState('');
  const [deviceFileBase64, setDeviceFileBase64] = useState<string | null>(null);
  const [deviceFileName, setDeviceFileName] = useState('');
  
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [createdClaim, setCreatedClaim] = useState<ClaimResult | null>(null);

  // File to Base64 Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'bill' | 'device') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('File size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'bill') {
        setBillFileBase64(base64);
        setBillFileName(file.name);
      } else {
        setDeviceFileBase64(base64);
        setDeviceFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Claim
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !productName.trim() || !issueDescription.trim()) {
      showToast('Please fill all required fields (Name, Phone, Product Name, Problem)');
      return;
    }

    if (purchaseChannel === 'OFFLINE_STORE' && !invoiceNumber.trim() && !billFileBase64) {
      showToast('Showroom purchase requires Bill Number or Bill Photo upload.');
      return;
    }

    if (purchaseChannel === 'PAST_LEGACY' && !billFileBase64 && !serialNumber.trim()) {
      showToast('Past customer claim requires Old Bill Photo or Device Serial Number.');
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const res = await fetch('/api/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseChannel,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim() || undefined,
          orderId: orderId.trim() || undefined,
          invoiceNumber: invoiceNumber.trim() || undefined,
          purchaseDate: purchaseDate.trim() || undefined,
          productName: productName.trim(),
          productCategory: category,
          brand,
          serialNumber: serialNumber.trim().toUpperCase() || undefined,
          issueDescription: issueDescription.trim(),
          accessoriesReceived: accessoriesReceived.trim() || undefined,
          billDocumentUrl: billFileBase64 || undefined,
          devicePhotoUrl: deviceFileBase64 || undefined,
          warrantyType: purchaseChannel === 'ONLINE_WEBSITE' ? 'Online Website Order Warranty' : (purchaseChannel === 'PAST_LEGACY' ? 'Past Purchase Claim' : 'Showroom Counter Warranty'),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedClaim(data.claim);
        showToast(`Warranty Claim #${data.claim.claimId} submitted successfully!`);
      } else {
        showToast(data.error || 'Failed to submit warranty claim');
      }
    } catch {
      showToast('Connection error. Please try again.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Track Status
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackQuery.trim();
    if (!clean) {
      setTrackError('Please enter Job Sheet No, Mobile Number, or Serial Number.');
      return;
    }

    setIsSearching(true);
    setTrackError('');
    setSearched(true);

    try {
      const res = await fetch(`/api/warranty?publicLookup=true&q=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSearchResults(data.claims || []);
      } else {
        setSearchResults([]);
        setTrackError(data.error || 'No matching warranty records found.');
      }
    } catch {
      setTrackError('Network error. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 0;
      case 'UNDER_INSPECTION': return 1;
      case 'SENT_TO_BRAND': return 2;
      case 'REPAIRED_READY': return 3;
      case 'DELIVERED_CLOSED': return 4;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24">

      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#0F1D3D] via-[#1E3A8A] to-[#1A56DB] text-white py-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -top-10 -right-10" />

        <div className="max-w-4xl mx-auto text-center space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Lapiez Garhwa Service Desk</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Warranty Claim & Service Center
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            Aapne <strong>दुकान से खरीदा हो (Showroom Shop Bill)</strong>, <strong>वेबसाइट से ऑनलाइन ऑर्डर किया हो</strong>, ya <strong>पहले कभी पुराना सामान खरीदा हो</strong> — yahan apna bill aur serial number daal kar warranty claim karein.
          </p>

          {/* Dual Main Mode Selector */}
          <div className="pt-4 flex items-center justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={() => setActiveMainTab('claim')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md ${
                activeMainTab === 'claim'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20 scale-102'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              + Register Claim (नया क्लेम करें)
            </button>

            <button
              onClick={() => setActiveMainTab('track')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md ${
                activeMainTab === 'track'
                  ? 'bg-white text-blue-900 scale-102'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              🔍 Track Status (स्टेटस चेक करें)
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4 space-y-6">

        {/* VIEW 1: REGISTER WARRANTY CLAIM */}
        {activeMainTab === 'claim' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
            
            {createdClaim ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                <h2 className="text-2xl font-black text-emerald-950">
                  Warranty Claim Registered Successfully!
                </h2>
                <div className="inline-block px-4 py-2 bg-white rounded-2xl border border-emerald-300 font-mono text-lg font-black text-emerald-700">
                  Job Sheet No: #{createdClaim.claimId}
                </div>
                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Aapka warranty claim hamari service team ke paas receive ho chuka hai. Kripya apna device aur original charger showroom desk par deposit karein ya hamare helpline par call karein.
                </p>
                <div className="text-xs font-mono font-semibold text-slate-700 space-y-1">
                  <div>Device: <strong>{createdClaim.productName}</strong></div>
                  <div>Customer: <strong>{createdClaim.customerName}</strong> ({createdClaim.customerPhone})</div>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setCreatedClaim(null);
                      setCustomerName('');
                      setCustomerPhone('');
                      setInvoiceNumber('');
                      setSerialNumber('');
                      setIssueDescription('');
                      setBillFileBase64(null);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-md"
                  >
                    Submit Another Claim
                  </button>
                  <button
                    onClick={() => {
                      setTrackQuery(createdClaim.claimId);
                      setActiveMainTab('track');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs cursor-pointer"
                  >
                    Track This Job Status
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-6">

                {/* 3 Purchase Channels Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Step 1: Choose Where You Purchased (आपने कहाँ से खरीदा था?)
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Option 1: Showroom Offline Purchase */}
                    <button
                      type="button"
                      onClick={() => setPurchaseChannel('OFFLINE_STORE')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        purchaseChannel === 'OFFLINE_STORE'
                          ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-400/30'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-purple-600" />
                        <span className="font-extrabold text-xs text-purple-950">Showroom Purchase</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Garhwa showroom se bill lekar kharida hua
                      </p>
                    </button>

                    {/* Option 2: Online Website Order */}
                    <button
                      type="button"
                      onClick={() => setPurchaseChannel('ONLINE_WEBSITE')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        purchaseChannel === 'ONLINE_WEBSITE'
                          ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400/30'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <span className="font-extrabold text-xs text-blue-950">Online Website Order</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Lapiez.com website se order kiya hua
                      </p>
                    </button>

                    {/* Option 3: Past / Legacy Customer */}
                    <button
                      type="button"
                      onClick={() => setPurchaseChannel('PAST_LEGACY')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        purchaseChannel === 'PAST_LEGACY'
                          ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400/30'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-amber-600" />
                        <span className="font-extrabold text-xs text-amber-950">Past / Old Customer</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Pehle kharida hua purana bill ya slip
                      </p>
                    </button>
                  </div>
                </div>

                {/* Step 2: Contact Details */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Step 2: Customer Contact Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Your Full Name (आपका पूरा नाम) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        10-Digit Mobile Number (मोबाइल नंबर) *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="e.g. 9608828288"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City / Area Address (शहर / पता)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ranka More, Garhwa"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Step 3: Purchase Bill & Invoice Proof */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>
                      Step 3: {purchaseChannel === 'ONLINE_WEBSITE' ? 'Online Order Details' : 'Showroom Bill & Purchase Proof (बिल की जानकारी)'}
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {purchaseChannel === 'ONLINE_WEBSITE' ? 'Website Order ID (e.g. LPZ-2601-921)' : 'Bill / Invoice Number (बिल नंबर)'} *
                      </label>
                      <input
                        type="text"
                        placeholder={purchaseChannel === 'ONLINE_WEBSITE' ? 'e.g. LPZ-2601-921' : 'e.g. INV-2026-081 or Receipt No'}
                        value={purchaseChannel === 'ONLINE_WEBSITE' ? orderId : invoiceNumber}
                        onChange={(e) => {
                          if (purchaseChannel === 'ONLINE_WEBSITE') setOrderId(e.target.value);
                          else setInvoiceNumber(e.target.value);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Purchase Date (खरीदने की तारीख)
                      </label>
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Upload Bill Copy (Mandatory for Offline / Past) */}
                  <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-purple-900 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-purple-700" />
                        <span>Upload Showroom Bill Photo / PDF (दुकान के बिल की फोटो अपलोड करें)</span>
                      </label>
                      {billFileName && (
                        <span className="text-[11px] text-emerald-700 font-bold">
                          ✓ {billFileName}
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'bill')}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />
                    <p className="text-[11px] text-purple-800/80">
                      Apne physical bill, invoice ya cash memo ki clear photo kheench kar yahan upload karein.
                    </p>
                  </div>
                </div>

                {/* Step 4: Device & Hardware Details */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>Step 4: Device Identification (डिवाइस की जानकारी)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Device Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="Laptop">Laptop (लैपटॉप)</option>
                        <option value="Desktop">Desktop / All-in-One PC</option>
                        <option value="CCTV">CCTV Camera / DVR</option>
                        <option value="Printer">Printer / Scanner</option>
                        <option value="Component">Motherboard / RAM / SSD</option>
                        <option value="Other">Other Hardware</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="HP">HP</option>
                        <option value="Dell">Dell</option>
                        <option value="Lenovo">Lenovo</option>
                        <option value="Hikvision">Hikvision</option>
                        <option value="CP Plus">CP Plus</option>
                        <option value="Acer">Acer</option>
                        <option value="Asus">Asus</option>
                        <option value="Canon">Canon</option>
                        <option value="Epson">Epson</option>
                        <option value="Other">Other Brand</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Device Serial No / IMEI *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5CD1234XYZ"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                        className="w-full bg-purple-50/50 border border-purple-300 rounded-xl px-3.5 py-2.5 text-xs text-purple-950 focus:outline-none focus:border-purple-600 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Name & Model (मॉडल व नाम) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HP 15s Core i5 12th Gen Laptop"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Device Photo */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Upload Device / Serial Sticker Photo (सीरियल नंबर स्टिकर की फोटो)</span>
                      </label>
                      {deviceFileName && (
                        <span className="text-[11px] text-emerald-700 font-bold">
                          ✓ {deviceFileName}
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'device')}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Step 5: Problem Complaint */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>Step 5: Problem Description (समस्या क्या आ रही है?)</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Describe the exact defect / problem *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Display screen flickering, battery charging stop, power dead, CCTV recording black screen."
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-600 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Accessories you will provide with device (सामान क्या साथ देंगे)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Laptop + Original 65W Charger + Power Cord"
                      value={accessoriesReceived}
                      onChange={(e) => setAccessoriesReceived(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingClaim}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingClaim ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Uploading Bill & Registering Claim...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Submit Warranty Claim (क्लेम दर्ज करें)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

        {/* VIEW 2: TRACK WARRANTY STATUS */}
        {activeMainTab === 'track' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
            
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-slate-900">
                Track Warranty Repair & Job Sheet
              </h2>
              <p className="text-xs text-slate-500">
                Apna Job Sheet No, Mobile Number, ya Serial Number daal kar real-time repair progress dekhein
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="max-w-xl mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Job Sheet No (e.g. WAR-26-1001) / Mobile / Serial"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Track</span>}
              </button>
            </form>

            {trackError && (
              <p className="text-xs text-rose-600 font-semibold text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                <span>{trackError}</span>
              </p>
            )}

            {/* Results Display */}
            {searched && searchResults.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                {searchResults.map((c) => {
                  const currentStep = getStepIndex(c.status);

                  return (
                    <div key={c.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                        <div>
                          <div className="text-xs font-bold text-blue-600 font-mono">
                            JOB SHEET #{c.claimId}
                          </div>
                          <h3 className="text-base font-black text-slate-900">{c.productName}</h3>
                          <p className="text-xs text-slate-500">
                            Customer: {c.customerName} • Phone: {c.customerPhone}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                            {c.status.replace(/_/g, ' ')}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Date: {new Date(c.createdAt).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        {STATUS_STEPS.map((step, idx) => {
                          const isCurrent = idx === currentStep;
                          const isCompleted = idx <= currentStep;

                          return (
                            <div
                              key={step.key}
                              className={`p-2.5 rounded-xl border ${
                                isCurrent
                                  ? 'bg-blue-600 text-white font-black shadow-md'
                                  : isCompleted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                                  : 'bg-white text-slate-400 border-slate-200'
                              }`}
                            >
                              <div className="text-xs">{step.label}</div>
                              <div className="text-[9.5px] mt-0.5">{step.hindi}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                        <div><strong className="text-slate-500">Issue:</strong> {c.issueDescription}</div>
                        {c.serialNumber && <div><strong className="text-slate-500">Serial No:</strong> <span className="font-mono text-purple-700">{c.serialNumber}</span></div>}
                        {c.brandRmaNumber && <div><strong className="text-purple-600">Brand RMA No:</strong> <span className="font-mono">{c.brandRmaNumber}</span></div>}
                        {c.estimatedReadyDate && <div><strong className="text-amber-600">Est. Ready:</strong> {c.estimatedReadyDate}</div>}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Showroom Support: +91 9608828288</span>
                        <a
                          href={`https://wa.me/919608828288?text=${encodeURIComponent(`Hello Lapiez, I am checking status for Job Sheet #${c.claimId}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Desk</span>
                        </a>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* Informational Help Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <Store className="w-6 h-6 text-purple-600" />
            <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
              1. Showroom Counter Bill
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Agar aapne Garhwa showroom counter se kharida hai, to apne invoice ki photo ya bill number ke sath claim karein.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <Globe className="w-6 h-6 text-blue-600" />
            <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
              2. Website Online Order
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Online store se khareede gaye sabhi products ka Order ID daalkar instant warranty registration aur tracking karein.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <History className="w-6 h-6 text-amber-600" />
            <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
              3. Past Customers
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pehle kabhi khareeda hua device hai? Apna purana bill ya serial number sticker photo upload karein, team verify karegi.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
