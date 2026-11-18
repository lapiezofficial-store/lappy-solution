'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, RefreshCw, MapPin, Phone, MessageSquare, CheckCircle, 
  Power, Package, Navigation, Clock, ShieldCheck, ExternalLink,
  Calendar, Bike
} from 'lucide-react';

interface ActivityItem {
  id: string;
  activityType: string;
  title: string;
  description: string;
  lat?: number | null;
  lng?: number | null;
  locationText?: string | null;
  metadata?: string | null;
  createdAt: string;
}

interface RiderActivityModalProps {
  rider: {
    id: string;
    riderCode?: string;
    name: string;
    phone: string;
    vehicleType?: string;
    vehicleNumber?: string;
    isOnline: boolean;
    currentLat?: number | null;
    currentLng?: number | null;
    lastLocationText?: string | null;
    lastActiveAt?: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RiderActivityModal({ rider, isOpen, onClose }: RiderActivityModalProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'CALLS' | 'CHATS' | 'ORDERS' | 'LOCATION'>('ALL');

  const fetchActivities = async () => {
    if (!rider?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/rider/activity?riderId=${encodeURIComponent(rider.id)}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.activities)) {
          setActivities(data.activities);
        }
      }
    } catch (err) {
      console.error('Failed to fetch rider activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && rider?.id) {
      fetchActivities();
    }
  }, [isOpen, rider?.id]);

  if (!isOpen || !rider) return null;

  const filteredActivities = activities.filter((act) => {
    if (filter === 'ALL') return true;
    if (filter === 'CALLS') return act.activityType === 'CALL_CUSTOMER';
    if (filter === 'CHATS') return act.activityType === 'CHAT_MESSAGE';
    if (filter === 'ORDERS') return ['ORDER_ACCEPTED', 'ORDER_DELIVERED', 'ARRIVED_STORE', 'ARRIVED_CUSTOMER'].includes(act.activityType);
    if (filter === 'LOCATION') return ['LOCATION_PING', 'ONLINE', 'OFFLINE'].includes(act.activityType);
    return true;
  });

  const mapsUrl = rider.currentLat && rider.currentLng
    ? `https://www.google.com/maps?q=${rider.currentLat},${rider.currentLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((rider.lastLocationText || 'Garhwa') + ', Jharkhand')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full h-[700px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1A56DB]">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">{rider.name}</h3>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {rider.riderCode}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  rider.isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${rider.isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                  <span>{rider.isOnline ? 'DUTY ON' : 'DUTY OFF'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {rider.phone} • {rider.vehicleType || 'BIKE'} {rider.vehicleNumber ? `(${rider.vehicleNumber})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchActivities}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Refresh timeline"
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

        {/* Live Location Strip */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-slate-700 block truncate">
                {rider.lastLocationText || 'Location not pinged recently'}
              </span>
              {rider.currentLat && rider.currentLng && (
                <span className="text-[11px] font-mono text-slate-400">
                  Coordinates: {rider.currentLat.toFixed(4)}, {rider.currentLng.toFixed(4)}
                </span>
              )}
            </div>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1A56DB] font-extrabold rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Filter Pills */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['ALL', 'CALLS', 'CHATS', 'ORDERS', 'LOCATION'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === tab
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tab === 'ALL' && `All Activities (${activities.length})`}
              {tab === 'CALLS' && 'Customer Calls'}
              {tab === 'CHATS' && 'Chat Messages'}
              {tab === 'ORDERS' && 'Order Lifecycle'}
              {tab === 'LOCATION' && 'Duty & GPS'}
            </button>
          ))}
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
          {loading && activities.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Fetching activity timeline...</span>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Clock className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No activity recorded for this filter</p>
              <p className="text-[11px] text-slate-400">
                Rider's live events will appear here in chronological order.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
              {filteredActivities.map((act) => {
                const dateObj = new Date(act.createdAt);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                let Icon = Clock;

                if (act.activityType === 'CALL_CUSTOMER') {
                  badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  Icon = Phone;
                } else if (act.activityType === 'CHAT_MESSAGE') {
                  badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                  Icon = MessageSquare;
                } else if (act.activityType === 'ORDER_ACCEPTED') {
                  badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                  Icon = Package;
                } else if (act.activityType === 'ORDER_DELIVERED') {
                  badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  Icon = CheckCircle;
                } else if (act.activityType === 'ONLINE') {
                  badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  Icon = Power;
                } else if (act.activityType === 'OFFLINE') {
                  badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                  Icon = Power;
                }

                return (
                  <div key={act.id} className="relative pl-6">
                    {/* Dot on line */}
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badgeColor}`}>
                            <Icon className="w-3 h-3" />
                            <span>{act.activityType.replace('_', ' ')}</span>
                          </span>
                          <strong className="text-xs font-bold text-slate-900">{act.title}</strong>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {dateStr}, {timeStr}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {act.description}
                      </p>

                      {act.locationText && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{act.locationText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
