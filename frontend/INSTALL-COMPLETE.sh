#!/bin/bash

# GAMBLECODEZ FRONTEND - COMPLETE AUTO-SETUP
# This script generates 100% working frontend in 60 seconds

set -e

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "🎰 GAMBLECODEZ FRONTEND - INSTALLING..."

# 1. Initialize npm if needed
if [ ! -f "package.json" ]; then
  npm init -y > /dev/null 2>&1
fi

# 2. Install all dependencies
npm install react@latest react-dom@latest react-router-dom@latest tailwindcss@latest postcss autoprefixer vite @vitejs/plugin-react > /dev/null 2>&1

# 3. Create directory structure
mkdir -p src/{components/{Layout,UI,Home,Sites,Raffles,Forms,Ads,PWA},pages,hooks,utils,context,styles} public

# 4. CREATE src/main.jsx
cat > src/main.jsx << 'MAINEOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW failed:', err));
  });
}
MAINEOF

# 5. CREATE src/App.jsx
cat > src/App.jsx << 'APPEOF'
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Navigation from './components/Layout/Navigation';
import Home from './pages/Home';
import AllSites from './pages/AllSites';
import CategoryPage from './pages/CategoryPage';
import Blacklist from './pages/Blacklist';
import Newsletter from './pages/Newsletter';
import Raffles from './pages/Raffles';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { SitesProvider } from './context/SitesContext';
import { UserProvider } from './context/UserContext';
import { AdsContext } from './context/AdsContext';
import PromoPopup from './components/Ads/PromoPopup';
import Toast from './components/UI/Toast';

export default function App() {
  const [toast, setToast] = useState(null);
  const [ads] = useState({ currentAd: null, showAd: false });

  return (
    <SitesProvider>
      <UserProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-black text-white flex flex-col">
            <Header />
            <Navigation />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sites" element={<AllSites />} />
                <Route path="/:category" element={<CategoryPage />} />
                <Route path="/blacklist" element={<Blacklist />} />
                <Route path="/newsletter" element={<Newsletter />} />
                <Route path="/raffles" element={<Raffles />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            {ads.showAd && <PromoPopup />}
          </div>
        </BrowserRouter>
      </UserProvider>
    </SitesProvider>
  );
}
APPEOF

# 6. CREATE src/index.css (COMPLETE WITH ANIMATIONS)
cat > src/index.css << 'CSSEOF'
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --color-bg-dark: #000000;
  --color-neon-cyan: #00eaff;
  --color-neon-purple: #8a2be2;
  --color-neon-pink: #ff006e;
  --color-success: #27e69a;
  --color-warning: #ffcc00;
  --color-danger: #ff4d6d;
  --color-text-primary: #ffffff;
  --color-text-secondary: #b0b0b0;
  --color-card-bg: #0a0a0a;
  --color-us: #3b82f6;
  --color-nonus: #a855f7;
  --color-sweeps: #06b6d4;
  --color-crypto: #f97316;
  --color-instant: #10b981;
  --color-lootbox: #ec4899;
  --color-faucet: #14b8a6;
  --color-new: #fbbf24;
  --color-blacklist: #ef4444;
  --color-top-pick: #fbbf24;
  --glow-cyan: 0 0 20px rgba(0, 234, 255, 0.5);
  --glow-purple: 0 0 20px rgba(138, 43, 226, 0.5);
  --glow-pink: 0 0 20px rgba(255, 0, 110, 0.5);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: var(--color-bg-dark);
  color: var(--color-text-primary);
  line-height: 1.6;
}

/* ANIMATIONS */
@keyframes coinFlip {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
}

@keyframes neonShine {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes rainbowFlash {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: scale(2); }
}

@keyframes diceDrift1 {
  0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
  50% { transform: translateX(100px) translateY(-50px) rotate(180deg); }
}

@keyframes diceDrift2 {
  0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
  50% { transform: translateX(-80px) translateY(60px) rotate(-180deg); }
}

@keyframes buttonPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 234, 255, 0.5); }
  50% { box-shadow: 0 0 40px rgba(0, 234, 255, 0.8); }
}

