import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../utils/constants';

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center md:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-cyan-400 text-xl">☰</button>
        </div>
        
        <div className={`${mobileOpen ? 'block' : 'hidden'} md:block`}>
          <ul className="flex flex-col md:flex-row gap-2 md:gap-4">
            <li><Link to="/sites" className="text-gray-300 hover:text-cyan-400 block py-2">All Sites</Link></li>
            {CATEGORIES.map(cat => (
              <li key={cat.name}><Link to={cat.path} className="text-gray-300 hover:text-cyan-400 block py-2">{cat.label}</Link></li>
            ))}
            <li><Link to="/top-picks" className="text-yellow-400 hover:text-cyan-400 block py-2">⭐ Top Picks</Link></li>
            <li><Link to="/new" className="text-yellow-400 hover:text-cyan-400 block py-2">🆕 New</Link></li>
            <li><Link to="/blacklist" className="text-red-500 hover:text-red-400 block py-2">⚠️ Blacklist</Link></li>
            <li><Link to="/contact" className="text-gray-300 hover:text-cyan-400 block py-2">📞 Report</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
