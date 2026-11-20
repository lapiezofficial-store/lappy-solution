'use client';

import React, { useState, useMemo } from 'react';
import { Tag, Plus, X, List, Layers, Check } from 'lucide-react';

interface BulkSerialNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onSyncStock?: (count: number) => void;
  label?: string;
}

export const BulkSerialNumberInput: React.FC<BulkSerialNumberInputProps> = ({
  value,
  onChange,
  onSyncStock,
  label = 'Product Serial Numbers (S/N)',
}) => {
  const [mode, setMode] = useState<'chips' | 'textarea'>('chips');
  const [singleInput, setSingleInput] = useState('');

  // Parse comma or newline separated serial numbers into clean uppercase unique list
  const serialList = useMemo(() => {
    if (!value) return [];
    return value
      .split(/[\n,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }, [value]);

  const updateSerials = (newList: string[]) => {
    // Preserve as comma-separated list
    const unique = Array.from(new Set(newList));
    onChange(unique.join(', '));
  };

  const handleAddSingle = () => {
    const val = singleInput.trim().toUpperCase();
    if (!val) return;
    const tokens = val.split(/[\n,; ]+/).map((t) => t.trim()).filter(Boolean);
    updateSerials([...serialList, ...tokens]);
    setSingleInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSingle();
    }
  };

  const handleRemove = (index: number) => {
    const updated = serialList.filter((_, idx) => idx !== index);
    updateSerials(updated);
  };

  const handleTextAreaChange = (text: string) => {
    const tokens = text
      .split(/[\n,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    updateSerials(tokens);
  };

  return (
    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
      {/* Header with Title & Mode Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#1A56DB]" />
          <label className="font-bold text-gray-800 text-xs">
            {label}
          </label>
          <span className="text-[10px] bg-blue-100 text-[#1A56DB] font-extrabold px-2 py-0.5 rounded-full">
            {serialList.length} {serialList.length === 1 ? 'Serial' : 'Serials'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onSyncStock && serialList.length > 0 && (
            <button
              type="button"
              onClick={() => onSyncStock(serialList.length)}
              className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
              title="Set Product Stock Quantity equal to number of serial numbers"
            >
              <Check className="w-3 h-3" />
              <span>Set Stock to {serialList.length}</span>
            </button>
          )}

          <div className="flex bg-gray-200/80 p-0.5 rounded-lg text-[10.5px] font-bold">
            <button
              type="button"
              onClick={() => setMode('chips')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                mode === 'chips' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3 h-3 inline mr-1" />
              Tags
            </button>
            <button
              type="button"
              onClick={() => setMode('textarea')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                mode === 'textarea' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <List className="w-3 h-3 inline mr-1" />
              Bulk Paste
            </button>
          </div>
        </div>
      </div>

      {mode === 'chips' ? (
        <div className="space-y-2">
          {/* Quick Input Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type or scan S/N, press Enter (or paste comma-separated)..."
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              className="flex-1 h-9 bg-white border border-gray-300 rounded-xl px-3 text-xs text-gray-900 font-mono uppercase focus:outline-none focus:border-[#1A56DB] shadow-2xs"
            />
            <button
              type="button"
              onClick={handleAddSingle}
              disabled={!singleInput.trim()}
              className="px-3 bg-[#1A56DB] hover:bg-[#1E40AF] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Chips list */}
          {serialList.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white border border-gray-200 rounded-xl">
              {serialList.map((sn, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg font-mono text-[11px] font-bold shadow-2xs"
                >
                  <span>{sn}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="hover:bg-blue-200 rounded-full p-0.5 text-blue-700 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 italic">
              Koi serial number add nahi hai. Ek se jyada serial numbers add karne ke liye Enter ya comma lagayein.
            </p>
          )}
        </div>
      ) : (
        /* Textarea Mode for Excel / Bulk Paste */
        <div className="space-y-1">
          <textarea
            rows={4}
            placeholder="Paste multiple serial numbers here from Excel or Barcode scanner (one per line, or comma-separated)&#10;SN-HP-001&#10;SN-HP-002&#10;SN-HP-003"
            value={serialList.join('\n')}
            onChange={(e) => handleTextAreaChange(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-mono uppercase focus:outline-none focus:border-[#1A56DB] shadow-2xs leading-relaxed"
          />
          <p className="text-[10px] text-gray-500">
            * Excel ya Notepad se directly copy paste karein. Har line me ek serial number detect hoga.
          </p>
        </div>
      )}
    </div>
  );
};
