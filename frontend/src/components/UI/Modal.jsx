import React from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center modal-slide">
      <div className={`bg-gray-950 border border-cyan-400/30 rounded-lg p-6 shadow-lg shadow-cyan-500/30 ${sizes[size]} ${className}`}>
        {title && <h2 className="text-2xl font-bold text-cyan-400 mb-4">{title}</h2>}
        {children}
        <button onClick={onClose} className="absolute top-4 right-4 text-cyan-400 hover:text-purple-600">✕</button>
      </div>
    </div>
  );
}
