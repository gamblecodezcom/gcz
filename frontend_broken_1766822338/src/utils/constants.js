export const CATEGORY_COLORS = {
  us: '#3b82f6',
  nonus: '#a855f7',
  sweeps: '#06b6d4',
  crypto: '#f97316',
  instant: '#10b981',
  lootbox: '#ec4899',
  faucet: '#14b8a6',
  new: '#fbbf24',
  blacklist: '#ef4444',
  top_pick: '#fbbf24',
};

export const CATEGORIES = [
  { name: 'us', label: 'US', path: '/us' },
  { name: 'nonus', label: 'Non-US', path: '/nonus' },
  { name: 'sweeps', label: 'Sweeps', path: '/sweeps' },
  { name: 'crypto', label: 'Crypto', path: '/crypto' },
  { name: 'instant', label: 'Instant', path: '/instant' },
  { name: 'lootbox', label: 'Lootbox', path: '/lootbox' },
  { name: 'faucet', label: 'Faucet', path: '/faucet' },
];

export const SOCIALS = {
  telegram: 'https://t.me/GambleCodezDrops',
  twitter: 'https://twitter.com/GambleCodez',
  telegramBot: 'https://t.me/GambleCodezCasinoDrops_bot',
};

export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category?.toLowerCase()] || CATEGORY_COLORS.us;
};
