'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Package, Heart, User, MapPin, Phone, Mail, 
  Clock, ShieldCheck, ShoppingCart, Trash2, ArrowRight, 
  Store, ExternalLink, Search, Filter, ChevronRight, 
  FileText, CheckCircle2, AlertCircle, Sparkles, Star, 
  Tag, CreditCard, HelpCircle, Download, Check, X, 
  Printer, ArrowLeft, RefreshCw, MessageSquare, QrCode, LogOut
} from 'lucide-react';

import { useStore } from '../../context/StoreContext';
import { STORE_INFO } from '../../data/storeData';
import { Product } from '../../data/products';

type AccountTab = 
  | 'orders' 
  | 'cart'
  | 'profile' 
  | 'addresses' 
  | 'wishlist' 
  | 'gst' 
  | 'payments' 
  | 'support';

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  locality: string;
  address: string;
  city: string;
  state: string;
  type: 'HOME' | 'WORK' | 'SHOWROOM';
  isDefault: boolean;
}

const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-1',
    name: 'Rupesh Kumar',
    phone: '9608828288',
    pincode: '822114',
    locality: 'Opposite G P Plaza',
    address: 'Near Old Bus Stand, Chiniya Road',
    city: 'Garhwa',
    state: 'Jharkhand',
    type: 'HOME',
    isDefault: true,
  },
  {
    id: 'addr-2',
    name: 'Lapiez Showroom Counter',
    phone: '9608828288',
    pincode: '822114',
    locality: 'In front of G P Plaza',
    address: 'Chiniya Road, Garhwa - Direct Self-Pickup with Live Counter Testing',
    city: 'Garhwa',
    state: 'Jharkhand',
    type: 'SHOWROOM',
    isDefault: false,
  },
];

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { 
    orders, 
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    wishlistIds, 
    products, 
    addToCart, 
    toggleWishlist, 
    siteSettings,
    paymentSettings,
    showToast,
    customer,
    signInWithGoogle,
    loginCustomerManually,
    signOutCustomer,
  } = useStore();


  const initialTab = (searchParams.get('tab') as AccountTab) || 'orders';
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as AccountTab;
    if (tabParam && ['orders', 'cart', 'profile', 'addresses', 'wishlist', 'gst', 'payments', 'support'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Profile State
  const [profile, setProfile] = useState({
    firstName: 'Customer',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
  });

  // Guest Access States
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  // Client-side Google Identity Services (GSI)
  useEffect(() => {
    if (typeof window === 'undefined' || customer) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '888729719943-farrlhra2vsr5dvgmdl4te3226g469l7.apps.googleusercontent.com';

    const parseJwt = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    };

    const initGsi = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response?.credential) {
                const payload = parseJwt(response.credential);
                if (payload?.email) {
                  loginCustomerManually({
                    id: payload.sub,
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                  });
                }
              }
            },
          });

          // One-tap prompt initialized without duplicate button render
        } catch (err) {
          console.log('Google Identity init note:', err);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(interval);
          initGsi();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [customer, loginCustomerManually]);

  const handleQuickSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickPhone.trim()) {
      showToast('Please enter your name and phone number');
      return;
    }
    const updatedProfile = {
      ...profile,
      firstName: quickName.trim(),
      phone: quickPhone.trim(),
    };
    setProfile(updatedProfile);
    loginCustomerManually({
      email: `${quickPhone.trim()}@guest.lapiez.com`,
      name: quickName.trim(),
    });
    try {
      localStorage.setItem('ls_customer_profile', JSON.stringify(updatedProfile));
    } catch (e) {}
    setIsGuestModalOpen(false);
  };

  // Sync profile when Google customer logs in
  useEffect(() => {
    if (customer) {
      const fullName = (customer.user_metadata?.full_name || customer.user_metadata?.name || '').trim();
      const parts = fullName ? fullName.split(' ') : [];
      const firstName = parts[0] || customer.email?.split('@')[0] || 'Customer';
      const lastName = parts.slice(1).join(' ') || '';
      setProfile((prev) => ({
        ...prev,
        firstName,
        lastName,
        email: customer.email || prev.email,
        phone: customer.phone || customer.user_metadata?.phone || prev.phone,
      }));
    }
  }, [customer]);


  // Saved Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>(DEFAULT_ADDRESSES);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddr, setNewAddr] = useState<Partial<SavedAddress>>({
    name: '',
    phone: '',
    pincode: '822114',
    locality: '',
    address: '',
    city: 'Garhwa',
    state: 'Jharkhand',
    type: 'HOME',
  });

  // GST State
  const [gstInfo, setGstInfo] = useState({
    businessName: 'Lappy Tech Solutions Garhwa',
    gstin: '20AABCL1234F1Z5',
    panNumber: 'AABCL1234F',
  });

  // Order Filters & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'delivered' | 'shipped' | 'processing'>('all');

  // Selected Order for Invoice Modal
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);

  // Selected Order for Tracking Stepper Modal
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('ls_customer_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));

      const savedAddresses = localStorage.getItem('ls_customer_addresses');
      if (savedAddresses) setAddresses(JSON.parse(savedAddresses));

      const savedGst = localStorage.getItem('ls_customer_gst');
      if (savedGst) setGstInfo(JSON.parse(savedGst));
    } catch (e) {}
  }, []);

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  // Filtered Orders (Restricted to authenticated customer for privacy)
  const filteredOrders = useMemo(() => {
    if (!customer) return orders;
    const custId = customer.id;
    const custEmail = (customer.email || '').toLowerCase().trim();
    const custPhone = (customer.phone || customer.user_metadata?.phone || '').replace(/\D/g, '').slice(-10);

    return orders.filter((o) => {
      // Privacy & Ownership verification
      const orderEmail = (o.customerEmail || o.email || '').toLowerCase().trim();
      const orderPhone = (o.phone || '').replace(/\D/g, '').slice(-10);
      const isOwner = (o.customerId && o.customerId === custId) ||
                      (custEmail && orderEmail === custEmail) ||
                      (custPhone && orderPhone && custPhone === orderPhone);

      if (!isOwner) return false;

      if (orderStatusFilter === 'delivered' && o.orderStatus !== 'Delivered') return false;
      if (orderStatusFilter === 'shipped' && o.orderStatus !== 'Shipped') return false;
      if (orderStatusFilter === 'processing' && (o.orderStatus === 'Delivered' || o.orderStatus === 'Cancelled')) return false;

      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const idMatches = (o.orderId || '').toLowerCase().includes(q);
        const nameMatches = (o.customerName || '').toLowerCase().includes(q);
        const itemMatches = o.items?.some((i: any) => i.name.toLowerCase().includes(q));
        if (!idMatches && !nameMatches && !itemMatches) return false;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch, customer]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('ls_customer_profile', JSON.stringify(profile));
      showToast('Profile information updated successfully!');
    } catch (e) {}
  };

  const handleSaveGst = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('ls_customer_gst', JSON.stringify(gstInfo));
      showToast('GST Business details saved for tax invoicing!');
    } catch (e) {}
  };

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.name || !newAddr.phone || !newAddr.address) {
      showToast('Please fill all required address fields.');
      return;
    }
    const created: SavedAddress = {
      id: `addr-${Date.now()}`,
      name: newAddr.name.trim(),
      phone: newAddr.phone.trim(),
      pincode: newAddr.pincode || '822114',
      locality: newAddr.locality || 'Garhwa',
      address: newAddr.address.trim(),
      city: newAddr.city || 'Garhwa',
      state: newAddr.state || 'Jharkhand',
      type: newAddr.type || 'HOME',
      isDefault: addresses.length === 0,
    };
    const updated = [created, ...addresses];
    setAddresses(updated);
    try {
      localStorage.setItem('ls_customer_addresses', JSON.stringify(updated));
    } catch (e) {}
    setIsAddAddressOpen(false);
    setNewAddr({ name: '', phone: '', pincode: '822114', locality: '', address: '', city: 'Garhwa', state: 'Jharkhand', type: 'HOME' });
    showToast('New address saved successfully!');
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    try {
      localStorage.setItem('ls_customer_addresses', JSON.stringify(updated));
    } catch (e) {}
    showToast('Address removed.');
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    try {
      localStorage.setItem('ls_customer_addresses', JSON.stringify(updated));
    } catch (e) {}
    showToast('Default delivery address updated.');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const getTabTitle = (tab: AccountTab) => {
    switch (tab) {
      case 'orders': return 'My Orders';
      case 'cart': return `My Active Cart (${cart.reduce((sum, item) => sum + item.quantity, 0)} items)`;
      case 'profile': return 'Profile Information';
      case 'addresses': return 'Manage Addresses';
      case 'wishlist': return `My Wishlist (${wishlistProducts.length})`;
      case 'gst': return 'PAN Card & GST Invoicing';
      case 'payments': return 'Saved UPI & Payment Methods';
      case 'support': return '24x7 Help Center & Warranty Desk';
    }
  };

  return (
    <div className="bg-[#F1F3F6] min-h-screen pb-20 font-sans">
      
      {/* 1. FLIPKART STYLE BREADCRUMB BAR */}
      <div className="bg-white border-b border-[#E5E7EB] py-2 px-3 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-[11px] sm:text-xs text-[#6B7280]">
          <Link href="/" className="hover:text-[#1A56DB] transition-colors">Home</Link>
          <span>›</span>
          <span className="text-[#374151]">My Account</span>
          <span>›</span>
          <span className="text-[#111827] font-bold">{getTabTitle(activeTab)}</span>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN CONTAINER */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start">
          
          {/* ========================================================= */}
          {/* LEFT SIDEBAR (FLIPKART / AMAZON INDIAN ECOM STYLE)        */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-3">
            
            {/* User Greeting Card */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 sm:p-4 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {customer?.user_metadata?.avatar_url ? (
                  <img
                    src={customer.user_metadata.avatar_url}
                    alt="Customer Avatar"
                    className="w-12 h-12 rounded-full border-2 border-blue-400 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1A56DB] to-[#3B82F6] flex items-center justify-center text-white font-extrabold text-lg shadow-sm flex-shrink-0">
                    {profile.firstName.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[11px] text-[#6B7280] block">Hello,</span>
                  <h3 className="font-extrabold text-[15px] text-[#111827] truncate">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  {customer ? (
                    <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded mt-0.5">
                      Google Verified
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Google Sign In / Sign Up Card if not authenticated */}
            {!customer && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 rounded-xl border border-blue-200/90 p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customer Quick Access</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sign in with Google to automatically sync orders, save delivery addresses, and track GST invoices.
                </p>

                {/* Primary Direct Google Sign-In / Sign-Up Button */}
                <button
                  type="button"
                  onClick={() => signInWithGoogle('/account')}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsGuestModalOpen(true)}
                    className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#1A56DB] font-bold text-xs rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Instant Customer / Guest Sign-in</span>
                  </button>
                </div>
              </div>
            )}


            {/* Navigation Menu Card */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs divide-y divide-[#F3F4F6] overflow-hidden text-xs">
              
              {/* GROUP 1: MY ORDERS & MY CART */}
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between font-bold transition-all ${
                    activeTab === 'orders'
                      ? 'bg-[#EFF6FF] text-[#1A56DB]'
                      : 'text-[#374151] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className={`w-4 h-4 ${activeTab === 'orders' ? 'text-[#1A56DB]' : 'text-gray-400'}`} />
                    <span>MY ORDERS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-[#1A56DB] font-extrabold">
                      {orders.length}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('cart')}
                  className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between font-bold transition-all ${
                    activeTab === 'cart'
                      ? 'bg-[#EFF6FF] text-[#1A56DB]'
                      : 'text-[#374151] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className={`w-4 h-4 ${activeTab === 'cart' ? 'text-[#1A56DB]' : 'text-gray-400'}`} />
                    <span>MY ACTIVE CART</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      cart.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </button>
              </div>

              {/* GROUP 2: ACCOUNT SETTINGS */}
              <div className="p-2 space-y-0.5">
                <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-[#1A56DB]" />
                  <span>ACCOUNT SETTINGS</span>
                </div>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full py-2 px-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-[#EFF6FF] text-[#1A56DB] font-bold'
                      : 'text-[#4B5563] hover:bg-gray-50'
                  }`}
                >
                  <span>Profile Information</span>
                  {activeTab === 'profile' && <ChevronRight className="w-3 h-3 text-[#1A56DB]" />}
                </button>

                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full py-2 px-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                    activeTab === 'addresses'
                      ? 'bg-[#EFF6FF] text-[#1A56DB] font-bold'
                      : 'text-[#4B5563] hover:bg-gray-50'
                  }`}
                >
                  <span>Manage Addresses</span>
                  {activeTab === 'addresses' && <ChevronRight className="w-3 h-3 text-[#1A56DB]" />}
                </button>

                <button
                  onClick={() => setActiveTab('gst')}
                  className={`w-full py-2 px-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                    activeTab === 'gst'
                      ? 'bg-[#EFF6FF] text-[#1A56DB] font-bold'
                      : 'text-[#4B5563] hover:bg-gray-50'
                  }`}
                >
                  <span>PAN & GST Invoicing</span>
                  {activeTab === 'gst' && <ChevronRight className="w-3 h-3 text-[#1A56DB]" />}
                </button>
              </div>

              {/* GROUP 3: PAYMENTS */}
              <div className="p-2 space-y-0.5">
                <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-[#1A56DB]" />
                  <span>PAYMENTS</span>
                </div>

                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full py-2 px-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                    activeTab === 'payments'
                      ? 'bg-[#EFF6FF] text-[#1A56DB] font-bold'
                      : 'text-[#4B5563] hover:bg-gray-50'
                  }`}
                >
                  <span>Saved UPI & Bank Details</span>
                  {activeTab === 'payments' && <ChevronRight className="w-3 h-3 text-[#1A56DB]" />}
                </button>
              </div>

              {/* GROUP 4: MY STUFF */}
              <div className="p-2 space-y-0.5">
                <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-[#1A56DB]" />
                  <span>MY STUFF</span>
                </div>

                <button
                  onClick={() => setActiveTab('cart')}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-colors ${
                    activeTab === 'cart'
                      ? 'bg-[#EFF6FF] text-[#1A56DB] font-bold'
                      : 'text-[#4B5563] hover:bg-gray-50'
                  }`}
                >
                  <span>My Cart Items</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-colors ${
                    activeTab === 'wishlist'
                      ? 'bg-[#EFF6FF] text-[#1A56DB] font-bold'
                      : 'text-[#4B5563] hover:bg-gray-50'
                  }`}
                >
                  <span>My Wishlist</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-red-600">
                    {wishlistProducts.length}
                  </span>
                </button>
              </div>

              {/* GROUP 5: 24x7 CUSTOMER DESK */}
              <div className="p-2">
                <button
                  onClick={() => setActiveTab('support')}
                  className={`w-full py-2 px-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                    activeTab === 'support'
                      ? 'bg-[#EFF6FF] text-[#1A56DB] font-bold'
                      : 'text-[#4B5563] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>24x7 Help & Warranty Desk</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>

              {/* LOG OUT BUTTON (Shown when signed in) */}
              {customer && (
                <div className="p-2 border-t border-gray-100">
                  <button
                    onClick={() => signOutCustomer()}
                    className="w-full py-2.5 px-3 text-left font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>LOG OUT</span>
                    </div>
                  </button>
                </div>
              )}
            </div>


            {/* Showroom Direct Connect Card */}
            <div className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] rounded-xl p-3.5 shadow-2xs space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-[#1D4ED8] flex items-center gap-1">
                <Store className="w-3 h-3 text-[#1D4ED8]" />
                GARHWA SHOWROOM HELP
              </span>
              <p className="text-xs text-[#1E3A8A] leading-snug">
                Need on-counter hardware diagnostics or invoice duplicate?
              </p>
              <div className="pt-1 flex items-center gap-2">
                <a
                  href={`tel:${siteSettings?.phone || STORE_INFO.phone}`}
                  className="flex-1 h-8 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Store</span>
                </a>
                <a
                  href={`https://wa.me/${(siteSettings?.whatsapp || STORE_INFO.whatsapp).replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-8 rounded-lg bg-[#25D366] hover:bg-[#1EBE5B] text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                >
                  <MessageSquare className="w-3 h-3 fill-white" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT MAIN CONTENT AREA                                   */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            
            {/* ======================================================= */}
            {/* TAB 1: MY ORDERS (FLIPKART STYLE)                       */}
            {/* ======================================================= */}
            {activeTab === 'orders' && (
              <div className="space-y-3.5">
                
                {/* Search & Filter Header */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    
                    {/* Search in Orders Bar */}
                    <div className="relative w-full sm:max-w-md">
                      <input
                        type="text"
                        placeholder="Search your orders by product name or order ID..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full h-9.5 pl-9 pr-3 text-xs bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1A56DB] focus:bg-white"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                      {orderSearch && (
                        <button
                          onClick={() => setOrderSearch('')}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Status Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                      {[
                        { id: 'all', label: 'All Orders' },
                        { id: 'delivered', label: 'Delivered' },
                        { id: 'shipped', label: 'On the Way' },
                        { id: 'processing', label: 'Processing' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setOrderStatusFilter(f.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                            orderStatusFilter === f.id
                              ? 'bg-[#1A56DB] text-white border-[#1A56DB]'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord: any) => {
                    const isDelivered = ord.orderStatus === 'Delivered';
                    const isShipped = ord.orderStatus === 'Shipped';
                    const isPaid = ord.paymentStatus === 'Paid' || ord.paymentStatus === 'Verified';

                    return (
                      <div
                        key={ord.orderId}
                        className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        {/* Top Metadata Strip */}
                        <div className="bg-[#F9FAFB] px-4 py-2.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-4 text-gray-600">
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">ORDER PLACED</span>
                              <span className="font-semibold text-gray-800">{ord.orderDate || 'Today'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">TOTAL AMOUNT</span>
                              <span className="font-extrabold text-[#111827]">
                                ₹{(Number(ord.totalAmount) || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">SHIP TO</span>
                              <span className="font-semibold text-gray-800 truncate max-w-[150px] block">
                                {ord.customerName || profile.firstName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-500">
                              ORDER # <strong className="text-gray-900">{ord.orderId}</strong>
                            </span>
                            <button
                              onClick={() => setInvoiceOrder(ord)}
                              className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 text-[#1A56DB] border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>Invoice</span>
                            </button>
                          </div>
                        </div>

                        {/* Order Items & Delivery Tracking Progress */}
                        <div className="p-4 sm:p-5 space-y-4">
                          
                          {/* Items Rows */}
                          <div className="divide-y divide-gray-100">
                            {ord.items?.map((item: any, idx: number) => (
                              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    <img
                                      src={item.image || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'}
                                      alt={item.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 hover:text-[#1A56DB] line-clamp-2">
                                      {item.name}
                                    </h4>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                      Qty: <strong className="text-gray-800">{item.quantity}</strong> • 18% GST Invoiced
                                    </p>
                                    <span className="text-sm font-extrabold text-[#111827] font-mono mt-1 block">
                                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>

                                {/* Delivery Status Message with Dot */}
                                <div className="sm:text-right flex-shrink-0">
                                  <div className="flex items-center sm:justify-end gap-1.5">
                                    <span className={`w-2.5 h-2.5 rounded-full ${
                                      isDelivered ? 'bg-[#15803D]' : isShipped ? 'bg-[#2563EB]' : 'bg-[#D97706]'
                                    }`} />
                                    <span className="font-extrabold text-xs text-gray-900">
                                      {isDelivered
                                        ? 'Delivered on counter / address'
                                        : isShipped
                                        ? 'Out for Delivery (Garhwa Express)'
                                        : 'Processing for Dispatch'}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-gray-500 block mt-0.5">
                                    {isDelivered
                                      ? 'Package was handed to resident'
                                      : 'Expected today or 30-min showroom pickup'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 4-Step Flipkart Progress Stepper */}
                          <div className="pt-3 border-t border-gray-100">
                            <div className="grid grid-cols-4 gap-1 text-center text-[10.5px]">
                              
                              {/* Step 1: Confirmed */}
                              <div className="space-y-1">
                                <div className="w-5 h-5 mx-auto rounded-full bg-[#15803D] text-white flex items-center justify-center font-bold text-[10px]">
                                  ✓
                                </div>
                                <span className="font-bold text-gray-800 block">Order Confirmed</span>
                                <span className="text-[9.5px] text-gray-400 block">{ord.orderDate || 'Today'}</span>
                              </div>

                              {/* Step 2: UPI Verified */}
                              <div className="space-y-1">
                                <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  isPaid ? 'bg-[#15803D] text-white' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {isPaid ? '✓' : '•'}
                                </div>
                                <span className="font-bold text-gray-800 block">UPI Verified</span>
                                <span className="text-[9.5px] text-gray-400 block">
                                  {ord.utrNumber ? `UTR: ${ord.utrNumber.substring(0, 6)}...` : 'Counter Pay'}
                                </span>
                              </div>

                              {/* Step 3: Shipped */}
                              <div className="space-y-1">
                                <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  isShipped || isDelivered ? 'bg-[#15803D] text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                  {isShipped || isDelivered ? '✓' : '•'}
                                </div>
                                <span className="font-bold text-gray-800 block">Dispatched</span>
                                <span className="text-[9.5px] text-gray-400 block">Chiniya Road Lab</span>
                              </div>

                              {/* Step 4: Delivered */}
                              <div className="space-y-1">
                                <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  isDelivered ? 'bg-[#15803D] text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                  {isDelivered ? '✓' : '•'}
                                </div>
                                <span className="font-bold text-gray-800 block">Delivered</span>
                                <span className="text-[9.5px] text-gray-400 block">
                                  {isDelivered ? 'Verified' : 'Garhwa & Palamu'}
                                </span>
                              </div>

                            </div>
                          </div>

                          {/* Bottom Action Strip (Flipkart Style) */}
                          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                            
                            {/* Star Rating Prompt */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <span className="font-bold text-gray-700">Rate product:</span>
                              <div className="flex items-center text-amber-400 cursor-pointer">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400 hover:scale-110 transition-transform" />
                                ))}
                              </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                              
                              <button
                                onClick={() => setTrackingOrder(ord)}
                                className="h-8 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#1A56DB]" />
                                <span>Track Package</span>
                              </button>

                              <a
                                href={`https://wa.me/${(siteSettings?.whatsapp || STORE_INFO.whatsapp).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello Lapiez Garhwa, I need help with my Order #${ord.orderId}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 px-3 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-[#15803D] font-bold text-xs flex items-center gap-1.5 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5 fill-[#15803D]" />
                                <span>Need Help?</span>
                              </a>

                              <button
                                onClick={() => {
                                  if (ord.items && ord.items.length > 0) {
                                    ord.items.forEach((item: any) => {
                                      const fullProd = products.find((p) => p.id === item.productId || p.name === item.name);
                                      if (fullProd) addToCart(fullProd);
                                    });
                                    showToast('Items added to cart!');
                                  }
                                }}
                                className="h-8 px-3.5 rounded-lg bg-[#FB641B] hover:bg-[#E0530F] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Buy It Again</span>
                              </button>

                            </div>

                          </div>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-md mx-auto shadow-2xs space-y-3">
                    <Package className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="font-extrabold text-gray-900 text-base">
                      {orderSearch ? 'No Orders Found' : 'No Orders Placed Yet'}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {orderSearch ? 'No orders match your search keyword.' : 'Sign in with Google to view and live-track your past showroom and online orders.'}
                    </p>
                    {!customer ? (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => signInWithGoogle('/account')}
                          className="h-9.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Sign in with Google</span>
                        </button>
                        <button
                          onClick={() => setIsGuestModalOpen(true)}
                          className="h-9.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1A56DB] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-200 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Guest Sign-in</span>
                        </button>
                      </div>
                    ) : (
                      <Link
                        href="/shop"
                        className="inline-flex h-9.5 px-5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs items-center gap-1.5 transition-colors shadow-xs mx-auto"
                      >
                        <span>Explore Catalog ({products.length || 413} Items)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ======================================================= */}
            {/* TAB: MY ACTIVE CART & CHOSEN HARDWARE                   */}
            {/* ======================================================= */}
            {activeTab === 'cart' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Header Card */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-blue-50 text-[#1A56DB]">
                        <ShoppingCart className="w-4 h-4" />
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-[#111827]">
                        My Selected Hardware & Cart ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Manage products chosen in your customer session, change quantity, or remove items before placing order.
                    </p>
                  </div>

                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove all items from your cart?')) {
                          clearCart();
                          showToast('Cart cleared.');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All Items</span>
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  /* Empty State */
                  <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center shadow-2xs space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A56DB] mx-auto">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-gray-900">Your Cart is Currently Empty</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      You haven't chosen any products yet. Browse our Garhwa showroom catalog for laptops, parts, CCTV kits, and accessories.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <span>Browse Products Catalog</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Active Cart Grid */
                  <div className="space-y-4">
                    {/* Items List */}
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs overflow-hidden divide-y divide-gray-100">
                      {cart.map((item) => {
                        const itemSubtotal = item.product.price * item.quantity;
                        const itemSavings = (item.product.mrp || item.product.price) > item.product.price
                          ? ((item.product.mrp || item.product.price) - item.product.price) * item.quantity
                          : 0;

                        return (
                          <div key={item.product.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                            {/* Product Info */}
                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                              <Link href={`/product/${item.product.id}`} className="flex-shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#F8FAFC] border border-gray-200 p-1.5 flex items-center justify-center overflow-hidden hover:border-blue-400 transition-colors">
                                  <img
                                    src={item.product.image || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'}
                                    alt={item.product.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </Link>

                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1A56DB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    {item.product.brand || 'Showroom'}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {item.product.category}
                                  </span>
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                                    GST {item.product.gstRate ?? 18}%
                                  </span>
                                </div>

                                <Link href={`/product/${item.product.id}`} className="block">
                                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 hover:text-[#1A56DB] transition-colors line-clamp-1">
                                    {item.product.name}
                                  </h4>
                                </Link>

                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-extrabold text-gray-900">
                                    ₹{item.product.price.toLocaleString('en-IN')}
                                  </span>
                                  {(item.product.mrp || 0) > item.product.price && (
                                    <span className="text-gray-400 line-through text-[11px]">
                                      ₹{item.product.mrp?.toLocaleString('en-IN')}
                                    </span>
                                  )}
                                  {itemSavings > 0 && (
                                    <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded">
                                      Save ₹{itemSavings.toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>

                                <span className="text-[10.5px] text-gray-400 font-mono block">
                                  SKU: {item.product.sku || item.product.id}
                                </span>
                              </div>
                            </div>

                            {/* Quantity Controls & Total & Remove Action */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              <div className="text-right">
                                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Item Total</span>
                                <span className="text-sm sm:text-base font-black text-gray-900 font-mono">
                                  ₹{itemSubtotal.toLocaleString('en-IN')}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                {/* Quantity Step Counter */}
                                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (item.quantity <= 1) {
                                        removeFromCart(item.product.id);
                                        showToast(`Removed "${item.product.name.slice(0, 18)}..." from cart`);
                                      } else {
                                        updateQuantity(item.product.id, item.quantity - 1);
                                      }
                                    }}
                                    className="w-7 h-7 rounded-md bg-white text-gray-700 hover:bg-gray-100 flex items-center justify-center font-bold text-xs transition-colors border border-gray-200 cursor-pointer"
                                    title="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center text-xs font-black text-gray-900 font-mono">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateQuantity(item.product.id, item.quantity + 1);
                                    }}
                                    className="w-7 h-7 rounded-md bg-white text-gray-700 hover:bg-gray-100 flex items-center justify-center font-bold text-xs transition-colors border border-gray-200 cursor-pointer"
                                    title="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeFromCart(item.product.id);
                                    showToast(`Removed "${item.product.name.slice(0, 18)}..." from cart`);
                                  }}
                                  className="h-8 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Remove item from cart"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cart Bill & Checkout CTA Card */}
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="font-bold text-sm text-gray-900">Total Cart Breakdown</span>
                        <span className="text-xs font-mono text-gray-500">{cart.reduce((s, i) => s + i.quantity, 0)} Items Selected</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal (Base Price)</span>
                          <span className="font-bold text-gray-900 font-mono">
                            ₹{cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Showroom Testing & Counter Pickup</span>
                          <span className="font-bold text-emerald-600 uppercase text-[11px]">FREE (Garhwa)</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>GST Tax Invoice</span>
                          <span className="font-bold text-blue-600">100% ITC Eligible</span>
                        </div>

                        <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm sm:text-base">
                          <span className="font-black text-gray-900">Total Payable Amount</span>
                          <span className="font-black text-[#1A56DB] text-lg sm:text-xl font-mono">
                            ₹{cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <Link
                          href="/shop"
                          className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs text-center transition-colors"
                        >
                          + Add More Hardware
                        </Link>
                        <Link
                          href="/checkout"
                          className="flex-1 py-3.5 px-6 rounded-xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                        >
                          <span>Proceed to Express Checkout</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ======================================================= */}
            {/* TAB 2: PROFILE INFORMATION                              */}
            {/* ======================================================= */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-[#111827]">
                    Personal Information
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manage your identity, registered communication email, and Garhwa showroom verified mobile.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                  
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">First Name *</label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="w-full h-9.5 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB] focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Last Name</label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="w-full h-9.5 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Gender Selector */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-2">Your Gender</label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                        <input
                          type="radio"
                          name="gender"
                          value="Male"
                          checked={profile.gender === 'Male'}
                          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                          className="w-4 h-4 text-[#1A56DB]"
                        />
                        <span>Male</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                        <input
                          type="radio"
                          name="gender"
                          value="Female"
                          checked={profile.gender === 'Female'}
                          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                          className="w-4 h-4 text-[#1A56DB]"
                        />
                        <span>Female</span>
                      </label>
                    </div>
                  </div>

                  {/* Email Field with Verified Tag */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full h-9.5 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB] focus:bg-white"
                      />
                      <span className="absolute right-3 top-2 text-[10.5px] font-extrabold text-[#15803D] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        ✓ Verified
                      </span>
                    </div>
                    <span className="text-[10.5px] text-gray-400 mt-1 block">Invoices & order updates are sent to this address</span>
                  </div>

                  {/* Mobile Phone Field */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Mobile Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full h-9.5 bg-gray-50 border border-gray-200 rounded-lg px-3 font-mono text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB] focus:bg-white"
                      />
                      <span className="absolute right-3 top-2 text-[10.5px] font-extrabold text-[#15803D] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        ✓ SMS Verified
                      </span>
                    </div>
                    <span className="text-[10.5px] text-gray-400 mt-1 block">Used by local Garhwa couriers to coordinate drop-off</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="h-10 px-6 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Save Profile Changes
                    </button>
                  </div>

                </form>

                {/* Flipkart FAQ Box */}
                <div className="pt-6 border-t border-gray-100 space-y-3">
                  <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
                    Frequently Asked Questions
                  </h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <p>
                      <strong className="text-gray-900 block font-semibold">What happens when I update my email or phone number?</strong>
                      Your login identity and delivery notifications will instantly route to the new contact coordinates. Past orders remain safely logged in your dashboard.
                    </p>
                    <p>
                      <strong className="text-gray-900 block font-semibold">How are my hardware warranties stored?</strong>
                      All laptops, motherboards, SSDs, and CP-PLUS CCTV kits have their serial numbers and 18% GST tax invoices digitally archived in your account.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================= */}
            {/* TAB 3: MANAGE ADDRESSES (FLIPKART STYLE)                */}
            {/* ======================================================= */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                
                {/* Header with Add Button */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-[#111827]">
                      Manage Addresses ({addresses.length})
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Delivery locations in Garhwa, Palamu, and surrounding areas.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddAddressOpen(true)}
                    className="h-9 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>+ ADD A NEW ADDRESS</span>
                  </button>
                </div>

                {/* Add Address Form Modal / Inline */}
                {isAddAddressOpen && (
                  <form onSubmit={handleAddAddressSubmit} className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <h4 className="font-extrabold text-sm text-[#111827]">Add New Delivery Address</h4>
                      <button type="button" onClick={() => setIsAddAddressOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={newAddr.name}
                          onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                          className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB]"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">10-Digit Mobile Phone *</label>
                        <input
                          type="tel"
                          value={newAddr.phone}
                          onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                          className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB]"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Pincode (822114) *</label>
                        <input
                          type="text"
                          value={newAddr.pincode}
                          onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                          className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB]"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Locality / Landmark</label>
                        <input
                          type="text"
                          value={newAddr.locality}
                          onChange={(e) => setNewAddr({ ...newAddr, locality: e.target.value })}
                          className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-bold text-gray-700 block mb-1">Street Address (House No, Building, Street) *</label>
                        <input
                          type="text"
                          value={newAddr.address}
                          onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                          className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB]"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">City / District</label>
                        <input
                          type="text"
                          value={newAddr.city}
                          onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                          className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">State</label>
                        <input
                          type="text"
                          value={newAddr.state}
                          onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                          className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB]"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddAddressOpen(false)}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs shadow-xs"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                {/* Address Cards */}
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`bg-white border rounded-xl p-4 sm:p-5 shadow-2xs transition-all ${
                        addr.isDefault ? 'border-[#1A56DB] ring-1 ring-[#1A56DB]/20' : 'border-[#E5E7EB]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {addr.type}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#1A56DB] border border-blue-200">
                                DEFAULT DELIVERY ADDRESS
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 pt-1">
                            <strong className="text-sm font-extrabold text-gray-900">{addr.name}</strong>
                            <span className="font-mono text-xs font-bold text-gray-700">{addr.phone}</span>
                          </div>

                          <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                            {addr.address}, {addr.locality ? `${addr.locality}, ` : ''}{addr.city} - <strong className="text-gray-900">{addr.pincode}</strong>, {addr.state}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#1A56DB] hover:bg-blue-50 border border-blue-200 transition-colors"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ======================================================= */}
            {/* TAB 4: MY WISHLIST                                      */}
            {/* ======================================================= */}
            {activeTab === 'wishlist' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
                  <h3 className="font-extrabold text-base text-[#111827]">
                    My Wishlist ({wishlistProducts.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Saved items you can order anytime with 1-click counter dispatch.
                  </p>
                </div>

                {wishlistProducts.length > 0 ? (
                  <div className="bg-white border border-[#E5E7EB] rounded-xl divide-y divide-gray-100 overflow-hidden shadow-2xs">
                    {wishlistProducts.map((p) => (
                      <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                        
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-16 h-16 rounded-xl bg-gray-50 p-1 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          
                          <div className="min-w-0 space-y-1">
                            <Link href={`/product/${p.id}`} className="block">
                              <h4 className="font-bold text-xs sm:text-sm text-gray-900 hover:text-[#1A56DB] line-clamp-2">
                                {p.name}
                              </h4>
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span className="font-bold text-gray-700">{p.brand}</span>
                              <span>•</span>
                              <span>{p.category}</span>
                              <span>•</span>
                              <span className="text-[#15803D] font-bold">18% GST Bill</span>
                            </div>
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="text-sm sm:text-base font-extrabold text-gray-900 font-mono">
                                ₹{p.price.toLocaleString('en-IN')}
                              </span>
                              {p.mrp > p.price && (
                                <>
                                  <span className="text-xs text-gray-400 line-through">
                                    ₹{p.mrp.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-xs font-bold text-[#15803D]">
                                    {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                          <button
                            onClick={() => {
                              addToCart(p);
                              showToast(`Added ${p.name} to cart!`);
                            }}
                            className="h-8.5 px-4 rounded-lg bg-[#FB641B] hover:bg-[#E0530F] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Move to Cart</span>
                          </button>
                          <button
                            onClick={() => toggleWishlist(p)}
                            className="w-8.5 h-8.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors"
                            title="Remove from Wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-md mx-auto shadow-2xs space-y-3">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="font-extrabold text-gray-900 text-base">Your Wishlist is Empty</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Tap the heart icon on any laptop, RAM, SSD, or CCTV product to save it here for festive deal tracking.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex h-9.5 px-5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>Explore Store Products</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================= */}
            {/* TAB 5: PAN & GST BUSINESS INVOICING                     */}
            {/* ======================================================= */}
            {activeTab === 'gst' && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-[#111827]">
                    PAN Card & 18% GST Business Invoicing
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Save your GSTIN number to claim 18% Input Tax Credit (ITC) on commercial laptop and CCTV purchases.
                  </p>
                </div>

                <form onSubmit={handleSaveGst} className="space-y-4 max-w-md text-xs">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Company / Business Trade Name *</label>
                    <input
                      type="text"
                      value={gstInfo.businessName}
                      onChange={(e) => setGstInfo({ ...gstInfo, businessName: e.target.value })}
                      className="w-full h-9.5 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB] focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Showroom GSTIN (15 Digits) *</label>
                    <input
                      type="text"
                      value={gstInfo.gstin}
                      onChange={(e) => setGstInfo({ ...gstInfo, gstin: e.target.value })}
                      className="w-full h-9.5 bg-gray-50 border border-gray-200 rounded-lg px-3 font-mono text-xs text-blue-900 font-bold focus:outline-none focus:border-[#1A56DB] focus:bg-white"
                      required
                    />
                    <span className="text-[10.5px] text-gray-400 mt-0.5 block">Format: 20AABCL1234F1Z5</span>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Permanent Account Number (PAN)</label>
                    <input
                      type="text"
                      value={gstInfo.panNumber}
                      onChange={(e) => setGstInfo({ ...gstInfo, panNumber: e.target.value })}
                      className="w-full h-9.5 bg-gray-50 border border-gray-200 rounded-lg px-3 font-mono text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB] focus:bg-white"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="h-10 px-6 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Save GST Invoicing Information
                    </button>
                  </div>
                </form>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
                  <span className="font-extrabold flex items-center gap-1.5 text-[#15803D]">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    GST Input Tax Credit (ITC) Ready
                  </span>
                  <p className="text-[11.5px] text-emerald-800 leading-relaxed">
                    All electronics billed to your GSTIN are uploaded to the GST portal (GSTR-1) so your enterprise or educational institute can claim back 18% tax on purchases.
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================= */}
            {/* TAB 6: SAVED UPI & PAYMENT METHODS                      */}
            {/* ======================================================= */}
            {activeTab === 'payments' && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-[#111827]">
                    Saved UPI & Payment Settlement Methods
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Official merchant UPI handle verified on Google Pay, PhonePe, Paytm, and Axis Bank.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Primary Store UPI Card */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1A56DB] uppercase text-[10.5px]">Official Merchant UPI</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Verified QR
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-sm text-blue-900 block">
                      {paymentSettings?.upiId || 'lappy.solution@ybl'}
                    </span>
                    <span className="text-gray-600 block">
                      Payee: {paymentSettings?.upiName || 'LAPIEZ GARHWA'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(paymentSettings?.upiId || 'lappy.solution@ybl', 'UPI ID')}
                      className="mt-2 text-[#1A56DB] hover:underline font-bold text-[11px] block"
                    >
                      Copy Official UPI ID
                    </button>
                  </div>

                  {/* Cash on Delivery / Counter Pickup */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700 uppercase text-[10.5px]">Counter Pickup Settlement</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        Pay on Pickup
                      </span>
                    </div>
                    <span className="font-bold text-sm text-gray-900 block">
                      Cash / POS Counter Swipe
                    </span>
                    <p className="text-gray-500 text-[11px] leading-relaxed">
                      Pay after testing hardware display, keyboard, and thermal temperatures in our Garhwa showroom.
                    </p>
                  </div>

                </div>
              </div>
            )}


            {/* ======================================================= */}
            {/* TAB 8: 24x7 CUSTOMER HELP & WARRANTY DESK               */}
            {/* ======================================================= */}
            {activeTab === 'support' && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-[#111827]">
                    24x7 Customer Care & Garhwa Showroom Warranty Desk
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Speak directly with hardware engineers on Chiniya Road, Garhwa for warranty claims and diagnostics.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Showroom Coordinates */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2.5">
                    <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Flagship Showroom Desk</span>
                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-[#1A56DB] flex-shrink-0 mt-0.5" />
                      <span>{siteSettings?.address || `${STORE_INFO.address}, Garhwa - ${STORE_INFO.pincode}`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-[#1A56DB] flex-shrink-0" />
                      <span>Phone: <strong className="text-gray-900">{siteSettings?.phone || STORE_INFO.phone}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-[#1A56DB] flex-shrink-0" />
                      <span>Timings: <strong className="text-gray-900">{siteSettings?.timings || STORE_INFO.timings}</strong></span>
                    </div>
                  </div>

                  {/* Priority WhatsApp */}
                  <div className="p-4 rounded-xl bg-green-50/70 border border-green-200 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#15803D] block">Fastest Response</span>
                      <h4 className="font-extrabold text-sm text-green-950 mt-1">Priority WhatsApp Support</h4>
                      <p className="text-gray-600 text-[11px] mt-1">
                        Send your order ID or laptop model photo to our technician counter for instant compatibility and repair updates.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${(siteSettings?.whatsapp || STORE_INFO.whatsapp).replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Lapiez Garhwa, I need warranty support for my hardware.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-4 rounded-lg bg-[#25D366] hover:bg-[#1EBE5B] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
                    >
                      <MessageSquare className="w-4 h-4 fill-white" />
                      <span>WhatsApp Store Desk</span>
                    </a>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: 18% GST TAX INVOICE (PRINTABLE / DOWNLOADABLE)     */}
      {/* ========================================================= */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl space-y-4">
            
            {/* Header & Print controls */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1A56DB]" />
                <h3 className="font-extrabold text-base text-gray-900">
                  Tax Invoice / Bill of Supply
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/invoice/${invoiceOrder.orderId}`}
                  target="_blank"
                  className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full A4 Invoice</span>
                </Link>
                <button
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-4 sm:p-6 border border-gray-200 rounded-xl space-y-5 text-xs bg-white">
              
              {/* Store Biller & GSTIN */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">
                    {siteSettings?.siteName || STORE_INFO.name}
                  </h2>
                  <p className="text-gray-600 mt-0.5 text-[11.5px]">
                    {siteSettings?.address || STORE_INFO.address}
                  </p>
                  <p className="text-gray-600 text-[11.5px]">Phone: {siteSettings?.phone || STORE_INFO.phone}</p>
                  <p className="font-mono text-gray-800 font-bold mt-1">
                    GSTIN: <strong className="text-blue-900">{paymentSettings?.gstin || '20AABCL1234F1Z5'}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 inline-block">
                    ORIGINAL FOR RECIPIENT
                  </span>
                  <div className="mt-2 font-mono text-xs">
                    <span className="text-gray-400 block">INVOICE NO:</span>
                    <strong className="text-gray-900">INV-LS-{invoiceOrder.orderId}</strong>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    Date: {invoiceOrder.orderDate || 'Today'}
                  </div>
                </div>
              </div>

              {/* Bill To Customer */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-200 text-xs">
                <div>
                  <span className="font-bold text-gray-400 uppercase text-[10px] block">BILLED TO (CUSTOMER)</span>
                  <strong className="font-extrabold text-sm text-gray-900 block mt-0.5">
                    {invoiceOrder.customerName || profile.firstName}
                  </strong>
                  <span className="text-gray-600 block mt-0.5">{invoiceOrder.phone || profile.phone}</span>
                  <span className="text-gray-500 block text-[11px]">{invoiceOrder.shippingAddress || 'Garhwa Showroom Counter Pickup'}</span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-gray-400 uppercase text-[10px] block">PAYMENT & SETTLEMENT</span>
                  <strong className="font-bold text-emerald-700 block mt-0.5">
                    {invoiceOrder.paymentStatus || 'Verified'}
                  </strong>
                  <span className="text-gray-600 block font-mono text-[11px]">
                    UTR: {invoiceOrder.utrNumber || 'COUNTER-CASH'}
                  </span>
                  <span className="text-gray-500 block text-[11px]">Place of Supply: Jharkhand (20)</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-200 font-extrabold text-gray-700">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Item Description</th>
                      <th className="py-2 px-2 text-center">HSN</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Taxable (₹)</th>
                      <th className="py-2 px-2 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoiceOrder.items?.map((item: any, idx: number) => {
                      const itemTotal = item.price * item.quantity;
                      const taxable = Math.round(itemTotal / 1.18);
                      return (
                        <tr key={idx} className="text-gray-800">
                          <td className="py-2 px-2 font-mono">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <span className="font-bold block">{item.name}</span>
                            <span className="text-[10px] text-gray-500">18% GST Included</span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-[11px] text-gray-500">8471</td>
                          <td className="py-2 px-2 text-center font-bold">{item.quantity}</td>
                          <td className="py-2 px-2 text-right font-mono">₹{taxable.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-2 text-right font-mono font-bold">₹{itemTotal.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals Calculation */}
              <div className="pt-3 border-t border-gray-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Taxable Value:</span>
                    <span className="font-mono">
                      ₹{Math.round((Number(invoiceOrder.totalAmount) || 0) / 1.18).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>CGST (9%):</span>
                    <span className="font-mono">
                      ₹{Math.round(((Number(invoiceOrder.totalAmount) || 0) * 0.09) / 1.18).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>SGST (9%):</span>
                    <span className="font-mono">
                      ₹{Math.round(((Number(invoiceOrder.totalAmount) || 0) * 0.09) / 1.18).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-2 border-t border-gray-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-[#1A56DB]">
                      ₹{(Number(invoiceOrder.totalAmount) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[10.5px] text-gray-400">
                <span>Computer generated tax invoice. Original brand warranty honored across India.</span>
                <span className="font-bold text-gray-600">Lapiez Garhwa</span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LIVE PACKAGE TRACKING STEPPER                     */}
      {/* ========================================================= */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">
                  Delivery Status & Tracking
                </h3>
                <span className="font-mono text-xs text-gray-500">
                  Order #{trackingOrder.orderId}
                </span>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-4 text-xs py-2">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900">Order Confirmed</h4>
                  <p className="text-gray-500 text-[11px]">Hardware components reserved from Garhwa showroom catalog</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900">Payment Verified</h4>
                  <p className="text-gray-500 text-[11px]">
                    {trackingOrder.utrNumber ? `Bank UTR: ${trackingOrder.utrNumber}` : 'Counter Pickup Verified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  trackingOrder.orderStatus === 'Shipped' || trackingOrder.orderStatus === 'Delivered'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {trackingOrder.orderStatus === 'Shipped' || trackingOrder.orderStatus === 'Delivered' ? '✓' : '3'}
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900">Dispatched from Showroom</h4>
                  <p className="text-gray-500 text-[11px]">Courier: Garhwa Local Express • Same-Day Delivery Partner</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  trackingOrder.orderStatus === 'Delivered'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {trackingOrder.orderStatus === 'Delivered' ? '✓' : '4'}
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900">Delivered</h4>
                  <p className="text-gray-500 text-[11px]">Handed directly to recipient with warranty seal</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setTrackingOrder(null)}
                className="px-4 py-2 rounded-lg bg-[#1A56DB] text-white font-bold text-xs"
              >
                Close Tracking
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quick Guest Profile Modal */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-sm text-gray-900">
                Quick Customer Sign-in
              </h3>
              <button
                type="button"
                onClick={() => setIsGuestModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsGuestModalOpen(false);
                  signInWithGoogle('/account');
                }}
                className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-2 text-[10px] uppercase font-bold text-gray-400 absolute">or manual phone</span>
              </div>
            </div>

            <form onSubmit={handleQuickSignIn} className="space-y-3.5 mt-2 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mobile / WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGuestModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold shadow-xs"
                >
                  Continue to Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
