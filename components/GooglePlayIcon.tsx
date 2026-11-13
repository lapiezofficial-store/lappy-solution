import React from 'react';

interface GooglePlayIconProps {
  className?: string;
  variant?: 'color' | 'monochrome';
}

/**
 * Official Google Play brand icon (vibrant 4-color multi-facet triangle)
 */
export const GooglePlayIcon: React.FC<GooglePlayIconProps> = ({
  className = 'w-4 h-4',
  variant = 'color',
}) => {
  if (variant === 'monochrome') {
    return (
      <svg
        viewBox="0 0 512 512"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <path d="M32.1 19.3C30.8 24.3 30 30.6 30 38.6v434.8c0 8 0.8 14.3 2.1 19.3l236.4-236.4L32.1 19.3zM352.4 340.6l-83.9-83.9-236.4 236.4c5.7 3.3 13.5 4.9 23 4.9 8.2 0 16.7-1.8 24.5-6.3l272.8-151.1zM55.1 7.3C47.3 2.8 38.8 1 30.6 1c-9.5 0-17.3 1.6-23 4.9l236.4 236.4 83.9-83.9L55.1 7.3zM472.9 233.1L352.4 166.4l-83.9 83.9 83.9 83.9 120.5-66.7c19.1-10.6 19.1-27.8 0-38.4z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Official 4 Google Play color facets: Blue, Yellow/Amber, Red, Green */}
      <path
        fill="#0086F8"
        d="M32.1 19.3C30.8 24.3 30 30.6 30 38.6v434.8c0 8 0.8 14.3 2.1 19.3l236.4-236.4L32.1 19.3z"
      />
      <path
        fill="#FFD000"
        d="M352.4 340.6l-83.9-83.9-236.4 236.4c5.7 3.3 13.5 4.9 23 4.9 8.2 0 16.7-1.8 24.5-6.3l272.8-151.1z"
      />
      <path
        fill="#FF3E30"
        d="M55.1 7.3C47.3 2.8 38.8 1 30.6 1c-9.5 0-17.3 1.6-23 4.9l236.4 236.4 83.9-83.9L55.1 7.3z"
      />
      <path
        fill="#00E676"
        d="M472.9 233.1L352.4 166.4l-83.9 83.9 83.9 83.9 120.5-66.7c19.1-10.6 19.1-27.8 0-38.4z"
      />
    </svg>
  );
};

