'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, 
  ShieldCheck, Truck
} from 'lucide-react';
import { Product } from '../data/products';
import { useStore } from '../context/StoreContext';

export interface CartItem {
  product: Product;
  quantity: number;
}

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart 
  } = useStore();

  if (!isCartOpen) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1A56DB]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827]">Your Cart</h3>
                <p className="text-xs text-gray-500">{totalItems} {totalItems === 1 ? 'item' : 'items'} in basket</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">Your shopping cart is empty</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Explore our range of genuine laptops, spares, CCTV security kits, and SSDs.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/shop');
                  }}
                  className="px-5 py-2.5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-xs"
                >
                  <span>Browse Products</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {cart.map((item) => (
                  <div key={item.product.id} className="pt-3.5 first:pt-0 flex gap-3 items-start">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-contain bg-[#F8FAFC] border border-gray-200 p-1 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A56DB] bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                            {item.product.brand}
                          </span>
                          <h4 className="text-[13px] font-semibold text-gray-900 truncate mt-0.5 max-w-[190px]">
                            {item.product.name}
                          </h4>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-gray-200 rounded-md bg-gray-50 p-0.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 rounded bg-white text-gray-700 flex items-center justify-center font-bold text-xs hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-white text-gray-700 flex items-center justify-center font-bold text-xs hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-[14px] font-extrabold text-[#111827]">
                            ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-600">Total Amount:</span>
                <span className="font-extrabold text-[#111827] text-xl">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="text-[11px] text-[#15803D] bg-green-50 border border-green-200 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#15803D] flex-shrink-0" />
                <span>Eligible for Free Garhwa Showroom Pickup & Delivery</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/checkout');
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-[#FB641B] hover:bg-[#E0530F] text-white font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/cart');
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>View Full Cart Details</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 text-[10px] text-gray-500 pt-0.5">
                <span>18% GST Tax Invoice</span>
                <span>•</span>
                <span>UPI / Cash on Delivery</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
