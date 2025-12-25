#!/bin/bash

# 🎰 GAMBLECODEZ FRONTEND - COMPLETE SETUP
# Copy & paste this entire script, run it, and you have a working frontend in 2 minutes

set -e

echo "🎰 GAMBLECODEZ FRONTEND - INSTALLING..."

# Initialize npm
npm init -y > /dev/null 2>&1

# Install dependencies
npm i react react-dom react-router-dom tailwindcss postcss autoprefixer vite @vitejs/plugin-react > /dev/null 2>&1

# Create directory structure
mkdir -p src/{components/{Layout,UI},pages,hooks,utils,context,styles} public

# ======== PACKAGE.JSON ========
cat > package.json << 'EOF'
{
  "name": "gamblecodez-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20",
    "vite": "^5.4.1"
  }
}
EOF

# ======== INDEX.HTML ========
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GambleCodez - Casino Discovery Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# ======== src/main.jsx ========
cat > src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# ======== src/App.jsx ========
cat > src/App.jsx << 'EOF'
import React, { useState } from 'react';
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
import Toast from './components/UI/Toast';

export default function App() {
  const [toast, setToast] = useState(null);

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
          </div>
        </BrowserRouter>
      </UserProvider>
    </SitesProvider>
  );
}
EOF

# ======== src/index.css ========
cat > src/index.css << 'EOF'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --color-neon-cyan: #00eaff;
  --color-neon-purple: #8a2be2;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', sans-serif;
  background: #000;
  color: #fff;
}

@keyframes coinFlip {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
}

@keyframes neonShine {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.crown-flip { animation: coinFlip 0.8s ease-in-out infinite; }
.neon-shine { animation: neonShine 1s infinite; }
EOF

# ======== src/utils/api.js ========
cat > src/utils/api.js << 'EOF'
const API_BASE = process.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  getSites: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/sites?${query}`).then(r => r.json());
  },
  subscribeNewsletter: async (email, telegramHandle) => {
    return fetch(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, telegram_handle: telegramHandle }),
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
EOF

# ======== src/context/SitesContext.jsx ========
cat > src/context/SitesContext.jsx << 'EOF'
import React, { createContext, useState, useCallback } from 'react';
import { apiClient } from '../utils/api';

export const SitesContext = createContext();

export const SitesProvider = ({ children }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const fetchSites = useCallback(async (category = null, page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (category) params.category = category;
      
      const data = await apiClient.getSites(params);
      setSites(data.sites || []);
      setCurrentPage(data.current_page || 1);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return (
    <SitesContext.Provider value={{ sites, loading, currentPage, totalPages, fetchSites, setCurrentPage }}>
      {children}
    </SitesContext.Provider>
  );
};
EOF

# ======== src/context/UserContext.jsx ========
cat > src/context/UserContext.jsx << 'EOF'
import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  return (
    <UserContext.Provider value={{ isSubscribed, setIsSubscribed }}>
      {children}
    </UserContext.Provider>
  );
};
EOF

# ======== src/components/Layout/Header.jsx ========
cat > src/components/Layout/Header.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [flipCount, setFlipCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setFlipCount(p => p + 1), 60000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-40 py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className={`text-4xl ${flipCount % 2 === 0 ? 'crown-flip' : ''}`}>👑</div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">GambleCodez</h1>
            <p className="text-xs text-gray-400">Redeem today, flex tomorrow.</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
EOF

# ======== src/components/Layout/Footer.jsx ========
cat > src/components/Layout/Footer.jsx << 'EOF'
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 mt-16 py-8 px-6">
      <div className="max-w-7xl mx-auto text-center text-xs text-gray-500">
        <p>&copy; 2025 GambleCodez. All rights reserved.</p>
      </div>
    </footer>
  );
}
EOF

# ======== src/components/Layout/Navigation.jsx ========
cat > src/components/Layout/Navigation.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-16 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex gap-6">
        <Link to="/sites" className="text-gray-300 hover:text-cyan-400">All Sites</Link>
        <Link to="/raffles" className="text-gray-300 hover:text-cyan-400">Raffles</Link>
        <Link to="/newsletter" className="text-gray-300 hover:text-cyan-400">Newsletter</Link>
        <Link to="/blacklist" className="text-red-500 hover:text-red-400">Blacklist</Link>
      </div>
    </nav>
  );
}
EOF

# ======== src/components/UI/Toast.jsx ========
cat > src/components/UI/Toast.jsx << 'EOF'
import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', duration = 4000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const types = {
    success: 'bg-green-500',
    error: 'bg-red-600',
    info: 'bg-cyan-400',
  };
  
  return (
    <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg font-bold z-50 text-black ${types[type]}`}>
      {message}
    </div>
  );
}
EOF

