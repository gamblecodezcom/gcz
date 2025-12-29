import React, { useEffect, useState } from 'react';
import { get } from '../utils/api';

const Raffles = () => {
  const [raffles, setRaffles] = useState([]);

  useEffect(() => {
    const fetchRaffles = async () => {
      const data = await get('/raffles');
      setRaffles(data || []);
    };
    fetchRaffles();
  }, []);

  return (
    <div className="page">
      <h1>🎟️ Active Raffles</h1>
      <ul>
        {raffles.map((raffle) => (
          <li key={raffle.id}>
            <strong>{raffle.title}</strong> — Ends: {new Date(raffle.ends_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Raffles;