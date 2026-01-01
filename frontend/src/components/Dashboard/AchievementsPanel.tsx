import { useState, useEffect } from 'react';
import { CrownAnimation } from '../Animations/CrownAnimation';
import { RainbowFlash } from '../Animations/RainbowFlash';

interface Achievement {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  completed: boolean;
  completed_at: string | null;
}

export const AchievementsPanel = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/gamification/achievements')
      .then(res => res.json())
      .then(data => {
        // Check for newly completed achievements
        const newlyCompleted = data.find((a: Achievement) => 
          a.completed && !achievements.find(old => old.id === a.id && old.completed)
        );
        if (newlyCompleted) {
          setNewAchievement(newlyCompleted.id);
          setTimeout(() => setNewAchievement(null), 2000);
        }
        setAchievements(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [achievements]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-neon-yellow text-neon-yellow';
      case 'epic': return 'border-neon-pink text-neon-pink';
      case 'rare': return 'border-neon-cyan text-neon-cyan';
      default: return 'border-text-muted text-text-muted';
    }
  };

  const completed = achievements.filter(a => a.completed);

  if (loading) {
    return (
      <div className="bg-bg-dark-2 rounded-2xl border border-neon-cyan/30 p-6">
        <div className="animate-pulse h-64"></div>
      </div>
    );
  }

  return (
    <div className="bg-bg-dark-2 rounded-2xl border border-neon-cyan/30 p-6 shadow-lg shadow-neon-cyan/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neon-cyan flex items-center gap-2">
          <span className="text-3xl">🏆</span>
          Achievements
        </h2>
        <div className="text-sm text-text-muted">
          {completed.length} / {achievements.length}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.slice(0, 6).map((achievement) => (
          <RainbowFlash 
            key={achievement.id} 
            trigger={newAchievement === achievement.id}
            duration={2000}
          >
            <div
              className={`bg-bg-dark rounded-xl p-4 border-2 ${
                achievement.completed
                  ? getRarityColor(achievement.rarity)
                  : 'border-text-muted/30 opacity-50'
              } transition-all hover:scale-105 hover:shadow-lg ${
                achievement.completed ? 'animate-pulse' : ''
              }`}
            >
              <div className="text-3xl mb-2 text-center relative">
                {achievement.icon}
                {achievement.completed && achievement.rarity === 'legendary' && (
                  <div className="absolute -top-2 -right-2">
                    <CrownAnimation size={20} />
                  </div>
                )}
              </div>
              <div className="text-sm font-bold text-center mb-1">{achievement.title}</div>
              {achievement.completed ? (
                <div className="text-xs text-center text-neon-green flex items-center justify-center gap-1">
                  <span>✓</span>
                  <span>Completed</span>
                </div>
              ) : (
                <div className="text-xs text-center text-text-muted">In Progress</div>
              )}
            </div>
          </RainbowFlash>
        ))}
      </div>

      {achievements.length > 6 && (
        <div className="mt-4 text-center">
          <button className="text-neon-cyan hover:text-neon-pink transition-colors">
            View All ({achievements.length})
          </button>
        </div>
      )}
    </div>
  );
};
