'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Trash2, ShoppingBag, ArrowRight, ShieldCheck, 
  Truck, ArrowLeft, Tag, Check, Store, Lock,
  MapPin, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PRODUCTS } from '../../data/products';

export default function CartPage() {
  const router = useRouter();
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    coupons, 
    appliedCoupon, 
    couponDiscount, 
    applyCoupon, 
    removeCoupon,
    customer,
    customerLocation,
    setIsLocationModalOpen,
    deliveryFee
  } = useStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalMrp = cart.reduce((sum, item) => sum + ((item.product.mrp || item.product.price) * item.quantity), 0);
  const totalSavings = totalMrp > subtotal ? totalMrp - subtotal : 0;
  
  const currentDeliveryFee = typeof deliveryFee === 'number' ? deliveryFee : 0;
  const finalTotal = Math.max(0, subtotal - couponDiscount + currentDeliveryFee);

  const handleApplyCoupon = (e: React.FormEvent, codeToApply?: string) => {
    e.preventDefault();
    setCouponError('');
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    const res = applyCoupon(code, subtotal);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponError('');
  };

  return (
    <div className="bg-[#F1F3F6] py-6 sm:py-10 min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-gray-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
              Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review your selected technology items and proceed to secure checkout.
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-[#1A56DB] hover:text-[#1E40AF] flex items-center gap-1.5 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-10 text-center max-w-xl mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A56DB] mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Your Cart is Empty</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Looks like you haven't added any laptops, computer parts, or CCTV security packages yet. Explore our genuine Garhwa inventory!
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/shop"
                className="h-10 px-5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-xs"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop?cat=Laptop%20Parts%20%26%20Spares"
                className="h-10 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <span>Laptop Spares & Parts</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Active Cart Grid (Items on Left, Summary on Right) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            
            {/* Left Column: Items List (8 Cols) */}
            <div className="lg:col-span-8 space-y-3.5">
              
              {/* Delivery Notification & Distance Scale Strip */}
              <div 
                onClick={() => setIsLocationModalOpen(true)}
                className={`rounded-2xl border p-4 flex items-center justify-between gap-3 text-xs transition-all cursor-pointer shadow-2xs group ${
                  currentDeliveryFee === 0 
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50/70 border-emerald-200 text-emerald-800'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50/70 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                    currentDeliveryFee === 0 ? 'bg-emerald-600 text-white' : 'bg-[#1A56DB] text-white'
                  }`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="font-extrabold text-sm leading-tight">
                        {currentDeliveryFee === 0 ? 'Free Express Delivery' : `Direct Delivery (₹${currentDeliveryFee})`}
                      </strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                        {customerLocation?.distanceKm ?? 2} km from Showroom
                      </span>
                    </div>
                    <span className="text-[11.5px] opacity-85 block truncate mt-0.5">
                      Delivering to: <strong className="underline decoration-slate-400">{customerLocation?.area || 'Garhwa Town'}</strong> • Tap to change distance &amp; area
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-[#1A56DB] group-hover:translate-x-0.5 transition-transform flex-shrink-0 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Change Distance</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Items Card */}
              <div className="rounded-xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                    
                    {/* Thumbnail & Title */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <Link href={`/product/${item.product.id}`} className="flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg bg-[#F8FAFC] border border-gray-200 p-1.5 hover:scale-105 transition-transform"
                        />
                      </Link>

                      <div className="min-w-0 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A56DB] bg-blue-50 px-2 py-0.5 rounded inline-block">
                          {item.product.brand}
                        </span>
                        <Link href={`/product/${item.product.id}`} className="block">
                          <h3 className="text-xs sm:text-[14px] font-semibold text-gray-900 hover:text-[#1A56DB] transition-colors truncate">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-gray-500 font-semibold">
                          ₹{item.product.price.toLocaleString('en-IN')} each
                        </p>
                      </div>
                    </div>

                    {/* Quantity & Item Total Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 rounded bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs hover:bg-gray-100 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Total Price */}
                      <div className="text-right min-w-[90px]">
                        <span className="text-sm sm:text-base font-extrabold text-[#111827] block">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        {item.product.mrp > item.product.price && (
                          <span className="text-[11px] text-gray-400 line-through">
                            ₹{(item.product.mrp * item.quantity).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                ))}
              </div>

              {/* Guarantees Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#15803D] flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">100% Brand Boxed</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#1A56DB] flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">18% GST Tax Invoice</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] text-xs flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">Chiniya Road Showroom</span>
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary (4 Cols Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              
              <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-gray-900 pb-2.5 border-b border-gray-100">
                  PRICE DETAILS
                </h3>

                {/* Price Calculations */}
                <div className="space-y-2.5 text-xs sm:text-[13px]">
                  <div className="flex justify-between text-gray-600">
                    <span>Price ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="text-gray-900 font-semibold">₹{totalMrp.toLocaleString('en-IN')}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-[#15803D] font-bold">
                      <span>Discount</span>
                      <span>-₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between text-[#15803D] font-bold">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span>Delivery Charges</span>
                      <button
                        type="button"
                        onClick={() => setIsLocationModalOpen(true)}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        ({customerLocation ? `${customerLocation.distanceKm} km` : 'Set Distance'})
                      </button>
                    </div>
                    {currentDeliveryFee === 0 ? (
                      <span className="text-[#15803D] font-bold">FREE</span>
                    ) : (
                      <span className="text-gray-900 font-bold">₹{currentDeliveryFee.toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>GST Invoicing (18%)</span>
                    <span className="text-gray-900 font-semibold">Included in Price</span>
                  </div>

                  <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-gray-900">Total Amount</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#111827]">
                      ₹{finalTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="text-[11.5px] font-bold text-[#15803D] pt-1 border-t border-gray-100">
                      You will save ₹{totalSavings.toLocaleString('en-IN')} on this order
                    </div>
                  )}
                </div>

                {/* Promo Code Input */}
                <div className="pt-1">
                  {!appliedCoupon ? (
                    <div className="space-y-1.5">
                      <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter Promo / Coupon Code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="flex-1 h-9 px-3 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-[#1A56DB] uppercase font-semibold font-mono"
                          />
                          <button
                            type="submit"
                            className="h-9 px-3.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
                        )}
                      </form>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span><strong>{appliedCoupon.code}</strong> applied (₹{couponDiscount.toLocaleString('en-IN')} off)</span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-600 hover:text-red-800 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Primary Checkout CTA (Orange button like Flipkart / Amazon) */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => router.push('/checkout')}
                    className="w-full h-12 rounded-xl bg-[#FB641B] hover:bg-[#E0530F] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 active:scale-[0.98] cursor-pointer"
                  >
                    <span>PROCEED TO CHECKOUT</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center">
                    <span className="text-[11px] text-gray-500 font-medium flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Secure Checkout • 18% GST Invoice</span>
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