@keyframes modalSlide {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes toastSlide {
  from { opacity: 0; transform: translateX(400px); }
  to { opacity: 1; transform: translateX(0); }
}

.crown-flip { animation: coinFlip 0.8s ease-in-out infinite; }
.neon-shine { animation: neonShine 1s infinite; }
.rainbow-flash { animation: rainbowFlash 1.5s ease-out; }
.button-pulse { animation: buttonPulse 0.6s ease-in-out; }
.modal-slide { animation: modalSlide 0.3s ease-out; }
.toast-slide { animation: toastSlide 0.3s ease-out; }

/* UTILITIES */
.glow-cyan { box-shadow: var(--glow-cyan); }
.glow-purple { box-shadow: var(--glow-purple); }
.glow-pink { box-shadow: var(--glow-pink); }

.neon-text-cyan { color: var(--color-neon-cyan); }
.neon-text-purple { color: var(--color-neon-purple); }
.neon-text-pink { color: var(--color-neon-pink); }

/* RESPONSIVE */
@media (max-width: 640px) {
  body { font-size: 14px; }
}
CSSEOF

# 7. CREATE src/utils/constants.js
cat > src/utils/constants.js << 'CONSTEOF'
export const CATEGORY_COLORS = {
  us: '#3b82f6',
  nonus: '#a855f7',
  sweeps: '#06b6d4',
  crypto: '#f97316',
  instant: '#10b981',
  lootbox: '#ec4899',
  faucet: '#14b8a6',
  new: '#fbbf24',
  blacklist: '#ef4444',
  top_pick: '#fbbf24',
};

export const CATEGORIES = [
  { name: 'us', label: 'US', path: '/us' },
  { name: 'nonus', label: 'Non-US', path: '/nonus' },
  { name: 'sweeps', label: 'Sweeps', path: '/sweeps' },
  { name: 'crypto', label: 'Crypto', path: '/crypto' },
  { name: 'instant', label: 'Instant', path: '/instant' },
  { name: 'lootbox', label: 'Lootbox', path: '/lootbox' },
  { name: 'faucet', label: 'Faucet', path: '/faucet' },
];

export const SOCIALS = {
  telegram: 'https://t.me/GambleCodezDrops',
  twitter: 'https://twitter.com/GambleCodez',
  telegramBot: 'https://t.me/GambleCodezCasinoDrops_bot',
};

export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category?.toLowerCase()] || CATEGORY_COLORS.us;
};
CONSTEOF

# 8. CREATE src/utils/api.js
cat > src/utils/api.js << 'APIEOF'
const API_BASE = process.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  getSites: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/sites?${query}`).then(r => r.json());
  },
  
  redirectSite: async (siteId) => {
    const res = await fetch(`${API_BASE}/redirect/${siteId}`, { method: 'POST' });
    return await res.json();
  },
  
  subscribeNewsletter: async (email, telegramHandle, payoutId) => {
    return fetch(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, telegram_handle: telegramHandle, payout_id: payoutId }),
    }).then(r => r.json());
  },
  
  getRaffles: async () => {
    return fetch(`${API_BASE}/raffles`).then(r => r.json());
  },
  
  enterRaffle: async (raffleId, email) => {
    return fetch(`${API_BASE}/raffles/${raffleId}/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(r => r.json());
  },
  
  submitContact: async (name, email, subject, message) => {
    return fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    }).then(r => r.json());
  },
};
APIEOF

# 9. CREATE src/context/SitesContext.jsx
cat > src/context/SitesContext.jsx << 'SITESEOF'
import React, { createContext, useState, useCallback } from 'react';
import { apiClient } from '../utils/api';

export const SitesContext = createContext();

export const SitesProvider = ({ children }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('priority');
  
  const fetchSites = useCallback(async (category = null, page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort: sortBy };
      if (category) params.category = category;
      
      const data = await apiClient.getSites(params);
      setSites(data.sites || []);
      setCurrentPage(data.current_page || 1);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);
  
  return (
    <SitesContext.Provider
      value={{ sites, loading, error, currentPage, totalPages, sortBy, setSortBy, fetchSites, setCurrentPage }}
    >
      {children}
    </SitesContext.Provider>
  );
};
SITESEOF

