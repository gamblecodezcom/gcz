import { API_BASE_URL } from './constants';
import type {
  ActivityEntry,
  DashboardStats,
  DropPromo,
  LinkedSite,
  LiveNotification,
  NotificationSettings,
  Profile,
  Raffle,
  RaffleEntry,
  SecretCodeResponse,
  SiteCard,
  SitePushNotification,
  WheelEligibility,
  WheelSpinResult,
  RunewagerTip,
  CryptoTip,
  LootboxReward,
  TelegramNotification,
} from '../types';

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

export interface Socials {
  telegram: {
    bot: string;
    channel: string;
    group: string;
  };
  twitter: string;
  email: string;
  discord?: string;
  cwalletAffiliateUrl?: string;
  websiteUrl?: string;
}

const API_BASE = API_BASE_URL.replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

const getStoredValue = (key: string) => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

const setStoredValue = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
};

const clearStoredValue = (key: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
};

const getUserId = () => getStoredValue('gcz_user_id');
const getPin = () => (typeof window === 'undefined' ? null : window.sessionStorage.getItem('gcz_pin'));
const setPin = (pin: string) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem('gcz_pin', pin);
};

const buildQuery = (params?: Record<string, string | number | boolean | undefined>) => {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const parseJson = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
  { includeUser = true, includePin = false, timeoutMs = DEFAULT_TIMEOUT_MS }: { includeUser?: boolean; includePin?: boolean; timeoutMs?: number } = {}
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers = new Headers(options.headers || {});

      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      if (includeUser) {
        const userId = getUserId();
        if (userId) {
          headers.set('x-user-id', userId);
        }
      }

      if (includePin) {
        const pin = getPin();
        if (pin) {
          headers.set('x-pin', pin);
        }
      }

      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const text = await response.text();
      const data = parseJson(text);

      if (!response.ok) {
        const errorMessage = (data as any)?.error || (data as any)?.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      clearTimeout(timeout);
      return data as T;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error : new Error('Request failed');
      if (attempt < MAX_RETRIES) {
        await sleep(300 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Request failed');
};

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export const setDegenLoginSession = (telegramId: string, username?: string) => {
  setStoredValue('gcz_user_id', telegramId);
  if (username) {
    setStoredValue('gcz_username', username);
  }
};

export const clearDegenLoginSession = () => {
  clearStoredValue('gcz_user_id');
  clearStoredValue('gcz_username');
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('gcz_pin');
  }
};

export const getProfile = () => apiFetch<Profile>('/api/profile');

export const updateProfile = (payload: { username?: string; cwallet_id?: string; email?: string }) =>
  apiFetch<{ user: Profile['user'] }>('/api/profile/update', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const setRafflePin = (pin: string) =>
  apiFetch<{ success: boolean; message?: string }>('/api/profile/pin', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });

export const verifyPin = async (pin: string) => {
  const response = await apiFetch<{ success: boolean }>('/api/profile/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
  if (response.success) {
    setPin(pin);
  }
  return response;
};

export const changePin = async (oldPin: string, newPin: string) => {
  const response = await apiFetch<{ success: boolean }>('/api/profile/change-pin', {
    method: 'POST',
    body: JSON.stringify({ oldPin, newPin }),
  });
  setPin(newPin);
  return response;
};

export const logoutAllSessions = () =>
  apiFetch<{ success: boolean }>('/api/profile/logout-all', {
    method: 'POST',
  });

export const deleteAccount = (pin: string) =>
  apiFetch<{ success: boolean }>('/api/profile/delete-account', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  }, { includePin: true });

export const getDashboardStats = () => apiFetch<DashboardStats>('/api/profile/dashboard-stats');

export const getNotificationSettings = () => apiFetch<NotificationSettings>('/api/profile/notifications');

export const updateNotificationSettings = (settings: NotificationSettings) =>
  apiFetch<{ success: boolean }>('/api/profile/notifications', {
    method: 'POST',
    body: JSON.stringify(settings),
  });

export const getActivityLog = (limit = 50) =>
  apiFetch<ActivityEntry[]>(`/api/profile/activity${buildQuery({ limit })}`);

export const getLinkedSites = () => apiFetch<LinkedSite[]>('/api/profile/sites-linked');

export const linkSite = (payload: { siteId: string; identifierType: string; identifierValue: string }) =>
  apiFetch<LinkedSite>('/api/profile/site-link', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const unlinkSite = (siteId: string) =>
  apiFetch<{ success: boolean; message?: string }>(`/api/profile/site-link/${siteId}`, {
    method: 'DELETE',
  });

export const getTipEligibility = () => apiFetch<TipEligibility>('/api/profile/tip-eligibility');

export const getRunewagerTips = () => apiFetch<RunewagerTip[]>('/api/profile/rewards/runewager');

export const getCryptoTips = () => apiFetch<CryptoTip[]>('/api/profile/rewards/crypto');

export const getLootboxRewards = () => apiFetch<LootboxReward[]>('/api/profile/rewards/lootbox');

export const getTelegramNotifications = () => apiFetch<TelegramNotification[]>('/api/profile/rewards/telegram');

export const updateCryptoAddresses = (payload: { btc?: string; eth?: string; sol?: string; usdt?: string }) =>
  apiFetch<{ success: boolean }>('/api/profile/crypto-addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, { includePin: true });

export const getRaffles = () => apiFetch<Raffle[]>('/api/raffles');

export const getPastRaffles = () => apiFetch<Raffle[]>('/api/raffles/past');

export const submitSecretCode = (code: string) =>
  apiFetch<SecretCodeResponse>('/api/raffles/secret-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

export const getRaffleEntries = (raffleId?: string) =>
  apiFetch<RaffleEntry[]>(`/api/raffles/entries${buildQuery({ raffleId })}`);

export const getEndlessRaffle = () =>
  apiFetch<{ raffle: Raffle | null; userEntries: number; totalEntries: number }>('/api/raffles/endless');

export const checkWheelEligibility = () => apiFetch<WheelEligibility>('/api/daily-spin/eligibility');

export const spinWheel = () =>
  apiFetch<WheelSpinResult>('/api/daily-spin/spin', {
    method: 'POST',
  });

export const getWheelHistory = () => apiFetch<WheelSpinResult[]>('/api/daily-spin/history');

export const getSites = (params?: { jurisdiction?: string; category?: string; page?: number; limit?: number }) => {
  const normalizedParams = {
    ...params,
    category: params?.category ? params.category.replace(/\s+/g, '') : undefined,
  };
  return apiFetch<{ data: SiteCard[]; page: number; limit: number; total: number; totalPages: number }>(
    `/api/sites${buildQuery(normalizedParams)}`
  );
};

export const getRecentSites = (params?: { jurisdiction?: string; category?: string; page?: number; limit?: number }) =>
  apiFetch<{ data: SiteCard[]; page: number; limit: number; total: number; totalPages: number }>(
    `/api/sites/recent${buildQuery(params)}`
  );

export const getDrops = async (params?: {
  jurisdiction?: string;
  casino_id?: string;
  featured?: boolean;
  limit?: number;
}) => {
  const query = buildQuery(params as Record<string, string | number | boolean | undefined>);
  const data = await apiFetch<any>(`/api/drops${query}`);

  if (Array.isArray(data)) {
    return { promos: data as DropPromo[] };
  }

  if (data?.promos) {
    return data as { promos: DropPromo[] };
  }

  if (data?.drops) {
    return { promos: data.drops as DropPromo[] };
  }

  return { promos: [] };
};

export const reportDrop = (promoId: string, payload: { report_type: string }) =>
  apiFetch<{ ok: boolean; id?: string }>('/api/bugReports', {
    method: 'POST',
    body: JSON.stringify({
      role: 'user',
      surface: 'drops',
      issue_type: payload.report_type,
      severity: 'low',
      description: `Reported drop ${promoId} as ${payload.report_type}`,
      metadata: { promoId },
    }),
  });

export const getPushNotifications = () => apiFetch<SitePushNotification[]>('/api/push');

export const markPushNotificationRead = (id: string) =>
  apiFetch<{ success: boolean }>(`/api/push/${id}/read`, {
    method: 'PATCH',
  });

export const getLiveNotification = async () => {
  try {
    const data = await apiFetch<{ banner: any }>('/api/notifications/live');
    if (!data?.banner) return null;
    return {
      id: data.banner.id?.toString() ?? 'live-banner',
      message: data.banner.message,
      type: data.banner.type || 'info',
      dismissible: true,
      linkUrl: data.banner.link_url || undefined,
    } as LiveNotification;
  } catch {
    const fallback = await apiFetch<{ banner: any }>('/api/admin/live-banner');
    if (!fallback?.banner) return null;
    return {
      id: fallback.banner.id?.toString() ?? 'live-banner',
      message: fallback.banner.message,
      type: fallback.banner.type || 'info',
      dismissible: true,
      linkUrl: fallback.banner.link_url || undefined,
    } as LiveNotification;
  }
};

export const getSocials = () => apiFetch<Socials>('/api/socials');

export const submitContact = (payload: { name: string; email: string; subject?: string; message: string }) =>
  apiFetch<{ success: boolean }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getBlacklist = () => apiFetch<any>('/api/blacklist');

export const subscribeNewsletter = (email: string) => {
  if (!validateEmail(email)) {
    return Promise.reject(new Error('Invalid email address'));
  }
  return apiFetch<{ success: boolean; status: string }>('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const unsubscribeNewsletter = (email: string) => {
  if (!validateEmail(email)) {
    return Promise.reject(new Error('Invalid email address'));
  }
  return apiFetch<{ success: boolean; status: string }>('/api/newsletter/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};
