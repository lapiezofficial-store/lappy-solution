'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Wrench, Search, Plus, RefreshCw, Printer,
  Phone, MessageSquare, AlertCircle, CheckCircle2, Clock,
  ArrowRight, X, ExternalLink, Calendar, User, FileText,
  Laptop, Check, Eye, ChevronDown, Filter, Trash2, Send,
  Cpu, Camera, HardDrive, HelpCircle, Building, Upload,
  Image as ImageIcon, FileCheck, AlertTriangle, Store, Globe, History
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export interface WarrantyClaim {
  id: string;
  claimId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  productName: string;
  productCategory?: string | null;
  brand?: string | null;
  modelNumber?: string | null;
  serialNumber?: string | null;
  orderId?: string | null;
  invoiceNumber?: string | null;
  purchaseDate?: string | null;
  purchaseChannel?: 'ONLINE_WEBSITE' | 'OFFLINE_STORE' | 'PAST_LEGACY' | string;
  billDocumentUrl?: string | null;
  devicePhotoUrl?: string | null;
  verificationStatus?: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED_INVALID_BILL' | string;
  warrantyType: string;
  warrantyPeriod: string;
  issueDescription: string;
  faultCategory?: string | null;
  physicalCondition?: string | null;
  accessoriesReceived?: string | null;
  status: 'RECEIVED' | 'UNDER_INSPECTION' | 'SENT_TO_BRAND' | 'REPAIRED_READY' | 'DELIVERED_CLOSED' | 'REJECTED';
  serviceCost: number;
  estimatedReadyDate?: string | null;
  resolutionNotes?: string | null;
  technicianNotes?: string | null;
  staffName?: string | null;
  brandRmaNumber?: string | null;
  handedOverDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; hindi: string; bg: string; text: string; border: string; dot: string }
