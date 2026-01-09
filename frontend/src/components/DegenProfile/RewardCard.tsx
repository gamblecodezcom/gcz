interface RewardCardProps {
  casino: string;
  reward: string;
  username: string;
  loggedBy: string;
  email: string;
  rewardDate: string;
}

export const RewardCard = ({
  casino = 'Unknown Casino',
  reward = 'No reward',
  username = 'anonymous',
  loggedBy = 'System',
  email = '',
  rewardDate = 'N/A',
}: RewardCardProps) => {
  return (
    <div className="bg-gradient-to-br from-bg-dark-2 to-bg-dark-3 border-2 border-neon-yellow/30 rounded-2xl p-6 relative overflow-hidden group hover:border-neon-yellow/60 transition-all duration-300">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-yellow/5 via-transparent to-neon-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-yellow/30 to-neon-orange/30 flex items-center justify-center border border-neon-yellow/50">
              <span className="text-2xl">🎁</span>
            </div>
            <div>
              <h3 className="font-bold text-neon-yellow text-lg">{casino}</h3>
              <p className="text-xs text-text-muted">Giveaway Reward</p>
            </div>
          </div>
        </div>

        {/* Reward Amount */}
        <div className="bg-bg-dark rounded-xl p-4 border border-neon-yellow/20">
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">Reward</div>
          <div className="text-2xl font-bold text-neon-yellow font-orbitron">{reward}</div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-bg-dark rounded-lg p-3 border border-white/10">
            <div className="text-xs text-text-muted mb-1">Username</div>
            <div className="text-text-primary font-semibold">{username}</div>
          </div>
          <div className="bg-bg-dark rounded-lg p-3 border border-white/10">
            <div className="text-xs text-text-muted mb-1">Logged by</div>
            <div className="text-text-primary font-semibold">{loggedBy}</div>
          </div>
          <div className="bg-bg-dark rounded-lg p-3 border border-white/10 col-span-2">
            <div className="text-xs text-text-muted mb-1">Email</div>
            <div className="text-text-primary font-mono text-xs break-all">
              {email || 'Not provided'}
            </div>
          </div>
          <div className="bg-bg-dark rounded-lg p-3 border border-white/10 col-span-2">
            <div className="text-xs text-text-muted mb-1">Reward Date</div>
            <div className="text-text-primary font-semibold">{rewardDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
