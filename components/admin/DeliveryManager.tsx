'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, SlidersHorizontal, Truck, Clock, ShieldCheck, 
  Save, RefreshCw, CheckCircle2, AlertCircle, Users, 
  ExternalLink, ArrowRight, DollarSign, Navigation 
} from 'lucide-react';
import { DeliverySettings, DeliverySlab, CustomerLocationRecord } from '@/lib/deliveryService';

export const DeliveryManager: React.FC = () => {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [slabs, setSlabs] = useState<DeliverySlab[]>([]);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState<number>(5000);
  const [locations, setLocations] = useState<CustomerLocationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch settings & recent customer locations
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [ratesRes, locsRes] = await Promise.all([
        fetch('/api/delivery/rates'),
        fetch('/api/customer/location'),
      ]);

      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        if (ratesData?.settings) {
          setSettings(ratesData.settings);
          setSlabs(ratesData.settings.slabs || []);
          setFreeDeliveryAbove(ratesData.settings.freeDeliveryAbove ?? 5000);
        }
      }

      if (locsRes.ok) {
        const locsData = await locsRes.json();
        if (Array.isArray(locsData?.locations)) {
          setLocations(locsData.locations);
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to load delivery settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, []);

  const handleSlabPriceChange = (index: number, newPrice: number) => {
    const updated = [...slabs];
    updated[index] = { ...updated[index], price: Math.max(0, newPrice) };
    setSlabs(updated);
  };

  const handleSlabTimeChange = (index: number, newTime: string) => {
    const updated = [...slabs];
    updated[index] = { ...updated[index], estimatedTime: newTime };
    setSlabs(updated);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/delivery/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          freeDeliveryAbove,
          slabs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        if (data.settings) {
          setSettings(data.settings);
          setSlabs(data.settings.slabs);
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to save delivery rates');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1A56DB] flex items-center justify-center shadow-xs">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Delivery Charges &amp; Distance Scale Controller
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control distance-based delivery charges and view realtime customer delivery locations in Garhwa &amp; Palamu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="h-10 px-5 rounded-xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Live Rates</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Delivery rate scale saved! New rates are now active for all customers.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: 2 Columns (Left: Rate Slabs, Right: Live Customer Locations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Slabs Controller (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Distance Slabs &amp; Delivery Pricing
                </h3>
                <p className="text-[11px] text-slate-500">
                  Set how much customers are charged based on distance from showroom (Chiniya Rd, Garhwa).
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {slabs.length} Slabs Configured
              </span>
            </div>

            {/* Slabs List */}
            <div className="space-y-3.5">
              {slabs.map((slab, index) => (
                <div
                  key={slab.id || index}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3 transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block leading-tight">
                          {slab.name}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Range: {slab.minKm} km - {slab.maxKm} km ({slab.description})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                        <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={slab.price}
                          onChange={(e) => handleSlabPriceChange(index, Number(e.target.value))}
                          className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                        />
                      </div>
                      {slab.price === 0 && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          FREE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estimated Delivery Time Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                        Est. Delivery Speed
                      </label>
                      <input
                        type="text"
                        value={slab.estimatedTime}
                        onChange={(e) => handleSlabTimeChange(index, e.target.value)}
                        placeholder="e.g. 30-60 mins"
                        className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                        Covered Areas
                      </label>
                      <div className="text-[11px] text-slate-600 truncate py-1 font-medium">
                        {slab.popularAreas?.join(', ') || slab.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Free Delivery Threshold */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <strong className="text-xs font-bold text-amber-950 block">
                    Free Delivery Threshold (Orders Above ₹)
                  </strong>
                  <span className="text-[11px] text-amber-800">
                    Orders with total above this amount receive 100% Free Delivery regardless of distance.
                  </span>
                </div>
                <div className="flex items-center bg-white border border-amber-300 rounded-xl px-3 py-1.5 self-end sm:self-auto">
                  <span className="text-xs font-bold text-amber-900 mr-1">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={freeDeliveryAbove}
                    onChange={(e) => setFreeDeliveryAbove(Number(e.target.value))}
                    className="w-20 text-xs font-black text-amber-950 text-right focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Customer Locations Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Live Customer Locations
                  </h3>
                  <span className="text-[10.5px] text-slate-500">
                    Realtime delivery locations added by customers
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {locations.length} Visitors
              </span>
            </div>

            {/* Locations List */}
            {locations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Navigation className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No Location Records Yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  When customers use GPS auto-detect or pick their area on the website, their distance and charges will show here instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 divide-y divide-slate-100">
                {locations.map((loc) => (
                  <div key={loc.id} className="pt-2.5 first:pt-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs font-bold text-slate-800 block leading-tight">
                            {loc.area}
                          </strong>
                          <span className="text-[10.5px] text-slate-500">
                            {loc.city} - {loc.pincode} {loc.landmark ? `(Near ${loc.landmark})` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-black text-slate-900 block font-mono">
                          {loc.distanceKm} km
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          loc.deliveryFee === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {loc.deliveryFee === 0 ? 'FREE' : `₹${loc.deliveryFee}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pl-5 pt-0.5">
                      <span>Slab: {loc.distanceSlab}</span>
                      <span>
                        {new Date(loc.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
