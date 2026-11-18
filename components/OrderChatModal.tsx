'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, RefreshCw, User, Bike, ShieldCheck, CheckCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  orderId: string;
  riderId?: string | null;
  senderType: 'RIDER' | 'CUSTOMER' | 'ADMIN';
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface OrderChatModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserType: 'RIDER' | 'CUSTOMER' | 'ADMIN';
  currentUserName: string;
  riderId?: string;
}

export default function OrderChatModal({
  orderId,
  isOpen,
  onClose,
  currentUserType,
  currentUserName,
  riderId,
}: OrderChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (silent = false) => {
    if (!orderId) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/chat`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !orderId) return;
    fetchMessages(false);

    // Live polling every 3 seconds
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, orderId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    try {
      setSending(true);
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: currentUserType,
          senderName: currentUserName,
          message: text,
          riderId,
        }),
      });

      if (res.ok) {
        setInputText('');
        await fetchMessages(true);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const quickChips = currentUserType === 'RIDER' ? [
    'Main showroom se nikal chuka hu',
    '5 minutes me pahunch raha hu',
    'Main aapke address par pahunch gaya hu',
    'Kripya gate par aayein',
  ] : [
    'Address par call karke aana',
    'Gate par bell bajana',
    'Kab tak pahunchenge?',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full h-[600px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1A56DB]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Order Delivery Chat</h3>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  #{orderId}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Live communication between Customer and Rider
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchMessages(false)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading chat history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Abhi tak koi message nahi hai</p>
              <p className="text-[11px] text-slate-400">
                Delivery coordinate karne ke liye message bhejein.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderType === currentUserType;
              const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                    {msg.senderType === 'RIDER' && (
                      <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                        <Bike className="w-2.5 h-2.5" /> Rider
                      </span>
                    )}
                    {msg.senderType === 'CUSTOMER' && (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> Customer
                      </span>
                    )}
                    {msg.senderType === 'ADMIN' && (
                      <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Admin
                      </span>
                    )}
                    <span className="font-medium text-slate-500">{msg.senderName}</span>
                    <span>•</span>
                    <span>{formattedTime}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-[#1A56DB] text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Message Chips */}
        <div className="bg-white border-t border-slate-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-[#1A56DB] border border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="bg-white border-t border-slate-200 p-3 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="p-2.5 bg-[#1A56DB] hover:bg-[#1E40AF] disabled:opacity-40 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
