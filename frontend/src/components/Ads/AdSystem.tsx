import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../../utils/constants';

interface Ad {
  id: string;
  type: 'popup' | 'banner' | 'inline';
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  weight: number; // 1-100, higher = more likely to show
}

export const AdSystem = () => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    const checkAndShowAd = () => {
      const lastShown = localStorage.getItem(STORAGE_KEYS.AD_SHOWN);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (lastShown && now - parseInt(lastShown) < oneDay) {
        return; // Already shown in last 24h
      }

      // TODO: Fetch ads from API with weighted selection
      // For now, using mock data
      const mockAds: Ad[] = [
        {
          id: '1',
          type: 'popup',
          title: 'Special Offer',
          content: 'Check out our latest casino bonuses!',
          linkUrl: '/affiliates',
          weight: 50,
        },
      ];

      // Weighted random selection
      const totalWeight = mockAds.reduce((sum, ad) => sum + ad.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedAd: Ad | null = null;

      for (const ad of mockAds) {
        random -= ad.weight;
        if (random <= 0) {
          selectedAd = ad;
          break;
        }
      }

      if (selectedAd) {
        setAd(selectedAd);
        setShowAd(true);
        localStorage.setItem(STORAGE_KEYS.AD_SHOWN, now.toString());
      }
    };

    // Show ad after 5 seconds on page load
    const timer = setTimeout(checkAndShowAd, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowAd(false);
  };

  const handleClick = () => {
    if (ad?.linkUrl) {
      window.location.href = ad.linkUrl;
    }
  };

  if (!showAd || !ad) return null;

  if (ad.type === 'popup') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
        <div className="bg-gradient-to-br from-bg-dark-2 to-bg-dark border-2 border-neon-cyan rounded-2xl p-8 max-w-md w-full mx-4 relative shadow-2xl shadow-neon-cyan/30 transform transition-all duration-300 animate-scaleIn">
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-2xl bg-neon-cyan/20 blur-xl -z-10 animate-pulse" />
          
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-text-muted hover:text-neon-cyan transition-all duration-300 hover:scale-110 hover:rotate-90 p-2 rounded-full hover:bg-neon-cyan/10"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {ad.imageUrl && (
            <div className="relative mb-6 rounded-xl overflow-hidden">
              <img 
                src={ad.imageUrl} 
                alt={ad.title} 
                className="w-full h-48 object-cover transition-transform duration-500 hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark-2/80 to-transparent" />
            </div>
          )}
          
          <h3 className="text-3xl font-bold font-orbitron text-neon-cyan mb-3 neon-glow-cyan">
            {ad.title}
          </h3>
          
          <p className="text-text-muted mb-6 leading-relaxed">{ad.content}</p>
          
          {ad.linkUrl && (
            <button
              onClick={handleClick}
              className="w-full btn-neon bg-gradient-to-r from-neon-cyan to-neon-pink text-bg-dark px-6 py-3 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-neon-cyan/50 transition-all duration-300 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Learn More
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (ad.type === 'banner') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-neon-cyan/20 via-neon-pink/20 to-neon-yellow/20 border-t-2 border-neon-cyan/50 backdrop-blur-md p-4 animate-slideUp">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-neon-cyan mb-1">{ad.title}</h4>
            <p className="text-sm text-text-muted">{ad.content}</p>
          </div>
          <div className="flex items-center gap-3">
            {ad.linkUrl && (
              <button
                onClick={handleClick}
                className="px-4 py-2 bg-neon-cyan text-bg-dark rounded-lg font-semibold hover:shadow-neon-cyan transition-all"
              >
                View
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-text-muted hover:text-neon-cyan transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (ad.type === 'inline') {
    return (
      <div className="bg-gradient-to-br from-bg-dark-2 to-bg-dark border-2 border-neon-cyan/30 rounded-xl p-6 my-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-neon-pink/5 to-neon-yellow/5 animate-shimmer" />
        <div className="relative z-10 flex items-center gap-6">
          {ad.imageUrl && (
            <img 
              src={ad.imageUrl} 
              alt={ad.title} 
              className="w-24 h-24 object-cover rounded-lg" 
            />
          )}
          <div className="flex-1">
            <h4 className="text-xl font-bold text-neon-cyan mb-2">{ad.title}</h4>
            <p className="text-text-muted mb-3">{ad.content}</p>
            {ad.linkUrl && (
              <button
                onClick={handleClick}
                className="text-neon-cyan hover:underline font-semibold flex items-center gap-2"
              >
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
