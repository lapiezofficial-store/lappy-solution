'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, Navigation, X, Check, ChevronRight, 
  Truck, Clock, ShieldCheck, Sparkles, AlertCircle, 
  SlidersHorizontal, Search, ArrowRight 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

// Showroom coordinates: Chiniya Road, Garhwa
const STORE_LAT = 24.1611;
const STORE_LNG = 83.8055;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
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

const POPULAR_GARHWA_HUBS = [
  { name: 'Garhwa Town Core', area: 'Main Market / Chiniya Rd', pincode: '822114', distanceKm: 2, label: '0-5 km' },
  { name: 'Sahijana / Tandwa', area: 'Sahijana', pincode: '822114', distanceKm: 3, label: '0-5 km' },
  { name: 'Bus Stand & Dipauwa', area: 'Dipauwa', pincode: '822114', distanceKm: 4, label: '0-5 km' },
  { name: 'Meral Block', area: 'Meral Chowk', pincode: '822133', distanceKm: 11, label: '5-15 km' },
  { name: 'Bishunpur / Pipra', area: 'Bishunpur', pincode: '822114', distanceKm: 8, label: '5-15 km' },
  { name: 'Majhiaon Town', area: 'Majhiaon Bazaar', pincode: '822114', distanceKm: 19, label: '15-35 km' },
  { name: 'Ranka Raj Block', area: 'Ranka', pincode: '822125', distanceKm: 23, label: '15-35 km' },
  { name: 'Rehla / Bishrampur', area: 'Rehla', pincode: '822124', distanceKm: 22, label: '15-35 km' },
  { name: 'Nagar Untari', area: 'Shri Banshidhar Nagar', pincode: '822128', distanceKm: 33, label: '15-35 km' },
  { name: 'Daltonganj (Medininagar)', area: 'Medininagar / Daltonganj', pincode: '822101', distanceKm: 42, label: '35+ km' },
  { name: 'Bhawanathpur', area: 'Bhawanathpur Township', pincode: '822112', distanceKm: 40, label: '35+ km' },
];

