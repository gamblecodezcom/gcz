export type Jurisdiction = 'US' | 'NON_US' | 'GLOBAL';
export type SiteType = 'sweeps' | 'crypto' | 'lootbox' | 'faucet' | 'instant' | 'kyc' | 'top_pick';

export type RedemptionSpeed = 'instant' | 'fast' | 'standard' | 'slow' | string;
export type RedemptionType = 'crypto' | 'bank' | 'gift_card' | 'sweepstakes' | string;

export interface WheelEligibility {
  loggedIn?: boolean;
  profileComplete?: boolean;
  newsletter?: boolean;
  eligible: boolean;
  nextSpin?: string;
  hoursUntilNext?: number;
  spinsRemaining?: number;
  lastSpinAt?: string | null;
  userId?: string;
  username?: string;
  [key: string]: unknown;
}

export interface WheelSpinResult {
  reward: number | string;
  jackpot: boolean;
  entriesAdded?: number;
  [key: string]: unknown;
}

export interface User {
  id: string;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  cwallet_id?: string | null;
  telegram_username?: string | null;
  telegram_id?: string | null;
  discord_username?: string | null;
  jurisdiction?: Jurisdiction | null;
  hasRaffleAccess?: boolean;
  newsletterAgreed?: boolean;
  admin_level?: number;
  linkedSites?: number;
  runewager_username?: string | null;
  winna_username?: string | null;
  [key: string]: unknown;
}

export interface DegenProfileStats {
  degenScore?: number;
  dropsRedeemed?: number;
  wheelSpins?: number;
  newsletterOptIn?: boolean;
  raffleEntries?: number;
  linkedAccounts?: number;
  [key: string]: unknown;
}

export interface Profile {
  user: User;
  rafflePinSet: boolean;
  stats?: DegenProfileStats;
  linkedCasinos?: Array<LinkedSite>;
  [key: string]: unknown;
}

export interface DashboardStats {
  raffleEntries: number;
  raffleEntriesToday: number;
  wheelSpinsRemaining: number;
  giveawaysReceived: number;
  linkedCasinos: number;
  [key: string]: unknown;
}

export interface SiteCard {
  id: string;
  name: string;
  slug?: string;
  icon_url?: string;
  priority?: number;
  status?: string;
  jurisdiction: Jurisdiction;
  category: string;
  categories?: string[];
  level?: number;
  bonus_code?: string;
  bonus_description?: string;
  redemption_speed?: RedemptionSpeed;
  redemption_minimum?: number | string;
  redemption_type?: RedemptionType;
  resolveddomain?: string;
  is_top_pick?: boolean;
  redirect_slug?: string;
  redirect_url?: string;
  date_added: string;
  [key: string]: unknown;
}

export interface LinkedSite {
  id: string;
  siteId: string;
  siteName: string;
  siteSlug?: string;
  identifierType: string;
  identifierValue: string;
  linkedAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface Raffle {
  id: string;
  title: string;
  description?: string | null;
  prize: string;
  prizeType?: string;
  secretCode?: string | null;
  isSecret?: boolean;
  maxWinners?: number;
  winners: string[];
  endsAt?: string | null;
  createdAt?: string;
  status?: string;
  raffleType?: string;
  [key: string]: unknown;
}

export interface RaffleEntry {
  id: string;
  raffleId: string;
  raffleTitle?: string;
  source: string;
  entries: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface SecretCodeResponse {
  success: boolean;
  message: string;
  entriesAdded?: number;
  raffleIds?: string[];
  [key: string]: unknown;
}

export interface ActivityEntry {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  linkUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export type ActivityType = string;

export interface SitePushNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl?: string;
  createdAt: string;
  readAt?: string;
  [key: string]: unknown;
}

export interface LiveNotification {
  id: string;
  message: string;
  type: 'promo' | 'winner' | 'new_site' | 'system' | 'info' | string;
  dismissible?: boolean;
  linkUrl?: string;
  [key: string]: unknown;
}

export interface NotificationSettings {
  emailNewsletter: boolean;
  telegramRaffleAlerts: boolean;
  telegramGiveawayAlerts: boolean;
  telegramSecretCodeHints: boolean;
  telegramDropsAlerts?: boolean;
  emailDropsAlerts?: boolean;
  pushDropsAlerts?: boolean;
  [key: string]: unknown;
}

export interface DropValidityFlags {
  verified?: boolean;
  community_submitted?: boolean;
  admin_edited?: boolean;
  [key: string]: unknown;
}

export interface DropPromo {
  id: string;
  headline: string;
  description?: string;
  bonus_code?: string | null;
  promo_type?: 'code' | 'url' | 'hybrid' | 'info_only' | string;
  promo_url?: string | null;
  quick_signup_url?: string | null;
  jurisdiction_tags?: string[];
  casino_name?: string;
  casino_logo?: string;
  resolved_domain?: string;
  featured?: boolean;
  validity_flags?: DropValidityFlags;
  created_at: string;
  [key: string]: unknown;
}

export interface RunewagerTip {
  id: string;
  username?: string | null;
  email?: string | null;
  amount: string | number;
  status: string;
  note?: string | null;
  adminName?: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface CryptoTip {
  id: string;
  asset: string;
  amount: string | number;
  deliveryMethod: string;
  status: string;
  txHash?: string | null;
  note?: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface LootboxReward {
  id: string;
  site: string;
  prizeType: string;
  claimUrl: string;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface TelegramNotification {
  id: string;
  telegramUsername?: string | null;
  telegramId?: string | null;
  type: string;
  title: string;
  body: string;
  sentAt: string;
  [key: string]: unknown;
}
