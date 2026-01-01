import { useState, useEffect } from 'react';
import { getActivityLog } from '../../utils/api';
import type { ActivityEntry, ActivityType } from '../../types';

interface ActivityLogProps {
  limit?: number;
}

export const ActivityLog = ({ limit = 50 }: ActivityLogProps) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadActivities();
  }, [selectedType, dateFilter]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params: {
        limit: number;
        type?: ActivityType;
        startDate?: string;
      } = { limit };
      
      if (selectedType !== 'all') {
        params.type = selectedType;
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        params.startDate = startDate.toISOString();
      }

      const data = await getActivityLog(params);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    const icons: Record<ActivityType, string> = {
      account_linked: '🔗',
      account_unlinked: '🔓',
      username_changed: '✏️',
      cwallet_updated: '💳',
      raffle_entry: '🎟️',
      secret_code: '🔐',
      wheel_spin: '🎡',
      reward_logged: '🎁',
      telegram_linked: '📱',
      telegram_unlinked: '📴',
    };
    return icons[type] || '📝';
  };

  const getActivityColor = (type: ActivityType) => {
    const colors: Record<ActivityType, string> = {
      account_linked: 'text-neon-green border-neon-green',
      account_unlinked: 'text-neon-pink border-neon-pink',
      username_changed: 'text-neon-cyan border-neon-cyan',
      cwallet_updated: 'text-neon-yellow border-neon-yellow',
      raffle_entry: 'text-neon-pink border-neon-pink',
      secret_code: 'text-neon-cyan border-neon-cyan',
      wheel_spin: 'text-neon-yellow border-neon-yellow',
      reward_logged: 'text-neon-green border-neon-green',
      telegram_linked: 'text-neon-cyan border-neon-cyan',
      telegram_unlinked: 'text-neon-pink border-neon-pink',
    };
    return colors[type] || 'text-text-muted border-text-muted';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activityTypes: { value: ActivityType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Activities' },
    { value: 'raffle_entry', label: 'Raffles' },
    { value: 'reward_logged', label: 'Rewards' },
    { value: 'account_linked', label: 'Accounts' },
    { value: 'wheel_spin', label: 'Wheel' },
    { value: 'secret_code', label: 'Secret Codes' },
  ];

  if (loading && activities.length === 0) {
    return (
      <div className="mt-8 bg-bg-dark-2 rounded-2xl border border-neon-cyan/30 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-bg-dark-2 rounded-2xl border-2 border-neon-cyan/30 p-6 shadow-lg shadow-neon-cyan/10 card-hover relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-neon-pink/5 to-neon-yellow/5 animate-pulse pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neon-cyan flex items-center gap-2 neon-glow-cyan">
            <span className="text-3xl">📊</span>
            Activity Log
          </h2>
        </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-muted">Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ActivityType | 'all')}
            className="bg-bg-dark border border-neon-cyan/30 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-neon-cyan"
          >
            {activityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-text-muted">Period:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="bg-bg-dark border border-neon-cyan/30 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-neon-cyan"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <div className="text-4xl mb-2">📭</div>
            <p>No activities found</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`bg-bg-dark rounded-xl p-4 border-l-4 ${getActivityColor(activity.type)} hover:bg-bg-dark-2 transition-all card-hover`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-text-muted">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-text-muted whitespace-nowrap">
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                  {activity.linkUrl && (
                    <a
                      href={activity.linkUrl}
                      className="text-sm text-neon-cyan hover:text-neon-pink mt-2 inline-block"
                    >
                      View details →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
};