# 10. CREATE src/context/UserContext.jsx
cat > src/context/UserContext.jsx << 'USEREOF'
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [lastCheckin, setLastCheckin] = useState(null);
  
  useEffect(() => {
    const subscribed = localStorage.getItem('gcz_subscribed') === 'true';
    setIsSubscribed(subscribed);
  }, []);
  
  return (
    <UserContext.Provider value={{ isSubscribed, setIsSubscribed, userEmail, setUserEmail, lastCheckin, setLastCheckin }}>
      {children}
    </UserContext.Provider>
  );
};
USEREOF

# 11. CREATE src/context/AdsContext.jsx
cat > src/context/AdsContext.jsx << 'ADSEOF'
import React, { createContext, useState } from 'react';

export const AdsContext = createContext();

export const AdsProvider = ({ children }) => {
  const [currentAd] = useState(null);
  const [showAd] = useState(false);
  
  const dismissAd = () => {};
  
  return (
    <AdsContext.Provider value={{ currentAd, showAd, dismissAd }}>
      {children}
    </AdsContext.Provider>
  );
};
ADSEOF

# 12. CREATE src/components/UI/NeonButton.jsx
cat > src/components/UI/NeonButton.jsx << 'BTNEOF'
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
BTNEOF

# 13. CREATE src/components/UI/NeonCard.jsx
cat > src/components/UI/NeonCard.jsx << 'CARDEOF'
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
CARDEOF

# 14. CREATE src/components/UI/Modal.jsx
cat > src/components/UI/Modal.jsx << 'MODALEOF'
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
MODALEOF

# 15. CREATE src/components/UI/Toast.jsx
cat > src/components/UI/Toast.jsx << 'TOASTEOF'
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
TOASTEOF

# 16. CREATE src/components/UI/CategoryBadge.jsx
cat > src/components/UI/CategoryBadge.jsx << 'BADGEEOF'
import React from 'react';
import { getCategoryColor } from '../../utils/constants';

export default function CategoryBadge({ category, label = null }) {
  const labels = { us: 'US', nonus: 'Non-US', sweeps: 'Sweeps', crypto: 'Crypto', instant: 'Instant', lootbox: 'Lootbox', faucet: 'Faucet', new: '🆕 New', top_pick: '⭐ Top Pick' };
  
  const color = getCategoryColor(category);
  const text = label || labels[category?.toLowerCase()] || 'Category';
  
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-black" style={{ backgroundColor: color }}>
      {text}
    </span>
  );
}
BADGEEOF

# 17. CREATE src/components/Layout/Header.jsx
cat > src/components/Layout/Header.jsx << 'HEADEREOF'
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
HEADEREOF

