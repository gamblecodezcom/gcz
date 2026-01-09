import { useState } from 'react';
import { StatCard } from './StatCard';
import { CasinoList } from './CasinoList';
import { CodeEntryBox } from './CodeEntryBox';
import { RewardCard } from './RewardCard';
import { ActivityFeed } from './ActivityFeed';

interface DegenProfileDashboardProps {
  username?: string | null;
  telegramHandle?: string | null;
  jurisdiction?: string | null;
  stats?: {
    raffleEntries?: number;
    wheelSpins?: number;
    maxWheelSpins?: number;
    giveaways?: number;
    linkedCasinos?: number;
  };
  linkedCasinos?: Array<{
    name: string;
    status: 'AVAILABLE' | 'LINKED' | 'CRYPTO S' | string;
  }>;
  recentReward?: {
    casino?: string;
    reward?: string;
    username?: string;
    loggedBy?: string;
    email?: string;
    rewardDate?: string;
  };
  recentActivities?: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: {
      entries?: number;
      casino?: string;
    };
  }>;
  onUpdateUsername?: () => void;
  onSubmitSecretCode?: (code: string) => void;
  confirmedCode?: string | null;
}

export const DegenProfileDashboard = ({
  username = null,
  telegramHandle = null,
  jurisdiction = 'US',
  stats = {},
  linkedCasinos = [],
  recentReward = null,
  recentActivities = [],
  onUpdateUsername,
  onSubmitSecretCode,
  confirmedCode = null,
}: DegenProfileDashboardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateUsername = async () => {
    if (!onUpdateUsername) return;
    setIsUpdating(true);
    try {
      await onUpdateUsername();
    } finally {
      setIsUpdating(false);
    }
  };

  // Null-safe stat defaults
  const raffleEntries = stats.raffleEntries ?? 0;
  const wheelSpins = stats.wheelSpins ?? 0;
  const maxWheelSpins = stats.maxWheelSpins ?? 10;
  const giveaways = stats.giveaways ?? 0;
  const linkedCasinosCount = stats.linkedCasinos ?? linkedCasinos.length ?? 0;

  return (
    <div className="space-y-8">
      {/* TOP SECTION */}
      <div className="rounded-2xl border-2 border-neon-cyan/30 bg-gradient-to-br from-bg-dark-2 to-bg-dark-3 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/8 via-transparent to-neon-pink/8 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* User Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm px-3 py-1 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan font-semibold">
                  {jurisdiction}
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary font-orbitron">
                  @{username || 'DeGenName'}
                </h1>
              </div>
              {telegramHandle && (
                <p className="text-text-muted">
                  Telegram: <span className="text-neon-pink font-semibold">@{telegramHandle}</span>
                </p>
              )}
            </div>

            <button
              onClick={handleUpdateUsername}
              disabled={isUpdating || !onUpdateUsername}
              className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-blue rounded-xl font-bold uppercase tracking-wider text-bg-dark hover:shadow-neon-cyan transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {isUpdating ? 'UPDATING...' : 'UPDATE USERNAME'}
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="RAFFLE ENTRIES" value={raffleEntries} variant="cyan" />
            <StatCard label="WHEEL SPINS" value={`${wheelSpins}/${maxWheelSpins}`} variant="pink" />
            <StatCard label="GIVEAWAYS" value={giveaways} variant="yellow" />
            <StatCard label="LINKED CASINOS" value={linkedCasinosCount} variant="green" />
          </div>
        </div>
      </div>

      {/* LINKED CASINO ACCOUNTS */}
      <div className="rounded-2xl border border-white/10 bg-bg-dark-2 p-6">
        <h2 className="text-xl md:text-2xl font-bold text-neon-pink mb-6 flex items-center gap-2">
          <span className="text-2xl">🎰</span>
          Linked Casino Accounts
        </h2>
        <CasinoList casinos={linkedCasinos} />
      </div>

      {/* SECRET CODE ENTRY */}
      <div className="rounded-2xl border-2 border-neon-pink/30 bg-gradient-to-br from-bg-dark-2 to-bg-dark-3 p-6">
        <h2 className="text-xl md:text-2xl font-bold text-neon-pink mb-4 flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          Secret Code Entry
        </h2>
        <CodeEntryBox onSubmit={onSubmitSecretCode} confirmedCode={confirmedCode} />
      </div>

      {/* GIVEAWAY REWARDS */}
      {recentReward && (
        <div className="rounded-2xl border border-white/10 bg-bg-dark-2 p-6">
          <h2 className="text-xl md:text-2xl font-bold text-neon-yellow mb-6 flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            Giveaway Rewards
          </h2>
          <RewardCard
            casino={recentReward.casino || 'Unknown Casino'}
            reward={recentReward.reward || 'N/A'}
            username={recentReward.username || 'anonymous'}
            loggedBy={recentReward.loggedBy || 'Admin'}
            email={recentReward.email || ''}
            rewardDate={recentReward.rewardDate || 'N/A'}
          />
        </div>
      )}

      {/* RECENT ACTIVITY */}
      <div className="rounded-2xl border border-white/10 bg-bg-dark-2 p-6">
        <h2 className="text-xl md:text-2xl font-bold text-neon-green mb-6 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Recent Activity
        </h2>
        <ActivityFeed activities={recentActivities} />
      </div>
    </div>
  );
};
