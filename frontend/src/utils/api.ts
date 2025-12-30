import axios from 'axios';
import { API_BASE_URL } from './constants';
import type { SiteCard, LiveNotification, SitePushNotification, Paginated, Raffle, Profile, LinkedSite, DashboardStats, Reward, RunewagerTip, CryptoTip, LootboxReward, TelegramNotification, SecretCodeResponse, RaffleEntry } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Auto-attach credentials (cookies)
});

// Request interceptor to attach credentials
api.interceptors.request.use(
  (config) => {
    // Credentials are automatically attached via withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - redirect to profile (PIN gate)
    if (error.response?.status === 401) {
      // Only redirect if not already on profile page
      if (window.location.pathname !== '/profile') {
        window.location.href = '/profile';
      }
      return Promise.reject(new Error('Authentication required. Please set your PIN.'));
    }

    // Handle blacklist responses gracefully
    if (error.response?.status === 403 && error.response?.data?.message?.toLowerCase().includes('blacklist')) {
      return Promise.reject(new Error('Access denied. Your account has been restricted.'));
    }

    // Handle other errors
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Sites
export const getSites = async (params?: {
  jurisdiction?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<SiteCard>> => {
  const response = await api.get('/api/sites', { params });
  return response.data;
};

export const getRecentSites = async (params?: {
  jurisdiction?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<SiteCard>> => {
  const response = await api.get('/api/sites/recent', { params });
  return response.data;
};

// Notifications
export const getLiveNotification = async (): Promise<LiveNotification | null> => {
  try {
    const response = await api.get('/api/notifications/live');
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getPushNotifications = async (): Promise<SitePushNotification[]> => {
  const response = await api.get('/api/push');
  return response.data;
};

export const markPushNotificationRead = async (id: string): Promise<void> => {
  await api.patch(`/api/push/${id}/read`);
};

// Raffles
export const getRaffles = async (): Promise<Raffle[]> => {
  const response = await api.get('/api/raffles');
  return response.data;
};

// Profile
export const getProfile = async (): Promise<Profile> => {
  const response = await api.get('/api/profile');
  return response.data;
};

export const updateProfile = async (data: {
  username?: string;
  cwallet_id?: string;
  email?: string;
}): Promise<Profile> => {
  const response = await api.post('/api/profile/update', data);
  return response.data;
};

export const setRafflePin = async (pin: string): Promise<void> => {
  await api.post('/api/profile/pin', { pin });
};

export const verifyPin = async (pin: string): Promise<{ success: boolean }> => {
  const response = await api.post('/api/profile/verify-pin', { pin });
  return response.data;
};

// Dashboard & Site Linking
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/api/profile/dashboard-stats');
  return response.data;
};

export const getLinkedSites = async (): Promise<LinkedSite[]> => {
  const response = await api.get('/api/profile/sites-linked');
  return response.data;
};

export const linkSite = async (data: {
  siteId: string;
  identifierType: 'username' | 'email' | 'player_id';
  identifierValue: string;
}): Promise<LinkedSite> => {
  const response = await api.post('/api/profile/site-link', data);
  return response.data;
};

export const unlinkSite = async (siteId: string): Promise<void> => {
  await api.delete(`/api/profile/site-link/${siteId}`);
};

export interface TipEligibility {
  runewager: boolean;
  runewagerDetails: {
    identifierType: string;
    identifierValue: string;
  } | null;
  otherSites: Array<{
    siteId: string;
    siteName: string;
    siteSlug: string;
    identifierType: string;
    identifierValue: string;
    scEligible: boolean;
    cryptoEligible: boolean;
    tipEligible: boolean;
  }>;
}

export const getTipEligibility = async (): Promise<TipEligibility> => {
  const response = await api.get('/api/profile/tip-eligibility');
  return response.data;
};

// Rewards & Giveaways
export const getRewards = async (): Promise<Reward[]> => {
  try {
    const response = await api.get('/api/profile/rewards');
    return Array.isArray(response.data) ? response.data : response.data?.rewards || [];
  } catch (error) {
    return [];
  }
};

export const getRunewagerTips = async (): Promise<RunewagerTip[]> => {
  try {
    const response = await api.get('/api/profile/rewards/runewager');
    return Array.isArray(response.data) ? response.data : response.data?.tips || [];
  } catch (error) {
    return [];
  }
};

export const getCryptoTips = async (): Promise<CryptoTip[]> => {
  try {
    const response = await api.get('/api/profile/rewards/crypto');
    return Array.isArray(response.data) ? response.data : response.data?.tips || [];
  } catch (error) {
    return [];
  }
};

export const getLootboxRewards = async (): Promise<LootboxReward[]> => {
  try {
    const response = await api.get('/api/profile/rewards/lootbox');
    return Array.isArray(response.data) ? response.data : response.data?.rewards || [];
  } catch (error) {
    return [];
  }
};

export const getTelegramNotifications = async (): Promise<TelegramNotification[]> => {
  try {
    const response = await api.get('/api/profile/rewards/telegram');
    return Array.isArray(response.data) ? response.data : response.data?.notifications || [];
  } catch (error) {
    return [];
  }
};

export const updateCryptoAddresses = async (data: {
  btc?: string;
  eth?: string;
  sol?: string;
  usdt?: string;
}): Promise<void> => {
  await api.post('/api/profile/crypto-addresses', data);
};

// Raffles & Secret Codes
export const submitSecretCode = async (code: string): Promise<SecretCodeResponse> => {
  const response = await api.post('/api/raffles/secret-code', { code });
  return response.data;
};

export const getRaffleEntries = async (raffleId?: string): Promise<RaffleEntry[]> => {
  try {
    const url = raffleId ? `/api/raffles/entries/${raffleId}` : '/api/raffles/entries';
    const response = await api.get(url);
    return Array.isArray(response.data) ? response.data : response.data?.entries || [];
  } catch (error) {
    return [];
  }
};

export const getPastRaffles = async (): Promise<Raffle[]> => {
  try {
    const response = await api.get('/api/raffles/past');
    return Array.isArray(response.data) ? response.data : response.data?.raffles || [];
  } catch (error) {
    return [];
  }
};

export interface EndlessRaffleResponse {
  raffle: Raffle | null;
  userEntries: number;
  totalEntries: number;
}

export const getEndlessRaffle = async (): Promise<EndlessRaffleResponse> => {
  try {
    const response = await api.get('/api/raffles/endless');
    return response.data;
  } catch (error) {
    return { raffle: null, userEntries: 0, totalEntries: 0 };
  }
};

// Wheel
export interface WheelEligibility {
  eligible: boolean;
  nextSpin?: string;
  hoursUntilNext?: number;
}

export interface WheelSpinResult {
  reward: number | string;
  jackpot: boolean;
  entriesAdded?: number;
}

export const checkWheelEligibility = async (): Promise<WheelEligibility> => {
  try {
    const response = await api.get('/api/daily-spin/eligibility');
    return response.data;
  } catch (error) {
    return { eligible: false };
  }
};

export const spinWheel = async (): Promise<WheelSpinResult> => {
  const response = await api.post('/api/daily-spin/spin');
  return response.data;
};

export const getWheelHistory = async (): Promise<any[]> => {
  try {
    const response = await api.get('/api/profile/wheel-history');
    return Array.isArray(response.data) ? response.data : response.data?.history || [];
  } catch (error) {
    return [];
  }
};

// Activity Log
export type ActivityType = 
  | 'account_linked' 
  | 'account_unlinked' 
  | 'username_changed' 
  | 'cwallet_updated' 
  | 'raffle_entry' 
  | 'secret_code' 
  | 'wheel_spin' 
  | 'reward_logged' 
  | 'telegram_linked' 
  | 'telegram_unlinked';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

export const getActivityLog = async (params?: {
  type?: ActivityType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<ActivityEntry[]> => {
  try {
    const response = await api.get('/api/profile/activity', { params });
    return Array.isArray(response.data) ? response.data : response.data?.activities || [];
  } catch (error) {
    return [];
  }
};

// Settings
export interface NotificationSettings {
  emailNewsletter: boolean;
  telegramRaffleAlerts: boolean;
  telegramGiveawayAlerts: boolean;
  telegramSecretCodeHints: boolean;
}

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const response = await api.get('/api/profile/notifications');
    return response.data;
  } catch (error) {
    return {
      emailNewsletter: false,
      telegramRaffleAlerts: true,
      telegramGiveawayAlerts: true,
      telegramSecretCodeHints: false,
    };
  }
};

export const updateNotificationSettings = async (settings: Partial<NotificationSettings>): Promise<void> => {
  await api.post('/api/profile/notifications', settings);
};

export const changePin = async (oldPin: string, newPin: string): Promise<void> => {
  await api.post('/api/profile/change-pin', { oldPin, newPin });
};

export const logoutAllSessions = async (): Promise<void> => {
  await api.post('/api/profile/logout-all');
};

export const deleteAccount = async (pin: string): Promise<void> => {
  await api.post('/api/profile/delete-account', { pin });
};

// Contact
export const submitContact = async (data: {
  name: string;
  email: string;
  message: string;
}): Promise<void> => {
  await api.post('/api/contact', data);
};

// Blacklist
export const getBlacklist = async (): Promise<any[]> => {
  const response = await api.get('/api/blacklist');
  return response.data;
};

// Drops
import type { DropPromo } from '../types';

export const getDrops = async (params?: {
  jurisdiction?: string;
  casino_id?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ promos: DropPromo[]; total: number; limit: number; offset: number }> => {
  const response = await api.get('/api/drops/public', { params });
  return response.data;
};

export const reportDrop = async (dropId: string, data: {
  report_type: 'invalid_promo' | 'spam' | 'duplicate' | 'expired' | 'other';
  report_text?: string;
}): Promise<void> => {
  await api.post(`/api/drops/public/${dropId}/report`, data);
};

// Socials
export interface Socials {
  telegram: {
    bot: string;
    channel: string;
    group: string;
  };
  twitter: string;
  email: string;
  cwalletAffiliateUrl: string;
  websiteUrl: string;
}

export const getSocials = async (): Promise<Socials> => {
  try {
    const response = await api.get('/api/socials');
    return response.data;
  } catch (error) {
    // Return defaults if API fails
    return {
      telegram: {
        bot: 'https://t.me/GambleCodezCasinoDrops_bot',
        channel: 'https://t.me/GambleCodezDrops',
        group: 'https://t.me/GambleCodezPrizeHub',
      },
      twitter: 'https://x.com/GambleCodez',
      email: 'GambleCodez@gmail.com',
      cwalletAffiliateUrl: 'https://cwallet.com/referral/Nwnah81L',
      websiteUrl: 'https://gamblecodez.com',
    };
  }
};

export default api;
