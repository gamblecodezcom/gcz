import { useState, useEffect } from 'react';
import { RainbowFlash } from '../Animations/RainbowFlash';

interface XPData {
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  current_streak: number;
  longest_streak: number;
}

export const XPLevelPanel = () => {
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);

  useEffect(() => {
    fetch('/api/gamification/xp')
      .then(res => res.json())
      .then(data => {
        // Check for level up
        if (data.current_level > previousLevel && previousLevel > 1) {
          setLevelUpFlash(true);
          setTimeout(() => setLevelUpFlash(false), 1000);
        }
        setPreviousLevel(data.current_level);
        setXpData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [previousLevel]);

  if (loading || !xpData) {
    return (
      <div className="bg-bg-dark-2 rounded-2xl border border-neon-cyan/30 p-6">
        <div className="animate-pulse h-32"></div>
      </div>
    );
  }

  const progressPercent = ((xpData.total_xp % (xpData.xp_to_next_level + (xpData.total_xp - (xpData.current_level - 1) * 100))) / xpData.xp_to_next_level) * 100;

  return (
    <RainbowFlash trigger={levelUpFlash} duration={1000}>
      <div className="bg-bg-dark-2 rounded-2xl border border-neon-cyan/30 p-6 shadow-lg shadow-neon-cyan/10 transition-all hover:shadow-xl hover:shadow-neon-cyan/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-neon-cyan flex items-center gap-2 animate-pulse">
            <span className="text-3xl animate-bounce">⭐</span>
            Level {xpData.current_level}
          </h2>
          <div className="text-sm text-text-muted">
            {xpData.total_xp} XP
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-text-muted mb-2">
            <span>Progress to Level {xpData.current_level + 1}</span>
            <span>{xpData.xp_to_next_level - (xpData.total_xp % xpData.xp_to_next_level)} XP needed</span>
          </div>
          <div className="w-full bg-bg-dark rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-pink transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            >
              <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-dark rounded-xl p-4 border border-neon-yellow/20">
            <div className="text-sm text-text-muted mb-1">🔥 Current Streak</div>
            <div className="text-2xl font-bold text-neon-yellow">{xpData.current_streak} days</div>
          </div>
          <div className="bg-bg-dark rounded-xl p-4 border border-neon-pink/20">
            <div className="text-sm text-text-muted mb-1">⚡ Longest Streak</div>
            <div className="text-2xl font-bold text-neon-pink">{xpData.longest_streak} days</div>
          </div>
        </div>
      </div>
    </RainbowFlash>
  );
};
