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
    } catch (error) {
      console.error('Failed to update username:', error);
      alert(error instanceof Error ? error.message : 'Failed to update username');
    } finally {
      setUpdatingUsername(false);
    }
  };

  const jurisdictionConfig = user.jurisdiction
    ? JURISDICTION_CONFIG[user.jurisdiction]
    : JURISDICTION_CONFIG.GLOBAL;

  return (
    <>
      <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-xl p-6 mb-6 relative overflow-hidden card-hover">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-neon-pink/5 to-neon-yellow/5 animate-pulse" />
        
        {/* Crown Logo - Top Left */}
        <div className="absolute top-4 left-4 opacity-20 hover:opacity-40 transition-opacity crown-animation">
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
              fill="url(#crownGradientHeader)"
              className="drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
            />
            <defs>
              <linearGradient id="crownGradientHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD600" />
                <stop offset="100%" stopColor="#FFA500" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Side - Avatar & Identity */}
            <div className="flex items-start gap-4">
              {/* Neon Avatar with Hex Frame Option */}
              <div className="relative group">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white relative overflow-hidden border-2 border-neon-cyan/50"
                  style={{
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)`,
                    boxShadow: `0 0 20px ${avatarColor}80, 0 0 40px ${avatarColor}40, inset 0 0 20px rgba(0, 245, 255, 0.2)`,
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
                {/* Pulsing glow ring */}
                <div
                  className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
                  style={{
                    boxShadow: `0 0 30px ${avatarColor}60`,
                  }}
                />
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `0 0 50px ${avatarColor}, 0 0 100px ${avatarColor}80`,
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
                    <div className="flex items-center gap-2">
                      <a
                        href={SOCIAL_LINKS.telegram.bot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-text-primary hover:text-neon-cyan transition-colors group"
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform">📱</span>
                        <span>Telegram: <span className="text-neon-cyan font-semibold">@{user.telegram_username}</span></span>
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <span className="px-2 py-0.5 bg-neon-green/20 border border-neon-green/50 rounded-full text-xs font-semibold text-neon-green">
                        ✓ Linked
                      </span>
                    </div>
                  ) : (
                    <a
                      href={SOCIAL_LINKS.telegram.bot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-neon-pink to-neon-cyan text-white rounded-lg hover:shadow-neon-pink transition-all inline-flex items-center gap-2 group"
                    >
                      <span className="text-lg">📱</span>
                      <span>Link Telegram Bot</span>
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
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
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowPinModal(true)}
                className="btn-neon px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-pink text-bg-dark rounded-xl font-bold text-lg hover:shadow-neon-cyan transition-all relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.4 7 14.8 8.6 14.8 10V11.5C15.4 11.5 16 12.1 16 12.7V16.2C16 16.8 15.4 17.3 14.8 17.3H9.2C8.6 17.3 8 16.7 8 16.1V12.6C8 12 8.6 11.5 9.2 11.5V10C9.2 8.6 10.6 7 12 7M12 8.2C11.2 8.2 10.5 8.7 10.5 10V11.5H13.5V10C13.5 8.7 12.8 8.2 12 8.2Z" />
                  </svg>
                  Unlock with PIN
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-cyan opacity-0 group-hover:opacity-20 transition-opacity" />
              </button>
            </div>
          )}
          
          {/* Unlock Success Indicator */}
          {isPinUnlocked && (
            <div className="mt-4 flex items-center justify-center gap-2 text-neon-green text-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Identity Unlocked</span>
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
