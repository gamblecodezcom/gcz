import React from 'react';
import { getCategoryColor } from '../../utils/constants';

export default function CategoryBadge({ category, label = null }) {
  const labels = { us: 'US', nonus: 'Non-US', sweeps: 'Sweeps', crypto: 'Crypto', instant: 'Instant', lootbox: 'Lootbox', faucet: 'Faucet', new: '🆕 New', top_pick: '⭐ Top Pick' };
  
  const color = getCategoryColor(category);
  const text = label || labels[category?.toLowerCase()] || 'Category';
  
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-black" style={{ backgroundColor: color }}>
      {text}
    </span>
  );
}
