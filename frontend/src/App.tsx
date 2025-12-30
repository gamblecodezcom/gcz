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
import { SEOHead } from './components/Common/SEOHead';

const NotFound = () => {
  return (
    <>
      <SEOHead
        title="404 - Page Not Found"
        description="The page you're looking for doesn't exist."
        noindex={true}
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
};

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen relative">
          <AnimatedDice />
          <RainbowFlash />
          <Navbar />
          <LiveBanner />
          <main className="relative z-10 page-transition">
            <Routes>
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/drops" element={<ErrorBoundary><Drops /></ErrorBoundary>} />
              <Route path="/raffles" element={<ErrorBoundary><Raffles /></ErrorBoundary>} />
              <Route path="/wheel" element={<ErrorBoundary><Wheel /></ErrorBoundary>} />
              <Route path="/affiliates" element={<ErrorBoundary><Affiliates /></ErrorBoundary>} />
              <Route path="/sites/recent" element={<ErrorBoundary><RecentSites /></ErrorBoundary>} />
              <Route path="/leaderboard" element={<ErrorBoundary><Leaderboard /></ErrorBoundary>} />
              <Route path="/blacklist" element={<ErrorBoundary><Blacklist /></ErrorBoundary>} />
              <Route path="/contact" element={<ErrorBoundary><Contact /></ErrorBoundary>} />
              <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
              <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/terms" element={<ErrorBoundary><Terms /></ErrorBoundary>} />
              <Route path="/privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />
              <Route path="/casino/:slug" element={<ErrorBoundary><Casino /></ErrorBoundary>} />
              <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
            </Routes>
          </main>
          <Footer />
          <PWAInstallPrompt />
          <NotificationPermissionPrompt />
          <AdSystem />
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
