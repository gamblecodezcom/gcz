import { useState } from 'react';
import { updateProfile } from '../../utils/api';
import { PinUnlockModal } from './PinUnlockModal';
import { JURISDICTION_CONFIG, SOCIAL_LINKS } from '../../utils/constants';
import type { User, DashboardStats } from '../../types';

interface PlayerIdentityHeaderProps {
  user: User;
  stats: DashboardStats;
  onUpdate: () => void;
}

// Generate avatar color from username
const generateAvatarColor = (username?: string): string => {
  if (!username) return '#00F5FF';
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

// Generate initials from username
const getInitials = (username?: string): string => {
  if (!username) return 'DG';
  const parts = username.split(/[\s_-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
};

export const PlayerIdentityHeader = ({ user, stats, onUpdate }: PlayerIdentityHeaderProps) => {
  const [isPinUnlocked, setIsPinUnlocked] = useState(() => {
    // Check if PIN was unlocked in this session
    return sessionStorage.getItem('pin_unlocked') === 'true';
  });
  const [showPinModal, setShowPinModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const avatarColor = generateAvatarColor(user.username);

  const handlePinSuccess = () => {
    setIsPinUnlocked(true);
    sessionStorage.setItem('pin_unlocked', 'true');
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    setUpdatingUsername(true);
    try {
      await updateProfile({ username: newUsername.trim() });
      setShowUsernameModal(false);
      setNewUsername('');
      onUpdate();
    } catch (error: any) {
      console.error('Failed to update username:', error);
      alert(error.message || 'Failed to update username');
    } finally {
      setUpdatingUsername(false);
    }
  };

  const jurisdictionConfig = user.jurisdiction
    ? JURISDICTION_CONFIG[user.jurisdiction]
    : JURISDICTION_CONFIG.GLOBAL;

  return (
    <>
      <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-xl p-6 mb-6 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-neon-pink/5 to-neon-yellow/5 animate-pulse" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Side - Avatar & Identity */}
            <div className="flex items-start gap-4">
              {/* Neon Avatar */}
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)`,
                    boxShadow: `0 0 20px ${avatarColor}80, 0 0 40px ${avatarColor}40`,
                  }}
                >
                  <span className="relative z-10">{getInitials(user.username)}</span>
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${avatarColor}ff, transparent)`,
                    }}
                  />
                </div>
                <div
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    boxShadow: `0 0 30px ${avatarColor}60`,
                  }}
                />
              </div>

              {/* Username & Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-text-primary">
                    {user.username ? `@${user.username}` : 'Anonymous Player'}
                  </h2>
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="px-3 py-1 text-xs font-semibold bg-neon-cyan/20 border border-neon-cyan/50 rounded-lg text-neon-cyan hover:bg-neon-cyan/30 hover:shadow-neon-cyan transition-all"
                  >
                    Update
                  </button>
                </div>

                {/* Jurisdiction Badge */}
                {user.jurisdiction && (
                  <div
                    className={`inline-block px-3 py-1 text-xs rounded-full mb-3 ${jurisdictionConfig.bg} border border-current/30`}
                  >
                    {user.jurisdiction}
                  </div>
                )}

                {/* Telegram */}
                <div className="flex items-center gap-2 mb-2">
                  {user.telegram_username ? (
                    <div className="flex items-center gap-2 text-text-primary">
                      <span className="text-lg">📱</span>
                      <span>Telegram: @{user.telegram_username}</span>
                    </div>
                  ) : (
                    <a
                      href={SOCIAL_LINKS.telegram.bot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs font-semibold bg-neon-pink/20 border border-neon-pink/50 rounded-lg text-neon-pink hover:bg-neon-pink/30 hover:shadow-neon-pink transition-all inline-flex items-center gap-1"
                    >
                      Link Telegram
                    </a>
                  )}
                </div>

                {/* Cwallet ID */}
                <div className="text-sm">
                  <span className="text-text-muted">Cwallet ID: </span>
                  {isPinUnlocked && user.cwallet_id ? (
                    <span className="text-neon-green font-mono">{user.cwallet_id}</span>
                  ) : (
                    <span className="text-text-muted">
                      •••••••••••{' '}
                      <button
                        onClick={() => setShowPinModal(true)}
                        className="text-neon-cyan hover:underline"
                      >
                        (Unlock with PIN)
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-dark/50 border border-neon-cyan/20 rounded-lg p-3">
                <div className="text-xs text-text-muted mb-1">Raffle Entries</div>
                <div className="text-xl font-bold text-neon-cyan">{stats.raffleEntries}</div>
                <div className="text-xs text-text-muted">+{stats.raffleEntriesToday} today</div>
              </div>

              <div className="bg-bg-dark/50 border border-neon-pink/20 rounded-lg p-3">
                <div className="text-xs text-text-muted mb-1">Wheel Spins</div>
                <div className="text-xl font-bold text-neon-pink">{stats.wheelSpinsRemaining}</div>
                <div className="text-xs text-text-muted">remaining</div>
              </div>

              <div className="bg-bg-dark/50 border border-neon-yellow/20 rounded-lg p-3">
                <div className="text-xs text-text-muted mb-1">Giveaways</div>
                <div className="text-xl font-bold text-neon-yellow">{stats.giveawaysReceived}</div>
                <div className="text-xs text-text-muted">received</div>
              </div>

              <div className="bg-bg-dark/50 border border-neon-green/20 rounded-lg p-3">
                <div className="text-xs text-text-muted mb-1">Linked Casinos</div>
                <div className="text-xl font-bold text-neon-green">{stats.linkedCasinos}</div>
                <div className="text-xs text-text-muted">accounts</div>
              </div>
            </div>
          </div>

          {/* PIN Unlock Button */}
          {!isPinUnlocked && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowPinModal(true)}
                className="btn-neon px-6 py-3 bg-neon-cyan text-bg-dark rounded-xl font-bold hover:shadow-neon-cyan transition-all"
              >
                Unlock with PIN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PIN Unlock Modal */}
      <PinUnlockModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
      />

      {/* Username Update Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-dark-2 border-2 border-neon-cyan/50 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 neon-glow-cyan">Update Username</h3>
            <form onSubmit={handleUpdateUsername}>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
                className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan mb-4"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updatingUsername}
                  className="btn-neon px-4 py-2 bg-neon-cyan text-bg-dark rounded-xl font-semibold hover:shadow-neon-cyan transition-all disabled:opacity-50"
                >
                  {updatingUsername ? 'Updating...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUsernameModal(false);
                    setNewUsername('');
                  }}
                  className="px-4 py-2 text-text-muted hover:text-neon-cyan transition-colors rounded-xl hover:bg-bg-dark"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