> = {
  RECEIVED: {
    label: 'Received at Desk',
    hindi: 'दुकान में जमा',
    bg: 'bg-blue-50 text-blue-800',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  UNDER_INSPECTION: {
    label: 'Under Inspection',
    hindi: 'जाँच चालू है',
    bg: 'bg-amber-50 text-amber-800',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  SENT_TO_BRAND: {
    label: 'Sent to Brand Center',
    hindi: 'कंपनी सर्विस सेंटर भेजा गया',
    bg: 'bg-purple-50 text-purple-800',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  REPAIRED_READY: {
    label: 'Repaired & Ready',
    hindi: 'तैयार है (कस्टमर को दें)',
    bg: 'bg-emerald-50 text-emerald-800',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  DELIVERED_CLOSED: {
    label: 'Delivered & Closed',
    hindi: 'कस्टमर को दे दिया गया',
    bg: 'bg-slate-100 text-slate-700',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  },
  REJECTED: {
    label: 'Rejected (Damage/Expired)',
    hindi: 'रद्द / आउट ऑफ वारंटी',
    bg: 'bg-rose-50 text-rose-800',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};

export default function WarrantyManager() {
  const { siteSettings, orders, showToast } = useStore();

  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    onlineCount: 0,
    offlineCount: 0,
    pastCount: 0,
    pendingVerification: 0,
    received: 0,
    underInspection: 0,
    sentToBrand: 0,
    repairedReady: 0,
    deliveredClosed: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');

  // Modals & Drawers
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<{ url: string; title: string } | null>(null);

  // New Claim Form State
  const [purchaseChannel, setPurchaseChannel] = useState<'OFFLINE_STORE' | 'ONLINE_WEBSITE' | 'PAST_LEGACY'>('OFFLINE_STORE');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerEmail, setFormCustomerEmail] = useState('');
  const [formCustomerAddress, setFormCustomerAddress] = useState('');
  const [formProductName, setFormProductName] = useState('');
  const [formCategory, setFormCategory] = useState('Laptop');
  const [formBrand, setFormBrand] = useState('HP');
  const [formModel, setFormModel] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formOrderId, setFormOrderId] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formWarrantyType, setFormWarrantyType] = useState('Brand Authorized Warranty');
  const [formWarrantyPeriod, setFormWarrantyPeriod] = useState('1 Year');
  const [formIssue, setFormIssue] = useState('');
  const [formFaultCategory, setFormFaultCategory] = useState('Hardware');
  const [formPhysicalCondition, setFormPhysicalCondition] = useState('Normal condition, minor wear');
  const [formAccessories, setFormAccessories] = useState('Device + Original Power Adapter');
  const [formEstimatedDate, setFormEstimatedDate] = useState('');
  const [formStaffName, setFormStaffName] = useState('Jay Prakash / Counter');
  
  // File uploads
  const [billFileBase64, setBillFileBase64] = useState<string | null>(null);
  const [billFileName, setBillFileName] = useState('');
  const [deviceFileBase64, setDeviceFileBase64] = useState<string | null>(null);
  const [deviceFileName, setDeviceFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status & Notes Update State
  const [updateStatus, setUpdateStatus] = useState<WarrantyClaim['status']>('RECEIVED');
  const [updateVerification, setUpdateVerification] = useState('VERIFIED');
  const [updateTechNotes, setUpdateTechNotes] = useState('');
  const [updateResNotes, setUpdateResNotes] = useState('');
  const [updateRmaNumber, setUpdateRmaNumber] = useState('');
  const [updateServiceCost, setUpdateServiceCost] = useState('0');
  const [updateEstimatedDate, setUpdateEstimatedDate] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/warranty');
      const data = await res.json();
      if (res.ok && data.success) {
        setClaims(data.claims || []);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        showToast(data.error || 'Failed to load warranty claims.');
      }
    } catch {
      showToast('Network error loading warranty claims.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (channelFilter !== 'ALL' && c.purchaseChannel !== channelFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.claimId.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.includes(q) ||
        (c.serialNumber && c.serialNumber.toLowerCase().includes(q)) ||
        c.productName.toLowerCase().includes(q) ||
        (c.brand && c.brand.toLowerCase().includes(q)) ||
        (c.orderId && c.orderId.toLowerCase().includes(q)) ||
        (c.invoiceNumber && c.invoiceNumber.toLowerCase().includes(q))
      );
    });
  }, [claims, statusFilter, channelFilter, searchQuery]);

  // Handle Order Selection from past orders
  const handleSelectPastOrder = (orderId: string) => {
    const found = orders.find((o) => o.orderId === orderId);
    if (!found) return;

    setPurchaseChannel('ONLINE_WEBSITE');
    setFormOrderId(found.orderId);
    setFormInvoiceNumber(`INV-${found.orderId}`);
    setFormCustomerName(found.customerName || '');
    setFormCustomerPhone(found.phone?.replace(/\D/g, '').slice(-10) || '');
    setFormCustomerAddress(found.address || '');

    if (found.items && found.items.length > 0) {
      const firstItem = found.items[0];
      setFormProductName(firstItem.name || '');
      if (firstItem.category) setFormCategory(firstItem.category);
    }
    if (found.date) {
      setFormPurchaseDate(found.date);
    }
    showToast(`Online Order #${orderId} autofilled!`);
  };

  // Convert File to Base64
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

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || !formCustomerPhone.trim() || !formProductName.trim() || !formIssue.trim()) {
      showToast('Please fill in Customer Name, 10-digit Phone, Product Name, and Fault Description.');
      return;
    }

    if (purchaseChannel === 'OFFLINE_STORE' && !formInvoiceNumber.trim() && !billFileBase64) {
      showToast('Please enter Showroom Bill No. or upload Bill Photo.');
      return;
    }

    if (purchaseChannel === 'PAST_LEGACY' && !formSerial.trim() && !billFileBase64) {
      showToast('Past customer requires Serial Number or Old Bill Photo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseChannel,
          customerName: formCustomerName.trim(),
          customerPhone: formCustomerPhone.trim(),
          customerEmail: formCustomerEmail.trim() || undefined,
          customerAddress: formCustomerAddress.trim() || undefined,
          productName: formProductName.trim(),
          productCategory: formCategory,
          brand: formBrand,
          modelNumber: formModel.trim() || undefined,
          serialNumber: formSerial.trim() || undefined,
          orderId: formOrderId.trim() || undefined,
          invoiceNumber: formInvoiceNumber.trim() || undefined,
          purchaseDate: formPurchaseDate.trim() || undefined,
          warrantyType: formWarrantyType,
          warrantyPeriod: formWarrantyPeriod,
          issueDescription: formIssue.trim(),
          faultCategory: formFaultCategory,
          physicalCondition: formPhysicalCondition.trim(),
          accessoriesReceived: formAccessories.trim(),
          estimatedReadyDate: formEstimatedDate.trim() || undefined,
          staffName: formStaffName.trim(),
          billDocumentUrl: billFileBase64 || undefined,
          devicePhotoUrl: deviceFileBase64 || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Warranty Claim #${data.claim.claimId} created!`);
        setIsNewModalOpen(false);
        resetForm();
        fetchClaims();
        setSelectedClaim(data.claim);
        setIsPrintModalOpen(true);
      } else {
        showToast(data.error || 'Failed to register warranty claim.');
      }
    } catch {
      showToast('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPurchaseChannel('OFFLINE_STORE');
    setFormCustomerName('');
    setFormCustomerPhone('');
    setFormCustomerEmail('');
    setFormCustomerAddress('');
    setFormProductName('');
    setFormModel('');
    setFormSerial('');
    setFormOrderId('');
    setFormInvoiceNumber('');
    setFormPurchaseDate('');
    setFormIssue('');
    setFormEstimatedDate('');
    setBillFileBase64(null);
    setBillFileName('');
    setDeviceFileBase64(null);
    setDeviceFileName('');
  };

  const handleOpenUpdate = (claim: WarrantyClaim) => {
    setSelectedClaim(claim);
    setUpdateStatus(claim.status);
    setUpdateVerification(claim.verificationStatus || 'VERIFIED');
    setUpdateTechNotes(claim.technicianNotes || '');
    setUpdateResNotes(claim.resolutionNotes || '');
    setUpdateRmaNumber(claim.brandRmaNumber || '');
    setUpdateServiceCost(String(claim.serviceCost || 0));
    setUpdateEstimatedDate(claim.estimatedReadyDate || '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/warranty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedClaim.id,
          status: updateStatus,
          verificationStatus: updateVerification,
          technicianNotes: updateTechNotes.trim() || undefined,
          resolutionNotes: updateResNotes.trim() || undefined,
          brandRmaNumber: updateRmaNumber.trim() || undefined,
          serviceCost: Number(updateServiceCost) || 0,
          estimatedReadyDate: updateEstimatedDate.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Claim #${selectedClaim.claimId} updated successfully!`);
        setIsUpdateModalOpen(false);
        fetchClaims();
      } else {
        showToast(data.error || 'Failed to update claim.');
      }
    } catch {
      showToast('Connection error updating claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClaim = async (claimId: string, id: string) => {
    if (!confirm(`Are you sure you want to delete Warranty Claim #${claimId}?`)) return;

    try {
      const res = await fetch(`/api/warranty?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Claim #${claimId} deleted.`);
        fetchClaims();
      } else {
        showToast(data.error || 'Failed to delete claim.');
      }
    } catch {
      showToast('Network error deleting claim.');
    }
  };

  const generateWhatsAppMessage = (c: WarrantyClaim) => {
    let msg = `*LAPIEZ GARHWA - WARRANTY & SERVICE UPDATE*\n\n`;
    msg += `Namaste *${c.customerName}* ji,\n`;
    msg += `Aapke device *${c.productName}* ka warranty claim update:\n\n`;
    msg += `📌 *Job Sheet No:* ${c.claimId}\n`;
    if (c.serialNumber) msg += `🔢 *Serial No:* ${c.serialNumber}\n`;
    msg += `⚙️ *Current Status:* ${STATUS_CONFIG[c.status]?.label || c.status} (${STATUS_CONFIG[c.status]?.hindi || ''})\n`;

    if (c.status === 'REPAIRED_READY') {
      msg += `\n🎉 *Good News!* Aapka device successfully repair/inspect ho gaya hai. Kripya apna Job Sheet lekar showroom se collect karein.\n`;
    } else if (c.status === 'SENT_TO_BRAND') {
      msg += `\n🚚 Aapka device Authorized Brand Service Center dispatched ho chuka hai. Brand RMA: ${c.brandRmaNumber || 'Under Process'}.\n`;
    } else if (c.status === 'DELIVERED_CLOSED') {
      msg += `\n✅ Device aapko hand over kar diya gaya hai. Lapiez Garhwa ko chune ke liye dhanyawad!\n`;
    }

    if (c.estimatedReadyDate) {
      msg += `🗓️ *Est. Ready Date:* ${c.estimatedReadyDate}\n`;
    }

    msg += `\n📍 *Showroom Address:* In front of G P Plaza, Chiniya Road, Garhwa\n`;
    msg += `📞 *Call / WhatsApp Desk:* +91 9608828288\n`;

    return encodeURIComponent(msg);
  };

  return (
    <div className="space-y-6">

      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-[#0F1D3D] via-[#1A365D] to-[#1E3A8A] rounded-2xl p-6 text-white shadow-lg border border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Garhwa Showroom Warranty & RMA Desk</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Customer Warranty & Service Claims</span>
          </h2>
          <p className="text-xs text-blue-200/80 max-w-2xl leading-relaxed">
            Support for <strong>Showroom Walk-in Counter Purchases</strong>, <strong>Website Online Orders</strong>, and <strong>Past Legacy Customers</strong> with Bill verification, Serial number tracking, and Brand ASC (HP, Dell, Lenovo, Hikvision) coordination.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Warranty Claim (नया क्लेम दर्ज करें)</span>
          </button>

          <button
            onClick={fetchClaims}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
            title="Refresh Claims"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Channel & Purchase Type Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        
        {/* All Claims */}
        <div
          onClick={() => { setChannelFilter('ALL'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            channelFilter === 'ALL' && statusFilter === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`text-[11px] font-bold uppercase tracking-wider ${
            channelFilter === 'ALL' && statusFilter === 'ALL' ? 'text-blue-100' : 'text-slate-500'
          }`}>
            Total Claims
          </div>
          <div className="text-2xl font-black mt-1">{metrics.total}</div>
          <div className={`text-[10px] mt-0.5 ${
            channelFilter === 'ALL' && statusFilter === 'ALL' ? 'text-blue-200' : 'text-slate-400'
          }`}>
            All channels combined
          </div>
        </div>

        {/* 1. Showroom Offline Purchases */}
        <div
          onClick={() => setChannelFilter('OFFLINE_STORE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            channelFilter === 'OFFLINE_STORE'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            channelFilter === 'OFFLINE_STORE' ? 'text-purple-100' : 'text-purple-700'
          }`}>
            <Store className="w-3.5 h-3.5" />
            <span>Showroom Shop Bill</span>
          </div>
          <div className="text-2xl font-black mt-1">{metrics.offlineCount}</div>
          <div className={`text-[10px] mt-0.5 ${
            channelFilter === 'OFFLINE_STORE' ? 'text-purple-200' : 'text-purple-600'
          }`}>
            दुकान से खरीदा हुआ
          </div>
        </div>

        {/* 2. Online Website Orders */}
        <div
          onClick={() => setChannelFilter('ONLINE_WEBSITE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            channelFilter === 'ONLINE_WEBSITE'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            channelFilter === 'ONLINE_WEBSITE' ? 'text-blue-100' : 'text-blue-700'
          }`}>
            <Globe className="w-3.5 h-3.5" />
            <span>Online Orders</span>
          </div>
          <div className="text-2xl font-black mt-1">{metrics.onlineCount}</div>
          <div className={`text-[10px] mt-0.5 ${
            channelFilter === 'ONLINE_WEBSITE' ? 'text-blue-200' : 'text-blue-600'
          }`}>
            वेबसाइट से आर्डर
          </div>
        </div>

        {/* 3. Past Legacy Customers */}
        <div
          onClick={() => setChannelFilter('PAST_LEGACY')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            channelFilter === 'PAST_LEGACY'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            channelFilter === 'PAST_LEGACY' ? 'text-amber-100' : 'text-amber-700'
          }`}>
            <History className="w-3.5 h-3.5" />
            <span>Past Customers</span>
          </div>
          <div className="text-2xl font-black mt-1">{metrics.pastCount}</div>
          <div className={`text-[10px] mt-0.5 ${
            channelFilter === 'PAST_LEGACY' ? 'text-amber-200' : 'text-amber-600'
          }`}>
            पुराने बिल व ग्राहक
          </div>
        </div>

        {/* 4. Pending Bill Verification */}
        <div
          onClick={() => { setChannelFilter('ALL'); setStatusFilter('RECEIVED'); }}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-300 transition-all cursor-pointer"
        >
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Bill Verification</span>
          </div>
          <div className="text-2xl font-black text-rose-900 mt-1">{metrics.pendingVerification}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">बिल जाँचना बाकी है</div>
        </div>

      </div>

      {/* Search & Channel Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Job ID, Mobile, Serial No, Bill No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Channel Filters */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Channels' },
            { id: 'OFFLINE_STORE', label: '🏪 Shop Bills' },
            { id: 'ONLINE_WEBSITE', label: '🌐 Online' },
            { id: 'PAST_LEGACY', label: '📜 Past Customers' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setChannelFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                channelFilter === pill.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Status' },
            { id: 'RECEIVED', label: 'Received' },
            { id: 'UNDER_INSPECTION', label: 'Diagnosis' },
            { id: 'SENT_TO_BRAND', label: 'Brand ASC' },
            { id: 'REPAIRED_READY', label: 'Ready' },
            { id: 'DELIVERED_CLOSED', label: 'Delivered' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

      </div>

      {/* Claims List Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-xs font-semibold">Loading warranty claims...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No warranty claims found</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click "New Warranty Claim" to register a walk-in, online, or past customer repair claim.
            </p>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Claim Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Job ID & Channel</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Device & Serial</th>
                  <th className="py-3.5 px-4">Bill & Documents</th>
                  <th className="py-3.5 px-4">Problem / Issue</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map((claim) => {
                  const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.RECEIVED;
                  const channel = claim.purchaseChannel || 'OFFLINE_STORE';

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Job ID & Purchase Channel */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-extrabold text-blue-700 text-sm">{claim.claimId}</div>
                        <div className="mt-1">
                          {channel === 'ONLINE_WEBSITE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Globe className="w-3 h-3" />
                              <span>Online Order</span>
                            </span>
                          ) : channel === 'PAST_LEGACY' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <History className="w-3 h-3" />
                              <span>Past Customer</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Store className="w-3 h-3" />
                              <span>Shop Bill</span>
                            </span>
                          )}
                        </div>
                        {claim.orderId && (
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            Order: #{claim.orderId}
                          </div>
                        )}
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{claim.customerName}</div>
                        <div className="text-slate-600 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{claim.customerPhone}</span>
                        </div>
                        {claim.customerAddress && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5" title={claim.customerAddress}>
                            📍 {claim.customerAddress}
                          </div>
                        )}
                      </td>

                      {/* Device & Serial */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 max-w-[180px] truncate" title={claim.productName}>
                          {claim.productName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {claim.brand || 'Device'} • {claim.productCategory || 'Hardware'}
                        </div>
                        {claim.serialNumber ? (
                          <div className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded inline-block mt-1 font-bold text-[10.5px]">
                            SN: {claim.serialNumber}
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-700 mt-1 font-semibold">
                            ⚠️ No Serial entered
                          </div>
                        )}
                      </td>

                      {/* Bill & Documents */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {claim.invoiceNumber ? (
                            <div className="font-mono text-[11px] font-bold text-slate-800">
                              Bill: {claim.invoiceNumber}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">No Bill No.</div>
                          )}

                          {claim.purchaseDate && (
                            <div className="text-[10px] text-slate-500">
                              Date: {claim.purchaseDate}
                            </div>
                          )}

                          {/* Bill Copy Preview Button */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {claim.billDocumentUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewingDocumentUrl({
                                  url: claim.billDocumentUrl!,
                                  title: `Invoice / Bill Copy - ${claim.customerName} (#${claim.claimId})`,
                                })}
                                className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <FileCheck className="w-3 h-3 text-emerald-600" />
                                <span>View Bill</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No Bill File</span>
                            )}

                            {claim.devicePhotoUrl && (
                              <button
                                type="button"
                                onClick={() => setViewingDocumentUrl({
                                  url: claim.devicePhotoUrl!,
                                  title: `Device / Serial Photo - #${claim.claimId}`,
                                })}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] cursor-pointer"
                                title="View Device Photo"
                              >
                                <ImageIcon className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Issue Description */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="text-slate-800 line-clamp-2" title={claim.issueDescription}>
                          {claim.issueDescription}
                        </div>
                        {claim.accessoriesReceived && (
                          <div className="text-[10px] text-slate-500 mt-1 truncate" title={claim.accessoriesReceived}>
                            📦 {claim.accessoriesReceived}
                          </div>
                        )}
                        {claim.brandRmaNumber && (
                          <div className="text-[10px] font-mono text-purple-700 font-bold mt-0.5">
                            RMA: {claim.brandRmaNumber}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                          <span>{cfg.label}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {cfg.hindi}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenUpdate(claim)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Update
                        </button>

                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setIsPrintModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Print Customer Job Sheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`https://wa.me/91${claim.customerPhone}?text=${generateWhatsAppMessage(claim)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 inline-flex items-center justify-center cursor-pointer"
                          title="WhatsApp Customer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDeleteClaim(claim.claimId, claim.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Claim"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: NEW WARRANTY CLAIM (ONLINE / OFFLINE / PAST CUSTOMER) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">New Warranty Claim & Service Registration</h3>
                  <p className="text-xs text-slate-500">Showroom Offline Bill, Online Order, ya Purane Customer ke liye</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CHANNEL SELECTOR TABS */}
            <div className="mb-6 p-1.5 bg-slate-100 rounded-2xl grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setPurchaseChannel('OFFLINE_STORE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  purchaseChannel === 'OFFLINE_STORE'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>1. Showroom Shop Purchase (दुकान से खरीदा)</span>
              </button>

              <button
                type="button"
                onClick={() => setPurchaseChannel('ONLINE_WEBSITE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  purchaseChannel === 'ONLINE_WEBSITE'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>2. Online Website Order (ऑनलाइन आर्डर)</span>
              </button>

              <button
                type="button"
                onClick={() => setPurchaseChannel('PAST_LEGACY')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  purchaseChannel === 'PAST_LEGACY'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-4 h-4" />
                <span>3. Past Customer (पुराना ग्राहक)</span>
              </button>
            </div>

            {/* Autofill for Online Channel */}
            {purchaseChannel === 'ONLINE_WEBSITE' && orders && orders.length > 0 && (
              <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-1.5">
                <label className="block text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                  ⚡ Autofill from Past Online Orders
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleSelectPastOrder(e.target.value);
                  }}
                  className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  defaultValue=""
                >
                  <option value="">-- Choose customer online order --</option>
                  {orders.slice(0, 20).map((o) => (
                    <option key={o.id} value={o.orderId}>
                      #{o.orderId} • {o.customerName} ({o.phone}) • ₹{o.totalAmount}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleCreateClaim} className="space-y-5">
              
              {/* Section 1: Customer Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customer Contact Details (ग्राहक की जानकारी)</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Verma"
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9608828288"
                      value={formCustomerPhone}
                      onChange={(e) => setFormCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City / Showroom Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chiniya Road, Garhwa"
                      value={formCustomerAddress}
                      onChange={(e) => setFormCustomerAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@gmail.com"
                      value={formCustomerEmail}
                      onChange={(e) => setFormCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Bill & Purchase Proof */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    {purchaseChannel === 'OFFLINE_STORE' && 'Showroom Bill & Invoice Details (दुकान का बिल)'}
                    {purchaseChannel === 'ONLINE_WEBSITE' && 'Online Website Order Verification'}
                    {purchaseChannel === 'PAST_LEGACY' && 'Past Purchase Record (पुराना बिल/कैश मेमो)'}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {purchaseChannel === 'ONLINE_WEBSITE' ? 'Online Order ID' : 'Bill / Invoice / Cash Memo No.'} *
                    </label>
                    <input
                      type="text"
                      placeholder={purchaseChannel === 'ONLINE_WEBSITE' ? 'e.g. LPZ-2601-921' : 'e.g. INV-2026-081 or Bill #1024'}
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date of Purchase (खरीदने की तारीख)
                    </label>
                    <input
                      type="date"
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Bill Photo Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-purple-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-purple-600" />
                        <span>Upload Showroom Bill Photo (बिल की फोटो)</span>
                      </span>
                      {billFileName && (
                        <span className="text-[10px] text-emerald-700 font-bold truncate max-w-[120px]">
                          ✓ {billFileName}
                        </span>
                      )}
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'bill')}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />
                    <p className="text-[10.5px] text-purple-700/80">
                      Take photo of showroom GST bill / receipt / warranty slip.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Device / Serial Sticker Photo</span>
                      </span>
                      {deviceFileName && (
                        <span className="text-[10px] text-emerald-700 font-bold truncate max-w-[120px]">
                          ✓ {deviceFileName}
                        </span>
                      )}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'device')}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    <p className="text-[10.5px] text-slate-500">
                      Photo of device serial sticker or defect screen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Hardware & Serial Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-600" />
                  <span>Hardware & Serial Identifier</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="Laptop">Laptop (लैपटॉप)</option>
                      <option value="Desktop">Desktop / All-in-One PC</option>
                      <option value="CCTV">CCTV Camera / DVR</option>
                      <option value="Printer">Printer / Scanner</option>
                      <option value="Motherboard">Motherboard / RAM / SSD</option>
                      <option value="Monitor">Monitor / Display</option>
                      <option value="Accessory">Keyboard / Mouse / UPS</option>
                      <option value="Other">Other Hardware</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
                    <select
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
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
                      <option value="Lapiez">Lapiez Brand</option>
                      <option value="Other">Other</option>
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
                      value={formSerial}
                      onChange={(e) => setFormSerial(e.target.value.toUpperCase())}
                      className="w-full bg-purple-50/50 border border-purple-300 rounded-xl px-3.5 py-2.5 text-xs text-purple-900 focus:outline-none focus:border-purple-600 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HP 15s Core i5 12th Gen 16GB / 512GB SSD"
                    value={formProductName}
                    onChange={(e) => setFormProductName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Coverage</label>
                    <select
                      value={formWarrantyType}
                      onChange={(e) => setFormWarrantyType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="Brand Authorized Warranty">Brand Authorized Warranty (कंपनी वारंटी)</option>
                      <option value="Lapiez Showroom Warranty">Lapiez Showroom Warranty</option>
                      <option value="Refurbished 6-Month Warranty">Refurbished 6-Month Warranty</option>
                      <option value="Out of Warranty Service">Out of Warranty / Paid Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Period</label>
                    <select
                      value={formWarrantyPeriod}
                      onChange={(e) => setFormWarrantyPeriod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="6 Months">6 Months (Refurbished)</option>
                      <option value="1 Year">1 Year Standard</option>
                      <option value="2 Years">2 Years</option>
                      <option value="3 Years">3 Years (Commercial/CCTV)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Fault & Accessories */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fault Description & Physical Check</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Problem / Fault Description *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Describe exact customer issue (e.g. Display lines, battery draining fast, dead power, CCTV camera blurry)"
                    value={formIssue}
                    onChange={(e) => setFormIssue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Accessories Received (सामान क्या-क्या मिला)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Device + Original Charger + Power Cable"
                      value={formAccessories}
                      onChange={(e) => setFormAccessories(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Physical Condition (शारीरिक स्थिति)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Minor scratches, screen intact, no water spill"
                      value={formPhysicalCondition}
                      onChange={(e) => setFormPhysicalCondition(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estimated Ready Date
                    </label>
                    <input
                      type="date"
                      value={formEstimatedDate}
                      onChange={(e) => setFormEstimatedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Staff Handler Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jay Prakash / Rohit"
                      value={formStaffName}
                      onChange={(e) => setFormStaffName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving & Uploading Bill...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Register & Print Job Sheet (दर्ज करें)</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE STATUS & VERIFICATION */}
      {isUpdateModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Update Claim #{selectedClaim.claimId}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedClaim.customerName} • {selectedClaim.productName}
                </p>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Repair Progress Status
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none"
                  >
                    <option value="RECEIVED">1. RECEIVED (दुकान में जमा)</option>
                    <option value="UNDER_INSPECTION">2. UNDER_INSPECTION (जाँच चालू)</option>
                    <option value="SENT_TO_BRAND">3. SENT_TO_BRAND (Brand ASC भेजा)</option>
                    <option value="REPAIRED_READY">4. REPAIRED_READY (तैयार है)</option>
                    <option value="DELIVERED_CLOSED">5. DELIVERED_CLOSED (दे दिया गया)</option>
                    <option value="REJECTED">6. REJECTED (रद्द / डैमेज)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bill Verification Status
                  </label>
                  <select
                    value={updateVerification}
                    onChange={(e) => setUpdateVerification(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none"
                  >
                    <option value="VERIFIED">✓ Bill Verified (बिल जाँचा गया)</option>
                    <option value="PENDING_VERIFICATION">⏳ Verification Pending</option>
                    <option value="REJECTED_INVALID_BILL">✕ Invalid / Fake Bill</option>
                  </select>
                </div>
              </div>

              {updateStatus === 'SENT_TO_BRAND' && (
                <div>
                  <label className="block text-xs font-bold text-purple-800 mb-1">
                    Brand RMA / Ticket Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HP RMA #IN-981245 or Dell Tag"
                    value={updateRmaNumber}
                    onChange={(e) => setUpdateRmaNumber(e.target.value)}
                    className="w-full bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-xs text-purple-900 font-mono font-bold focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Technician / Diagnosis Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Technician diagnostic findings..."
                  value={updateTechNotes}
                  onChange={(e) => setUpdateTechNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Cost (₹0 if under warranty)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={updateServiceCost}
                    onChange={(e) => setUpdateServiceCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Est. Ready Date
                  </label>
                  <input
                    type="date"
                    value={updateEstimatedDate}
                    onChange={(e) => setUpdateEstimatedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW UPLOADED BILL / DOCUMENT */}
      {viewingDocumentUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="font-bold text-sm text-slate-800 truncate max-w-lg">
                {viewingDocumentUrl.title}
              </div>
              <button
                onClick={() => setViewingDocumentUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-slate-900 rounded-2xl p-2">
              <img
                src={viewingDocumentUrl.url}
                alt="Document Preview"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={viewingDocumentUrl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Image</span>
              </a>

              <button
                onClick={() => setViewingDocumentUrl(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE JOB SHEET */}
      {isPrintModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase">Customer Job Sheet Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Body */}
            <div className="border border-slate-300 p-6 rounded-2xl font-sans text-slate-900 space-y-4 print:border-slate-800">
              
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-blue-900 tracking-tight">LAPIEZ SOLUTIONS</h2>
                  <p className="text-[11px] text-slate-600">Garhwa Showroom & Service Support Desk</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    In front of G P Plaza, Chiniya Road, Garhwa, Jharkhand - 822114
                  </p>
                  <p className="text-[10px] text-slate-500">Phone: +91 9608828288 • GSTIN: 20AABCL1234F1Z5</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase">JOB SHEET NO</div>
                  <div className="text-lg font-black text-blue-700 font-mono">{selectedClaim.claimId}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Date: {new Date(selectedClaim.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Customer Details</div>
                  <div className="font-bold text-slate-900">{selectedClaim.customerName}</div>
                  <div className="font-mono text-slate-700">Phone: {selectedClaim.customerPhone}</div>
                  {selectedClaim.customerAddress && (
                    <div className="text-[10.5px] text-slate-600">{selectedClaim.customerAddress}</div>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Device & Purchase Proof</div>
                  <div className="font-bold text-slate-900">{selectedClaim.productName}</div>
                  <div className="text-slate-600">Brand: {selectedClaim.brand || 'Other'}</div>
                  {selectedClaim.serialNumber && (
                    <div className="font-mono font-bold text-purple-700">SN: {selectedClaim.serialNumber}</div>
                  )}
                  {selectedClaim.invoiceNumber && (
                    <div className="font-mono text-slate-700">Bill No: {selectedClaim.invoiceNumber}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="border border-slate-200 p-2.5 rounded-xl">
                  <span className="font-bold text-slate-800">Reported Problem: </span>
                  <span className="text-slate-700">{selectedClaim.issueDescription}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="border border-slate-200 p-2 rounded-xl">
                    <span className="font-bold text-slate-600">Accessories: </span>
                    <span className="text-slate-800">{selectedClaim.accessoriesReceived || 'Device only'}</span>
                  </div>
                  <div className="border border-slate-200 p-2 rounded-xl">
                    <span className="font-bold text-slate-600">Condition: </span>
                    <span className="text-slate-800">{selectedClaim.physicalCondition || 'Normal usage'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[9px] text-slate-500 space-y-1 border-t">
                <p>1. Diagnosis takes 3-7 working days. Brand warranty repairs depend on Brand ASC turnaround time.</p>
                <p>2. Please backup your data prior to service. Showroom is not responsible for data loss.</p>
                <p>3. Please collect device within 30 days of repair completion by presenting this original Job Sheet slip.</p>
              </div>

              <div className="pt-6 flex items-center justify-between text-xs text-slate-700">
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="text-[10px] text-slate-500">Customer Signature</span>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="text-[10px] text-slate-500">Authorized Desk Sign & Stamp</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
