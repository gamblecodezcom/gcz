interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: {
    entries?: number;
    casino?: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
}

export const ActivityFeed = ({ activities = [] }: ActivityFeedProps) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No recent activity
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'casino_link':
      case 'linked_account':
        return '🔗';
      case 'raffle_entry':
      case 'entered_raffle':
        return '🎟️';
      case 'wheel_spin':
        return '🎡';
      case 'code_submit':
        return '🔐';
      case 'reward':
        return '🎁';
      default:
        return '📌';
    }
  };

  const getTimeLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-4 p-4 rounded-xl bg-bg-dark border border-white/10 hover:border-neon-cyan/40 transition-all duration-300 group animate-fadeIn"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-pink/20 flex items-center justify-center border border-white/10 text-xl">
            {getActivityIcon(activity.type)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-text-primary font-medium group-hover:text-neon-cyan transition-colors">
              {activity.description}
              {activity.metadata?.entries && (
                <span className="ml-2 text-neon-green font-bold">
                  (+{activity.metadata.entries} entries)
                </span>
              )}
            </p>
            {activity.metadata?.casino && (
              <p className="text-xs text-text-muted mt-1">
                Casino: {activity.metadata.casino}
              </p>
            )}
          </div>

          <div className="flex-shrink-0 text-xs text-text-muted">
            {getTimeLabel(activity.timestamp)}
          </div>
        </div>
      ))}
    </div>
  );
};
