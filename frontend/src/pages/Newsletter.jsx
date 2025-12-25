import React, { useState } from 'react';
import { apiClient } from '../utils/api';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.subscribeNewsletter(email, telegram, '');
      localStorage.setItem('gcz_subscribed', 'true');
      setSubmitted(true);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">Subscribe to Newsletter</h1>
      
      {submitted ? (
        <div className="bg-green-950 border border-green-600 rounded-lg p-6 text-center">
          <p className="text-green-400 font-bold text-xl">✅ Subscribed!</p>
          <p className="text-gray-300 mt-2">Check your email for confirmation.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-cyan-400 mb-2">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-purple-400 mb-2">Telegram Handle</label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              placeholder="@username"
            />
          </div>
          
          <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded-lg hover:shadow-lg">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
