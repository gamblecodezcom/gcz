import { useState, useEffect } from 'react';

interface Mission {
  id: number;
  code: string;
  title: string;
  description: string;
  mission_type: 'daily' | 'weekly' | 'monthly' | 'special';
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  bonus_xp: number;
  progress: number;
  completed: boolean;
  expires_at: string | null;
}

export const MissionsPanel = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gamification/missions')
      .then(res => res.json())
        .then(data => {
          setMissions(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
  }, []);

  const getMissionTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'border-neon-green text-neon-green';
      case 'weekly': return 'border-neon-cyan text-neon-cyan';
      case 'monthly': return 'border-neon-pink text-neon-pink';
      default: return 'border-neon-yellow text-neon-yellow';
    }
  };

  if (loading) {
    return (
      <div className="bg-bg-dark-2 rounded-2xl border border-neon-cyan/30 p-6">
        <div className="animate-pulse h-48"></div>
      </div>
    );
  }

  const activeMissions = missions.filter(m => !m.completed);

  return (
    <div className="bg-bg-dark-2 rounded-2xl border border-neon-cyan/30 p-6 shadow-lg shadow-neon-cyan/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neon-cyan flex items-center gap-2">
          <span className="text-3xl">🎯</span>
          Missions
        </h2>
        <div className="text-sm text-text-muted">
          {activeMissions.length} active
        </div>
      </div>

      <div className="space-y-4">
        {activeMissions.slice(0, 3).map((mission) => {
          const progressPercent = (mission.progress / mission.requirement_value) * 100;
          
          return (
            <div
              key={mission.id}
              className={`bg-bg-dark rounded-xl p-4 border-2 ${getMissionTypeColor(mission.mission_type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-sm">{mission.title}</div>
                  <div className="text-xs text-text-muted mt-1">{mission.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">{mission.xp_reward + mission.bonus_xp} XP</div>
                  <div className="text-xs text-text-muted capitalize">{mission.mission_type}</div>
                </div>
              </div>
              
              <div className="mt-2">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Progress</span>
                  <span>{mission.progress} / {mission.requirement_value}</span>
                </div>
                <div className="w-full bg-bg-dark-2 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-pink transition-all duration-500"
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeMissions.length === 0 && (
        <div className="text-center text-text-muted py-8">
          No active missions. Check back tomorrow for new missions!
        </div>
      )}
    </div>
  );
};
