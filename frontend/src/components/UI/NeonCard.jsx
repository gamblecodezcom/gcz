import React from 'react';

export default function NeonCard({ children, className = '', glowColor = 'cyan', interactive = true, onClick, ...props }) {
  const glows = {
    cyan: 'hover:shadow-lg hover:shadow-cyan-500/50',
    purple: 'hover:shadow-lg hover:shadow-purple-600/50',
    pink: 'hover:shadow-lg hover:shadow-pink-600/50',
    green: 'hover:shadow-lg hover:shadow-green-500/50',
  };
  
  return (
    <div
      className={`bg-gray-950 border border-gray-800 rounded-lg p-4 transition-all duration-300 ${interactive ? 'cursor-pointer hover:scale-105' : ''} ${glows[glowColor]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
