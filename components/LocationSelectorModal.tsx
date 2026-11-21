'use client';

import React, { useState } from 'react';
import { 
  MapPin, X, Navigation, CheckCircle2, AlertCircle, ArrowRight, Search 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

// Showroom coordinates: Chiniya Road, Garhwa, Jharkhand
const STORE_LAT = 24.1611;
const STORE_LNG = 83.8055;

export const GARHWA_LOCALITIES = [
  { name: 'Chiniya Road / Showroom', km: 0.5, pin: '822114' },
  { name: 'Garhwa Main Market', km: 1.2, pin: '822114' },
  { name: 'Garhwa Bus Stand', km: 1.5, pin: '822114' },
  { name: 'Sahijana', km: 2.0, pin: '822114' },
  { name: 'Tandwa', km: 2.5, pin: '822114' },
  { name: 'Dipauwa / Kachahri', km: 3.0, pin: '822114' },
  { name: 'Meral Block', km: 8.0, pin: '822133' },
  { name: 'Bishunpur', km: 9.0, pin: '822114' },
  { name: 'Pipra Kalan', km: 11.0, pin: '822114' },
  { name: 'Kalyanpur', km: 13.0, pin: '822114' },
  { name: 'Majhiaon', km: 18.0, pin: '822114' },
  { name: 'Ranka Block', km: 22.0, pin: '822125' },
  { name: 'Rehla / Bishrampur', km: 25.0, pin: '822124' },
  { name: 'Nagar Untari (Banshidhar)', km: 38.0, pin: '822121' },
  { name: 'Daltonganj (Medininagar)', km: 45.0, pin: '822101' },
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const LocationSelectorModal: React.FC = () => {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    customerLocation,
    setCustomerDeliveryLocation,
    deliverySettings,
    showToast,
  } = useStore();

  const [isDetecting, setIsDetecting] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualArea, setManualArea] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Auto-detect GPS as soon as modal opens if coordinates not yet available
  React.useEffect(() => {
    if (isLocationModalOpen && !customerLocation?.lat && !isDetecting && !gpsError) {
      handleDetectLiveLocation();
    }
  }, [isLocationModalOpen]);

  const slabs = deliverySettings?.slabs || [
    { id: 's1', name: 'Garhwa Town Core', minKm: 0, maxKm: 5, price: 0, estimatedTime: '30-60 mins' },
    { id: 's2', name: 'Garhwa Outskirts & Rural', minKm: 5, maxKm: 15, price: 60, estimatedTime: '2-4 hours' },
    { id: 's3', name: 'Nearby Block HQs', minKm: 15, maxKm: 35, price: 120, estimatedTime: 'Same-Day' },
    { id: 's4', name: 'Palamu & Outer Districts', minKm: 35, maxKm: 100, price: 200, estimatedTime: 'Next-Day' },
  ];

  const getFeeForDistance = (distKm: number) => {
    const matched = slabs.find((s: any) => distKm >= s.minKm && distKm < s.maxKm) || slabs[slabs.length - 1];
    return { fee: matched?.price ?? 0, slabName: matched?.name ?? 'Standard Delivery' };
  };

  // 1-Click Live GPS Detection
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please enter your area manually.');
      setShowManualInput(true);
      return;
    }

    setIsDetecting(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const distKm = calculateDistanceKm(STORE_LAT, STORE_LNG, latitude, longitude);
          const { fee, slabName } = getFeeForDistance(distKm);

          // Reverse geocode locality name
          let localityName = 'Garhwa Area';
          let detectedPincode = '822114';
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (res.ok) {
              const data = await res.json();
              localityName = data.locality || data.city || data.principalSubdivision || 'Garhwa Area';
              if (data.postcode) detectedPincode = data.postcode;
            }
          } catch {
            localityName = distKm <= 5 ? 'Garhwa Town' : distKm <= 20 ? 'Garhwa Outskirts' : 'Palamu District';
          }

          const locData = {
            area: localityName,
            city: 'Garhwa',
            pincode: detectedPincode,
            distanceKm: distKm,
            lat: latitude,
            lng: longitude,
            distanceSlab: slabName,
            deliveryFee: fee,
            fullAddress: `${localityName}, Garhwa - ${detectedPincode}`,
            updatedAt: new Date().toISOString(),
          };

          setCustomerDeliveryLocation(locData);
          if (typeof window !== 'undefined') {
            localStorage.setItem('lapiez_loc_confirmed', 'true');
          }
          setIsLocationModalOpen(false);
          showToast(`Location set to ${localityName}`);
        } catch (e: any) {
          setGpsError('Could not process location. Please enter area manually.');
          setShowManualInput(true);
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setIsDetecting(false);
        let msg = 'Location access was not granted.';
        if (err.code === 1) msg = 'Location permission was denied. Please enter your area below.';
        else if (err.code === 2) msg = 'Location unavailable. Please enter your area below.';
        setGpsError(msg);
        setShowManualInput(true);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleSelectPresetArea = (loc: { name: string; km: number; pin: string }) => {
    const { fee, slabName } = getFeeForDistance(loc.km);
    const locData = {
      area: loc.name,
      city: 'Garhwa',
      pincode: loc.pin,
      distanceKm: loc.km,
      distanceSlab: slabName,
      deliveryFee: fee,
      fullAddress: `${loc.name}, Garhwa - ${loc.pin}`,
      updatedAt: new Date().toISOString(),
      isConfirmed: true,
    };

    setCustomerDeliveryLocation(locData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lapiez_loc_confirmed', 'true');
    }
    setIsLocationModalOpen(false);
    showToast(`Delivery location set to ${loc.name} (${loc.km} km)`);
  };

  const handleConfirmManualArea = () => {
    if (!manualArea.trim()) {
      showToast('Please enter your area or colony name.');
      return;
    }

    const trimmed = manualArea.trim();
    // Default estimated distance for manual entry (e.g. 3 km for Garhwa town)
    const distKm = 3;
    const { fee, slabName } = getFeeForDistance(distKm);

    const locData = {
      area: trimmed,
      city: 'Garhwa',
      pincode: '822114',
      distanceKm: distKm,
      distanceSlab: slabName,
      deliveryFee: fee,
      fullAddress: `${trimmed}, Garhwa - 822114`,
      updatedAt: new Date().toISOString(),
      isConfirmed: true,
    };

    setCustomerDeliveryLocation(locData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lapiez_loc_confirmed', 'true');
    }
    setIsLocationModalOpen(false);
    showToast(`Delivery location set to ${trimmed}`);
  };

  if (!isLocationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsLocationModalOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 sm:p-6 text-center space-y-2 relative border-b border-slate-100">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Animated Pin Illustration */}
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center mx-auto shadow-inner relative">
            <MapPin className="w-6 h-6 relative z-10 stroke-[2.2]" />
          </div>

          <div className="space-y-0.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Select Delivery Location
            </h3>
            <p className="text-[11.5px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              Live GPS ya apna local area choose karein delivery fee calculate karne ke liye.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* 1-Tap Live GPS Button */}
          <button
            type="button"
            onClick={handleDetectLiveLocation}
            disabled={isDetecting}
            className="w-full h-11 rounded-xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
          >
            <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Detecting Live Location...' : 'Use Current Live GPS Location'}</span>
          </button>

          {gpsError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Quick Select Popular Garhwa Localities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Popular Garhwa Localities:</span>
              <span className="text-[10px] text-blue-600">Tap to auto-select</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {GARHWA_LOCALITIES.map((loc) => {
                const isSelected = customerLocation?.area === loc.name;
                const { fee } = getFeeForDistance(loc.km);
                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleSelectPresetArea(loc)}
                    className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <span className="truncate block font-semibold text-[11.5px]">{loc.name}</span>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
                      <span>{loc.km} km</span>
                      <span className={fee === 0 ? 'text-emerald-700 font-bold' : 'text-slate-700 font-bold'}>
                        {fee === 0 ? 'FREE' : `₹${fee}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Input Toggle */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-700 block">
              Or Enter Custom Area / Village Name:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Sahijana, Dipauwa, Ranka Road"
                value={manualArea}
                onChange={(e) => setManualArea(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmManualArea()}
                className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#1A56DB] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleConfirmManualArea}
                className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Set Area
              </button>
            </div>
          </div>

          {/* Current Saved Location Pill */}
          {customerLocation?.area && (
            <div className="pt-2 text-center border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Current selected: <strong className="text-slate-900 font-bold">{customerLocation.area}</strong> ({customerLocation.distanceKm ?? 0} km)
              </span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
