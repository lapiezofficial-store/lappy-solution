'use client';

import React from 'react';

interface LapiezLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  label?: string;
  sublabel?: string;
}

export const LapiezLoader: React.FC<LapiezLoaderProps> = ({
  size = 'fullscreen',
  label = 'Loading Lapiez Store',
  sublabel = 'Authentic Hardware & Laptops',
}) => {
  const isFullscreen = size === 'fullscreen';

  const logoSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    fullscreen: 'w-20 h-20',
  };

  const ringSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    fullscreen: 'w-28 h-28',
  };

  const content = (
    <div className="flex flex-col items-center justify-center text-center select-none font-sans">
      {/* Animated Glowing Orbital Ring Container */}
      <div className={`relative flex items-center justify-center ${ringSizes[size]}`}>
        {/* Outer Pulsing Glow */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />

        {/* High-Precision Rotating Spinner Ring */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: '1.4s' }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-slate-200"
            strokeWidth="3.5"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            className="stroke-[#1A56DB]"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="90 180"
            fill="none"
          />
        </svg>

        {/* Inner Counter-Rotating Ring */}
        <svg
          className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)] animate-spin"
          style={{ animationDuration: '2.4s', animationDirection: 'reverse' }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-blue-400/40"
            strokeWidth="2"
            strokeDasharray="40 120"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Center Lapiez Brand Emblem */}
        <div className={`relative rounded-full bg-white p-2.5 shadow-md border border-slate-100 flex items-center justify-center ${logoSizes[size]}`}>
          <img
            src="/images/logo.png"
            alt="Lapiez"
            className="w-full h-full object-contain drop-shadow-xs"
            onError={(e) => {
              // Fallback to SVG if PNG fails
              (e.currentTarget as HTMLImageElement).src = '/images/logo.svg';
            }}
          />
        </div>
      </div>

      {/* Brand & Loading Label */}
      {size !== 'sm' && (
        <div className="mt-5 space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-black tracking-[0.25em] text-slate-900 uppercase">
              LAPIEZ
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A56DB] animate-ping" />
          </div>

          {label && (
            <p className="text-xs font-semibold text-slate-600 tracking-tight">
              {label}
            </p>
          )}

          {sublabel && (
            <p className="text-[11px] text-slate-400 font-medium">
              {sublabel}
            </p>
          )}

          {/* Micro Progress Bar Indicator */}
          <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto mt-3">
            <div className="h-full bg-gradient-to-r from-blue-500 via-[#1A56DB] to-indigo-600 rounded-full animate-[progress_1.2s_ease-in-out_infinite]" />
          </div>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-md flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return <div className="py-8 flex items-center justify-center">{content}</div>;
};

export default LapiezLoader;
