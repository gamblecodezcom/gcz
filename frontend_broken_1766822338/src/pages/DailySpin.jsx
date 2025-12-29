import React, { useState, useEffect } from 'react';
import { get, post } from '../utils/api';
import DegenWheel from '../components/DegenWheel';

const DailySpin = () => {
  const [cooldown, setCooldown] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState(null);

  useEffect(() => {
    get('/daily-spin/status').then((res) => setCooldown(res.cooldown || null));
  }, []);

  const handleSpin = async () => {
    setSpinning(true);
    const result = await post('/daily-spin', {});
    setTimeout(() => {
      setReward(result.reward);
      setSpinning(false);
      setCooldown(result.cooldown || null);
    }, 3600); // 3.6s match to animation duration
  };

  return (
    <div className="page">
      <h1>🎯 Daily Spin</h1>
      {cooldown ? (
        <p>Next spin in: {cooldown}</p>
      ) : (
        <>
          <DegenWheel spinning={spinning} reward={reward} />
          <button onClick={handleSpin} disabled={spinning}>
            {spinning ? 'Spinning...' : 'Spin Now'}
          </button>
          {reward && <div className="reward-popup">You won: {reward}</div>}
        </>
      )}
    </div>
  );
};

export default DailySpin;