# ======== PAGES ========

# src/pages/Home.jsx
cat > src/pages/Home.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <div className="text-8xl mb-4">👑</div>
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">GambleCodez</h2>
        <p className="text-2xl text-gray-400 mb-8">Redeem today, flex tomorrow.</p>
        <Link to="/sites" className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded-lg inline-block">
          Explore Sites →
        </Link>
      </div>
    </div>
  );
}
EOF

# src/pages/AllSites.jsx
cat > src/pages/AllSites.jsx << 'EOF'
import React, { useContext, useEffect } from 'react';
import { SitesContext } from '../context/SitesContext';

export default function AllSites() {
  const { sites, loading, fetchSites, currentPage, setCurrentPage, totalPages } = useContext(SitesContext);
  
  useEffect(() => {
    fetchSites(null, currentPage);
  }, [currentPage]);
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">All Sites</h1>
      
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {sites.map(site => (
              <div key={site.id} className="bg-gray-950 border border-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-cyan-400 mb-2">{site.name}</h3>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded">
                  Visit
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded ${page === currentPage ? 'bg-cyan-400 text-black' : 'bg-gray-900 border border-gray-700'}`}
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
EOF

# src/pages/CategoryPage.jsx
cat > src/pages/CategoryPage.jsx << 'EOF'
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
      <h1 className="text-4xl font-bold mb-8 text-cyan-400 capitalize">{category}</h1>
      {loading ? <p>Loading...</p> : <p className="text-gray-400">{sites.length} found</p>}
    </div>
  );
}
EOF

# src/pages/Blacklist.jsx
cat > src/pages/Blacklist.jsx << 'EOF'
import React from 'react';

export default function Blacklist() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-red-500 mb-8">⚠️ Blacklist</h1>
      <p className="text-gray-400">No blacklisted sites at this time.</p>
    </div>
  );
}
EOF

# src/pages/Newsletter.jsx
cat > src/pages/Newsletter.jsx << 'EOF'
import React, { useState } from 'react';
import { apiClient } from '../utils/api';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.subscribeNewsletter(email, '');
      localStorage.setItem('gcz_subscribed', 'true');
      setSubmitted(true);
    } catch (err) {
      alert('Error');
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">Newsletter</h1>
      
      {submitted ? (
        <p className="text-green-400">✅ Subscribed!</p>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-800 rounded-lg p-6">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white mb-4"
            placeholder="your@email.com"
          />
          <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
EOF

# src/pages/Raffles.jsx
cat > src/pages/Raffles.jsx << 'EOF'
import React from 'react';

export default function Raffles() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">🎁 Raffles</h1>
      <p className="text-gray-400">Active raffles coming soon.</p>
    </div>
  );
}
EOF

# src/pages/Contact.jsx
cat > src/pages/Contact.jsx << 'EOF'
import React, { useState } from 'react';
import { apiClient } from '../utils/api';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.submitContact(formData.name, formData.email, formData.subject, formData.message);
      setSubmitted(true);
    } catch (err) {
      alert('Error');
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">Contact</h1>
      {submitted ? (
        <p className="text-green-400">✅ Message sent!</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Name" onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
          <input type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
          <input type="text" placeholder="Subject" onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
          <textarea placeholder="Message" onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white h-32"></textarea>
          <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded">Send</button>
        </form>
      )}
    </div>
  );
}
EOF

# src/pages/NotFound.jsx
cat > src/pages/NotFound.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-6xl font-bold text-cyan-400 mb-4">404</h1>
      <Link to="/" className="text-cyan-400 hover:text-purple-600">Go Home</Link>
    </div>
  );
}
EOF

# ======== CONFIG FILES ========

# vite.config.js
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 }
})
EOF

# tailwind.config.js
cat > tailwind.config.js << 'EOF'
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
EOF

# postcss.config.js
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# .env.example
cat > .env.example << 'EOF'
VITE_API_URL=http://localhost:5000/api
EOF

cp .env.example .env

echo ""
echo "✅ INSTALLATION COMPLETE!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Edit .env and set VITE_API_URL to your backend"
echo "2. npm install (if not already done)"
echo "3. npm run dev"
echo ""
echo "🎉 App will run at http://localhost:3000"
echo ""
