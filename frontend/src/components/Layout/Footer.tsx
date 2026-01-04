import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSocials, type Socials } from '../../utils/api';
import { SOCIAL_LINKS } from '../../utils/constants';

export const Footer = () => {
  const [socials, setSocials] = useState<Socials | null>(null);

  useEffect(() => {
    getSocials().then(setSocials).catch(() => {
      // Fallback to constants if API fails
      setSocials({
        telegram: SOCIAL_LINKS.telegram,
        twitter: SOCIAL_LINKS.twitter,
        email: SOCIAL_LINKS.email,
        cwalletAffiliateUrl: '',
        websiteUrl: '',
      });
    });
  }, []);

  const displaySocials = socials || {
    telegram: SOCIAL_LINKS.telegram,
    twitter: SOCIAL_LINKS.twitter,
    email: SOCIAL_LINKS.email,
    cwalletAffiliateUrl: '',
    websiteUrl: '',
  };
  const footerLinks = [
    { path: '/drops', label: 'Drops' },
    { path: '/raffles', label: 'Raffles' },
    { path: '/wheel', label: 'Degen Wheel' },
    { path: '/affiliates', label: 'Affiliates' },
    { path: '/blacklist', label: 'Blacklist' },
    { path: '/sites/recent', label: 'Recently Added' },
    { path: '/contact', label: 'Contact' },
    { path: '/terms', label: 'Terms' },
    { path: '/privacy', label: 'Privacy' },
  ];

  return (
    <footer className="bg-gradient-to-b from-bg-dark via-bg-dark-2 to-bg-dark border-t border-neon-cyan/30 mt-20 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/8 via-transparent to-neon-pink/8 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-radial from-neon-cyan/3 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4 group">
              <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
                  fill="url(#crownGradient)"
                />
                <defs>
                  <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD600" />
                    <stop offset="100%" stopColor="#FFA500" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-lg font-bold font-orbitron neon-glow-yellow">GambleCodez</span>
            </div>
            <p className="text-text-muted text-sm mb-4">Redeem today, flex tomorrow.</p>
            <p className="text-text-muted text-xs">
              Your trusted source for casino drops, raffles, and rewards.
            </p>
          </div>

          {/* Middle: Links */}
          <div>
            <h3 className="text-neon-cyan font-semibold mb-4 text-lg">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-text-muted hover:text-neon-cyan text-sm transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-1 group"
                >
                  <span>{link.label}</span>
                  <svg 
                    className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Social */}
          <div>
            <h3 className="text-neon-cyan font-semibold mb-4 text-lg">Connect</h3>
            <div className="flex space-x-4 mb-4">
              <a
                href={displaySocials.telegram.channel}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/10 border-2 border-neon-cyan/50 flex items-center justify-center hover:scale-110 hover:shadow-glow-cyan hover:border-neon-cyan hover:bg-neon-cyan/30 transition-all duration-300 group relative overflow-hidden"
                aria-label="Telegram"
              >
                <span className="absolute inset-0 bg-neon-cyan/0 group-hover:bg-neon-cyan/20 transition-all duration-300 rounded-full" />
                <svg className="w-7 h-7 text-neon-cyan group-hover:scale-110 transition-transform relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
              </a>
              <a
                href={displaySocials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-full bg-gradient-to-br from-white/15 to-white/5 border-2 border-white/30 flex items-center justify-center hover:scale-110 hover:shadow-glow-cyan hover:border-neon-cyan/50 hover:bg-white/20 transition-all duration-300 group relative overflow-hidden"
                aria-label="Twitter/X"
              >
                <span className="absolute inset-0 bg-neon-cyan/0 group-hover:bg-neon-cyan/10 transition-all duration-300 rounded-full" />
                <svg className="w-7 h-7 text-white group-hover:scale-110 group-hover:text-neon-cyan transition-all relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
            <a
              href={`mailto:${displaySocials.email}`}
              className="text-text-muted hover:text-neon-cyan text-sm transition-all duration-200 inline-flex items-center gap-2 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {displaySocials.email}
            </a>
          </div>
        </div>

        <div className="border-t border-neon-cyan/30 mt-12 pt-8 text-center relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
          <p className="text-text-muted text-sm mb-2">
            &copy; {new Date().getFullYear()} GambleCodez. All rights reserved.
          </p>
          <p className="text-text-muted text-xs">
            Gamble responsibly. 18+ only. Terms apply.
          </p>
        </div>
      </div>
    </footer>
  );
};
