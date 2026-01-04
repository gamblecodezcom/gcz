import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../../utils/constants';

export const NotificationPermissionPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PROMPT_SHOWN) === 'true';
    if (hasShown) return;

    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register service worker and subscribe to push if configured
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        }
      }
    }
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PROMPT_SHOWN, 'true');
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PROMPT_SHOWN, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-bg-dark-2 border-2 border-neon-pink rounded-lg p-4 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-neon-pink font-bold mb-1">Enable Notifications</h3>
          <p className="text-sm text-text-muted">
            Stay ahead of promos and raffle winners. Turn on notifications?
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-muted hover:text-neon-pink transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleEnable}
          className="flex-1 bg-neon-pink text-white px-4 py-2 rounded-md font-semibold hover:shadow-neon-pink transition-all"
        >
          Enable
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-text-muted hover:text-neon-pink transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
};
