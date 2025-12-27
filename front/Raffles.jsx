// frontend/src/pages/Raffles.jsx
import React, { useEffect, useState } from "react";
import { getRaffles, enterRaffle } from "../utils/api";

const Raffles = () => {
  const [raffles, setRaffles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRaffles()
      .then(setRaffles)
      .catch(() => setError("Failed to load raffles"));
  }, []);

  const handleEnter = async (id) => {
    try {
      await enterRaffle("demo-user", id);
      alert("Entry submitted!");
    } catch {
      alert("Error entering raffle.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl mb-4 text-center">🎁 Active Raffles</h2>
      {error && <p className="text-red-400">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {raffles.map((raffle) => (
          <div key={raffle.id} className="border border-pink-500 p-4 rounded-lg">
            <h3 className="text-xl font-bold">{raffle.title}</h3>
            <p>{raffle.description}</p>
            <p className="text-sm text-gray-400">Ends: {new Date(raffle.end_date).toLocaleString()}</p>
            <button
              className="mt-3 neon-button"
              onClick={() => handleEnter(raffle.id)}
            >
              Enter Raffle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Raffles;