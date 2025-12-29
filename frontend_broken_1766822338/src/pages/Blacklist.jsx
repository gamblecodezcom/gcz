import React from 'react';

export default function Blacklist() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="bg-red-950/30 border border-red-600 rounded-lg p-6 mb-8">
        <h1 className="text-4xl font-bold text-red-500 mb-2">⚠️ BLACKLIST</h1>
        <p className="text-gray-300">These sites have been reported as unsafe or fraudulent.</p>
      </div>
      <p className="text-gray-400">No blacklisted sites at this time.</p>
    </div>
  );
}
