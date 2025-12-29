import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../../utils/constants';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem(STORAGE_KEYS.PWA_PROMPT_SHOWN) === 'true';
    if (hasShown) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 3 seconds or first scroll
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      const handleScroll = () => {
        setShowPrompt(true);
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll);
      };
      window.addEventListener('scroll', handleScroll, { once: true });

      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll);
      };
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEYS.PWA_PROMPT_SHOWN, 'true');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.PWA_PROMPT_SHOWN, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-bg-dark-2 border-2 border-neon-cyan rounded-lg p-4 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-neon-cyan font-bold mb-1">Install GambleCodez</h3>
          <p className="text-sm text-text-muted">
            Install as an app for faster drops and notifications.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-muted hover:text-neon-cyan transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 bg-neon-cyan text-bg-dark px-4 py-2 rounded-md font-semibold hover:shadow-neon-cyan transition-all"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-text-muted hover:text-neon-cyan transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};
