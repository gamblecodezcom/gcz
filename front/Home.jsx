// frontend/src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
      <h1 className="text-4xl md:text-6xl font-bold neon-text mb-6">
        Welcome to GambleCodez 🎰
      </h1>
      <p className="mb-8 text-lg max-w-2xl">
        Daily Spins, Crypto Raffles, and Instant Bonuses — All powered by your favorite degen casinos.
      </p>
      <button
        onClick={() => navigate("/daily-spin")}
        className="neon-button text-2xl px-6 py-3"
      >
        Spin Your Degen Daily Wheel
      </button>
    </div>
  );
};

export default Home;