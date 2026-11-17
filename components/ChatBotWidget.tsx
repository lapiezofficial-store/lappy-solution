'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, X, Send, RotateCcw, 
  MapPin, Phone, Truck, ShieldCheck, 
  Package, CheckCircle2, Clock, 
  ArrowRight, ExternalLink, Sparkles 
} from 'lucide-react';

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
  text: 'Welcome to Lapiez Garhwa. I am your online showroom assistant.\n\nHow can I help you today? You can ask about our laptops, printer toners, CCTV deals, track an order, or get showroom directions.',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  'Track My Order',
  'Find Budget Laptops',
  'HP Printer Toners',
  'CCTV Camera Setup',
  'Showroom Address & Hours',
  'Laptop Repair & Warranty',
];

export const ChatBotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Save conversation history
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem('lapiez_chat_history', JSON.stringify(messages.slice(-25)));
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
        text: data.reply || 'Thank you for your message.',
        products: Array.isArray(data.products) ? data.products : [],
        orderData: data.orderData || null,
        action: data.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to connect to showroom services. Please call our Garhwa desk directly at +91 9608828288.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear chat history?')) {
      setMessages([INITIAL_MESSAGE]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lapiez_chat_history');
      }
    }
  };

  return (
    <>
      {/* Floating Trigger Pill / Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 h-11 px-4 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xl border border-slate-700/60 flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer group"
          title="Chat with Lapiez Showroom Assistant"
          aria-label="Open Chat"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-[#0F172A]" />
          </div>
          <span className="text-xs font-bold tracking-tight text-slate-100">
            Assistant
          </span>
        </button>
      )}

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] max-h-[82vh] bg-white rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1A56DB]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs text-slate-900 tracking-tight">
                    Lapiez Assistant
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Garhwa Showroom Live Support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Restart conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
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

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#F8FAFC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble */}
                <div
                  className={`p-3 text-xs leading-relaxed max-w-[86%] ${
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
                      </div>
                      <Link
                        href="/account?tab=orders"
                        onClick={() => setIsOpen(false)}
                        className="h-7 w-full rounded-lg bg-[#1A56DB] hover:bg-[#1545B0] text-white text-[10.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Package className="w-3 h-3" />
                        <span>Track Order Details</span>
                      </Link>
                    </div>
                  )}

                  {/* Product Matches List */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2.5 space-y-2 pt-1 border-t border-slate-100">
                      {msg.products.map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-all cursor-pointer group"
                        >
                          <img
                            src={p.image || '/logo.png'}
                            alt={p.name}
                            className="w-11 h-11 object-contain rounded-lg bg-white border border-slate-200 p-1 flex-shrink-0"
                            onError={(e: any) => {
                              e.target.src = '/logo.png';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-slate-900 block truncate group-hover:text-[#1A56DB] transition-colors">
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
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1A56DB] flex-shrink-0" />
                        </Link>
                      ))}
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
          {messages.length <= 3 && !isLoading && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
            className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question or enter order ID..."
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
