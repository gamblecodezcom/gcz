import { useState, useEffect } from 'react';
import { getLiveNotification } from '../../utils/api';
import { STORAGE_KEYS, NOTIFICATION_TYPE_CONFIG } from '../../utils/constants';
import type { LiveNotification } from '../../types';

export const LiveBanner = () => {
  const [notification, setNotification] = useState<LiveNotification | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchNotification = async () => {
      const notif = await getLiveNotification();
      if (notif) {
        const dismissedKey = `${STORAGE_KEYS.BANNER_DISMISSED}${notif.id}`;
        const isDismissed = localStorage.getItem(dismissedKey) === 'true';
        if (!isDismissed) {
          setNotification(notif);
        }
      }
    };
    fetchNotification();
  }, []);

  const handleDismiss = () => {
    if (notification) {
      const dismissedKey = `${STORAGE_KEYS.BANNER_DISMISSED}${notification.id}`;
      localStorage.setItem(dismissedKey, 'true');
      setDismissed(true);
    }
  };

  if (!notification || dismissed) return null;

  const config = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.info;

  return (
    <div className={`${config.bg} ${config.border} border-t-2 border-b-2 py-2 relative`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex-1 text-center">
          {notification.linkUrl ? (
            <a
              href={notification.linkUrl}
              className="text-sm font-medium hover:underline"
            >
              {notification.message}
            </a>
          ) : (
            <p className="text-sm font-medium">{notification.message}</p>
          )}
        </div>
        {notification.dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-4 text-text-primary hover:text-neon-cyan transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
