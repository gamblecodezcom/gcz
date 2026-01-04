import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { LiveBanner } from './components/Notifications/LiveBanner';
import { RainbowFlash } from './components/Animations/RainbowFlash';
import { AnimatedDice } from './components/Animations/AnimatedDice';
import { PWAInstallPrompt } from './components/PWA/PWAInstallPrompt';
import { NotificationPermissionPrompt } from './components/PWA/NotificationPermissionPrompt';
import { AdSystem } from './components/Ads/AdSystem';

import { Home } from './pages/Home';
import { Drops } from './pages/Drops';
import { Raffles } from './pages/Raffles';
import { Wheel } from './pages/Wheel';
import { Affiliates } from './pages/Affiliates';
import { RecentSites } from './pages/RecentSites';
import { Leaderboard } from './pages/Leaderboard';
import { Blacklist } from './pages/Blacklist';
import { Contact } from './pages/Contact';
import { Profile } from './pages/Profile';
import { Dashboard } from './pages/Dashboard';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Casino } from './pages/Casino';
import { DegenLogin } from './pages/DegenLogin';
import { Newsletter } from './pages/Newsletter';
import { SEOHead } from './components/Common/SEOHead';

const NotFound = () => (
  <>
    <SEOHead
      title="404 - Page Not Found"
      description="The page you're looking for doesn't exist."
      noindex
    />
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 neon-glow-cyan">404</h1>
        <p className="text-text-muted mb-4">Page not found</p>
        <a href="/" className="text-neon-cyan hover:underline">
          Go home →
        </a>
      </div>
    </div>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen relative">
          {/* Global FX */}
          <AnimatedDice />
          <RainbowFlash />

          {/* Layout */}
          <Navbar />
          <LiveBanner />

          <main className="relative z-10 page-transition">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<DegenLogin />} />
              <Route path="/degen-login" element={<DegenLogin />} />
              <Route path="/degen-profile" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/drops" element={<Drops />} />
              <Route path="/raffles" element={<Raffles />} />
              <Route path="/wheel" element={<Wheel />} />
              <Route path="/newsletter" element={<Newsletter />} />
              <Route path="/affiliates" element={<Affiliates />} />
              <Route path="/sites/recent" element={<RecentSites />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/blacklist" element={<Blacklist />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/casino/:slug" element={<Casino />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />

          {/* System-level components */}
          <PWAInstallPrompt />
          <NotificationPermissionPrompt />
          <AdSystem />
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
