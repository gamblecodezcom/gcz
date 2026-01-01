import React from 'react';

interface CrownAnimationProps {
  size?: number;
  className?: string;
}

export const CrownAnimation: React.FC<CrownAnimationProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`crown-animation ${className}`}
      style={{
        filter: 'drop-shadow(0 0 8px #FFD700) drop-shadow(0 0 16px #FFD700)',
        animation: 'crownFloat 3s ease-in-out infinite'
      }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
        fill="url(#crownGradient)"
        stroke="#FFD700"
        strokeWidth="1.5"
        className="animate-pulse"
      />
      <defs>
        <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
          <stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
};
