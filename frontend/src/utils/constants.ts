export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'https://gamblecodez.com';

export const CWALLET_AFFILIATE_URL = 'https://cwallet.com/referral/Nwnah81L';

export const SOCIAL_LINKS = {
  telegram: {
    bot: 'https://t.me/GambleCodezCasinoDrops_bot',
    channel: 'https://t.me/GambleCodezDrops',
    group: 'https://t.me/GambleCodezPrizeHub',
  },
  twitter: 'https://x.com/GambleCodez',
  email: 'GambleCodez@gmail.com',
};

export const CATEGORY_CONFIG: Record<string, { color: string; emblem: string; glow: string }> = {
  sweeps: { color: 'text-yellow-400', emblem: '🎟️', glow: 'shadow-neon-yellow' },
  crypto: { color: 'text-green-400', emblem: '₿', glow: 'shadow-neon-green' },
  lootbox: { color: 'text-orange-400', emblem: '🎁', glow: 'shadow-orange-500' },
  faucet: { color: 'text-cyan-400', emblem: '💧', glow: 'shadow-neon-cyan' },
  instant: { color: 'text-yellow-400', emblem: '⚡', glow: 'shadow-neon-yellow' },
  kyc: { color: 'text-red-400', emblem: '🛂', glow: 'shadow-red-500' },
  top_pick: { color: 'text-white', emblem: '👑', glow: 'shadow-neon-gold' },
};

export const JURISDICTION_CONFIG: Record<string, { color: string; bg: string }> = {
  US: { color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-400/50' },
  NON_US: { color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-400/50' },
  GLOBAL: { color: 'text-gray-300', bg: 'bg-gray-500/20 border-gray-400/50' },
};

export const NOTIFICATION_TYPE_CONFIG: Record<string, { bg: string; border: string }> = {
  promo: { bg: 'bg-pink-600/40', border: 'border-pink-400/70' },
  winner: { bg: 'bg-yellow-500/30', border: 'border-yellow-400/80' },
  new_site: { bg: 'bg-cyan-500/30', border: 'border-cyan-400/80' },
  system: { bg: 'bg-purple-700/30', border: 'border-purple-400/80' },
  info: { bg: 'bg-blue-500/30', border: 'border-blue-400/80' },
};

export const STORAGE_KEYS = {
  BANNER_DISMISSED: 'gcz_banner_dismissed_',
  PWA_PROMPT_SHOWN: 'gcz_pwa_prompt_shown_v1',
  NOTIFICATION_PROMPT_SHOWN: 'gcz_notification_prompt_shown',
  RAINBOW_FLASH_SHOWN: 'gcz_rainbow_flash_shown',
  AD_SHOWN: 'gcz_ad_shown',
};
