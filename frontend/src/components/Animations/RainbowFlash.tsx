import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../utils/constants';

export const RainbowFlash = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const lastShown = localStorage.getItem(STORAGE_KEYS.RAINBOW_FLASH_SHOWN);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastShown || now - parseInt(lastShown) > oneDay) {
      setShow(true);
      localStorage.setItem(STORAGE_KEYS.RAINBOW_FLASH_SHOWN, now.toString());
      
      setTimeout(() => {
        setShow(false);
      }, 500);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none animate-rainbow-flash">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF0000" stopOpacity="0.8" />
            <stop offset="16.66%" stopColor="#FF7F00" stopOpacity="0.8" />
            <stop offset="33.33%" stopColor="#FFFF00" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00FF00" stopOpacity="0.8" />
            <stop offset="66.66%" stopColor="#0000FF" stopOpacity="0.8" />
            <stop offset="83.33%" stopColor="#4B0082" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9400D3" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#rainbow)" opacity="0.6" />
      </svg>
    </div>
  );
};
