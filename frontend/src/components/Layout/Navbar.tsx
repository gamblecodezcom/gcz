import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PushNotificationBell } from '../Notifications/PushNotificationBell';

const CrownLogo = () => {
  const [isFlipping, setIsFlipping] = useState(false);

  const handleHover = () => {
    setIsFlipping(true);
    setTimeout(() => setIsFlipping(false), 600);
  };

  return (
    <Link to="/" className="flex items-center space-x-2 group" onMouseEnter={handleHover}>
      <svg
        className={`w-8 h-8 transition-transform duration-600 ${isFlipping ? 'animate-flip' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
          fill="url(#crownGradient)"
          className="drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
        />
        <defs>
          <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD600" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-xl font-bold font-orbitron neon-glow-yellow">GambleCodez</span>
    </Link>
  );
};

export const Navbar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/degen-login', label: 'Degen Login' },
    { path: '/degen-profile', label: 'Degen Profile' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/drops', label: 'Drops' },
    { path: '/raffles', label: 'Raffles' },
    { path: '/wheel', label: 'Wheel' },
    { path: '/newsletter', label: 'Newsletter' },
    { path: '/affiliates', label: 'Affiliates' },
    { path: '/sites/recent', label: 'Recent' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/blacklist', label: 'Blacklist' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 glass-strong border-b border-neon-cyan/30 transition-all duration-300 ${
          isVisible ? 'translate-y-0 shadow-glow-cyan' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <CrownLogo />
            
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 relative group ${
                    location.pathname === link.path
                      ? 'text-neon-cyan neon-glow-cyan bg-neon-cyan/10'
                      : 'text-text-muted hover:text-neon-cyan hover:bg-neon-cyan/5'
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                  {location.pathname === link.path && (
                    <>
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan shadow-glow-cyan" />
                      <span className="absolute inset-0 bg-neon-cyan/10 rounded-lg -z-0" />
                    </>
                  )}
                  {!location.pathname.includes(link.path) && (
                    <span className="absolute inset-0 bg-neon-cyan/0 rounded-lg transition-all duration-300 group-hover:bg-neon-cyan/5 -z-0" />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <PushNotificationBell />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-text-primary hover:text-neon-cyan transition-colors p-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed top-16 left-0 right-0 z-40 glass-strong border-b border-neon-cyan/30 shadow-glow-cyan transition-all duration-300 md:hidden ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  location.pathname === link.path
                    ? 'text-neon-cyan neon-glow-cyan bg-neon-cyan/15 border border-neon-cyan/50 shadow-glow-cyan'
                    : 'text-text-muted hover:text-neon-cyan hover:bg-neon-cyan/10 border border-transparent hover:border-neon-cyan/30'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
