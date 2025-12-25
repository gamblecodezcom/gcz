import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-center">
      <h1 className="text-6xl font-bold text-cyan-400 mb-4">404</h1>
      <p className="text-2xl text-gray-300 mb-8">Page not found</p>
      <Link to="/" className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded-lg inline-block">
        Go Home
      </Link>
    </div>
  );
}