export const LocationSelectorModal: React.FC = () => {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    customerLocation,
    setCustomerDeliveryLocation,
    deliverySettings,
    showToast,
  } = useStore();

  const [selectedDistance, setSelectedDistance] = useState<number>(() => {
    return customerLocation?.distanceKm ?? 3;
  });
  const [selectedArea, setSelectedArea] = useState<string>(() => {
    return customerLocation?.area || 'Garhwa Town Core';
  });
  const [pincode, setPincode] = useState<string>(() => {
    return customerLocation?.pincode || '822114';
  });
  const [landmark, setLandmark] = useState<string>(() => {
    return customerLocation?.landmark || '';
  });
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Sync state if customerLocation changes
  useEffect(() => {
    if (customerLocation) {
      setSelectedDistance(customerLocation.distanceKm);
      setSelectedArea(customerLocation.area);
      setPincode(customerLocation.pincode);
      if (customerLocation.landmark) setLandmark(customerLocation.landmark);
    }
  }, [customerLocation]);

  // Slabs & calculated fee
  const slabs = deliverySettings?.slabs || [
    { id: 's1', name: 'Garhwa Town Core', minKm: 0, maxKm: 5, price: 0, estimatedTime: '30-60 mins' },
    { id: 's2', name: 'Garhwa Outskirts & Rural', minKm: 5, maxKm: 15, price: 60, estimatedTime: '2-4 hours' },
    { id: 's3', name: 'Nearby Block HQs', minKm: 15, maxKm: 35, price: 120, estimatedTime: 'Same-Day' },
    { id: 's4', name: 'Palamu & Outer Districts', minKm: 35, maxKm: 100, price: 200, estimatedTime: 'Next-Day' },
  ];

  const currentSlab = useMemo(() => {
    const found = slabs.find((s: any) => selectedDistance >= s.minKm && selectedDistance < s.maxKm);
    return found || slabs[slabs.length - 1];
  }, [selectedDistance, slabs]);

  const deliveryFee = currentSlab.price;

  // 1-Click GPS Location Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = calculateDistance(STORE_LAT, STORE_LNG, latitude, longitude);
        setSelectedDistance(dist);

        // Reverse geocoding fallback
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          .then((res) => res.json())
          .then((data) => {
            const locality = data.locality || data.city || data.principalSubdivision || 'Garhwa Area';
            const postCode = data.postcode || '822114';
            setSelectedArea(locality);
            setPincode(postCode);
            showToast(`Location detected: ${locality} (~${dist} km from showroom)`);
          })
          .catch(() => {
            setSelectedArea(`Near Garhwa (~${dist} km)`);
            showToast(`GPS matched distance: ~${dist} km from showroom`);
          })
          .finally(() => {
            setIsDetectingGps(false);
          });
      },
      (err) => {
        setIsDetectingGps(false);
        setGpsError('GPS access was not allowed. Please choose your area or distance below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectHub = (hub: typeof POPULAR_GARHWA_HUBS[0]) => {
    setSelectedArea(hub.name);
    setSelectedDistance(hub.distanceKm);
    setPincode(hub.pincode);
    if (!landmark) setLandmark(hub.area);
  };

  const handleConfirmLocation = () => {
    const locData = {
      area: selectedArea.trim() || 'Garhwa Town',
      city: 'Garhwa',
      pincode: pincode.trim() || '822114',
      landmark: landmark.trim() || undefined,
      distanceKm: selectedDistance,
      distanceSlab: currentSlab.name,
      deliveryFee: deliveryFee,
      fullAddress: `${selectedArea.trim()}${landmark ? `, Near ${landmark.trim()}` : ''}, Garhwa - ${pincode}`,
      updatedAt: new Date().toISOString(),
    };

    setCustomerDeliveryLocation(locData);
    setIsLocationModalOpen(false);
    showToast(`Delivery location set to ${locData.area} (${selectedDistance} km)`);
  };

  if (!isLocationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsLocationModalOpen(false)}
      />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header Ribbon */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Select Delivery Location
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Set your distance from Garhwa showroom for live rates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLocationModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Option 1: 1-Click GPS Auto-Detect */}
          <div>
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={isDetectingGps}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70"
            >
              <div className="flex items-center gap-2.5">
                <Navigation className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>{isDetectingGps ? 'Detecting GPS Location...' : 'Use Current GPS Location'}</span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
                1-Tap Auto
              </span>
            </button>
            {gpsError && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{gpsError}</span>
              </p>
            )}
          </div>

          {/* Option 2: Interactive Distance Scale Slider */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  Store Distance Scale
                </span>
              </div>
              <span className="text-xs font-black text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-100 border border-blue-200">
                {selectedDistance} km from Store
              </span>
            </div>

            {/* Slider Bar */}
            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1A56DB]"
              />
              <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                <span>0 km (Town)</span>
                <span>15 km (Outskirts)</span>
                <span>35 km (Blocks)</span>
                <span>50 km+ (Palamu)</span>
              </div>
            </div>

            {/* Realtime Calculated Delivery Rate Badge */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">{currentSlab.name}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Est. Speed: {currentSlab.estimatedTime}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Delivery Charge</span>
                {deliveryFee === 0 ? (
                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    FREE
                  </span>
                ) : (
                  <span className="text-sm font-black text-slate-900">
                    ₹{deliveryFee}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Option 3: Quick Garhwa & Palamu Delivery Hubs */}
          <div className="space-y-2">
            <label className="text-[11.5px] font-bold text-slate-700 block">
              Popular Local Areas (Tap to Select)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {POPULAR_GARHWA_HUBS.map((hub) => {
                const isSelected = selectedArea === hub.name;
                return (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => handleSelectHub(hub)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <strong className="block text-xs font-bold text-slate-800 leading-tight">
                        {hub.name}
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        {hub.area} • {hub.distanceKm} km
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option 4: Manual Address & Pincode */}
          <div className="space-y-2.5 pt-1 border-t border-slate-100">
            <label className="text-[11.5px] font-bold text-slate-700 block">
              Custom Locality & Landmark
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Area / Colony / Village"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="Nearby Landmark (e.g. Near Kali Mandir, Hospital Road)"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center gap-3">
          <button
            type="button"
            onClick={handleConfirmLocation}
            className="flex-1 h-11 px-5 rounded-2xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>Confirm &amp; Apply Location</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
