#!/bin/bash
# =============================================================================
# GambleCodez Frontend - COMPLETE INSTALLATION SCRIPT
# =============================================================================
# This script sets up the entire React frontend project structure and files
# Run this in your project root directory: bash INSTALL.sh
# =============================================================================

set -e

echo "🎰 GambleCodez Frontend - Installation Script"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo ""

# Step 1: Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/{components/{Layout,UI,Home,Sites,Raffles,Forms,Ads,PWA},pages,hooks,context,utils,styles,assets/{icons,animations,images}}
mkdir -p public/{icons,screenshots}

# Step 2: Copy all configuration files
echo "⚙️  Creating configuration files..."

# vite.config.js
cat > vite.config.js << 'VITE_CONFIG'
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
VITE_CONFIG

# tailwind.config.js
cat > tailwind.config.js << 'TAILWIND_CONFIG'
export default {
  content: ['./src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00eaff',
        'neon-purple': '#8a2be2',
        'neon-pink': '#ff006e',
        'dark-bg': '#000000',
        'card-bg': '#0a0a0a',
        'success': '#27e69a',
        'warning': '#ffcc00',
        'danger': '#ff4d6d',
      },
      fontFamily: {
        'bebas': ['"Bebas Neue"', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 30px rgba(0, 234, 255, 0.6)',
        'glow-purple': '0 0 30px rgba(138, 43, 226, 0.6)',
        'glow-pink': '0 0 30px rgba(255, 0, 110, 0.6)',
      },
    },
  },
  plugins: [],
};
TAILWIND_CONFIG

# postcss.config.js
cat > postcss.config.js << 'POSTCSS_CONFIG'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
POSTCSS_CONFIG

# .env.example
cat > .env.example << 'ENV_CONFIG'
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=GambleCodez
VITE_BRAND_MOTTO=Redeem today, flex tomorrow.
VITE_TELEGRAM_BOT_URL=https://t.me/GambleCodezCasinoDrops_bot
VITE_TELEGRAM_CHANNEL_URL=https://t.me/GambleCodezDrops
VITE_TELEGRAM_GROUP_URL=https://t.me/GambleCodezPrizeHub
VITE_TWITTER_URL=https://twitter.com/GambleCodez
ENV_CONFIG

# .gitignore
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
.vscode/
.idea/
GITIGNORE

# package.json
cat > package.json << 'PACKAGE_JSON'
{
  "name": "gamblecodez-frontend",
  "version": "1.0.0",
  "description": "GambleCodez - Casino Discovery Platform",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.2.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.2.0"
  }
}
PACKAGE_JSON

# Step 3: Create public files
echo "📢 Creating public files..."

# manifest.json
cat > public/manifest.json << 'MANIFEST'
{
  "name": "GambleCodez - Casino Discovery Platform",
  "short_name": "GambleCodez",
  "description": "Discover and win at the best online casinos and sweeps sites. Redeem today, flex tomorrow.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#00eaff",
  "background_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "categories": ["games"],
  "shortcuts": [
    {
      "name": "All Sites",
      "short_name": "Sites",
      "description": "Browse all casino sites",
      "url": "/sites"
    },
    {
      "name": "Raffles",
      "short_name": "Raffles",
      "description": "Enter daily raffles and win",
      "url": "/raffles"
    }
  ]
}
MANIFEST

# sw.js (Service Worker)
cat > public/sw.js << 'SERVICE_WORKER'
const CACHE_NAME = 'gamblecodez-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || new Response('Offline - try again later', { status: 503 });
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
SERVICE_WORKER

# Step 4: Create index.html
echo "🌐 Creating index.html..."

cat > index.html << 'INDEX_HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="GambleCodez - Discover and win at the best online casinos and sweeps sites.">
  <meta name="theme-color" content="#00eaff">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%2300eaff'>👑</text></svg>">
  <title>GambleCodez - Casino Discovery Platform</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
INDEX_HTML

# README.md
cat > README.md << 'README'
# GambleCodez Frontend

A neon-themed casino discovery platform built with React, Tailwind CSS, and Vite.

## Features

- 🎰 Dark neon aesthetic with cyan & purple accents
- 📱 Responsive design (mobile, tablet, desktop)
- 🤖 Telegram WebView support
- 📲 PWA with install prompt & offline fallback
- 🎯 Category-based filtering & pagination
- 🎁 Raffle system with daily check-in
- 📧 Newsletter subscription & gating
- 🎬 Smooth animations & transitions
- 🌐 Weighted ad system with 24h cooldown

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Building

```bash
npm run build
```

## Deployment

Deploy the `dist/` folder to your hosting provider.

---

**Build it fast. Ship it neon. ⚡✨**
README

echo "✅ Configuration files created!"
echo ""
echo "📦 Now installing dependencies..."
npm install

echo ""
echo "✅ Copy .env file:"
echo "   cp .env.example .env"
echo "   Then edit .env and set VITE_API_URL to your backend"
echo ""
echo "🚀 Ready to start development:"
echo "   npm run dev"
echo ""
echo "🏗️  To build for production:"
echo "   npm run build"
echo ""
echo "🎉 Installation complete!"
echo "🎰 GambleCodez Frontend is ready to use!"
