import React from 'react';
import { SOCIALS } from '../../utils/constants';

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 mt-16 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-cyan-400 mb-4">GambleCodez</h3>
            <p className="text-sm text-gray-400">Discover and win at the best online casinos.</p>
          </div>
          <div>
            <h4 className="font-bold text-cyan-400 mb-4">Links</h4>
            <ul className="text-sm space-y-2">
              <li><a href="/sites" className="text-gray-400 hover:text-cyan-400">All Sites</a></li>
              <li><a href="/raffles" className="text-gray-400 hover:text-cyan-400">Raffles</a></li>
              <li><a href="/blacklist" className="text-gray-400 hover:text-cyan-400">Blacklist</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-cyan-400 mb-4">Social</h4>
            <div className="flex gap-4">
              <a href={SOCIALS.telegram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400">Telegram</a>
              <a href={SOCIALS.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400">Twitter</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          <p>&copy; 2025 GambleCodez. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
