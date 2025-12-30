import React, { useEffect, useState } from 'react';

interface RainbowFlashProps {
  trigger?: boolean;
  duration?: number;
  children?: React.ReactNode;
}

export const RainbowFlash: React.FC<RainbowFlashProps> = ({
  trigger = false,
  duration = 500,
  children
}) => {
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  if (!children) {
    return (
      <div
        className={`rainbow-flash-overlay ${isFlashing ? 'active' : ''}`}
        style={{ '--duration': `${duration}ms` } as React.CSSProperties}
      />
    );
  }

  return (
    <div
      className={`rainbow-flash-wrapper ${isFlashing ? 'active' : ''}`}
      style={{ '--duration': `${duration}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
