import React from 'react';

export default function NeonButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  className = '', 
  onClick, 
  ...props 
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold',
    secondary: 'bg-transparent border-2 border-cyan-400 text-cyan-400',
    danger: 'bg-red-600 text-white font-bold',
    success: 'bg-green-500 text-black font-bold',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      className={`rounded-lg font-semibold transition-all duration-300 hover:shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? '⟳ Loading...' : children}
    </button>
  );
}
