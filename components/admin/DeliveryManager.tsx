'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, SlidersHorizontal, Truck, Clock, ShieldCheck, 
  Save, RefreshCw, CheckCircle2, AlertCircle, Users, 
  ExternalLink, ArrowRight, DollarSign, Navigation, Plus, Trash2 
} from 'lucide-react';
import { DeliverySettings, DeliverySlab, CustomerLocationRecord } from '@/lib/deliveryService';
import { adminFetch } from '@/lib/adminApi';
import { useStore } from '@/context/StoreContext';

export const DeliveryManager: React.FC = () => {
  const { updateDeliverySettingsInStore, showToast } = useStore();
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
        adminFetch('/api/delivery/rates'),
        adminFetch('/api/customer/location'),
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

  const handleSlabChange = (index: number, field: keyof DeliverySlab, value: any) => {
    const updated = [...slabs];
    updated[index] = { ...updated[index], [field]: value };
    setSlabs(updated);
  };

  const handleAddSlab = () => {
    const lastSlab = slabs[slabs.length - 1];
    const newMin = lastSlab ? lastSlab.maxKm : 0;
    const newMax = newMin + 15;
    const newSlab: DeliverySlab = {
      id: `slab-${Date.now()}`,
      name: `Tier ${slabs.length + 1} (${newMin}-${newMax} km)`,
      minKm: newMin,
      maxKm: newMax,
      price: 100,
      estimatedTime: 'Same-Day Delivery',
      description: `Delivery between ${newMin} km and ${newMax} km`,
      popularAreas: [],
    };
    setSlabs([...slabs, newSlab]);
  };

  const handleDeleteSlab = (index: number) => {
    if (slabs.length <= 1) {
      alert('At least one delivery distance slab is required.');
      return;
    }
    const updated = slabs.filter((_, i) => i !== index);
    setSlabs(updated);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const payload = {
        enabled: true,
        freeDeliveryAbove,
        slabs,
        adminKey: 'Lapiez@2026#',
      };

      const res = await adminFetch('/api/delivery/rates', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        if (data.settings) {
          setSettings(data.settings);
          setSlabs(data.settings.slabs || []);
        }
        if (updateDeliverySettingsInStore) {
          await updateDeliverySettingsInStore(payload);
        }
        if (showToast) {
          showToast('Delivery rates saved & live updated!');
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
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Store Radius &amp; Delivery Rates
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Radius Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Customer distance is automatically computed via GPS from Garhwa Showroom (Chiniya Rd). Delivery fees are charged automatically per your radius chart below.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="h-9 px-4 rounded-xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
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
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Delivery radius chart saved successfully! New rates are now active.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Radius Chart & Free Delivery Threshold (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Store Radius Delivery Chart
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Set delivery charge (₹) by distance range from Garhwa showroom
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSlab}
                className="h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1A56DB] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Range</span>
              </button>
            </div>

            {/* Radius Tiers List */}
            <div className="space-y-3">
              {slabs.map((slab, index) => (
                <div
                  key={slab.id || index}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-black text-[11px] flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={slab.name}
                        onChange={(e) => handleSlabChange(index, 'name', e.target.value)}
                        className="font-bold text-xs text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 flex-1 focus:outline-none focus:border-[#1A56DB]"
                        placeholder="Radius Range Name"
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                        <span className="text-xs font-bold text-slate-400 mr-1">Fee: ₹</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={slab.price}
                          onChange={(e) => handleSlabChange(index, 'price', Math.max(0, Number(e.target.value)))}
                          className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                        />
                      </div>
                      {slab.price === 0 ? (
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          FREE
                        </span>
                      ) : null}
                      {slabs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSlab(index)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete this range"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Range Inputs & Delivery Speed */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                        From Distance
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={slab.minKm}
                          onChange={(e) => handleSlabChange(index, 'minKm', Math.max(0, Number(e.target.value)))}
                          className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1A56DB]"
                        />
                        <span className="text-[11px] text-slate-400 font-semibold">km</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                        Up To Distance
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={slab.maxKm}
                          onChange={(e) => handleSlabChange(index, 'maxKm', Math.max(1, Number(e.target.value)))}
                          className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1A56DB]"
                        />
                        <span className="text-[11px] text-slate-400 font-semibold">km</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                        Est. Delivery Time
                      </label>
                      <input
                        type="text"
                        value={slab.estimatedTime}
                        onChange={(e) => handleSlabChange(index, 'estimatedTime', e.target.value)}
                        placeholder="e.g. 30-60 mins"
                        className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1A56DB]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Free Delivery Threshold */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <strong className="font-bold text-slate-900 block">
                  Free Delivery on Orders Above
                </strong>
                <span className="text-[11px] text-slate-500">
                  Cart subtotal qualifying for 100% Free Delivery regardless of distance.
                </span>
              </div>
              <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1 self-start sm:self-auto">
                <span className="font-bold text-slate-400 mr-1">₹</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={freeDeliveryAbove}
                  onChange={(e) => setFreeDeliveryAbove(Number(e.target.value))}
                  className="w-20 font-bold text-slate-900 text-right focus:outline-none"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Customer GPS Distances Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Customer Distances (Live GPS)
                  </h3>
                  <span className="text-[10.5px] text-slate-500">
                    Realtime distances computed from your showroom
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {locations.length} Visits
              </span>
            </div>

            {/* Locations List */}
            {locations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1.5">
                <Navigation className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No Location Records Yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  When customers visit or checkout, their GPS distance from Garhwa showroom appears here live.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 divide-y divide-slate-100">
                {locations.map((loc) => (
                  <div key={loc.id} className="pt-2.5 first:pt-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <strong className="text-xs font-bold text-slate-800 block leading-tight truncate">
                            {loc.area}
                          </strong>
                          <span className="text-[10.5px] text-slate-500 truncate block">
                            {loc.city} • {loc.pincode}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-black text-slate-900 block font-mono">
                          {loc.distanceKm} km
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          loc.deliveryFee === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {loc.deliveryFee === 0 ? 'FREE' : `₹${loc.deliveryFee}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pl-5 pt-0.5">
                      <span>Tier: {loc.distanceSlab}</span>
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