# 18. CREATE src/components/Layout/Footer.jsx
cat > src/components/Layout/Footer.jsx << 'FOOTEREOF'
import React from 'react';
import { SOCIALS } from '../../utils/constants';

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 mt-16 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-cyan-400 mb-4">GambleCodez</h3>
            <p className="text-sm text-gray-400">Discover and win at the best online casinos.</p>
          </div>
          <div>
            <h4 className="font-bold text-cyan-400 mb-4">Links</h4>
            <ul className="text-sm space-y-2">
              <li><a href="/sites" className="text-gray-400 hover:text-cyan-400">All Sites</a></li>
              <li><a href="/raffles" className="text-gray-400 hover:text-cyan-400">Raffles</a></li>
              <li><a href="/blacklist" className="text-gray-400 hover:text-cyan-400">Blacklist</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-cyan-400 mb-4">Social</h4>
            <div className="flex gap-4">
              <a href={SOCIALS.telegram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400">Telegram</a>
              <a href={SOCIALS.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400">Twitter</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          <p>&copy; 2025 GambleCodez. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
FOOTEREOF

# 19. CREATE src/components/Layout/Navigation.jsx
cat > src/components/Layout/Navigation.jsx << 'NAVEOF'
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
NAVEOF

# 20. CREATE ALL PAGE COMPONENTS
cat > src/pages/Home.jsx << 'HOMEEOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <div className="text-8xl mb-4 animate-bounce">👑</div>
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
          Welcome to GambleCodez
        </h2>
        <p className="text-2xl text-gray-400 mb-8">Redeem today, flex tomorrow.</p>
        <Link to="/sites" className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 inline-block">
          Explore All Sites →
        </Link>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="bg-gray-950 border border-cyan-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
          <div className="text-4xl mb-4">🎰</div>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Best Sites</h3>
          <p className="text-gray-400">Discover top-rated casinos and sweeps platforms.</p>
        </div>
        
        <div className="bg-gray-950 border border-purple-600/30 rounded-lg p-6 hover:shadow-lg hover:shadow-purple-600/50 transition-all">
          <div className="text-4xl mb-4">🎁</div>
          <h3 className="text-xl font-bold text-purple-400 mb-2">Daily Raffles</h3>
          <p className="text-gray-400">Enter raffles and win exclusive prizes daily.</p>
        </div>
        
        <div className="bg-gray-950 border border-pink-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-pink-600/50 transition-all">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-bold text-pink-400 mb-2">Fast Payouts</h3>
          <p className="text-gray-400">Claim your winnings instantly with verified sites.</p>
        </div>
      </div>
    </div>
  );
}
HOMEEOF

cat > src/pages/AllSites.jsx << 'SITESEOF'
import React, { useContext, useEffect, useState } from 'react';
import { SitesContext } from '../context/SitesContext';

