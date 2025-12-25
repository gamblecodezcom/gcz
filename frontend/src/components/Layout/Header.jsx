import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [flipCount, setFlipCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFlipCount(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-40 py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className={`text-4xl ${flipCount % 2 === 0 ? 'crown-flip' : ''}`} key={flipCount}>👑</div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">GambleCodez</h1>
            <p className="text-xs text-gray-400">Redeem today, flex tomorrow.</p>
          </div>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link to="/sites" className="text-gray-300 hover:text-cyan-400">Sites</Link>
          <Link to="/raffles" className="text-gray-300 hover:text-cyan-400">Raffles</Link>
          <Link to="/newsletter" className="text-gray-300 hover:text-cyan-400">Newsletter</Link>
        </nav>
      </div>
    </header>
  );
}
