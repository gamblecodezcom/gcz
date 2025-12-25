import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <div className="text-8xl mb-4 animate-bounce">👑</div>
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
          Welcome to GambleCodez
        </h2>
        <p className="text-2xl text-gray-400 mb-8">Redeem today, flex tomorrow.</p>
        <Link to="/sites" className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 inline-block">
          Explore All Sites →
        </Link>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="bg-gray-950 border border-cyan-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
          <div className="text-4xl mb-4">🎰</div>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Best Sites</h3>
          <p className="text-gray-400">Discover top-rated casinos and sweeps platforms.</p>
        </div>
        
        <div className="bg-gray-950 border border-purple-600/30 rounded-lg p-6 hover:shadow-lg hover:shadow-purple-600/50 transition-all">
          <div className="text-4xl mb-4">🎁</div>
          <h3 className="text-xl font-bold text-purple-400 mb-2">Daily Raffles</h3>
          <p className="text-gray-400">Enter raffles and win exclusive prizes daily.</p>
        </div>
        
        <div className="bg-gray-950 border border-pink-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-pink-600/50 transition-all">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-bold text-pink-400 mb-2">Fast Payouts</h3>
          <p className="text-gray-400">Claim your winnings instantly with verified sites.</p>
        </div>
      </div>
    </div>
  );
}
