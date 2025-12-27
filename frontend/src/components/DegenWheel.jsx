import React, { useEffect, useRef } from 'react';
import '../styles/DegenWheel.css';

const segments = ['5', '10', '25', '50', '100', 'JACKPOT', '10', '5'];

const DegenWheel = ({ spinning, reward }) => {
  const wheelRef = useRef(null);

  useEffect(() => {
    if (spinning && wheelRef.current) {
      const index = segments.indexOf(reward?.toString() || '5');
      const angle = 3600 + (360 / segments.length) * index;
      wheelRef.current.style.transform = `rotate(${angle}deg)`;
    }
  }, [spinning, reward]);

  return (
    <div className="wheel-container">
      <div className="wheel" ref={wheelRef}>
        {segments.map((label, i) => (
          <div key={i} className="segment" style={{ transform: `rotate(${(360 / segments.length) * i}deg)` }}>
            {label}
          </div>
        ))}
      </div>
      <div className="pointer">▼</div>
    </div>
  );
};

export default DegenWheel;