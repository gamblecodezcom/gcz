export type Jurisdiction = 'US' | 'NON_US' | 'GLOBAL';

export type SiteType =
  | 'sweeps'
  | 'crypto'
  | 'lootbox'
  | 'faucet'
  | 'instant'
  | 'kyc'
  | 'top_pick';

export type NotificationType = 'info' | 'promo' | 'winner' | 'new_site' | 'system';

export type PushNotificationType = 'promo' | 'winner' | 'new_site' | 'system';

export type RedemptionSpeed = 'instant' | 'same_day' | '24h' | 'slow';

export type RedemptionType = 'gift_card' | 'crypto' | 'sweep_coins' | 'other';

export interface SiteCard {
  id: string;
  name: string;
  slug: string;
  icon_url: string;
  priority: number;
  status: 'active' | 'paused' | 'blacklisted';
  jurisdiction: Jurisdiction;
  category: string; // comma-separated list
  categories: SiteType[];
  level?: string;
  bonus_code?: string;
  bonus_description?: string;
  redemption_speed?: RedemptionSpeed;
  redemption_minimum?: number;
  redemption_type?: RedemptionType;
  resolveddomain: string;
  is_top_pick: boolean;
  redirect_slug: string;
  redirect_url?: string;
  date_added: string;
}

export interface LiveNotification {
  id: string;
  message: string;
  type: NotificationType;
  linkUrl?: string;
  dismissible: boolean;
}

export interface SitePushNotification {
  id: string;
  type: PushNotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface Paginated<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  prize: string;
  prizeType: 'crypto_box' | 'cwallet_deposit' | 'wallet_tip' | 'platform_tip';
  prizeUrl?: string;
  prizeCwalletId?: string;
  prizeAddress?: string;
  prizePlatform?: string;
  secretCode?: string;
  isSecret: boolean;
  maxWinners: number;
  winners: string[];
  endsAt: string;
  createdAt: string;
  status: 'active' | 'ended' | 'cancelled';
}

export interface User {
  id: string;
  username?: string;
  cwallet_id?: string;
  email?: string;
  telegram_username?: string;
  telegram_id?: string;
  jurisdiction?: Jurisdiction;
  hasRaffleAccess: boolean;
  newsletterAgreed: boolean;
}

export interface Profile {
  user: User;
  rafflePinSet: boolean;
}

export interface LinkedSite {
  id: string;
  siteId: string;
  siteName: string;
  siteSlug: string;
  identifierType: 'username' | 'email' | 'player_id';
  identifierValue: string;
  linkedAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  raffleEntries: number;
  raffleEntriesToday: number;
  wheelSpinsRemaining: number;
  giveawaysReceived: number;
  linkedCasinos: number;
}

// Rewards & Giveaways
export interface Reward {
  id: string;
  type: 'runewager_sc' | 'crypto' | 'lootbox' | 'telegram';
  status: 'logged' | 'pending' | 'completed';
  createdAt: string;
}

export interface RunewagerTip {
  id: string;
  username: string;
  email?: string;
  amount: number;
  note?: string;
  status: 'logged' | 'pending' | 'completed';
  createdAt: string;
  adminName?: string;
}

export interface CryptoTip {
  id: string;
  asset: 'BTC' | 'ETH' | 'SOL' | 'USDT';
  amount: string;
  destination: string; // Cwallet ID or address
  deliveryMethod: 'direct_wallet' | 'cwallet' | 'other';
  txHash?: string;
  note?: string;
  status: 'logged' | 'pending' | 'completed';
  createdAt: string;
  adminName?: string;
}

export interface LootboxReward {
  id: string;
  claimUrl: string;
  site: string;
  sponsor?: string;
  prizeType: string;
  status: 'pending' | 'claimed' | 'expired';
  expiresAt?: string;
  createdAt: string;
  adminName?: string;
}

export interface TelegramNotification {
  id: string;
  type: 'raffle_win' | 'secret_code' | 'claim_notification';
  title: string;
  body: string;
  sentAt: string;
  telegramUsername: string;
}

// Secret Code & Raffle Entries
export interface SecretCodeResponse {
  success: boolean;
  message: string;
  entriesAdded?: number;
  raffleIds?: string[];
}

export interface RaffleEntry {
  id: string;
  raffleId: string;
  raffleTitle: string;
  source: 'daily_checkin' | 'wheel' | 'secret_code' | 'manual';
  entries: number;
  createdAt: string;
}

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

export interface WheelHistoryEntry {
  id: string;
  reward: number | string;
  jackpot: boolean;
  entriesAdded?: number;
  createdAt: string;
}

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

// Settings
export interface NotificationSettings {
  emailNewsletter: boolean;
  telegramRaffleAlerts: boolean;
  telegramGiveawayAlerts: boolean;
  telegramSecretCodeHints: boolean;
  telegramDropsAlerts?: boolean;
  emailDropsAlerts?: boolean;
  pushDropsAlerts?: boolean;
}

// Drops Ecosystem
export interface DropPromo {
  id: string;
  headline: string;
  description?: string;
  promo_type: 'code' | 'url' | 'hybrid' | 'info_only';
  bonus_code?: string;
  promo_url?: string;
  resolved_domain?: string;
  mapped_casino_id?: number;
  casino_name?: string;
  casino_logo?: string;
  casino_slug?: string;
  jurisdiction_tags: string[];
  quick_signup_url?: string;
  validity_flags?: {
    verified?: boolean;
    community_submitted?: boolean;
    admin_edited?: boolean;
  };
  featured: boolean;
  view_count: number;
  click_count: number;
  created_at: string;
  expires_at?: string;
}
