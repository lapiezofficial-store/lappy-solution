'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, X, RefreshCw, Check, CheckCheck } from 'lucide-react';

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

// Gentle audio notification beep for incoming messages
function playMessageChime() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {
    // Ignore audio permission errors
  }
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
  const prevCountRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mark messages as read by current viewer
  const markAsRead = useCallback(async () => {
    if (!orderId) return;
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderId)}/chat`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerType: currentUserType }),
      });
    } catch {
      // Ignore background read errors
    }
  }, [orderId, currentUserType]);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!orderId) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/chat`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          // Play sound if a new message arrived from the other party
          if (silent && prevCountRef.current > 0 && data.messages.length > prevCountRef.current) {
            const lastMsg = data.messages[data.messages.length - 1];
            if (lastMsg && lastMsg.senderType !== currentUserType) {
              playMessageChime();
            }
          }
          prevCountRef.current = data.messages.length;
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId, currentUserType]);

  useEffect(() => {
    if (!isOpen || !orderId) return;
    fetchMessages(false);
    markAsRead();

    // Fast real-time polling every 1.5 seconds
    const interval = setInterval(() => {
      fetchMessages(true);
      markAsRead();
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen, orderId, fetchMessages, markAsRead]);

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full h-[620px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header - Clean & Executive */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Delivery Live Chat</h3>
                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  #{orderId}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Instant real-time coordination
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchMessages(false)}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-800' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body - Clean Modern Bubbles */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-800" />
              <span>Loading chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">No messages yet</p>
              <p className="text-[11px] text-slate-400">
                Send a message below to coordinate delivery in real time.
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
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    <div>{msg.message}</div>

                    <div
                      className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                        isMe ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      <span>{formattedTime}</span>
                      {isMe && (
                        <span title={msg.isRead ? 'Seen' : 'Sent'}>
                          {msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-300 inline" />
                          )}
                        </span>
                      )}
                    </div>
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
              className="whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
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
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-800 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-30 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0 font-bold text-xs gap-1.5"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
