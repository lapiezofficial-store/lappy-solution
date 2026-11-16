'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, X, Truck, Clock, SlidersHorizontal, ArrowRight 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

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
    return customerLocation?.distanceKm ?? 2;
  });

  // Sync state if customerLocation changes
  useEffect(() => {
    if (customerLocation?.distanceKm) {
      setSelectedDistance(customerLocation.distanceKm);
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

  const handleConfirmLocation = () => {
    const autoArea = 
      selectedDistance <= 5 ? 'Garhwa Town Core' :
      selectedDistance <= 15 ? 'Garhwa Outskirts' :
      selectedDistance <= 35 ? 'Nearby Block HQs' :
      'Palamu & Outer Districts';

    const locData = {
      area: autoArea,
      city: 'Garhwa',
      pincode: '822114',
      distanceKm: selectedDistance,
      distanceSlab: currentSlab.name,
      deliveryFee: deliveryFee,
      fullAddress: `${autoArea} (${selectedDistance} km from Garhwa Showroom)`,
      updatedAt: new Date().toISOString(),
    };

    setCustomerDeliveryLocation(locData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lapiez_loc_confirmed', 'true');
    }
    setIsLocationModalOpen(false);
    showToast(`Delivery distance set to ${selectedDistance} km (${currentSlab.name})`);
  };

  if (!isLocationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsLocationModalOpen(false)}
      />

      {/* Modal / Card */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1A56DB] text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5" />
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

        {/* Body: Store Distance Scale (Clean, strictly matching circled section) */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-[#1A56DB]" />
                <span className="text-xs font-bold text-slate-800">
                  Store Distance Scale
                </span>
              </div>
              <span className="text-xs font-black text-[#1A56DB] px-3 py-1 rounded-full bg-blue-50 border border-blue-200 font-mono">
                {selectedDistance} km from Store
              </span>
            </div>

            {/* Slider Track */}
            <div className="space-y-2 pt-1">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1A56DB]"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>0 km (Town)</span>
                <span>15 km (Outskirts)</span>
                <span>35 km (Blocks)</span>
                <span>50 km+ (Palamu)</span>
              </div>
            </div>

            {/* Live Delivery Rate Card */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#1A56DB]" />
                  <span className="text-xs font-bold text-slate-900">{currentSlab.name}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Est. Speed: {currentSlab.estimatedTime}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Delivery Charge</span>
                {deliveryFee === 0 ? (
                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block">
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
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80">
          <button
            type="button"
            onClick={handleConfirmLocation}
            className="w-full h-11 px-5 rounded-2xl bg-[#1A56DB] hover:bg-[#1545B0] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>Confirm &amp; Apply Location</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
