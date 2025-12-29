import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', duration = 4000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const types = {
    success: 'bg-green-500 border-green-500 text-black',
    error: 'bg-red-600 border-red-600 text-white',
    warning: 'bg-yellow-500 border-yellow-500 text-black',
    info: 'bg-cyan-400 border-cyan-400 text-black',
  };
  
  return (
    <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg border font-bold transition-all duration-300 toast-slide z-50 ${types[type]}`}>
      {message}
    </div>
  );
}
