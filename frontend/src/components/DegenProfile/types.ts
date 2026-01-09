/**
 * Type definitions for DegenProfileDashboard components
 */

export type CasinoStatus = 'AVAILABLE' | 'LINKED' | 'CRYPTO S' | string;

export type StatVariant = 'cyan' | 'pink' | 'yellow' | 'green';

export type ActivityType =
  | 'casino_link'
  | 'linked_account'
  | 'raffle_entry'
  | 'entered_raffle'
  | 'wheel_spin'
  | 'code_submit'
  | 'reward'
  | string;

export interface LinkedCasino {
  name: string;
  status: CasinoStatus;
}

export interface ProfileStats {
  raffleEntries?: number;
  wheelSpins?: number;
  maxWheelSpins?: number;
  giveaways?: number;
  linkedCasinos?: number;
}

export interface RewardInfo {
  casino?: string;
  reward?: string;
  username?: string;
  loggedBy?: string;
  email?: string;
  rewardDate?: string;
}

export interface ActivityMetadata {
  entries?: number;
  casino?: string;
  [key: string]: unknown;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata?: ActivityMetadata;
}

export interface DegenProfileDashboardProps {
  username?: string | null;
  telegramHandle?: string | null;
  jurisdiction?: string | null;
  stats?: ProfileStats;
  linkedCasinos?: LinkedCasino[];
  recentReward?: RewardInfo | null;
  recentActivities?: Activity[];
  onUpdateUsername?: () => void | Promise<void>;
  onSubmitSecretCode?: (code: string) => void | Promise<void>;
  confirmedCode?: string | null;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  variant?: StatVariant;
}

export interface CasinoBadgeProps {
  status: CasinoStatus;
}

export interface CasinoListProps {
  casinos: LinkedCasino[];
}

export interface CodeEntryBoxProps {
  onSubmit?: (code: string) => void | Promise<void>;
  confirmedCode?: string | null;
}

export interface RewardCardProps {
  casino: string;
  reward: string;
  username: string;
  loggedBy: string;
  email: string;
  rewardDate: string;
}

export interface ActivityFeedProps {
  activities: Activity[];
}
