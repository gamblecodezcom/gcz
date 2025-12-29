import { useState, useEffect, useRef } from 'react';
import { getPushNotifications, markPushNotificationRead } from '../../utils/api';
import type { SitePushNotification } from '../../types';

export const PushNotificationBell = () => {
  const [notifications, setNotifications] = useState<SitePushNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const notifs = await getPushNotifications();
      setNotifications(notifs.filter(n => !n.readAt));
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markPushNotificationRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-primary hover:text-neon-cyan transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-neon-pink rounded-full text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-bg-dark-2 border border-neon-cyan/30 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-text-muted">No new notifications</div>
          ) : (
            <div className="py-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 border-b border-neon-cyan/10 hover:bg-bg-dark transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-primary mb-1">{notif.title}</h4>
                      <p className="text-sm text-text-muted mb-2">{notif.body}</p>
                      <span className="text-xs text-text-muted">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="ml-2 text-text-muted hover:text-neon-cyan transition-colors"
                      aria-label="Mark as read"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                  {notif.linkUrl && (
                    <a
                      href={notif.linkUrl}
                      className="text-xs text-neon-cyan hover:underline mt-2 block"
                    >
                      View →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
