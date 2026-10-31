'use client';

import React, { useState, useRef } from 'react';
import {
  UserCircle,
  Building2,
  Paintbrush,
  Printer,
  Users,
  BellRing,
  Briefcase,
  HelpCircle,
  CheckCircle2,
  Share2,
  Download,
  Copy,
  Save,
  QrCode,
  Calendar,
  Send,
  Plus,
  X,
  FileCode,
  Lock,
  ZoomIn,
  ZoomOut,
  Tag,
  Clock,
  ShieldCheck,
  Check,
  MessageSquare,
  Search,
  Sparkles,
  Layers,
  Sliders,
  RotateCcw,
  Key,
  HardDrive,
  Monitor
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { STORE_INFO } from '../../data/storeData';

export type SettingsTabId =
  | 'account'
  | 'business'
  | 'invoice'
  | 'thermal_print'
  | 'team'
  | 'reminders'
  | 'ca_sharing'
  | 'help_support';

interface MyBillBookCockpitProps {
  initialTab?: SettingsTabId;
}

export default function MyBillBookCockpit({ initialTab = 'account' }: MyBillBookCockpitProps) {
  const { products, invoices, showToast } = useStore();
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);

  // Active Company Context State
  const [activeCompany, setActiveCompany] = useState({
    legalName: 'Lapiez IT Showroom Pvt. Ltd.',
    tradeName: 'Lapiez Computer Hub & Solutions',
    gstin: '20AAACL1234F1Z8',
    pan: 'AAACL1234F',
    addressLine1: 'Main Road, Opp. Sadar Hospital',
    addressLine2: 'Near Overbridge Market',
    city: 'Garhwa',
    state: 'Jharkhand',
    stateCode: '20',
    pincode: '822114',
    phone: STORE_INFO.phone || '+91 74001 74001',
    email: STORE_INFO.email || 'care@lapiez.com',
    bankName: 'Union Bank of India',
    bankAccountNo: '638301010050261',
    bankIfsc: 'UBIN0563838',
    bankBranch: 'GARHWA',
    upiId: 'lappy.solution@ybl',
    classification: 'Retailer & IT Solutions',
    industry: 'Electronics & Computers',
    logoUrl: '/favicon.ico',
    eInvoiceEnabled: false,
    tdsEnabled: false,
    tcsEnabled: false,
    irpUsername: '',
    irpClientId: '',
    irpEnvironment: 'sandbox' as 'sandbox' | 'production',
    terms: '1. Goods once sold will be replaced under warranty policy.\n2. In case of dispute, Garhwa jurisdiction only.\n3. Payment due within 7 days of invoice date.'
  });

  // =========================================================================
  // SECTION 1: ACCOUNT & STORE ACCESS STATE
  // =========================================================================
  const [profileName, setProfileName] = useState('Anand Kumar (Store Admin)');
  const [profilePhone, setProfilePhone] = useState('+91 94709 90000');
  const [profileEmail, setProfileEmail] = useState('admin@lapiez.com');
  const [adminPin, setAdminPin] = useState('8221');
  const [autoPrintOnSave, setAutoPrintOnSave] = useState(true);
  const [autoLogoutTimer, setAutoLogoutTimer] = useState('30_mins');
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [suggestionRating, setSuggestionRating] = useState(5);
  const [suggestionCategory, setSuggestionCategory] = useState('Feature Request');
  const [suggestionText, setSuggestionText] = useState('');

  const handleSubmitSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) {
      showToast('Please enter your feedback description');
      return;
    }
    showToast('Thank you! Your suggestion has been saved. 🚀');
    setIsSuggestionModalOpen(false);
    setSuggestionText('');
  };

  // =========================================================================
  // SECTION 2: MANAGE BUSINESS & TALLY EXPORT & CLOSE FY
  // =========================================================================
  const [isTallyModalOpen, setIsTallyModalOpen] = useState(false);
  const [tallyDateRange, setTallyDateRange] = useState('current_month');
  const [isCloseFyModalOpen, setIsCloseFyModalOpen] = useState(false);
  const [currentFy, setCurrentFy] = useState('2025 - 2026');
  const [nextFy, setNextFy] = useState('2026 - 2027');
  const [isGstFetching, setIsGstFetching] = useState(false);
  const [isBusinessSwitcherOpen, setIsBusinessSwitcherOpen] = useState(false);
  const [savedBusinesses, setSavedBusinesses] = useState([
    { id: '1', name: 'Lapiez IT Showroom Pvt. Ltd.', city: 'Garhwa', gstin: '20AAACL1234F1Z8', isPrimary: true },
    { id: '2', name: 'Lapiez Mobile & Accessories Hub', city: 'Daltonganj', gstin: '20AAACL1234F2Z7', isPrimary: false },
    { id: '3', name: 'Lapiez Wholesale Godown', city: 'Ranchi', gstin: '20AAACL1234F3Z6', isPrimary: false },
  ]);

  // Signature Canvas
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startSigning = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsSigning(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawSigning = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSigning) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopSigning = () => {
    setIsSigning(false);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    showToast('Signature canvas cleared');
  };

  const handleFetchGstin = () => {
    if (!activeCompany.gstin || activeCompany.gstin.length < 15) {
      showToast('Please enter a valid 15-character GSTIN');
      return;
    }
    setIsGstFetching(true);
    setTimeout(() => {
      setIsGstFetching(false);
      showToast('GST details verified with GSTN Portal! Legal name and state matched.');
    }, 900);
  };

  const handleExportTallyXml = () => {
    const tallyXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${activeCompany.legalName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <COMPANY>
            <NAME>${activeCompany.legalName}</NAME>
            <GSTIN>${activeCompany.gstin}</GSTIN>
            <STATE>${activeCompany.state}</STATE>
          </COMPANY>
        </TALLYMESSAGE>
        ${invoices.slice(0, 10).map((inv, idx) => `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>${new Date((inv as any).date || (inv as any).createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '')}</DATE>
            <VOUCHERNUMBER>${inv.invoiceNumber || `INV-${202600 + idx}`}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${(inv as any).buyerName || (inv as any).customerName || 'Cash Sale Customer'}</PARTYLEDGERNAME>
            <STATENAME>${activeCompany.state}</STATENAME>
            <AMOUNT>-${inv.grandTotal || 0}</AMOUNT>
          </VOUCHER>
        </TALLYMESSAGE>`).join('\n')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    const blob = new Blob([tallyXmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TALLY_EXPORT_${activeCompany.legalName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsTallyModalOpen(false);
    showToast('Tally XML transaction pack exported successfully! Compatible with Tally Prime & ERP 9.');
  };

  const handleCloseFinancialYear = () => {
    setCurrentFy(nextFy);
    const startYear = parseInt(nextFy.split('-')[1].trim());
    setNextFy(`${startYear} - ${startYear + 1}`);
    setIsCloseFyModalOpen(false);
    showToast(`Financial Year advanced to ${nextFy}! Ledger balances rolled over into opening balances.`);
  };

  // =========================================================================
  // SECTION 3: INVOICE SETTINGS & LIVE PREVIEW
  // =========================================================================
  type InvoiceTheme =
    | 'modern_teal'
    | 'classic_blue'
    | 'tally_gst'
    | 'luxury'
    | 'stylish_pastel'
    | 'navratri'
    | 'durga_puja'
    | 'dussehra'
    | 'dhanteras'
    | 'diwali';

  const [selectedTheme, setSelectedTheme] = useState<InvoiceTheme>('modern_teal');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Invoice Customizer Toggles
  const [invShowLogo, setInvShowLogo] = useState(true);
  const [invShowQr, setInvShowQr] = useState(true);
  const [invShowBank, setInvShowBank] = useState(true);
  const [invShowHsn, setInvShowHsn] = useState(true);
  const [invShowSignatory, setInvShowSignatory] = useState(true);
  const [invShowPrevBalance, setInvShowPrevBalance] = useState(false);

  // Theme Preset Styles
  const themePresets: Record<InvoiceTheme, { name: string; category: string; primary: string; secondary: string; border: string; bg: string; badge: string }> = {
    modern_teal: { name: 'Modern Emerald', category: 'Corporate', primary: '#0D9488', secondary: '#14B8A6', border: '#CCFBF1', bg: '#F0FDFA', badge: 'Recommended' },
    classic_blue: { name: 'Classic Corporate', category: 'Corporate', primary: '#1E40AF', secondary: '#3B82F6', border: '#DBEAFE', bg: '#EFF6FF', badge: 'Standard' },
    tally_gst: { name: 'Advanced Tally Grid', category: 'Corporate', primary: '#1F2937', secondary: '#4B5563', border: '#E5E7EB', bg: '#F9FAFB', badge: 'Official' },
    luxury: { name: 'Luxury Dark & Gold', category: 'Corporate', primary: '#78350F', secondary: '#D97706', border: '#FEF3C7', bg: '#FFFBEB', badge: 'Premium' },
    stylish_pastel: { name: 'Stylish Pastel Mint', category: 'Corporate', primary: '#047857', secondary: '#10B981', border: '#D1FAE5', bg: '#ECFDF5', badge: 'Clean' },
    navratri: { name: 'Navratri Divine Saffron', category: 'Festival', primary: '#EA580C', secondary: '#F97316', border: '#FFEDD5', bg: '#FFF7ED', badge: 'Festive' },
    durga_puja: { name: 'Durga Puja Royal Crimson', category: 'Festival', primary: '#BE123C', secondary: '#E11D48', border: '#FFE4E6', bg: '#FFF1F2', badge: 'Festive' },
    dussehra: { name: 'Dussehra Victory Blue', category: 'Festival', primary: '#4338CA', secondary: '#6366F1', border: '#E0E7FF', bg: '#EEF2FF', badge: 'Festive' },
    dhanteras: { name: 'Dhanteras Gold Sparkle', category: 'Festival', primary: '#B45309', secondary: '#F59E0B', border: '#FEF3C7', bg: '#FFFDF0', badge: 'Festive' },
    diwali: { name: 'Diwali Midnight Radiance', category: 'Festival', primary: '#6D28D9', secondary: '#8B5CF6', border: '#EDE9FE', bg: '#F5F3FF', badge: 'Festive' },
  };

  // Sample Invoice Preview Data
  const sampleItems = [
    { name: 'HP Pavilion 15.6" Core i5 12th Gen (16GB/512GB SSD)', hsn: '8471', qty: 1, rate: 52990, discount: 1000, taxRate: 18 },
    { name: 'Logitech Wireless Keyboard & Mouse Combo MK270', hsn: '8471', qty: 2, rate: 1450, discount: 100, taxRate: 18 },
    { name: 'ProDot USB Cat6 High Speed Patch Cable 3M', hsn: '8544', qty: 4, rate: 180, discount: 0, taxRate: 18 },
  ];

  const sampleSubtotal = sampleItems.reduce((acc, it) => acc + (it.qty * (it.rate - it.discount)), 0);
  const sampleTaxable = sampleSubtotal / 1.18;
  const sampleCgst = (sampleSubtotal - sampleTaxable) / 2;
  const sampleSgst = sampleCgst;
  const sampleGrandTotal = sampleSubtotal;

  // =========================================================================
  // SECTION 4: PRINT SETTINGS (THERMAL & BARCODE)
  // =========================================================================
  const [printSubTab, setPrintSubTab] = useState<'thermal' | 'barcode'>('thermal');
  const [thermalPaperSize, setThermalPaperSize] = useState<'2inch' | '3inch'>('3inch');
  const [thermalTheme, setThermalTheme] = useState<'compact' | 'advanced' | 'simple' | 'classic'>('advanced');
  const [thermalPrintQr, setThermalPrintQr] = useState(true);
  const [thermalPrintBank, setThermalPrintBank] = useState(true);
  const [thermalPrintBalance, setThermalPrintBalance] = useState(true);
  const [thermalPrintSignature, setThermalPrintSignature] = useState(true);
  const [thermalAutoCut, setThermalAutoCut] = useState(true);

  // Barcode Sheet Generator State
  const [barcodeLabelFormat, setBarcodeLabelFormat] = useState('a4_24');
  const [barcodeSelectedProduct, setBarcodeSelectedProduct] = useState(products[0]?.name || 'HP Pavilion 15 Laptop');
  const [barcodePriceTag, setBarcodePriceTag] = useState(products[0]?.price || '52,990');

  // =========================================================================
  // SECTION 5: MANAGE USERS & RBAC
  // =========================================================================
  type StaffRole = 'admin' | 'salesman' | 'stock_manager' | 'delivery_boy' | 'ca';
  interface StaffUser {
    id: string;
    name: string;
    phone: string;
    role: StaffRole;
    status: 'active' | 'invited';
    lastActive: string;
    salesInvoicesCreated: number;
  }

  const [staffList, setStaffList] = useState<StaffUser[]>([
    { id: '1', name: 'Anand Kumar', phone: '+91 94709 90000', role: 'admin', status: 'active', lastActive: 'Just now', salesInvoicesCreated: 142 },
    { id: '2', name: 'Ramesh Sharma', phone: '+91 98351 12345', role: 'salesman', status: 'active', lastActive: '12 mins ago', salesInvoicesCreated: 89 },
    { id: '3', name: 'Vikas Singh', phone: '+91 91234 56789', role: 'stock_manager', status: 'active', lastActive: '1 hour ago', salesInvoicesCreated: 14 },
    { id: '4', name: 'Suraj Rider', phone: '+91 82103 44556', role: 'delivery_boy', status: 'active', lastActive: '34 mins ago', salesInvoicesCreated: 0 },
    { id: '5', name: 'CA R.K. Agarwal & Associates', phone: '+91 94311 00223', role: 'ca', status: 'active', lastActive: 'Yesterday', salesInvoicesCreated: 0 },
  ]);

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('salesman');
  const [isStaffDaybookOpen, setIsStaffDaybookOpen] = useState(false);
  const [selectedDaybookStaff, setSelectedDaybookStaff] = useState<StaffUser>(staffList[1]);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPhone.trim()) {
      showToast('Please fill in Staff Name and Phone number');
      return;
    }
    const newMember: StaffUser = {
      id: Date.now().toString(),
      name: newStaffName.trim(),
      phone: newStaffPhone.trim(),
      role: newStaffRole,
      status: 'invited',
      lastActive: 'Invite Sent',
      salesInvoicesCreated: 0,
    };
    setStaffList([...staffList, newMember]);
    setIsAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffPhone('');
    showToast(`Staff member "${newMember.name}" added successfully as ${newStaffRole.toUpperCase()}!`);
  };

  // Activity Log Stream
  const activityLogs = [
    { time: '10:45 AM Today', user: 'Ramesh Sharma (Salesman)', action: 'Created Cash Invoice INV-0042', amount: '₹14,500', ip: '103.211.54.12 (Counter 1)' },
    { time: '09:30 AM Today', user: 'Vikas Singh (Stock)', action: 'Stock Inward GRN: 20x Lapcare Keyboards', amount: '₹8,200', ip: '103.211.54.14 (Godown)' },
    { time: 'Yesterday 06:15 PM', user: 'Anand Kumar (Admin)', action: 'Updated Store Pricing & Margin Rules', amount: '-', ip: '103.211.54.10 (Master)' },
    { time: 'Yesterday 03:20 PM', user: 'Suraj Rider (Delivery)', action: 'Marked Order #ORD-8921 as Delivered & Paid', amount: '₹2,499', ip: 'Mobile App 4G' },
    { time: '29 Oct 11:00 AM', user: 'CA R.K. Agarwal', action: 'Downloaded GSTR-1 & Balance Sheet JSON', amount: '-', ip: 'Audit Portal' },
  ];

  // =========================================================================
  // SECTION 6: AUTOMATED PAYMENT REMINDERS (तगादा)
  // =========================================================================
  const [remindAutoOverdue, setRemindAutoOverdue] = useState(true);
  const [remindOnBillCreate, setRemindOnBillCreate] = useState(true);
  const [remindSchedule, setRemindSchedule] = useState({
    before3Days: true,
    onDueDate: true,
    after3Days: true,
    after7Days: true,
    after15Days: true,
  });
  const [reminderLanguage, setReminderLanguage] = useState<'hindi' | 'english' | 'hinglish'>('hindi');

  const reminderTemplates = {
    hindi: `प्रिय {ग्राहक_का_नाम},\n\nआपके {दुकान_का_नाम} के बकाया बिल #{बिल_नंबर} का ₹{बकाया_राशि} भुगतान शेष है। भुगतान की देय तिथि {देय_तिथि} है।\n\nकृपया नीचे दिए गए लिंक द्वारा तुरंत UPI से भुगतान करें:\nhttps://lapiez.com/pay/{बिल_नंबर}\n\nधन्यवाद,\n{दुकान_का_नाम}\nफोन: {दुकान_फोन}`,
    english: `Dear {customer_name},\n\nGreetings from {company_name}! This is a gentle reminder that an amount of ₹{due_amount} is pending against Invoice #{invoice_no} (Due: {due_date}).\n\nKindly clear the outstanding via instant UPI:\nhttps://lapiez.com/pay/{invoice_no}\n\nThank you for your business,\n{company_name}`,
    hinglish: `Namaste {customer_name} ji,\n\nAapke {company_name} ke bill #{invoice_no} ka ₹{due_amount} payment baki hai. Kripya samay par payment clear karein.\n\nInstant UPI Payment Link:\nhttps://lapiez.com/pay/{invoice_no}\n\nDhanyawad,\n{company_name}`
  };

  // =========================================================================
  // SECTION 7: CA REPORTS SHARING
  // =========================================================================
  const [caDetails, setCaDetails] = useState({
    name: 'CA R.K. Agarwal',
    phone: '+91 94311 00223',
    email: 'agarwal.ca@gmail.com',
    firm: 'R.K. Agarwal & Associates, Ranchi',
  });

  const handleShareToCaWhatsApp = () => {
    const text = `Namaste ${caDetails.name} Sahab,\n\nYeh ${activeCompany.legalName} ki accounting aur GST summary report hai:\n- GSTR-1 Sales Summary: ${invoices.length} invoices\n- GSTR-2B Input Tax Credit reconciliation ready\n- Trading, P&L & Balance Sheet\n- Current FY: ${currentFy}\n\nReports pack generated via Lapiez Enterprise Engine.\n\nRegards,\n${activeCompany.legalName}`;
    const cleanPhone = caDetails.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    showToast('Direct WhatsApp message opened for CA Sahab!');
  };

  const handleDownloadCaAuditPack = () => {
    const jsonPack = {
      auditTimestamp: new Date().toISOString(),
      company: activeCompany,
      financialYear: currentFy,
      invoicesSummary: {
        totalInvoices: invoices.length,
        totalBilledValue: invoices.reduce((acc, i) => acc + (i.grandTotal || 0), 0),
      },
      gstr1Report: invoices.map(i => ({
        invoiceNo: i.invoiceNumber,
        customer: (i as any).buyerName || (i as any).customerName || 'Counter Buyer',
        customerGstin: (i as any).buyerGstin || (i as any).customerGstin || 'URP',
        amount: i.grandTotal,
        date: (i as any).date || (i as any).createdAt || new Date().toISOString(),
      })),
      trialBalance: [
        { ledger: 'Sales Account', debit: 0, credit: 1250000 },
        { ledger: 'Sundry Debtors', debit: 420000, credit: 0 },
        { ledger: 'Union Bank of India Current A/c', debit: 830000, credit: 0 },
        { ledger: 'GST Output SGST', debit: 0, credit: 112500 },
        { ledger: 'GST Output CGST', debit: 0, credit: 112500 },
      ]
    };

    const blob = new Blob([JSON.stringify(jsonPack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CA_AUDIT_PACK_${activeCompany.legalName.replace(/\s+/g, '_')}_${currentFy.replace(/\s+/g, '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Complete CA Audit Pack (GSTR-1, 2B, Trial Balance & Ledger) downloaded!');
  };

  // =========================================================================
  // SECTION 8: HELP & SUPPORT
  // =========================================================================
  const [faqSearch, setFaqSearch] = useState('');

  const faqs = [
    { q: 'How do I connect my 2-inch or 3-inch Bluetooth thermal printer?', a: 'Under Print Settings > Thermal POS, select either 2-inch (58mm) or 3-inch (80mm). Any USB or Bluetooth ESC/POS printer works plug-and-play without special drivers.' },
    { q: 'Can my salesman view purchase prices and profit margins?', a: 'No. The Salesman role strictly hides purchase rates, vendor bills, and profit margins. They can only see customer selling prices, stock availability, and create sales bills.' },
    { q: 'How do automated WhatsApp payment reminders (तगादा) work?', a: 'Once activated under Reminders Settings, our engine monitors payment due dates and dispatches automated WhatsApp reminders with instant UPI payment links.' },
    { q: 'How to import my invoices and ledgers into Tally Prime?', a: 'Click "Data Export to Tally [New]" under Manage Business. It generates standard Tally XML format which can be directly imported via Alt+O in Tally.' },
  ];

  const filteredFaqs = faqs.filter(f => !faqSearch || f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase()));

  // =========================================================================
  // RENDER MASTER-DETAIL LAYOUT
  // =========================================================================
  return (
    <div className="space-y-6 text-[#1E293B]">
      
      {/* 1. TOP BRAND HEADER & COMPANY CONTEXT BAR */}
      <div className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0A1633] text-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-black text-2xl shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-white">
                  myBillBook Enterprise Billing Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Full Store Control • All Modules Unlocked
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Active Store: <span className="font-bold text-amber-300">{activeCompany.legalName}</span> ({activeCompany.city}, {activeCompany.state}) • GSTIN: <span className="font-mono text-teal-300">{activeCompany.gstin}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBusinessSwitcherOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Switch Business</span>
            </button>

            <button
              onClick={() => setIsTallyModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Data Export to Tally [New]</span>
            </button>

            <button
              onClick={() => setIsCloseFyModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Close FY ({currentFy})</span>
            </button>

            <button
              onClick={() => setActiveTab('invoice')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Counter Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SPLIT-PANE MASTER-DETAIL CONTAINER */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT COLUMN: DEDICATED SETTINGS NAVIGATION SIDEBAR */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden sticky top-4">
            
            <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Configuration Workflows</span>
                <span className="text-[10px] text-gray-500 block">Enterprise Management Modules</span>
              </div>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                8 Active
              </span>
            </div>

            <nav className="p-2 space-y-1">
              {[
                { id: 'account', label: 'Account & Security', sublabel: 'Admin credentials & POS lock', icon: UserCircle },
                { id: 'business', label: 'Manage Business', sublabel: 'Branding, GST, e-Invoice & Tally', icon: Building2 },
                { id: 'invoice', label: 'Invoice Settings', sublabel: 'Live preview, festival themes', icon: Paintbrush, badge: 'Live Preview', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                { id: 'thermal_print', label: 'Print Settings', sublabel: '2"/3" Thermal POS & Barcodes', icon: Printer, badge: 'POS Ready', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { id: 'team', label: 'Manage Users & RBAC', sublabel: 'Salesman daybook & tracker', icon: Users, badge: 'Margin Lock', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
                { id: 'reminders', label: 'Payment Reminders', sublabel: 'WhatsApp auto तगादा engine', icon: BellRing, badge: 'Auto Sync', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
                { id: 'ca_sharing', label: 'CA Reports Sharing', sublabel: 'GSTR-1, 2B, P&L & Daybook', icon: Briefcase, badge: 'GST Ready', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
                { id: 'help_support', label: 'Help & Support', sublabel: 'WhatsApp hotline & tutorials', icon: HelpCircle },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTabId)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate leading-tight">{item.label}</span>
                        <span className={`text-[10px] block truncate ${isActive ? 'text-teal-100' : 'text-gray-400'}`}>
                          {item.sublabel}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ml-1.5 ${
                        isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* LIVE STORE ENGINE STATUS WIDGET */}
            <div className="p-3.5 m-2 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
                <span className="text-xs font-black text-emerald-900">
                  Billing Engine Active
                </span>
              </div>
              <p className="text-[10px] text-gray-600 leading-tight">
                CBIC Rule 46 Compliant • Thermal 58/80mm ESC/POS online • Staff security shield engaged.
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: DYNAMIC CONTENT PANEL */}
        <main className="flex-1 min-w-0 w-full">
          
          {/* =============================================================== */}
          {/* 1. ACCOUNT & SECURITY SECTION                                   */}
          {/* =============================================================== */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                      AK
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-gray-900">{profileName}</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Authorized Admin
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Permission Level: <span className="font-bold text-gray-800">Master Store Controller (Full Access)</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSuggestionModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                  >
                    <Share2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Share Suggestion</span>
                  </button>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Administrator Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Phone Number (OTP & SMS Alerts)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full h-10 pl-3 pr-20 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Admin Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Quick POS Lock PIN (4 Digits)</label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={4}
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full h-10 pl-3 pr-16 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-mono font-bold tracking-widest"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">
                        PIN Set
                      </span>
                    </div>
                  </div>
                </div>

                {/* Counter POS Operational Preferences */}
                <div className="rounded-2xl border border-gray-200 p-4 sm:p-5 bg-gray-50/50 space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                    Counter POS Operational Preferences
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Auto-Print Receipt upon Save</span>
                        <span className="text-[10px] text-gray-500">Trigger printer dialog immediately on cash checkout</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoPrintOnSave}
                        onChange={(e) => setAutoPrintOnSave(e.target.checked)}
                        className="size-4 accent-teal-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">POS Terminal Inactivity Lock</span>
                        <span className="text-[10px] text-gray-500">Require PIN when cash counter is idle</span>
                      </div>
                      <select
                        value={autoLogoutTimer}
                        onChange={(e) => setAutoLogoutTimer(e.target.value)}
                        className="text-xs font-bold border border-gray-200 rounded-lg p-1 bg-gray-50 focus:outline-none"
                      >
                        <option value="15_mins">15 Mins</option>
                        <option value="30_mins">30 Mins</option>
                        <option value="60_mins">1 Hour</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Active Sessions & Connected Devices */}
                <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                    Connected Terminals & Active Hardware
                  </span>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200">
                      <div className="flex items-center gap-2.5">
                        <Monitor className="w-4 h-4 text-teal-600" />
                        <div>
                          <span className="font-bold text-gray-900 block">Admin Master Console (Current Session)</span>
                          <span className="text-[10px] text-gray-400 font-mono">Chrome on Windows 11 • IP: 103.211.54.10</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active Now
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200">
                      <div className="flex items-center gap-2.5">
                        <Printer className="w-4 h-4 text-indigo-600" />
                        <div>
                          <span className="font-bold text-gray-900 block">Counter POS 1 - Thermal Printer 80mm</span>
                          <span className="text-[10px] text-gray-400 font-mono">USB Hardware Link • Garhwa Showroom</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => showToast('Account & security settings saved successfully!')}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Account & Security</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 2. MANAGE BUSINESS SECTION                                      */}
          {/* =============================================================== */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-6">
                
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Business Profile & Legal Details</h3>
                    <p className="text-xs text-gray-500">
                      Printed on all GST tax invoices, delivery challans, and thermal receipts.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsBusinessSwitcherOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>+ Create New Business</span>
                    </button>
                    <button
                      onClick={() => setIsTallyModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Tally Export</span>
                    </button>
                  </div>
                </div>

                {/* Logo & Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Logo Drag & Drop */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Company Logo (PNG / JPG up to 5MB)</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-teal-500 transition-colors flex flex-col items-center justify-center bg-gray-50/50 min-h-[140px]">
                      <div className="size-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-xs mb-2 overflow-hidden">
                        {activeCompany.logoUrl ? (
                          <img src={activeCompany.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-teal-700 cursor-pointer hover:underline">
                        Upload Store Logo
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">Transparent PNG recommended</span>
                    </div>
                  </div>

                  {/* Names */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Business Legal Name</label>
                      <input
                        type="text"
                        value={activeCompany.legalName}
                        onChange={(e) => setActiveCompany({ ...activeCompany, legalName: e.target.value })}
                        className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Trade / Display Name</label>
                      <input
                        type="text"
                        value={activeCompany.tradeName}
                        onChange={(e) => setActiveCompany({ ...activeCompany, tradeName: e.target.value })}
                        className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Business Classification</label>
                      <select
                        value={activeCompany.classification}
                        onChange={(e) => setActiveCompany({ ...activeCompany, classification: e.target.value })}
                        className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                      >
                        <option value="Retailer & IT Solutions">Retailer (रिटेलर)</option>
                        <option value="Wholesaler & Stockist">Wholesaler (थोक व्यापारी)</option>
                        <option value="Distributor">Distributor (डिस्ट्रिब्यूटर)</option>
                        <option value="Manufacturer">Manufacturer (निर्माता)</option>
                        <option value="Services & Repairs">Services & Repairs (सर्विस सेंटर)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Industry Category</label>
                      <select
                        value={activeCompany.industry}
                        onChange={(e) => setActiveCompany({ ...activeCompany, industry: e.target.value })}
                        className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                      >
                        <option value="Electronics & Computers">Electronics, Computers & IT</option>
                        <option value="Mobile & Telecom">Mobile Phones & Accessories</option>
                        <option value="FMCG & Grocery">FMCG & Kirana / Grocery</option>
                        <option value="Hardware & Sanitary">Hardware, Electrical & Sanitary</option>
                        <option value="Textiles & Garments">Textiles & Readymade Garments</option>
                        <option value="Pharmaceuticals">Pharma & Medical Supplies</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* GST & Compliance Section */}
                <div className="rounded-2xl border border-gray-200 p-4 sm:p-5 bg-gray-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                        GST Registration & Compliance
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Enable GSTIN, PAN, e-Invoicing (NIC Portal) and TDS/TCS switches.
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Regular Scheme
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700">GSTIN Number (15 Digits)</label>
                        <button
                          type="button"
                          onClick={handleFetchGstin}
                          disabled={isGstFetching}
                          className="text-[10px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {isGstFetching ? 'Verifying...' : '⚡ Verify on GSTN Portal'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={activeCompany.gstin}
                        onChange={(e) => setActiveCompany({ ...activeCompany, gstin: e.target.value.toUpperCase() })}
                        className="w-full h-10 px-3 text-xs bg-white border border-gray-200 rounded-xl font-mono uppercase focus:outline-none focus:border-teal-600 font-bold"
                        placeholder="20AAACL1234F1Z8"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">PAN Number</label>
                      <input
                        type="text"
                        value={activeCompany.pan}
                        onChange={(e) => setActiveCompany({ ...activeCompany, pan: e.target.value.toUpperCase() })}
                        className="w-full h-10 px-3 text-xs bg-white border border-gray-200 rounded-xl font-mono uppercase focus:outline-none focus:border-teal-600 font-bold"
                        placeholder="AAACL1234F"
                      />
                    </div>
                  </div>

                  {/* e-Invoice Toggle & Credentials */}
                  <div className="pt-3 border-t border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-teal-600 animate-ping" />
                        <div>
                          <span className="text-xs font-bold text-gray-900">Enable e-Invoicing [NIC IRP]</span>
                          <p className="text-[11px] text-gray-500">Auto generate IRN (Invoice Reference Number) & QR Code on B2B invoices</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={activeCompany.eInvoiceEnabled}
                        onChange={(e) => setActiveCompany({ ...activeCompany, eInvoiceEnabled: e.target.checked })}
                        className="size-5 accent-teal-600 rounded cursor-pointer"
                      />
                    </div>

                    {activeCompany.eInvoiceEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-teal-200">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700">IRP Portal Username</label>
                          <input
                            type="text"
                            placeholder="e.g. NIC_USER_20"
                            value={activeCompany.irpUsername}
                            onChange={(e) => setActiveCompany({ ...activeCompany, irpUsername: e.target.value })}
                            className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700">Client ID / App Key</label>
                          <input
                            type="text"
                            placeholder="IRP Client ID"
                            value={activeCompany.irpClientId}
                            onChange={(e) => setActiveCompany({ ...activeCompany, irpClientId: e.target.value })}
                            className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700">Environment</label>
                          <select
                            value={activeCompany.irpEnvironment}
                            onChange={(e) => setActiveCompany({ ...activeCompany, irpEnvironment: e.target.value as any })}
                            className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-600"
                          >
                            <option value="sandbox">Sandbox (Testing Server)</option>
                            <option value="production">Production (einvoice1.gst.gov.in)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address & Store Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-700">Shop Address (Line 1)</label>
                    <input
                      type="text"
                      value={activeCompany.addressLine1}
                      onChange={(e) => setActiveCompany({ ...activeCompany, addressLine1: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">City / District</label>
                    <input
                      type="text"
                      value={activeCompany.city}
                      onChange={(e) => setActiveCompany({ ...activeCompany, city: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">State</label>
                    <input
                      type="text"
                      value={activeCompany.state}
                      onChange={(e) => setActiveCompany({ ...activeCompany, state: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">PIN Code</label>
                    <input
                      type="text"
                      value={activeCompany.pincode}
                      onChange={(e) => setActiveCompany({ ...activeCompany, pincode: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Store Support Phone</label>
                    <input
                      type="text"
                      value={activeCompany.phone}
                      onChange={(e) => setActiveCompany({ ...activeCompany, phone: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                    />
                  </div>
                </div>

                {/* Digital Signature Pad */}
                <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Authorized Digital Signature</span>
                      <span className="text-[11px] text-gray-500">Draw with mouse/finger or upload signature image</span>
                    </div>
                    {hasSignature && (
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear Signature
                      </button>
                    )}
                  </div>

                  <div className="border border-gray-300 rounded-xl bg-white overflow-hidden w-full max-w-md h-32 relative cursor-crosshair">
                    <canvas
                      ref={sigCanvasRef}
                      width={440}
                      height={128}
                      onMouseDown={startSigning}
                      onMouseMove={drawSigning}
                      onMouseUp={stopSigning}
                      onMouseLeave={stopSigning}
                      onTouchStart={startSigning}
                      onTouchMove={drawSigning}
                      onTouchEnd={stopSigning}
                      className="w-full h-full block"
                    />
                    {!hasSignature && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none select-none">
                        ✍️ Draw your signature here
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => showToast('Company profile & GST branding saved successfully!')}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Business Details</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 3. INVOICE SETTINGS & LIVE PREVIEW (SPLIT-SCREEN)               */}
          {/* =============================================================== */}
          {activeTab === 'invoice' && (
            <div className="space-y-6">
              
              {/* TOP CONTROL BAR */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    🎨
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-900">Interactive Split-Screen Theme Studio</h3>
                    <p className="text-[10px] text-gray-500">Changes below update live invoice preview instantly in real time</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    <button
                      onClick={() => setPreviewZoom(Math.max(75, previewZoom - 10))}
                      className="p-1 rounded text-gray-600 hover:bg-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1.5">{previewZoom}%</span>
                    <button
                      onClick={() => setPreviewZoom(Math.min(130, previewZoom + 10))}
                      className="p-1 rounded text-gray-600 hover:bg-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sample PDF</span>
                  </button>
                </div>
              </div>

              {/* SPLIT SCREEN: LEFT LIVE PREVIEW, RIGHT THEMES PICKER */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* LEFT/CENTER: LIVE TAX INVOICE PREVIEW CONTAINER */}
                <div className="xl:col-span-7 bg-slate-900/5 rounded-2xl border border-gray-200 p-4 sm:p-6 overflow-x-auto shadow-inner">
                  <div
                    style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
                    className="transition-transform duration-200 min-w-[580px] max-w-[680px] mx-auto bg-white rounded-xl shadow-xl border border-gray-300 p-6 text-slate-800"
                  >
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start pb-4 border-b-2" style={{ borderColor: themePresets[selectedTheme].primary }}>
                      <div className="flex items-start gap-3">
                        {invShowLogo && (
                          <div className="size-14 rounded-lg border border-gray-200 p-1 flex items-center justify-center bg-white shadow-2xs">
                            <Building2 className="w-8 h-8 text-slate-600" />
                          </div>
                        )}
                        <div>
                          <h1 className="text-base font-black tracking-tight" style={{ color: themePresets[selectedTheme].primary }}>
                            {activeCompany.legalName}
                          </h1>
                          <p className="text-[10px] text-gray-600 max-w-xs leading-tight">
                            {activeCompany.addressLine1}, {activeCompany.city} - {activeCompany.pincode} ({activeCompany.state})
                          </p>
                          <p className="text-[10px] text-gray-700 mt-1">
                            GSTIN: <span className="font-mono font-bold">{activeCompany.gstin}</span> • Phone: {activeCompany.phone}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md text-white inline-block shadow-2xs"
                          style={{ backgroundColor: themePresets[selectedTheme].primary }}
                        >
                          TAX INVOICE
                        </span>
                        <div className="text-[11px] font-mono mt-2 space-y-0.5">
                          <div>Invoice No: <span className="font-bold">INV-2026-0042</span></div>
                          <div>Date: <span className="font-semibold">{new Date().toISOString().slice(0, 10)}</span></div>
                          <div>Place of Supply: <span className="font-semibold">{activeCompany.state} ({activeCompany.stateCode})</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Bill To Party Block */}
                    <div className="grid grid-cols-2 gap-4 py-3 border-b text-[11px] border-gray-200 bg-gray-50/50 p-2 rounded-lg mt-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Billed To (Customer):</span>
                        <div className="font-bold text-gray-900 mt-0.5">Shree Ganesh Enterprises</div>
                        <div className="text-gray-600 text-[10px]">Station Road, Daltonganj, Palamu - 822101</div>
                        <div className="text-gray-700 font-mono text-[10px] mt-0.5">GSTIN: 20BCDEF5678G1Z3 • Ph: +91 98351 99887</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Payment Terms:</span>
                        <div className="font-semibold text-gray-900 mt-0.5">Due on Delivery (Net 7 Days)</div>
                        <div className="text-emerald-700 font-bold text-[10px] mt-0.5">Status: Authorized Original for Buyer</div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-[10px] mt-4 border-collapse">
                      <thead>
                        <tr className="text-white" style={{ backgroundColor: themePresets[selectedTheme].primary }}>
                          <th className="p-2 text-left">#</th>
                          <th className="p-2 text-left">Item Description</th>
                          {invShowHsn && <th className="p-2 text-center">HSN</th>}
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Rate</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sampleItems.map((it, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                            <td className="p-2 text-gray-500 font-mono">{idx + 1}</td>
                            <td className="p-2 font-medium text-gray-900">{it.name}</td>
                            {invShowHsn && <td className="p-2 text-center text-gray-600 font-mono">{it.hsn}</td>}
                            <td className="p-2 text-center font-bold text-gray-800">{it.qty} Nos</td>
                            <td className="p-2 text-right font-mono text-gray-700">₹{it.rate.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right font-mono font-bold text-gray-900">
                              ₹{(it.qty * (it.rate - it.discount)).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Calculation Summary & Bank/QR Footer */}
                    <div className="grid grid-cols-12 gap-4 pt-4 mt-3 border-t-2" style={{ borderColor: themePresets[selectedTheme].border }}>
                      
                      {/* Left: Bank details & UPI QR */}
                      <div className="col-span-7 space-y-2.5 text-[10px]">
                        {invShowBank && (
                          <div className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/70">
                            <span className="font-bold text-gray-800 block text-[10px]">Bank Settlement Details:</span>
                            <div className="font-mono text-gray-700 mt-0.5 space-y-0.5">
                              <div>Bank: {activeCompany.bankName} • Branch: {activeCompany.bankBranch}</div>
                              <div>A/C No: <span className="font-bold text-gray-900">{activeCompany.bankAccountNo}</span></div>
                              <div>IFSC: <span className="font-bold text-gray-900">{activeCompany.bankIfsc}</span></div>
                            </div>
                          </div>
                        )}

                        {invShowQr && (
                          <div className="flex items-center gap-2.5 p-2 rounded-lg border border-teal-200 bg-teal-50/60">
                            <div className="size-12 rounded bg-white border border-teal-300 p-1 flex items-center justify-center shrink-0">
                              <QrCode className="w-10 h-10 text-teal-800" />
                            </div>
                            <div>
                              <span className="font-bold text-teal-900 block text-[10px]">Instant UPI QR Payment</span>
                              <span className="text-[9px] text-teal-700 block font-mono">{activeCompany.upiId}</span>
                              <span className="text-[9px] text-gray-500">Scan with GPay, PhonePe, Paytm</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Tax Breakdown */}
                      <div className="col-span-5 text-[10px] space-y-1 text-right">
                        <div className="flex justify-between text-gray-600">
                          <span>Taxable Value:</span>
                          <span className="font-mono font-semibold">₹{Math.round(sampleTaxable).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>CGST (9%):</span>
                          <span className="font-mono font-semibold">₹{Math.round(sampleCgst).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>SGST (9%):</span>
                          <span className="font-mono font-semibold">₹{Math.round(sampleSgst).toLocaleString('en-IN')}</span>
                        </div>
                        <div
                          className="flex justify-between items-center pt-2 border-t-2 font-black text-xs"
                          style={{ borderColor: themePresets[selectedTheme].primary, color: themePresets[selectedTheme].primary }}
                        >
                          <span>Grand Total:</span>
                          <span className="font-mono text-sm">₹{sampleGrandTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-[9px] text-gray-500 block italic pt-1">
                          Amount in words: Fifty-Four Thousand Two Hundred Eighty Rupees Only
                        </span>

                        {invShowSignatory && (
                          <div className="pt-6 text-center">
                            <div className="font-script text-xs text-slate-800 font-bold italic">
                              Anand Kumar
                            </div>
                            <div className="border-t border-gray-400 pt-1 text-[9px] text-gray-500">
                              For {activeCompany.legalName} (Authorized Signatory)
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: THEME PICKER & CUSTOMIZER CONTROLS */}
                <div className="xl:col-span-5 space-y-6">
                  
                  {/* Festival & Corporate Themes */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                        Select Theme Template
                      </span>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        10 Presets Available
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {(Object.keys(themePresets) as InvoiceTheme[]).map((thmKey) => {
                        const thm = themePresets[thmKey];
                        const isSel = selectedTheme === thmKey;
                        return (
                          <button
                            key={thmKey}
                            onClick={() => setSelectedTheme(thmKey)}
                            type="button"
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                              isSel
                                ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-2 ring-teal-600/20'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="size-3.5 rounded-full" style={{ backgroundColor: thm.primary }} />
                              <span className="size-3.5 rounded-full" style={{ backgroundColor: thm.secondary }} />
                              {thm.badge && (
                                <span className="ml-auto text-[9px] font-black uppercase px-1 rounded bg-gray-100 text-gray-600">
                                  {thm.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-gray-900 block leading-tight">{thm.name}</span>
                            <span className="text-[10px] text-gray-500 block">{thm.category}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Element Visibility Toggles */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                      Bill Elements Visibility
                    </span>

                    <div className="space-y-2">
                      {[
                        { label: 'Company Store Logo', checked: invShowLogo, set: setInvShowLogo },
                        { label: 'Dynamic UPI QR Code', checked: invShowQr, set: setInvShowQr },
                        { label: 'Bank Details (A/C & IFSC)', checked: invShowBank, set: setInvShowBank },
                        { label: 'HSN / SAC Code Column', checked: invShowHsn, set: setInvShowHsn },
                        { label: 'Authorized Signatory Stamp', checked: invShowSignatory, set: setInvShowSignatory },
                        { label: 'Customer Previous Balance', checked: invShowPrevBalance, set: setInvShowPrevBalance },
                      ].map((tog, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-xs font-medium text-gray-800">{tog.label}</span>
                          <input
                            type="checkbox"
                            checked={tog.checked}
                            onChange={(e) => tog.set(e.target.checked)}
                            className="size-4 accent-teal-600 rounded cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => showToast(`Theme "${themePresets[selectedTheme].name}" saved as default invoice design!`)}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save as Default Template</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 4. PRINT SETTINGS: THERMAL & BARCODE                           */}
          {/* =============================================================== */}
          {activeTab === 'thermal_print' && (
            <div className="space-y-6">
              
              {/* Subtabs: Thermal POS vs Barcode Print */}
              <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-2xs flex items-center gap-2">
                <button
                  onClick={() => setPrintSubTab('thermal')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                    printSubTab === 'thermal'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Thermal POS Receipts (2" & 3")</span>
                </button>

                <button
                  onClick={() => setPrintSubTab('barcode')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                    printSubTab === 'barcode'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Barcode Label Sheet Engine</span>
                </button>
              </div>

              {printSubTab === 'thermal' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left: Thermal Controls */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-6">
                    <div>
                      <h3 className="text-base font-black text-gray-900">Thermal POS Printer Engine</h3>
                      <p className="text-xs text-gray-500">
                        Compatible with all Bluetooth, USB, and LAN thermal receipt roll printers (TVS, NGX, Epson, Everycom).
                      </p>
                    </div>

                    {/* Paper Size Radio */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">Receipt Roll Paper Width</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setThermalPaperSize('2inch')}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            thermalPaperSize === '2inch'
                              ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-2 ring-teal-600/20'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-xs font-bold text-gray-900 block">2-Inch (58mm)</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Handheld Bluetooth machines</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setThermalPaperSize('3inch')}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            thermalPaperSize === '3inch'
                              ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-2 ring-teal-600/20'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-xs font-bold text-gray-900 block">3-Inch (80mm)</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Desktop high-speed counter printers</span>
                        </button>
                      </div>
                    </div>

                    {/* Thermal Themes */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">Receipt Style Theme</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'advanced', label: 'Advanced GST', desc: 'Full tax breakup' },
                          { id: 'compact', label: 'Compact POS', desc: 'Saves paper' },
                          { id: 'simple', label: 'Grocery Style', desc: 'Item list only' },
                          { id: 'classic', label: 'Classic Star', desc: 'Dotted borders' },
                        ].map((th) => (
                          <button
                            key={th.id}
                            type="button"
                            onClick={() => setThermalTheme(th.id as any)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              thermalTheme === th.id
                                ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-bold'
                                : 'border-gray-200 bg-white text-gray-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">{th.label}</span>
                            <span className="text-[10px] text-gray-400 block">{th.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2.5 pt-2">
                      <label className="text-xs font-bold text-gray-700">Thermal Receipt Options</label>
                      <div className="space-y-2">
                        {[
                          { label: 'Print UPI Payment QR Code on Roll', state: thermalPrintQr, set: setThermalPrintQr },
                          { label: 'Print Bank Account Details', state: thermalPrintBank, set: setThermalPrintBank },
                          { label: 'Print Customer Khata Outstanding Balance', state: thermalPrintBalance, set: setThermalPrintBalance },
                          { label: 'Print Authorized Signature Line', state: thermalPrintSignature, set: setThermalPrintSignature },
                          { label: 'Send ESC/POS Auto Paper Cut Command', state: thermalAutoCut, set: setThermalAutoCut },
                        ].map((tog, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-xs font-medium text-gray-800">{tog.label}</span>
                            <input
                              type="checkbox"
                              checked={tog.state}
                              onChange={(e) => tog.set(e.target.checked)}
                              className="size-4 accent-teal-600 rounded cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Test Thermal Print</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('Thermal printer settings saved as default!')}
                        className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Settings</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Thermal Receipt Simulation */}
                  <div className="lg:col-span-5 bg-slate-900/5 rounded-2xl border border-gray-200 p-4 sm:p-6 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                      Live Monospace Roll Simulation ({thermalPaperSize === '2inch' ? '58mm Width' : '80mm Width'})
                    </span>

                    <div
                      style={{ width: thermalPaperSize === '2inch' ? '220px' : '290px' }}
                      className="bg-white rounded-lg shadow-xl border border-gray-300 p-4 font-mono text-[10px] text-slate-900 leading-tight space-y-2 select-none"
                    >
                      <div className="text-center space-y-0.5 border-b pb-2 border-dashed border-gray-400">
                        <div className="font-bold text-xs">{activeCompany.tradeName}</div>
                        <div>{activeCompany.city}, {activeCompany.state}</div>
                        <div>Ph: {activeCompany.phone}</div>
                        <div>GSTIN: {activeCompany.gstin}</div>
                      </div>

                      <div className="flex justify-between border-b pb-1 border-dashed border-gray-300 text-[9px]">
                        <span>Bill: INV-0042</span>
                        <span>{new Date().toISOString().slice(0, 10)}</span>
                      </div>

                      <div className="space-y-1 py-1 border-b border-dashed border-gray-400">
                        <div className="flex justify-between font-bold">
                          <span>ITEM</span>
                          <span>QTY  PRICE</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HP Pav Core i5</span>
                          <span>1x 52,990</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Logitech MK270</span>
                          <span>2x  2,900</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ProDot Patch Cb</span>
                          <span>4x    720</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 text-right font-bold pt-1">
                        <div className="flex justify-between text-[9px]">
                          <span>Subtotal:</span>
                          <span>₹56,610.00</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span>GST Included:</span>
                          <span>₹8,635.00</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t border-dashed border-gray-400">
                          <span>NET PAYABLE:</span>
                          <span>₹56,610.00</span>
                        </div>
                      </div>

                      {thermalPrintBalance && (
                        <div className="p-1 rounded bg-gray-100 text-center text-[9px]">
                          Customer Khata Balance: ₹0.00 (PAID)
                        </div>
                      )}

                      {thermalPrintQr && (
                        <div className="flex flex-col items-center justify-center pt-1">
                          <QrCode className="w-16 h-16 text-slate-900" />
                          <span className="text-[8px] text-gray-500">Scan to Pay via UPI</span>
                        </div>
                      )}

                      <div className="text-center text-[8px] pt-1 text-gray-500 border-t border-dashed border-gray-300">
                        Thank you for visiting Lapiez!
                        <br />*** HAVE A NICE DAY ***
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Barcode Label Sheet Generator */
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-6">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Barcode Label Sticker Generator</h3>
                    <p className="text-xs text-gray-500">
                      Generate ready-to-print barcode sticker sheets for item packaging and price tags.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Select Item</label>
                      <select
                        value={barcodeSelectedProduct}
                        onChange={(e) => setBarcodeSelectedProduct(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                      >
                        {products.slice(0, 15).map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Sheet Format</label>
                      <select
                        value={barcodeLabelFormat}
                        onChange={(e) => setBarcodeLabelFormat(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                      >
                        <option value="a4_24">A4 Sheet - 24 Labels (3 x 8)</option>
                        <option value="a4_40">A4 Sheet - 40 Labels (4 x 10)</option>
                        <option value="thermal_roll">Thermal Roll - 50mm x 25mm</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Display Price (₹)</label>
                      <input
                        type="text"
                        value={barcodePriceTag}
                        onChange={(e) => setBarcodePriceTag(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Live Barcode Sheet Simulation */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <span className="text-xs font-bold text-gray-700 block">Preview: First 6 Labels on Sheet</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="bg-white rounded-lg border border-gray-300 p-2.5 text-center shadow-xs space-y-1">
                          <span className="text-[9px] font-bold text-gray-700 block truncate">LAPIEZ IT SHOWROOM</span>
                          <span className="text-[10px] font-bold text-gray-900 block truncate">{barcodeSelectedProduct}</span>
                          <div className="h-7 bg-slate-900/10 rounded flex items-center justify-center font-mono text-[9px] font-black tracking-widest text-slate-800">
                            ||| | || |||| | ||| ||
                          </div>
                          <span className="text-[8px] font-mono text-gray-500 block">LPZ-8471-{1000 + idx}</span>
                          <span className="text-xs font-black text-teal-800 block">MRP: ₹{barcodePriceTag}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Barcode Label Sheet</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* 5. MANAGE USERS & RBAC                                          */}
          {/* =============================================================== */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              
              {/* Metrics Counters */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Staff Members</span>
                  <div className="text-2xl font-black text-gray-900 mt-1">{staffList.length} Users</div>
                  <span className="text-[10px] text-teal-600 font-bold block mt-0.5">5 Configured Roles</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Active Today</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">4 Active</div>
                  <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Real-time sync</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Recent Activities</span>
                  <div className="text-2xl font-black text-indigo-600 mt-1">245 Actions</div>
                  <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Last 30 days</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Security Shield</span>
                  <div className="text-2xl font-black text-teal-700 mt-1">Active</div>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Margins hidden for Sales</span>
                </div>
              </div>

              {/* Members Table */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Staff Members & Role Permissions</h3>
                    <p className="text-xs text-gray-500">Control who can view purchase rates, delete bills, or audit financial ledgers.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedDaybookStaff(staffList[1]);
                        setIsStaffDaybookOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Staff-wise Daybook</span>
                    </button>
                    <button
                      onClick={() => setIsAddStaffOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Staff User</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-black tracking-wider">
                      <tr>
                        <th className="p-3">Staff Member</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Last Active</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {staffList.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/70">
                          <td className="p-3 font-bold text-gray-900 flex items-center gap-2">
                            <div className="size-7 rounded-full bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center">
                              {m.name.slice(0, 1)}
                            </div>
                            <span>{m.name}</span>
                          </td>
                          <td className="p-3 font-mono text-gray-600">{m.phone}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              m.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              m.role === 'salesman' ? 'bg-blue-100 text-blue-800' :
                              m.role === 'stock_manager' ? 'bg-amber-100 text-amber-800' :
                              m.role === 'delivery_boy' ? 'bg-orange-100 text-orange-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {m.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          </td>
                          <td className="p-3 text-gray-500 text-[11px]">{m.lastActive}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedDaybookStaff(m);
                                setIsStaffDaybookOpen(true);
                              }}
                              className="text-teal-700 hover:underline font-bold text-[11px] cursor-pointer"
                            >
                              View Daybook →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Role Permissions Matrix Card */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mt-4 space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                    Permission Rules by Role
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-[11px]">
                    <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1">
                      <span className="font-bold text-purple-800 block">Admin / Partner</span>
                      <p className="text-gray-500 text-[10px]">Full vision: all bills, purchase cost, ledgers & bank settings.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-blue-200 space-y-1">
                      <span className="font-bold text-blue-800 block">Salesman</span>
                      <p className="text-gray-500 text-[10px]">Create sales bills. <strong>Purchase rates & margins HIDDEN.</strong></p>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1">
                      <span className="font-bold text-amber-800 block">Stock Manager</span>
                      <p className="text-gray-500 text-[10px]">Inventory inward, godown transfers, GRN stock counts.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1">
                      <span className="font-bold text-orange-800 block">Delivery Rider</span>
                      <p className="text-gray-500 text-[10px]">Delivery challans, customer address, payment collection status.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1">
                      <span className="font-bold text-emerald-800 block">CA / Auditor</span>
                      <p className="text-gray-500 text-[10px]">Read-only audit access to financial statements & GST reports.</p>
                    </div>
                  </div>
                </div>

                {/* Activity Tracker Stream */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                    Live Staff Activity Log Tracker
                  </span>
                  <div className="space-y-2">
                    {activityLogs.map((log, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs gap-1.5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-500 text-[10px] font-mono">{log.time}</span>
                          <span className="font-bold text-gray-900">{log.user}:</span>
                          <span className="text-gray-700">{log.action}</span>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {log.amount !== '-' && <span className="font-mono font-bold text-teal-700">{log.amount}</span>}
                          <span className="text-[10px] text-gray-400 font-mono">{log.ip}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 6. AUTOMATED PAYMENT REMINDERS (तगादा)                           */}
          {/* =============================================================== */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-6">
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900">Automated WhatsApp & SMS Recovery Engine</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Auto-Remind Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recover credit payments 3x faster with automated WhatsApp reminders containing 1-click UPI links.
                  </p>
                </div>

                {/* Master Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">Send Bill Copy on Creation</span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">Prompt to send invoice PDF on customer's WhatsApp as soon as bill is generated.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={remindOnBillCreate}
                      onChange={(e) => setRemindOnBillCreate(e.target.checked)}
                      className="size-5 accent-emerald-600 rounded cursor-pointer mt-0.5"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-teal-950 block">Payment Overdue Reminders (तगादा)</span>
                      <p className="text-[11px] text-teal-800 mt-0.5">Automatically trigger reminder notifications for balances exceeding due date.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={remindAutoOverdue}
                      onChange={(e) => setRemindAutoOverdue(e.target.checked)}
                      className="size-5 accent-teal-600 rounded cursor-pointer mt-0.5"
                    />
                  </div>
                </div>

                {/* Trigger Configuration Timeline */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                    Reminder Notification Schedule
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { label: '3 Days Before', key: 'before3Days', note: 'Friendly reminder' },
                      { label: 'On Due Date', key: 'onDueDate', note: 'Payment due today' },
                      { label: '3 Days Overdue', key: 'after3Days', note: 'First follow-up' },
                      { label: '7 Days Overdue', key: 'after7Days', note: 'Urgent notice' },
                      { label: '15 Days Overdue', key: 'after15Days', note: 'Formal demand' },
                    ].map((sch) => (
                      <div key={sch.key} className="p-2.5 rounded-lg bg-white border border-gray-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">{sch.label}</span>
                          <input
                            type="checkbox"
                            checked={(remindSchedule as any)[sch.key]}
                            onChange={(e) => setRemindSchedule({ ...remindSchedule, [sch.key]: e.target.checked })}
                            className="size-3.5 accent-teal-600 rounded cursor-pointer"
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 block">{sch.note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Language Template & Live Bubble Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Template Editor */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">Message Language & Template</label>
                      <div className="flex items-center rounded-lg border border-gray-200 bg-gray-100 p-0.5 text-[11px]">
                        {(['hindi', 'english', 'hinglish'] as const).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setReminderLanguage(lang)}
                            className={`px-2.5 py-1 rounded-md font-bold capitalize transition-colors ${
                              reminderLanguage === lang ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={7}
                      value={reminderTemplates[reminderLanguage]}
                      readOnly
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl font-mono leading-relaxed focus:outline-none"
                    />

                    <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-500">
                      <span className="font-bold text-gray-700">Variables:</span>
                      {['{party_name}', '{company_name}', '{invoice_no}', '{due_amount}', '{due_date}', '{upi_link}'].map((v, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-teal-800 font-mono font-bold">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Live WhatsApp Bubble Preview */}
                  <div className="lg:col-span-5 bg-slate-900/5 rounded-2xl border border-gray-200 p-4 space-y-2">
                    <span className="text-xs font-bold text-gray-600 block">WhatsApp Message Bubble Preview</span>
                    
                    <div className="bg-[#EFEAE2] rounded-xl p-3 shadow-md space-y-2">
                      <div className="bg-white rounded-lg p-3 shadow-xs text-xs space-y-2 max-w-[90%] rounded-tl-none">
                        <div className="flex items-center gap-1.5 text-teal-800 font-bold border-b border-gray-100 pb-1 text-[11px]">
                          <span>{activeCompany.legalName}</span>
                          <CheckCircle2 className="w-3 h-3 text-teal-600 fill-teal-600 text-white" />
                        </div>
                        <p className="text-[11px] text-gray-800 whitespace-pre-line leading-relaxed">
                          {reminderLanguage === 'hindi'
                            ? `प्रिय Shree Ganesh Enterprises,\n\nआपके Lapiez IT Showroom के बकाया बिल #INV-0042 का ₹14,500 भुगतान शेष है। भुगतान की देय तिथि 07 Nov 2026 है।\n\nकृपया नीचे दिए गए लिंक द्वारा तुरंत UPI से भुगतान करें:`
                            : `Dear Shree Ganesh Enterprises,\n\nGreetings from Lapiez IT Showroom! Amount of ₹14,500 is pending against Invoice #INV-0042.\n\nKindly clear via instant UPI:`
                          }
                        </p>
                        
                        <div className="p-2 rounded bg-teal-50 border border-teal-200 text-center">
                          <span className="text-[11px] font-black text-teal-900 flex items-center justify-center gap-1">
                            <QrCode className="w-3.5 h-3.5" /> Click to Pay ₹14,500 via UPI
                          </span>
                        </div>

                        <span className="text-[9px] text-gray-400 block text-right">10:45 AM ✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => showToast('Automated reminder settings and schedule updated!')}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Reminder Engine</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 7. CA REPORTS SHARING                                           */}
          {/* =============================================================== */}
          {activeTab === 'ca_sharing' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-black text-gray-900">CA Reports Sharing & GST Audit Pack</h3>
                    <p className="text-xs text-gray-500">
                      Directly share monthly GSTR-1, GSTR-2B, Daybook, P&L, and Trial Balance with your CA in 1 click.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 self-start sm:self-auto">
                    GST Return Ready
                  </span>
                </div>

                {/* CA Contact Card */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800 block">
                    Your Chartered Accountant (CA) / Tax Consultant
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">CA Name</label>
                      <input
                        type="text"
                        value={caDetails.name}
                        onChange={(e) => setCaDetails({ ...caDetails, name: e.target.value })}
                        className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">CA WhatsApp Phone</label>
                      <input
                        type="text"
                        value={caDetails.phone}
                        onChange={(e) => setCaDetails({ ...caDetails, phone: e.target.value })}
                        className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg font-mono focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">CA Email</label>
                      <input
                        type="email"
                        value={caDetails.email}
                        onChange={(e) => setCaDetails({ ...caDetails, email: e.target.value })}
                        className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">1-Click Complete Audit Pack</span>
                        <span className="text-[10px] text-gray-500">Includes GSTR-1, GSTR-2B, Balance Sheet & Trial Balance</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadCaAuditPack}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Audit JSON Pack</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Share Directly to CA WhatsApp</span>
                        <span className="text-[10px] text-gray-500">Dispatches complete summary message directly</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleShareToCaWhatsApp}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to CA WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 8. HELP & SUPPORT SECTION                                       */}
          {/* =============================================================== */}
          {activeTab === 'help_support' && (
            <div className="space-y-6">
              
              {/* Support Banner & Search */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Enterprise Help Desk & Priority Support</h3>
                    <p className="text-xs text-gray-500">Quick video tutorials, WhatsApp support hotline, and instant FAQs.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open('https://wa.me/917400174001?text=Hello%20Lapiez%20myBillBook%20Support', '_blank')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Support Hotline</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search how to print thermal bill, set up e-invoice, tally export..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Video Tutorials Grid */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                  Quick Video Guides & Walkthroughs
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title: '1. Fast GST Counter Invoicing in 30 Seconds', duration: '2:15 mins' },
                    { title: '2. Setting up 2" and 3" Thermal POS Printers', duration: '3:40 mins' },
                    { title: '3. Automating WhatsApp Payment तगादा Reminders', duration: '4:10 mins' },
                  ].map((vid, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 space-y-2 hover:border-teal-500 transition-colors">
                      <div className="h-24 rounded-lg bg-slate-900/10 flex items-center justify-center font-bold text-xs text-slate-700">
                        ▶ Video Tutorial
                      </div>
                      <div className="font-bold text-xs text-gray-900 leading-tight">{vid.title}</div>
                      <span className="text-[10px] text-gray-500 block">{vid.duration} • Full HD</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs Accordion */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-gray-900 block">
                  Frequently Asked Questions (FAQ)
                </span>

                <div className="space-y-2.5">
                  {filteredFaqs.map((faq, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                      <span className="text-xs font-bold text-gray-900 block">Q: {faq.q}</span>
                      <p className="text-[11px] text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =================================================================== */}
      {/* MODALS                                                             */}
      {/* =================================================================== */}

      {/* 1. Tally XML Export Modal */}
      {isTallyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-gray-900">Data Export to Tally [New]</h3>
              </div>
              <button onClick={() => setIsTallyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Exports sales invoices, customer ledgers, and inventory transactions into official XML format compatible with <strong>Tally Prime</strong> and <strong>Tally ERP 9</strong>.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Select Date Range</label>
                <select
                  value={tallyDateRange}
                  onChange={(e) => setTallyDateRange(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-600"
                >
                  <option value="current_month">Current Month (October 2026)</option>
                  <option value="last_quarter">Last Quarter (Q2 FY 2025-26)</option>
                  <option value="current_fy">Full Financial Year (2025 - 2026)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Ready to package {invoices.length} invoices
                </div>
                <div className="text-[10px] text-teal-700">Tally XML tags &lt;VOUCHER&gt;, &lt;ALLLEDGERENTRIES.LIST&gt; verified.</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsTallyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportTallyXml}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export XML File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Close Financial Year Modal */}
      {isCloseFyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-gray-900">Close Financial Year</h3>
              </div>
              <button onClick={() => setIsCloseFyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Advance your accounting books from <strong>FY {currentFy}</strong> to <strong>FY {nextFy}</strong>. Customer and supplier closing balances will roll over into new opening balances.
            </p>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold block">Summary of Rollover:</span>
              <div className="text-[11px] space-y-0.5">
                <div>• Closing Stock Valuation carried forward</div>
                <div>• Customer Khata outstanding balances preserved</div>
                <div>• Tax ledgers reset for fresh GSTR return filing</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsCloseFyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseFinancialYear}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Confirm & Advance FY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Business Switcher Dialog */}
      {isBusinessSwitcherOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900">Switch Business Store</h3>
              <button onClick={() => setIsBusinessSwitcherOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {savedBusinesses.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setActiveCompany({ ...activeCompany, legalName: b.name, city: b.city, gstin: b.gstin });
                    setIsBusinessSwitcherOpen(false);
                    showToast(`Switched active business to ${b.name}!`);
                  }}
                  className="p-3 rounded-xl border border-gray-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{b.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{b.city} • {b.gstin}</span>
                  </div>
                  {b.name === activeCompany.legalName && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const newName = prompt('Enter new business trade name:');
                  if (newName) {
                    setSavedBusinesses([...savedBusinesses, { id: Date.now().toString(), name: newName, city: 'Garhwa', gstin: '20AAACL1234F9Z1', isPrimary: false }]);
                    showToast(`Business "${newName}" registered!`);
                  }
                }}
                className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
              >
                + Register Another Shop / Firm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Staff-wise Daybook Modal */}
      {isStaffDaybookOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-gray-900">Staff Daybook: {selectedDaybookStaff.name}</h3>
              </div>
              <button onClick={() => setIsStaffDaybookOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-500 block">Total Bills Created</span>
                <span className="font-black text-gray-900 text-base">{selectedDaybookStaff.salesInvoicesCreated} Invoices</span>
              </div>
              <div>
                <span className="text-gray-500 block">Role Assigned</span>
                <span className="font-bold text-teal-700 capitalize">{selectedDaybookStaff.role.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Today's Cash Collection</span>
                <span className="font-black text-emerald-600 text-base">₹42,850</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 block">Recent Transactions by {selectedDaybookStaff.name}</span>
              <div className="max-h-52 overflow-y-auto space-y-1.5 text-xs pr-1">
                {[
                  { id: 'INV-0042', party: 'Shree Ganesh Enterprises', amt: '₹14,500', time: '10:45 AM' },
                  { id: 'INV-0041', party: 'Maa Kali Electronics', amt: '₹8,200', time: '11:20 AM' },
                  { id: 'INV-0040', party: 'Raju Hardware & Electricals', amt: '₹20,150', time: 'Yesterday' },
                ].map((row, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-gray-50 border border-gray-200 flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-bold text-gray-900">{row.id}</span> • {row.party}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-teal-700 block">{row.amt}</span>
                      <span className="text-[10px] text-gray-400">{row.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsStaffDaybookOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Share Suggestion Modal */}
      {isSuggestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900">Share Feedback / Suggestion</h3>
              <button onClick={() => setIsSuggestionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSuggestion} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Category</label>
                <select
                  value={suggestionCategory}
                  onChange={(e) => setSuggestionCategory(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-600"
                >
                  <option value="Feature Request">Feature Request (नया फीचर)</option>
                  <option value="Bug Report">Issue / Bug (समस्या)</option>
                  <option value="Invoice Design">Invoice Design & Printing</option>
                  <option value="Other">Other Feedback</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Rating</label>
                <div className="flex gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setSuggestionRating(star)}
                      className="text-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Your Feedback</label>
                <textarea
                  rows={4}
                  placeholder="Tell us what feature you would like to see in your billing engine..."
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSuggestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
