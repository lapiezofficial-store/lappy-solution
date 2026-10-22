'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Truck, Store, Check, ArrowLeft, 
  ArrowRight, QrCode, CreditCard, Banknote, Smartphone, 
  Copy, CheckCircle2, Lock, Building, UploadCloud, AlertCircle, Tag,
  User, UserCheck, LogIn, LogOut, Clock, RotateCcw, Sparkles, ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../../context/StoreContext';
import { STORE_INFO } from '../../data/storeData';

export default function CheckoutPage() {
  const router = useRouter();
  const { 
    cart, 
    placeOrder, 
    showToast, 
    siteSettings,
    paymentSettings,
    paymentMethodsConfig,
    bankAccounts,
    invoiceSettings,
    coupons,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    customer,
    isCustomerLoading,
    signInWithGoogle,
    loginCustomerManually,
    signOutCustomer
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Fast Sign-In States (When Visitor is Not Logged In)
  const [fastSignInName, setFastSignInName] = useState('');
  const [fastSignInPhone, setFastSignInPhone] = useState('');
  const [fastSignInEmail, setFastSignInEmail] = useState('');
  const [fastSignInError, setFastSignInError] = useState('');

  // Customer & Shipping State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Garhwa');
  const [pincode, setPincode] = useState('822114');
  const [orderNotes, setOrderNotes] = useState('');

  // GST Invoice & Purchase Order
  const [needGst, setNeedGst] = useState(false);
  const [gstin, setGstin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [poNumber, setPoNumber] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'upi_qr' | 'cod' | 'netbanking' | 'store_pickup'>('upi_qr');
  const [pickupPaymentMode, setPickupPaymentMode] = useState<'cash' | 'online'>('cash');
  const [pickupHandedBy, setPickupHandedBy] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempOrderId, setTempOrderId] = useState('');
  const [inputCouponCode, setInputCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  // Fallback if current payment method is disabled by admin in CMS
  useEffect(() => {
    const isUpiActive = paymentMethodsConfig?.enableUPI !== false;
    const isBankActive = paymentMethodsConfig?.enableBankTransfer !== false;
    const isPickupActive = paymentMethodsConfig?.enableStorePickup !== false;
    const isCodActive = paymentMethodsConfig?.enableCOD !== false && paymentSettings?.codEnabled !== false;

    if (paymentMethod === 'upi_qr' && !isUpiActive) {
      if (isCodActive) setPaymentMethod('cod');
      else if (isBankActive) setPaymentMethod('netbanking');
      else if (isPickupActive) setPaymentMethod('store_pickup');
    } else if (paymentMethod === 'cod' && !isCodActive) {
      if (isUpiActive) setPaymentMethod('upi_qr');
      else if (isBankActive) setPaymentMethod('netbanking');
      else if (isPickupActive) setPaymentMethod('store_pickup');
    } else if (paymentMethod === 'netbanking' && !isBankActive) {
      if (isUpiActive) setPaymentMethod('upi_qr');
      else if (isCodActive) setPaymentMethod('cod');
      else if (isPickupActive) setPaymentMethod('store_pickup');
    } else if (paymentMethod === 'store_pickup' && !isPickupActive) {
      if (isUpiActive) setPaymentMethod('upi_qr');
      else if (isCodActive) setPaymentMethod('cod');
      else if (isBankActive) setPaymentMethod('netbanking');
    }
  }, [paymentMethodsConfig, paymentSettings, paymentMethod]);

  // 5-minute (300s) Dynamic Transaction Countdown Timer State
  const [paymentTimerSeconds, setPaymentTimerSeconds] = useState(300);
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  // Generate unique order ID on mount
  useEffect(() => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    setTempOrderId(`LPZ-${randomDigits}`);
  }, []);

  // 5-minute (300s) Countdown Timer Effect for UPI QR Payment
  useEffect(() => {
    if (step !== 3 || paymentMethod !== 'upi_qr') return;
    
    if (paymentTimerSeconds <= 0) {
      setIsTimerExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setPaymentTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, paymentMethod, paymentTimerSeconds]);

  const handleRegenerateUpiSession = () => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    setTempOrderId(`LPZ-${randomDigits}`);
    setPaymentTimerSeconds(300);
    setIsTimerExpired(false);
    setUtrNumber('');
    showToast('UPI payment session refreshed! 5-minute timer restarted.');
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const finalTotal = Math.max(0, subtotal - (couponDiscount || 0));

  // Official Merchant UPI URI from CMS Database
  const upiId = paymentSettings.upiId || 'lappy.solution@ybl';
  const upiName = paymentSettings.upiName || 'LAPIEZ GARHWA';
  const upiPaymentUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${finalTotal}&cu=INR&tn=Order%20${tempOrderId}`;
  const gpayUri = `tez://upi/pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${finalTotal}&cu=INR&tn=Order%20${tempOrderId}`;
  const phonepeUri = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${finalTotal}&cu=INR&tn=Order%20${tempOrderId}`;
  const paytmUri = `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${finalTotal}&cu=INR&tn=Order%20${tempOrderId}`;

  const handleOpenPaymentApp = (customUri?: string) => {
    const target = customUri || upiPaymentUri;
    try {
      window.location.href = target;
    } catch {
      window.open(target, '_top');
    }
  };

  const handleApplyCouponCode = (e?: React.FormEvent, codeToApply?: string) => {
    if (e) e.preventDefault();
    const code = (codeToApply || inputCouponCode).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponError('');
    const res = applyCoupon(code, subtotal);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setInputCouponCode('');
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    showToast('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Pre-fill shipping form when customer is logged in
  useEffect(() => {
    if (customer) {
      const fullName = (customer.user_metadata?.full_name || customer.user_metadata?.name || '').trim();
      if (fullName && !customerName) {
        setCustomerName(fullName);
      }
      if (customer.email && !email && !customer.email.includes('@customer.lapiez.com') && !customer.email.includes('@guest.')) {
        setEmail(customer.email);
      }
      const custPhone = customer.phone || customer.user_metadata?.phone;
      if (custPhone && !phone) {
        setPhone(custPhone);
      }
    }
  }, [customer]);

  // Google GSI removed for direct frictionless checkout

  const handleFastCustomerSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setFastSignInError('');
    if (!fastSignInName.trim() || !fastSignInPhone.trim()) {
      setFastSignInError('Please enter your full name and 10-digit mobile number');
      return;
    }
    const cleanPhone = fastSignInPhone.trim().replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFastSignInError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8 or 9)');
      return;
    }
    const emailToUse = fastSignInEmail.trim() || `${cleanPhone}@customer.lapiez.com`;
    loginCustomerManually({
      id: `usr-${Date.now()}`,
      name: fastSignInName.trim(),
      email: emailToUse,
    });
    setCustomerName(fastSignInName.trim());
    setPhone(cleanPhone);
    if (fastSignInEmail.trim()) setEmail(fastSignInEmail.trim());
    showToast(`Signed in as ${fastSignInName.trim()}! Please complete delivery details.`);
  };

  const handleValidateStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    // Direct frictionless checkout without login requirement
    if (!customerName.trim() || !phone.trim()) {
      showToast('Please enter your full name and phone number');
      return;
    }
    if (deliveryType === 'delivery' && (!streetAddress.trim() || !pincode.trim())) {
      showToast('Please enter your delivery street address and pincode');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToPayment = () => {
    // Direct proceed to payment
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalOrderSubmit = async () => {
    // Direct order placement without login restriction
    if (paymentMethod === 'upi_qr') {
      if (isTimerExpired) {
        showToast('UPI payment session timed out. Please tap "Regenerate QR & Restart Timer" to proceed.');
        return;
      }
      if (!utrNumber.trim()) {
        showToast('Please enter the 12-digit UPI UTR / Transaction Reference number after scanning the QR code');
        return;
      }
    }

    if (paymentMethod === 'store_pickup' && pickupPaymentMode === 'online') {
      if (!utrNumber.trim()) {
        showToast('Please enter the UPI UTR / Transaction Reference number for Online Pickup payment');
        return;
      }
    }

    setIsSubmitting(true);

    const showroomAddr = siteSettings?.address || `${STORE_INFO.address}, ${STORE_INFO.city}, ${STORE_INFO.state} - ${STORE_INFO.pincode}`;
    const isPickup = deliveryType === 'pickup' || paymentMethod === 'store_pickup';
    const pickupStaffText = pickupHandedBy.trim() ? ` • Handed Over By: ${pickupHandedBy.trim()}` : '';
    const fullAddress = isPickup
      ? `Showroom Counter Pickup (${showroomAddr})${pickupStaffText}`
      : `${streetAddress}${landmark ? `, Near ${landmark}` : ''}, ${city}, Jharkhand - ${pincode}`;

    const newOrder = {
      orderId: tempOrderId,
      customerId: customer?.id || `cust-${Date.now()}`,
      customerName,
      phone,
      email: email || customer?.email || 'customer@lapiez.com',
      address: fullAddress,
      deliveryType: isPickup ? 'pickup' : 'delivery',
      pickupHandedBy: pickupHandedBy.trim() || null,
      items: cart.map(item => ({
        id: item.product.id,
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        category: item.product.category,
        sku: item.product.sku || item.product.id
      })),
      totalAmount: finalTotal,
      subtotalAmount: subtotal,
      couponCode: appliedCoupon?.code || null,
      couponDiscount: couponDiscount || 0,
      paymentMethod: 
        paymentMethod === 'upi_qr' 
          ? 'UPI Dynamic QR (GPay/PhonePe)' 
          : paymentMethod === 'cod' 
          ? 'Cash on Delivery (COD)' 
          : paymentMethod === 'store_pickup'
          ? (pickupPaymentMode === 'online' ? 'Store Pickup (Online UPI QR)' : 'Store Pickup (Cash at Counter)')
          : `NetBanking / Bank Transfer (${selectedBank})`,
      paymentStatus: (paymentMethod === 'upi_qr' || (paymentMethod === 'store_pickup' && pickupPaymentMode === 'online') || paymentMethod === 'netbanking' || Boolean(utrNumber)) ? 'Paid' : 'Pending',
      utrNumber: utrNumber || null,
      orderDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      gstin: needGst ? gstin : null,
      businessName: needGst ? businessName : null,
      poNumber: poNumber.trim() || null,
      notes: appliedCoupon 
        ? `${orderNotes ? orderNotes + ' | ' : ''}Coupon Applied: ${appliedCoupon.code} (₹${couponDiscount} OFF)`
        : orderNotes || null,
      trackingSteps: [
        { step: 'Order Placed', time: 'Just now', done: true },
        { step: 'Showroom Verification', time: 'Next 15 mins', done: true },
        { step: 'Hardware Testing & Pack', time: 'Pending', done: false },
        { step: 'Out for Delivery / Ready', time: 'Same-day', done: false },
        { step: 'Delivered / Handed Over', time: 'Today', done: false }
      ]
    };

    try {
      await placeOrder(newOrder);
      router.push(`/order-success/${tempOrderId}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to place the order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#F1F3F6]">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A56DB] mb-4">
          <Truck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Checkout is Empty</h1>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          You don't have any items in your checkout session. Select products from our catalog to begin checkout.
        </p>
        <Link
          href="/shop"
          className="h-11 px-6 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-semibold text-sm flex items-center gap-2 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F1F3F6] py-6 sm:py-10 pb-28 sm:pb-16 min-h-[85vh]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Header Breadcrumbs & Security Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Official Garhwa 256-Bit Encrypted Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Express Checkout
            </h1>
          </div>

          <Link
            href="/cart"
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cart</span>
          </Link>
        </div>

        {/* Modern 3-Step Checkout Stepper */}
        <div className="flex items-center justify-between max-w-lg mx-auto mb-8 pb-2 px-2">
          {([
            { num: 1 as const, label: 'Delivery Details' },
            { num: 2 as const, label: 'Order Review' },
            { num: 3 as const, label: 'Payment & Confirm' }
          ] as const).map((s, idx, arr) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center text-center cursor-pointer" onClick={() => { if (step > s.num) setStep(s.num); }}>
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mb-1.5 transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md'
                        : isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-bold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 sm:mx-4 mb-4 transition-colors ${step > s.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Main 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form & Payment Systems (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
                          <>

                {/* Verified Customer Status Bar */}
                {customer ? (
                <div className="rounded-2xl bg-white border border-emerald-200 p-4 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      {(customer.user_metadata?.full_name || customer.user_metadata?.name || customer.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {customer.user_metadata?.full_name || customer.user_metadata?.name || 'Verified Customer'}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Signed In
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {customer.email && !customer.email.includes('@customer.lapiez.com') ? customer.email : phone ? `Mobile: ${phone}` : 'Active Account'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOutCustomer()}
                    className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer transition-colors"
                  >
                    Switch Account
                  </button>
                </div>
                ) : (
                  <div className="rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 border border-blue-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Have a Lapiez Account? Sign in with Google</span>
                      </span>
                      <p className="text-[11px] text-slate-600">
                        Fast-track checkout: auto-fill delivery details and track your order live.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => signInWithGoogle('/checkout')}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 active:scale-[0.99]"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>
                )}

                {/* STEP 1: Customer & Delivery Address Form */}
                {step === 1 && (
                  <form onSubmit={handleValidateStep1} className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                
                {/* Contact Information */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
                    <span>Customer Contact Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Mobile / WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Email Address (for Digital GST Bill)</label>
                      <input
                        type="email"
                        placeholder="e.g. rajesh@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Preference */}
                <div className="pt-2">
                  <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">2</span>
                    <span>Choose Delivery Method</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-4 rounded-2xl text-left border-2 transition-all flex items-start gap-3 ${
                        deliveryType === 'delivery'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <Truck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${deliveryType === 'delivery' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <strong className="block text-xs font-bold text-slate-900">Same-Day Local Delivery</strong>
                        <span className="text-[11px] text-slate-500">Free door-to-door delivery in Garhwa & nearby villages.</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-4 rounded-2xl text-left border-2 transition-all flex items-start gap-3 ${
                        deliveryType === 'pickup'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <Store className={`w-5 h-5 flex-shrink-0 mt-0.5 ${deliveryType === 'pickup' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <strong className="block text-xs font-bold text-slate-900">Showroom Pickup (30 Mins)</strong>
                        <span className="text-[11px] text-slate-500">Opposite G P Plaza, Chiniya Road. Test before taking home.</span>
                      </div>
                    </button>
                  </div>

                  {/* Physical Address Fields if Delivery */}
                  {deliveryType === 'delivery' ? (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Street Address / Mohalla / Village *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Near Bus Stand, Main Market, Ward No. 4"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Landmark</label>
                          <input
                            type="text"
                            placeholder="e.g. Near Shiv Mandir"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">City</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Pincode *</label>
                          <input
                            type="text"
                            required
                            placeholder="822114"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <strong className="block font-bold">Showroom Address for Counter Collection:</strong>
                      <p>Lapiez, In front of G P Plaza, Chiniya Road, Garhwa, Jharkhand - 822114</p>
                      <p className="text-[11px] text-amber-800 pt-1">
                        Timings: Monday to Saturday (10:00 AM - 8:30 PM). Your items will be packaged and ready with test certificates.
                      </p>
                    </div>
                  )}
                </div>

                {/* Optional GST Invoicing Box */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needGst}
                      onChange={(e) => setNeedGst(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      I require an official Business GST Tax Invoice (for ITC input credit)
                    </span>
                  </label>

                  {needGst && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Company / Firm Name *</label>
                        <input
                          type="text"
                          required={needGst}
                          placeholder="e.g. Maa Tara Enterprises"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">15-Digit GSTIN Number *</label>
                        <input
                          type="text"
                          required={needGst}
                          placeholder="20AAAAA0000A1Z5"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value.toUpperCase())}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono uppercase"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1 pt-1">
                        <label className="text-xs font-semibold text-slate-700">Corporate Purchase Order (P.O.) Number (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. PO-GARHWA-2026-042"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Order Notes (Optional instructions)</label>
                  <input
                    type="text"
                    placeholder="e.g. Call before coming, please install Windows 11 updates"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                {/* Next Step Button */}
                <button
                  type="submit"
                  className="w-full h-13 min-h-[50px] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25 shrink-0 active:scale-[0.98] cursor-pointer"
                >
                  <span>Continue to Order Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>
            )}

            {/* STEP 2: Order Review & Confirmation */}
            {step === 2 && (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Review Your Order & Delivery Details
                  </h3>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Edit Details
                  </button>
                </div>

                {/* Customer Details Snapshot */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Customer:</span>
                    <strong className="text-slate-900">{customerName} ({phone})</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Email:</span>
                    <strong className="text-slate-900">{email || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Mode:</span>
                    <strong className="text-blue-700 uppercase">
                      {deliveryType === 'delivery' ? 'Home Delivery in Garhwa' : 'Showroom Pickup (Chiniya Road)'}
                    </strong>
                  </div>
                  {deliveryType === 'delivery' && (
                    <div className="flex justify-between text-slate-600">
                      <span>Address:</span>
                      <strong className="text-slate-900 text-right max-w-xs">
                        {streetAddress}, {city} - {pincode}
                      </strong>
                    </div>
                  )}
                  {needGst && (
                    <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                      <span>GST Invoicing:</span>
                      <strong className="text-slate-900">{businessName} ({gstin})</strong>
                    </div>
                  )}
                </div>

                {/* Items in Order */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Items in This Package ({cart.length})
                  </h4>
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                    {cart.map((item) => (
                      <div key={item.product.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-contain rounded-lg border border-slate-100 p-1 flex-shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-slate-900 block truncate">{item.product.name}</span>
                            <span className="text-slate-500 font-mono text-[11px]">Qty: {item.quantity} × ₹{item.product.price.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <span className="font-black text-slate-900 font-mono">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto h-12 min-h-[48px] px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  >
                    Back to Address
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="w-full sm:flex-1 h-13 min-h-[50px] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25 shrink-0 active:scale-[0.98] cursor-pointer"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: Integrated Payment Systems (Dynamic QR Code + UPI + COD) */}
            {step === 3 && (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                
                <div>
                  <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">3</span>
                    <span>Select Payment Option</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose dynamic UPI QR code scanning, Cash on Delivery, or NetBanking.
                  </p>
                </div>

                {/* Dynamic Payment Method Selection Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Option 1: UPI Dynamic QR */}
                  {paymentMethodsConfig?.enableUPI !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi_qr')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        paymentMethod === 'upi_qr'
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <QrCode className="w-6 h-6 text-blue-600" />
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Fastest</span>
                      </div>
                      <strong className="block text-xs font-bold text-slate-900">UPI Dynamic QR</strong>
                      <span className="text-[10px] text-slate-500">PhonePe, GPay, Paytm</span>
                    </button>
                  )}

                  {/* Option 2: Bank Transfer / IMPS */}
                  {paymentMethodsConfig?.enableBankTransfer !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        paymentMethod === 'netbanking'
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Building className="w-6 h-6 text-slate-700" />
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">NEFT/IMPS</span>
                      </div>
                      <strong className="block text-xs font-bold text-slate-900">Bank Transfer</strong>
                      <span className="text-[10px] text-slate-500">Union Bank of India</span>
                    </button>
                  )}

                  {/* Option 3: Pickup from Store */}
                  {paymentMethodsConfig?.enableStorePickup !== false && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('store_pickup');
                        setDeliveryType('pickup');
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        paymentMethod === 'store_pickup'
                          ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Store className="w-6 h-6 text-purple-600" />
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Garhwa Counter</span>
                      </div>
                      <strong className="block text-xs font-bold text-slate-900">Pickup from Store</strong>
                      <span className="text-[10px] text-slate-500">Inspect & Pay at Showroom</span>
                    </button>
                  )}

                  {/* Option 4: Cash on Delivery (COD) */}
                  {paymentMethodsConfig?.enableCOD !== false && paymentSettings?.codEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Banknote className="w-6 h-6 text-amber-700" />
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Doorstep</span>
                      </div>
                      <strong className="block text-xs font-bold text-slate-900">Cash on Delivery (COD)</strong>
                      <span className="text-[10px] text-slate-500">Pay when receiving item</span>
                    </button>
                  )}
                </div>

                {/* PAYMENT METHOD A: DYNAMIC UPI QR CODE SYSTEM WITH 5-MINUTE TRANSACTION TIMER */}
                {paymentMethod === 'upi_qr' && (
                  <div className="rounded-2xl border-2 border-blue-500 bg-gradient-to-b from-blue-50/30 to-white p-6 space-y-6">
                    
                    <div className="text-center space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full inline-block">
                        Instant UPI Payment Gateway
                      </span>
                      <h4 className="text-lg font-black text-slate-900">
                        Scan to Pay ₹{finalTotal.toLocaleString('en-IN')}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Use PhonePe, Google Pay, Paytm, BHIM, or any banking UPI app.
                      </p>
                    </div>

                    {/* Sleek Dynamic 5-Minute UPI Security Countdown Bar */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isTimerExpired
                        ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs'
                        : paymentTimerSeconds <= 60
                        ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
                        : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs'
                    }`}>
                      {/* Top Header Row: Status on left, Clock countdown on right */}
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`relative flex h-2.5 w-2.5 ${isTimerExpired ? 'hidden' : ''}`}>
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              paymentTimerSeconds <= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                              paymentTimerSeconds <= 60 ? 'bg-amber-600' : 'bg-emerald-600'
                            }`}></span>
                          </span>
                          <span className="text-xs font-black tracking-tight">
                            {isTimerExpired ? 'Payment Session Expired' : 'UPI Security Window'}
                          </span>
                        </div>

                        {/* Digital Timer Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-black text-xs sm:text-sm tracking-wider shadow-inner ${
                          isTimerExpired
                            ? 'bg-rose-950 text-rose-300'
                            : paymentTimerSeconds <= 60
                            ? 'bg-amber-950 text-amber-300 animate-pulse'
                            : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTimer(paymentTimerSeconds)}</span>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                            isTimerExpired
                              ? 'w-0'
                              : paymentTimerSeconds <= 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{
                            width: `${Math.max(0, Math.min(100, (paymentTimerSeconds / 300) * 100))}%`
                          }}
                        />
                      </div>

                      <p className="text-[11px] opacity-85 leading-relaxed">
                        {isTimerExpired
                          ? 'This 5-minute payment window has expired for security. Please tap Regenerate QR below to restart.'
                          : 'Scan QR with any UPI app and enter the 12-digit UTR reference below before session closes.'}
                      </p>
                    </div>

                    {/* ========================================================================= */}
                    {/* OPTION 1: PAY DIRECTLY ON THIS PHONE (NO 2ND PHONE NEEDED)                */}
                    {/* ========================================================================= */}
                    <div className="rounded-2xl bg-gradient-to-b from-blue-50/80 to-indigo-50/40 border-2 border-blue-400/80 p-4 sm:p-5 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                              <span>Pay on This Phone</span>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                No 2nd Phone Needed
                              </span>
                            </h5>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11.5px] text-slate-700 leading-relaxed font-medium">
                        Agar aap isi mobile se payment kar rahe hain, to niche diye gaye button par tap karein. Aapka payment app seedhe khul jayega:
                      </p>

                      {/* Main Primary Button: Open Any Installed UPI App */}
                      <a
                        href={upiPaymentUri}
                        target="_top"
                        className="w-full h-13 min-h-[50px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-blue-600/30 active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        <Smartphone className="w-5 h-5 shrink-0" />
                        <span>Open Payment App (Pay ₹{finalTotal.toLocaleString('en-IN')})</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </a>

                      {/* Specific UPI Apps Grid */}
                      <div className="pt-1 space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-center">
                          Or Tap Your Preferred UPI App Directly:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {/* Google Pay */}
                          <a
                            href={gpayUri}
                            target="_top"
                            className="h-10 px-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-500 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 transition-all shadow-2xs active:scale-95"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                            <span>Google Pay</span>
                          </a>

                          {/* PhonePe */}
                          <a
                            href={phonepeUri}
                            target="_top"
                            className="h-10 px-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 hover:border-purple-500 flex items-center justify-center gap-1.5 text-xs font-bold text-purple-900 transition-all shadow-2xs active:scale-95"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                            <span>PhonePe</span>
                          </a>

                          {/* Paytm */}
                          <a
                            href={paytmUri}
                            target="_top"
                            className="h-10 px-2 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 hover:border-sky-500 flex items-center justify-center gap-1.5 text-xs font-bold text-sky-900 transition-all shadow-2xs active:scale-95"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-[#00BAF2] shrink-0" />
                            <span>Paytm</span>
                          </a>

                          {/* Any BHIM / UPI */}
                          <a
                            href={upiPaymentUri}
                            target="_top"
                            className="h-10 px-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-500 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900 transition-all shadow-2xs active:scale-95"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                            <span>BHIM / UPI</span>
                          </a>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-blue-100/70 border border-blue-200 text-[11px] text-blue-900 font-medium flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                        <span>Payment complete karne ke baad, wapas is screen par aakar niche 12-digit UTR / Reference No. daal kar <strong>Place Order</strong> dabayein.</span>
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* OPTION 2: SCAN QR CODE WITH ANOTHER PHONE / TABLET / DESKTOP              */}
                    {/* ========================================================================= */}
                    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-slate-700" />
                          <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                            Or Scan QR Code (With Another Phone / Tablet)
                          </h5>
                        </div>
                        <span className="text-[10.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Dynamic QR
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Agar aap computer screen par hain ya kisi dusre mobile se scan karna chahte hain, to is QR code ko scan karein:
                      </p>

                      {/* Dynamic QR Code Card or Expired State */}
                      <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-xs mx-auto text-center relative overflow-hidden">
                        {isTimerExpired ? (
                          <div className="py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                              <AlertCircle className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-sm font-black text-slate-900">QR Code Expired</h5>
                              <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
                                The 5-minute payment window has ended to prevent duplicate or stalled transactions.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRegenerateUpiSession}
                              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Regenerate QR & Restart Timer (5:00)</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Merchant Logo Badge */}
                            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-slate-900">
                              <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px]">LS</div>
                              <span>LAPIEZ GARHWA</span>
                            </div>

                            {/* Live Generated QR Code */}
                            <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-xs">
                              <QRCodeSVG
                                value={upiPaymentUri}
                                size={180}
                                level="H"
                                includeMargin={false}
                              />
                            </div>

                            <div className="mt-2.5 text-center space-y-0.5">
                              <span className="text-xs font-black text-slate-900 block font-mono">
                                Payable: ₹{finalTotal.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Order Ref: {tempOrderId}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Copy UPI ID Box */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs max-w-md mx-auto">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Official Showroom UPI ID</span>
                        <strong className="text-slate-900 font-mono text-sm">{upiId}</strong>
                      </div>
                      <button
                        onClick={handleCopyUpi}
                        className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy ID'}</span>
                      </button>
                    </div>

                    {/* Verification Step: Enter UTR / Transaction Ref */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Step 2: Enter 12-Digit UPI Transaction ID / UTR Number *</span>
                        </div>
                        {isTimerExpired && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Session Expired
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        After completing payment in your UPI app, enter the 12-digit UTR / UPI Reference Number shown on your transaction screen:
                      </p>
                      <input
                        type="text"
                        required
                        disabled={isTimerExpired}
                        placeholder="e.g. 428172918273"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.trim())}
                        className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-mono tracking-wider focus:outline-none ${
                          isTimerExpired 
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'
                        }`}
                      />
                    </div>

                  </div>
                )}

                {/* PAYMENT METHOD B: CASH ON DELIVERY (COD) */}
                {paymentMethod === 'cod' && (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <span>Zero Advance Required • Pay When Product Reaches You</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      You can pay ₹{finalTotal.toLocaleString('en-IN')} by Cash, UPI QR on delivery agent's scanner, or card swipe when your order is delivered to your doorstep in Garhwa.
                    </p>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold pt-1">
                      <Check className="w-4 h-4" />
                      <span>Free unboxing & hardware test guaranteed before payment.</span>
                    </div>
                  </div>
                )}

                {/* PAYMENT METHOD C: NETBANKING / DIRECT IMPS */}
                {paymentMethod === 'netbanking' && (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 block">Select Your Bank</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-medium"
                      >
                        <option>State Bank of India (SBI)</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Bank of India (Garhwa Main Branch)</option>
                        <option>Punjab National Bank</option>
                        <option>Axis Bank</option>
                      </select>
                    </div>

                    {(() => {
                      const activeBank = bankAccounts?.find((b: any) => b.isPrimary) || bankAccounts?.[0] || {
                        accountHolderName: invoiceSettings?.accountHolderName || 'lappy solutions',
                        bankName: invoiceSettings?.bankName || 'Union Bank of India',
                        branch: invoiceSettings?.branch || 'GARHWA',
                        accountNumber: invoiceSettings?.accountNumber || '638301010050261',
                        ifscCode: invoiceSettings?.ifscCode || 'UBIN0563838',
                        accountType: 'Current'
                      };
                      return (
                        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-[11px] text-slate-600">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                            <strong className="text-slate-900 text-xs">Official Bank Account Details (IMPS / RTGS / NEFT):</strong>
                            <button
                              type="button"
                              onClick={() => {
                                const details = `BANK DETAILS\nName: ${activeBank.accountHolderName}\nBank: ${activeBank.bankName}${activeBank.branch ? `, ${activeBank.branch}` : ''}\nAccount No: ${activeBank.accountNumber}\nIFSC Code: ${activeBank.ifscCode}`;
                                navigator.clipboard?.writeText(details);
                                alert('Bank details copied to clipboard!');
                              }}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Copy Details
                            </button>
                          </div>
                          <p>Account Name: <strong className="text-slate-900 font-semibold">{activeBank.accountHolderName}</strong></p>
                          <p>Bank: <strong className="text-slate-900 font-semibold">{activeBank.bankName}{activeBank.branch ? `, ${activeBank.branch}` : ''}</strong></p>
                          <p>Account No: <strong className="text-slate-900 font-mono font-bold tracking-wider">{activeBank.accountNumber}</strong></p>
                          <p>IFSC Code: <strong className="text-slate-900 font-mono font-bold">{activeBank.ifscCode}</strong></p>
                          {activeBank.accountType && <p>Account Type: <strong className="text-slate-900 font-semibold">{activeBank.accountType} Account</strong></p>}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* PAYMENT METHOD D: PICKUP FROM STORE (COUNTER CASH OR ONLINE UPI) */}
                {paymentMethod === 'store_pickup' && (
                  <div className="p-6 rounded-2xl bg-purple-50/40 border-2 border-purple-300 space-y-5 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-purple-200">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-purple-700" />
                        <div>
                          <strong className="text-sm font-black text-slate-900 block">
                            Pickup from Showroom (Chiniya Road, Garhwa)
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Direct counter collection with live hardware testing &amp; instant 18% GST bill.
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-purple-100 text-purple-900 rounded-full flex-shrink-0">
                        Ready for Handover
                      </span>
                    </div>

                    {/* Choose Payment Mode: Cash vs Online */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                        Choose Counter Payment Mode (भुगतान का प्रकार चुनें)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPickupPaymentMode('cash')}
                          className={`p-3.5 rounded-xl border-2 text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            pickupPaymentMode === 'cash'
                              ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-200'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <Banknote className={`w-5 h-5 flex-shrink-0 mt-0.5 ${pickupPaymentMode === 'cash' ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <div>
                            <strong className="block text-xs font-extrabold text-slate-900">Cash at Counter</strong>
                            <span className="text-[10.5px] text-slate-500">Pay cash upon item inspection</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPickupPaymentMode('online')}
                          className={`p-3.5 rounded-xl border-2 text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            pickupPaymentMode === 'online'
                              ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-200'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <QrCode className={`w-5 h-5 flex-shrink-0 mt-0.5 ${pickupPaymentMode === 'online' ? 'text-blue-700' : 'text-slate-400'}`} />
                          <div>
                            <strong className="block text-xs font-extrabold text-slate-900">Online UPI QR</strong>
                            <span className="text-[10.5px] text-slate-500">GPay, PhonePe, Paytm, BHIM</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* If Online is selected: Show Direct App Launch + QR Code & UTR input */}
                    {pickupPaymentMode === 'online' && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-blue-200 space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                          <span className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4 text-blue-600" />
                            <span>Showroom Online UPI Payment</span>
                          </span>
                          <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Zero Convenience Fee</span>
                        </div>

                        {/* Pay directly on phone button for pickup */}
                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
                          <span className="text-[11px] font-extrabold text-slate-800 block">
                            📱 Option 1: Pay Directly On This Phone:
                          </span>
                          <a
                            href={`upi://pay?pa=${paymentSettings?.upiId || 'lappy.solution@ybl'}&pn=${encodeURIComponent(paymentSettings?.upiName || 'LAPIEZ GARHWA')}&am=${finalTotal}&cu=INR&tn=Pickup%20Order%20${tempOrderId}`}
                            target="_top"
                            className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer text-center"
                          >
                            <Smartphone className="w-4 h-4" />
                            <span>Open Payment App (Pay ₹{finalTotal.toLocaleString('en-IN')})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>

                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <a
                              href={`tez://upi/pay?pa=${paymentSettings?.upiId || 'lappy.solution@ybl'}&pn=${encodeURIComponent(paymentSettings?.upiName || 'LAPIEZ GARHWA')}&am=${finalTotal}&cu=INR&tn=Pickup%20Order%20${tempOrderId}`}
                              target="_top"
                              className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-center text-[10.5px] font-bold text-slate-800 active:scale-95"
                            >
                              Google Pay
                            </a>
                            <a
                              href={`phonepe://pay?pa=${paymentSettings?.upiId || 'lappy.solution@ybl'}&pn=${encodeURIComponent(paymentSettings?.upiName || 'LAPIEZ GARHWA')}&am=${finalTotal}&cu=INR&tn=Pickup%20Order%20${tempOrderId}`}
                              target="_top"
                              className="py-1.5 px-2 rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-center text-[10.5px] font-bold text-purple-900 active:scale-95"
                            >
                              PhonePe
                            </a>
                            <a
                              href={`paytmmp://pay?pa=${paymentSettings?.upiId || 'lappy.solution@ybl'}&pn=${encodeURIComponent(paymentSettings?.upiName || 'LAPIEZ GARHWA')}&am=${finalTotal}&cu=INR&tn=Pickup%20Order%20${tempOrderId}`}
                              target="_top"
                              className="py-1.5 px-2 rounded-lg bg-white border border-sky-200 hover:border-sky-400 text-center text-[10.5px] font-bold text-sky-900 active:scale-95"
                            >
                              Paytm
                            </a>
                          </div>
                        </div>

                        {/* Or Scan QR Code */}
                        <div>
                          <span className="text-[11px] font-extrabold text-slate-700 block mb-2">
                            📷 Option 2: Or Scan QR Code at Counter:
                          </span>
                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-xs flex-shrink-0">
                              <QRCodeSVG
                                value={`upi://pay?pa=${paymentSettings?.upiId || 'lappy.solution@ybl'}&pn=${encodeURIComponent(paymentSettings?.upiName || 'LAPIEZ GARHWA')}&am=${finalTotal}&cu=INR&tn=Pickup%20Order%20${tempOrderId}`}
                                size={120}
                                level="H"
                              />
                            </div>

                            <div className="space-y-2.5 flex-1 w-full text-xs">
                              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] text-gray-500 block">UPI ID</span>
                                  <span className="font-mono font-bold text-gray-900">{paymentSettings?.upiId || 'lappy.solution@ybl'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(paymentSettings?.upiId || 'lappy.solution@ybl');
                                    setCopiedUpi(true);
                                    setTimeout(() => setCopiedUpi(false), 2000);
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  {copiedUpi ? 'Copied!' : 'Copy'}
                                </button>
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-800 block mb-1">
                                  Enter UPI Transaction Reference (UTR Number) *
                                </label>
                                <input
                                  type="text"
                                  placeholder="12-digit UTR from GPay / PhonePe / Paytm"
                                  value={utrNumber}
                                  onChange={(e) => setUtrNumber(e.target.value.trim())}
                                  className="w-full bg-[#F8FAFC] border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Handed Over By / Staff Name Input Field */}
                    <div className="p-4 rounded-xl bg-white border border-purple-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-purple-700 flex-shrink-0" />
                        <label htmlFor="pickup-handed-by" className="text-xs font-extrabold text-slate-900">
                          Handed Over By / Staff Name (सामान देने वाले स्टाफ / काउंटर व्यक्ति का नाम)
                        </label>
                      </div>
                      <input
                        id="pickup-handed-by"
                        type="text"
                        value={pickupHandedBy}
                        onChange={(e) => setPickupHandedBy(e.target.value)}
                        placeholder="e.g. Sonu Kumar (Staff) or Showroom Counter Representative"
                        className="w-full bg-[#F8FAFC] border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:bg-white focus:border-purple-600 focus:outline-none"
                      />
                      <p className="text-[10.5px] text-slate-500">
                        Staff / counter person who delivered the item and confirmed payment will be displayed on the order invoice &amp; admin record.
                      </p>
                    </div>

                    {/* Showroom Details */}
                    <div className="p-3.5 rounded-xl bg-white/80 border border-purple-100 space-y-1.5 text-slate-700 text-[11.5px]">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-900 min-w-[110px]">Showroom Address:</span>
                        <span>{siteSettings?.address || `${STORE_INFO.address}, ${STORE_INFO.city}, ${STORE_INFO.state} - ${STORE_INFO.pincode}`}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-900 min-w-[110px]">Store Timings:</span>
                        <span>{siteSettings?.timings || STORE_INFO.timings}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <Check className="w-4 h-4" />
                        <span>Pre-flight hardware diagnostic &amp; 18% GST bill ready upon arrival</span>
                      </div>
                      <a
                        href={siteSettings?.googleMapsUrl || siteSettings?.twitterUrl || STORE_INFO.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-purple-700 hover:text-purple-900 underline inline-flex items-center gap-1"
                      >
                        <span>Open Showroom in Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Final Order Confirmation CTA */}
                <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto h-12 min-h-[48px] px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  >
                    ← Back to Review
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleFinalOrderSubmit}
                    className="w-full sm:flex-1 h-13 sm:h-14 min-h-[52px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 shrink-0 active:scale-[0.98] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Verifying & Placing Order...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                        <span>Place Order #{tempOrderId} (₹{finalTotal.toLocaleString('en-IN')})</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}
          </>

          </div>

          {/* Right Column: Order Bill Summary (5 Cols Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
              
              <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-blue-900 font-semibold flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>100% Genuine Hardware • Official Garhwa GST Bill</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900">
                  Order Summary
                </h3>
                <span className="text-xs font-mono text-blue-600 font-bold">
                  {tempOrderId}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.product.image} alt={item.product.name} className="w-10 h-10 object-contain rounded-lg border border-slate-100 p-1 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate">{item.product.name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 font-mono flex-shrink-0">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Have a Coupon Code?</span>
                  </span>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[11px] text-red-600 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div className="space-y-1.5">
                    <form onSubmit={(e) => handleApplyCouponCode(e)} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Promo / Coupon Code"
                        value={inputCouponCode}
                        onChange={(e) => setInputCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-mono uppercase focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>

                    {couponError && (
                      <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-mono font-bold text-emerald-900">{appliedCoupon.code}</span>
                        <span className="text-[10px] text-emerald-700 block">{appliedCoupon.title} Applied</span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-700">
                      -₹{couponDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Cost Calculations */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900 font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping & Handling</span>
                  <span className="text-emerald-700 font-bold">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Invoice (18%)</span>
                  <span className="text-slate-900 font-medium">Included</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Grand Total</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Security Badges */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>100% Genuine Boxed Goods with Warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Verified Garhwa Flagship Store Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Express Dispatch from Chiniya Road Lab</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
