'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, X, Send, RotateCcw, 
  MapPin, Phone, Truck, ShieldCheck, 
  Package, CheckCircle2, Clock, 
  ArrowRight, ExternalLink, ShoppingCart, 
  Maximize2, Minimize2, Zap, MessageCircle 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  discount: number;
  image: string;
  inStock: boolean;
  specs: string;
  rating: number;
}

interface OrderData {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  customerName: string;
  address: string;
  date: string;
  itemCount: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  products?: ProductItem[];
  orderData?: OrderData | null;
  isOrderIntent?: boolean;
  action?: {
    type: string;
    address?: string;
    phone?: string;
    mapsUrl?: string;
    url?: string;
    label?: string;
    query?: string;
  };
  timestamp: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init-1',
  sender: 'assistant',
  text: 'Namaste! Welcome to Lapiez Garhwa Showroom Assistant.\n\nMain aapki kya madad kar sakta hoon? Aap kisi bhi product ka order book kar sakte hain, live order track kar sakte hain, ya showroom details jaan sakte hain.',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  'Order HP Toner Cartridge',
  'Find Laptops Under 35k',
  'Track My Order',
  'CCTV Camera Setup',
  'Showroom Address & Hours',
  'Laptop Motherboard Repair',
];

export const ChatBotWidget: React.FC = () => {
  const router = useRouter();
  const { cart, addToCart, setIsCartOpen } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lapiez_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [INITIAL_MESSAGE];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem('lapiez_chat_history', JSON.stringify(messages.slice(-30)));
      } catch {}
    }
  }, [messages]);

  const handleSendMessage = async (userText?: string) => {
    const textToSend = (userText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: newHistory.slice(-8).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch reply');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Shukriya! Main aapki madad ke liye taiyar hoon.',
        products: Array.isArray(data.products) ? data.products : [],
        orderData: data.orderData || null,
        isOrderIntent: data.isOrderIntent,
        action: data.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Showroom server se connect nahi ho pa raha hai. Kripya direct showroom desk par call karein: +91 9608828288.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCartFromChat = (product: ProductItem) => {
    const formattedProduct: any = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      mrp: product.mrp,
      discount: product.discount,
      specs: product.specs,
      description: product.specs || product.name,
      image: product.image,
      inStock: product.inStock,
      stockQuantity: 10,
      sku: `SKU-${product.id}`,
      rating: product.rating,
      featured: false,
    };
    addToCart(formattedProduct, 1);
  };

  const handleBuyNowFromChat = (product: ProductItem) => {
    handleAddToCartFromChat(product);
    setIsOpen(false);
    router.push('/checkout');
  };

  const handleClearChat = () => {
    if (confirm('Conversation history clear karein?')) {
      setMessages([INITIAL_MESSAGE]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lapiez_chat_history');
      }
    }
  };

  return (
    <>
      {/* Floating Trigger Pill Button (Above Mobile Bottom Nav) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-18 md:bottom-6 right-3 sm:right-6 z-40 h-13 pl-1.5 pr-4 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-[0_8px_25px_-4px_rgba(26,86,219,0.4)] border border-slate-700/70 flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer group"
          title="Chat with Lapiez Showroom Assistant"
          aria-label="Open Chat"
        >
          {/* 3D Avatar Image with pulsing status dot */}
          <div className="relative w-10 h-10 rounded-full bg-slate-800 p-0.5 border border-blue-500/40 shadow-sm flex-shrink-0">
            <img
              src="/images/assistant-avatar.png"
              alt="Lapiez Assistant"
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
              onError={(e: any) => {
                e.target.src = '/images/assistant-avatar.svg';
              }}
            />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 ring-2 ring-[#0F172A]" />
          </div>

          <div className="text-left flex flex-col justify-center">
            <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-blue-400 leading-none">
              Live AI Desk
            </span>
            <span className="text-xs font-black tracking-tight text-white mt-0.5 leading-none">
              Ask Assistant
            </span>
          </div>

          {cartCount > 0 && (
            <span className="bg-[#1A56DB] text-white text-[9.5px] font-black px-1.5 py-0.2 rounded-full ml-0.5 shadow-xs">
              {cartCount}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Screen Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'inset-3 sm:inset-6 md:inset-auto md:bottom-6 md:right-6 md:w-[680px] md:h-[720px] md:max-h-[92vh]'
              : 'bottom-16 md:bottom-6 right-2 sm:right-6 w-[95vw] sm:w-[420px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-slate-100 p-0.5 border border-slate-200 shadow-2xs flex-shrink-0">
                <img
                  src="/images/assistant-avatar.png"
                  alt="Lapiez Assistant"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e: any) => {
                    e.target.src = '/images/assistant-avatar.svg';
                  }}
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-2 ring-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs text-slate-900 tracking-tight">
                    Lapiez Assistant
                  </h3>
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-blue-50 text-[#1A56DB] rounded-full border border-blue-200">
                    AI Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Garhwa Showroom Live AI • Orders &amp; Support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Fullscreen / Expand Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title={isExpanded ? 'Collapse' : 'Expand full screen'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Restart Button */}
              <button
                type="button"
                onClick={handleClearChat}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Restart conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Cart Banner (If customer has items in cart) */}
          {cartCount > 0 && (
            <div className="px-3.5 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5 text-[#1A56DB]" />
                <span className="font-bold text-slate-800 text-[11px]">
                  {cartCount} item{cartCount > 1 ? 's' : ''} in Cart (₹{cartSubtotal.toLocaleString('en-IN')})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/checkout');
                }}
                className="text-[11px] font-extrabold text-[#1A56DB] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Checkout Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#F8FAFC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 mt-1 shadow-2xs">
                    <img
                      src="/images/assistant-avatar.png"
                      alt="Assistant"
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = '/images/assistant-avatar.svg';
                      }}
                    />
                  </div>
                )}
                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[86%]`}>
                  {/* Bubble */}
                  <div
                    className={`p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#1A56DB] text-white rounded-2xl rounded-tr-xs shadow-2xs'
                        : 'bg-white text-slate-800 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-2xs space-y-2'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Order Tracking Card */}
                  {msg.orderData && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          #{msg.orderData.orderId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                          {msg.orderData.orderStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total:</span>
                          <span className="font-black text-slate-900">₹{msg.orderData.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Payment:</span>
                          <span className="font-semibold text-slate-800">{msg.orderData.paymentStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Items:</span>
                          <span className="font-semibold text-slate-800">{msg.orderData.itemCount}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 mt-1 truncate">
                          Address: {msg.orderData.address}
                        </div>
                      </div>
                      <Link
                        href="/account?tab=orders"
                        onClick={() => setIsOpen(false)}
                        className="h-8 w-full rounded-lg bg-[#1A56DB] hover:bg-[#1545B0] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Track Full Order &amp; Invoice</span>
                      </Link>
                    </div>
                  )}

                  {/* Product Cards with Direct Order Taking (Add to Cart & Buy Now) */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 space-y-2.5 pt-1.5 border-t border-slate-100">
                      {msg.products.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.image || '/logo.png'}
                              alt={p.name}
                              className="w-12 h-12 object-contain rounded-lg bg-white border border-slate-200 p-1 flex-shrink-0"
                              onError={(e: any) => {
                                e.target.src = '/logo.png';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[11.5px] font-bold text-slate-900 block truncate">
                                {p.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black text-slate-900">
                                  ₹{p.price.toLocaleString('en-IN')}
                                </span>
                                {p.discount > 0 && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    ₹{p.mrp.toLocaleString('en-IN')}
                                  </span>
                                )}
                                <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                  In Stock
                                </span>
                              </div>
                              {p.specs && (
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {p.specs}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Direct Order Actions: Add to Cart & Buy Now */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/70">
                            <button
                              type="button"
                              onClick={() => handleAddToCartFromChat(p)}
                              className="flex-1 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                            >
                              <ShoppingCart className="w-3 h-3 text-slate-600" />
                              <span>+ Add to Cart</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleBuyNowFromChat(p)}
                              className="flex-1 h-7 rounded-lg bg-[#1A56DB] hover:bg-[#1545B0] text-white text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Buy Now</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* WhatsApp Showroom Booking Option */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center justify-between">
                        <span>Showroom Phone / WhatsApp Booking:</span>
                        <a
                          href="https://wa.me/919608828288?text=Hello%20Lapiez,%20I%20want%20to%20order%20products%20from%20your%20Garhwa%20showroom"
                          target="_blank"
                          rel="noreferrer"
                          className="h-6 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp Order</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Showroom Contact Action */}
                  {msg.action?.type === 'SHOWROOM_INFO' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                      <a
                        href="tel:+919608828288"
                        className="h-7 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-slate-600" />
                        <span>Call Showroom</span>
                      </a>
                      <a
                        href="https://maps.google.com/?q=Lapiez+Garhwa+Chiniya+Road"
                        target="_blank"
                        rel="noreferrer"
                        className="h-7 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <MapPin className="w-3 h-3 text-slate-600" />
                        <span>Directions</span>
                      </a>
                    </div>
                  )}

                  {/* General Navigation Action */}
                  {msg.action?.type === 'NAVIGATE' && msg.action.url && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <Link
                        href={msg.action.url}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A56DB] hover:underline"
                      >
                        <span>{msg.action.label || 'View details'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-slate-400 px-1 mt-1">
                  {msg.timestamp}
                </span>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start">
                <div className="p-3 rounded-2xl rounded-tl-xs bg-white border border-slate-200/80 shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          {messages.length <= 4 && !isLoading && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer border border-slate-200/60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything or say 'Order HP Toner'..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1A56DB] focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-[#1A56DB] hover:bg-[#1545B0] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};
