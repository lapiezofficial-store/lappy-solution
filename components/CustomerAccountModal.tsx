'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, Package, Heart, ShoppingCart, Trash2, ArrowRight, ExternalLink, FileText,
  LogOut, Sparkles, User as UserIcon, Minus, Plus
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CustomerAccountModal: React.FC = () => {
  const router = useRouter();
  const { 
    isAccountOpen, 
    setIsAccountOpen, 
    accountTab, 
    setAccountTab,
    orders,
    cart,
    updateQuantity,
    removeFromCart,
    wishlistIds, 
    products, 
    addToCart, 
    toggleWishlist, 
    customer,
    signInWithGoogle,
    signOutCustomer,
    showToast
  } = useStore();

  const customerOrders = React.useMemo(() => {
    if (!customer) return orders;
    const email = customer.email?.toLowerCase();
    const phone = customer.phone;
    return orders.filter((o: any) => {
      if (o.customerId && o.customerId === customer.id) return true;
      if (email && (o.customerEmail?.toLowerCase() === email || o.email?.toLowerCase() === email || o.customer?.email?.toLowerCase() === email)) return true;
      if (phone && (o.customerPhone === phone || o.phone === phone)) return true;
      return false;
    });
  }, [customer, orders]);

  if (!isAccountOpen) return null;

  const wishlistProducts = products.filter(p => wishlistIds.includes(p.id));
  const totalCartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const totalCartAmount = cart.reduce((s, i) => s + (i.product.price * i.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Customer Account</h2>
            <p className="text-xs text-slate-500">Track orders, manage active cart, and view saved hardware</p>
          </div>
          <button
            onClick={() => setIsAccountOpen(false)}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Profile Status / Sign In Card */}
        <div className="pt-2">
          {customer ? (
            <div className="mb-2 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {customer.user_metadata?.avatar_url ? (
                  <img
                    src={customer.user_metadata.avatar_url}
                    alt={customer.user_metadata?.full_name || 'Customer'}
                    className="w-8 h-8 rounded-full border border-blue-300 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    {(customer.user_metadata?.full_name || (customer as any).name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {customer.user_metadata?.full_name || (customer as any).name || 'Customer'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-200/70 text-blue-800">
                      Google Verified
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{customer.email || 'Guest Profile'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOutCustomer()}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Sign out of customer account"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="mb-2 p-4 rounded-xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/40 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sign in for Seamless Checkout & Tracking</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Save addresses, download 18% GST invoices, and access your saved wishlist.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAccountOpen(false);
                  signInWithGoogle('/account');
                }}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all flex items-center justify-center gap-2.5 flex-shrink-0 cursor-pointer active:scale-[0.99]"
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
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between gap-2 pt-4 pb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAccountTab('orders')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                accountTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders ({customerOrders.length})</span>
            </button>

            <button
              onClick={() => setAccountTab('cart' as any)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                accountTab === ('cart' as any)
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>My Cart ({totalCartCount})</span>
            </button>

            <button
              onClick={() => setAccountTab('wishlist')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                accountTab === 'wishlist'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Wishlist ({wishlistProducts.length})</span>
            </button>
          </div>

          <Link
            href="/account"
            onClick={() => setIsAccountOpen(false)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Full Account Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Orders list */}
        {accountTab === 'orders' && (
          <div className="space-y-3">
            {customerOrders.length > 0 ? (
              customerOrders.map((ord: any) => (
                <div key={ord.orderId} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">#{ord.orderId}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {ord.paymentStatus || 'Confirmed'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{ord.orderDate} • ₹{Number(ord.totalAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        router.push(`/invoice/${ord.orderId}`);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-colors border border-emerald-200"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Invoice</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        router.push(`/order-success/${ord.orderId}`);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-800 text-sm">No orders yet</p>
                <p className="text-xs mt-0.5">Your orders will appear here with live tracking updates.</p>
              </div>
            )}
          </div>
        )}

        {/* Cart Items List */}
        {accountTab === ('cart' as any) && (
          <div className="space-y-3.5">
            {cart.length > 0 ? (
              <>
                <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div 
                      key={item.product.id} 
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img 
                          src={item.product.image || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'} 
                          alt={item.product.name} 
                          className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-slate-200 flex-shrink-0" 
                        />
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate" title={item.product.name}>
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-extrabold text-blue-600 font-mono">
                              ₹{item.product.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 font-mono">
                              Total: <strong className="text-slate-800">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Modifier & Remove Button */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Qty Selector */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeFromCart(item.product.id);
                                showToast(`Removed ${item.product.name.slice(0, 16)}... from cart`);
                              } else {
                                updateQuantity(item.product.id, item.quantity - 1);
                              }
                            }}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                            title="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                            title="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Direct Trash / Remove Button */}
                        <button
                          type="button"
                          onClick={() => {
                            removeFromCart(item.product.id);
                            showToast(`Removed ${item.product.name.slice(0, 18)}... from cart`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200"
                          title="Remove item from cart"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Checkout Action Bar */}
                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Cart Total ({totalCartCount} items):</span>
                    <span className="text-base font-extrabold text-blue-600 font-mono">
                      ₹{totalCartAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountOpen(false);
                        router.push('/checkout');
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-800 text-sm">Your cart is empty</p>
                <p className="text-xs">Browse our catalog and choose products to add to your order.</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      router.push('/shop');
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Browse Products
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wishlist list */}
        {accountTab === 'wishlist' && (
          <div className="space-y-3">
            {wishlistProducts.length > 0 ? (
              wishlistProducts.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.image} alt={p.name} className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-slate-200 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 truncate">{p.name}</h4>
                      <p className="text-xs font-bold text-blue-600 font-mono">₹{p.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        addToCart(p);
                        setIsAccountOpen(false);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => toggleWishlist(p)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Heart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-800 text-sm">Your wishlist is empty</p>
                <p className="text-xs mt-0.5">Click the heart icon on any hardware product to save it.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