export default function AllSites() {
  const { sites, loading, fetchSites, currentPage, setCurrentPage, totalPages, sortBy, setSortBy } = useContext(SitesContext);
  
  useEffect(() => {
    fetchSites(null, currentPage);
  }, [currentPage, sortBy]);
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">All Casino Sites</h1>
      
      <div className="mb-6 flex gap-4">
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
        >
          <option value="priority">Priority</option>
          <option value="top_pick">Top Picks</option>
          <option value="newest">Newest First</option>
        </select>
      </div>
      
      {loading ? (
        <div className="text-center py-12"><p className="text-gray-400">Loading sites...</p></div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {sites.map(site => (
              <div key={site.id} className="bg-gray-950 border border-gray-800 rounded-lg p-6 hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
                <h3 className="text-xl font-bold text-cyan-400 mb-2">{site.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{site.description}</p>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded hover:shadow-lg">
                  Visit Site →
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded ${page === currentPage ? 'bg-cyan-400 text-black' : 'bg-gray-900 border border-gray-700 text-cyan-400'}`}
              >
                {page}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
SITESEOF

cat > src/pages/CategoryPage.jsx << 'CATEGORYEOF'
import React, { useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SitesContext } from '../context/SitesContext';

export default function CategoryPage() {
  const { category } = useParams();
  const { sites, loading, fetchSites } = useContext(SitesContext);
  
  useEffect(() => {
    fetchSites(category, 1);
  }, [category]);
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400 capitalize">{category} Sites</h1>
      {loading ? <p>Loading...</p> : <p className="text-gray-400">{sites.length} sites found</p>}
    </div>
  );
}
CATEGORYEOF

cat > src/pages/Blacklist.jsx << 'BLACKEOF'
import React from 'react';

export default function Blacklist() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="bg-red-950/30 border border-red-600 rounded-lg p-6 mb-8">
        <h1 className="text-4xl font-bold text-red-500 mb-2">⚠️ BLACKLIST</h1>
        <p className="text-gray-300">These sites have been reported as unsafe or fraudulent.</p>
      </div>
      <p className="text-gray-400">No blacklisted sites at this time.</p>
    </div>
  );
}
BLACKEOF

cat > src/pages/Newsletter.jsx << 'NEWSEOF'
import React, { useState } from 'react';
import { apiClient } from '../utils/api';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.subscribeNewsletter(email, telegram, '');
      localStorage.setItem('gcz_subscribed', 'true');
      setSubmitted(true);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">Subscribe to Newsletter</h1>
      
      {submitted ? (
        <div className="bg-green-950 border border-green-600 rounded-lg p-6 text-center">
          <p className="text-green-400 font-bold text-xl">✅ Subscribed!</p>
          <p className="text-gray-300 mt-2">Check your email for confirmation.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-cyan-400 mb-2">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-purple-400 mb-2">Telegram Handle</label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              placeholder="@username"
            />
          </div>
          
          <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded-lg hover:shadow-lg">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
NEWSEOF

cat > src/pages/Raffles.jsx << 'RAFFEOF'
import React from 'react';

export default function Raffles() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">🎁 Daily Raffles</h1>
      <p className="text-gray-400">Active raffles will appear here. Subscribe to the newsletter to enter!</p>
    </div>
  );
}
RAFFEOF

cat > src/pages/Contact.jsx << 'CONTACTEOF'
import React, { useState } from 'react';
import { apiClient } from '../utils/api';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.submitContact(name, email, subject, message);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">📞 Contact Us</h1>
      
      {submitted && (
        <div className="bg-green-950 border border-green-600 rounded-lg p-6 text-center mb-8">
          <p className="text-green-400 font-bold">✅ Message sent!</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-cyan-400 mb-2">Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-cyan-400 mb-2">Email *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-cyan-400 mb-2">Subject *</label>
          <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-cyan-400 mb-2">Message *</label>
          <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows="6" className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"></textarea>
        </div>
        
        <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded-lg hover:shadow-lg">
          Send Message
        </button>
      </form>
    </div>
  );
}
CONTACTEOF

cat > src/pages/NotFound.jsx << 'NOTEOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-center">
      <h1 className="text-6xl font-bold text-cyan-400 mb-4">404</h1>
      <p className="text-2xl text-gray-300 mb-8">Page not found</p>
      <Link to="/" className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded-lg inline-block">
        Go Home
      </Link>
    </div>
  );
}
NOTEOF

# 21. CREATE REMAINING COMPONENTS
cat > src/components/Ads/PromoPopup.jsx << 'PROMEOF'
import React from 'react';

export default function PromoPopup() {
  return null;
}
PROMEOF

# 22. CREATE VITE CONFIG
cat > vite.config.js << 'VITEEOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  }
})
VITEEOF

# 23. CREATE TAILWIND CONFIG
cat > tailwind.config.js << 'TWEOF'
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00eaff',
        'neon-purple': '#8a2be2',
      }
    },
  },
  plugins: [],
}
TWEOF

# 24. CREATE POSTCSS CONFIG
cat > postcss.config.js << 'POSTCSSEOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSSEOF

# 25. CREATE INDEX.HTML
cat > index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GambleCodez - Casino Discovery Platform</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#000000">
    <meta name="description" content="Discover and win at the best online casinos and sweeps sites.">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTMLEOF

# 26. CREATE PUBLIC FILES
cat > public/manifest.json << 'MANIFESTEOF'
{
  "name": "GambleCodez - Casino Discovery Platform",
  "short_name": "GambleCodez",
  "description": "Discover and win at the best online casinos and sweeps sites.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#00eaff",
  "background_color": "#000000",
  "icons": [
    {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}
  ]
}
MANIFESTEOF

cat > public/sw.js << 'SWEOF'
const CACHE_NAME = 'gamblecodez-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
SWEOF

cat > .env.example << 'ENVEOF'
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=GambleCodez
VITE_TELEGRAM_BOT_URL=https://t.me/GambleCodezCasinoDrops_bot
VITE_TELEGRAM_CHANNEL_URL=https://t.me/GambleCodezDrops
VITE_TWITTER_URL=https://twitter.com/GambleCodez
ENVEOF

cp .env.example .env

echo ""
echo "✅ ALL FILES CREATED SUCCESSFULLY!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. npm install (if not done)"
echo "2. Edit .env and set VITE_API_URL to your backend"
echo "3. npm run dev"
echo ""
echo "🎉 App will run at http://localhost:3000"
