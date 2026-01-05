import { useState, useEffect } from 'react';
import { getProfile, setRafflePin } from '../utils/api';
import { CWALLET_AFFILIATE_URL, SOCIAL_LINKS } from '../utils/constants';
import { SEOHead } from '../components/Common/SEOHead';
import type { Profile as ProfileType } from '../types';

const getAvatarGradient = (username?: string | null) => {
  if (!username) {
    return 'from-neon-cyan via-neon-pink to-neon-yellow';
  }
  const hash = [...username].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-neon-cyan via-neon-pink to-neon-yellow',
    'from-neon-green via-neon-cyan to-neon-blue',
    'from-neon-pink via-neon-purple to-neon-yellow',
  ];
  return gradients[hash % gradients.length];
};

export const Profile = () => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pin.length < 4 || pin.length > 6) {
      setPinError('PIN must be 4-6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    try {
      await setRafflePin(pin);
      setShowPinForm(false);
      setPin('');
      setConfirmPin('');
      // Refresh profile
      const data = await getProfile();
      setProfile(data);
    } catch (error) {
      setPinError(error instanceof Error ? error.message : 'Failed to set PIN');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto max-w-2xl text-center">
          <p className="text-text-muted">Failed to load profile</p>
        </div>
      </div>
    );
  }

  const stats = profile.stats || {};
  const degenScore = typeof stats.degenScore === 'number' ? stats.degenScore : 0;
  const dropsRedeemed = typeof stats.dropsRedeemed === 'number' ? stats.dropsRedeemed : 0;
  const wheelSpins = typeof stats.wheelSpins === 'number' ? stats.wheelSpins : 0;
  const linkedAccounts = profile.user.linkedSites ?? profile.linkedCasinos?.length ?? 0;
  const newsletterOptIn = profile.user.newsletterAgreed ?? stats.newsletterOptIn ?? false;

  return (
    <>
      <SEOHead
        title="Degen Profile"
        description="Manage your GambleCodez Degen Profile, PIN, and account settings."
        noindex={true}
      />
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-orbitron mb-4 neon-glow-cyan flex items-center gap-3">
              <svg className="w-10 h-10 crown-animation" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
                  fill="url(#crownGradientProfile)"
                  className="drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
                />
                <defs>
                  <linearGradient id="crownGradientProfile" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#FFA500" />
                  </linearGradient>
                </defs>
              </svg>
              Degen Profile
            </h1>
            <p className="text-text-muted">Manage your identity, stats, and access</p>
          </div>

          <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-xl p-8 space-y-8 card-hover relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-neon-pink/5 to-neon-yellow/5 animate-pulse pointer-events-none" />
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarGradient(profile.user.username)} flex items-center justify-center text-2xl font-bold text-bg-dark border-2 border-neon-cyan/40`}
                  >
                    {profile.user.username ? profile.user.username.slice(0, 2).toUpperCase() : 'DG'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-neon-cyan">
                      {profile.user.username ? `@${profile.user.username}` : 'Anonymous Degen'}
                    </h2>
                    <p className="text-text-muted">Degen Score: <span className="text-neon-yellow font-semibold">{degenScore}</span></p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full border border-neon-pink/40 text-neon-pink">Drops Redeemed: {dropsRedeemed}</span>
                      <span className="px-2 py-1 rounded-full border border-neon-cyan/40 text-neon-cyan">Wheel Spins: {wheelSpins}</span>
                      <span className="px-2 py-1 rounded-full border border-neon-green/40 text-neon-green">Linked Accounts: {linkedAccounts}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-bg-dark rounded-lg p-4 border border-neon-cyan/20">
                    <label className="block text-sm text-text-muted mb-1">Discord Handle</label>
                    <div className="text-text-primary font-semibold">
                      {profile.user.discord_username || 'Not linked'}
                    </div>
                  </div>
                  <div className="bg-bg-dark rounded-lg p-4 border border-neon-cyan/20">
                    <label className="block text-sm text-text-muted mb-1">Telegram Handle</label>
                    <div className="text-text-primary font-semibold">
                      {profile.user.telegram_username ? `@${profile.user.telegram_username}` : 'Not linked'}
                    </div>
                  </div>
                  <div className="bg-bg-dark rounded-lg p-4 border border-neon-cyan/20">
                    <label className="block text-sm text-text-muted mb-1">Newsletter Opt-in</label>
                    <div className="text-text-primary font-semibold">
                      {newsletterOptIn ? 'Subscribed' : 'Not subscribed'}
                    </div>
                  </div>
                  <div className="bg-bg-dark rounded-lg p-4 border border-neon-cyan/20">
                    <label className="block text-sm text-text-muted mb-1">Cwallet ID</label>
                    <div className="text-text-primary font-mono">
                      {profile.user.cwallet_id || 'Not set'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg-dark rounded-lg p-4 border border-neon-pink/20">
                  <h3 className="text-sm font-semibold text-neon-pink mb-3">Linked Accounts</h3>
                  <div className="space-y-2 text-sm text-text-muted">
                    <div className="flex justify-between">
                      <span>Runewager</span>
                      <span className="text-text-primary">{profile.user.runewager_username || 'Not linked'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Winna</span>
                      <span className="text-text-primary">{profile.user.winna_username || 'Not linked'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other linked accounts</span>
                      <span className="text-text-primary">{linkedAccounts}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-bg-dark rounded-lg p-4 border border-neon-yellow/20">
                  <h3 className="text-sm font-semibold text-neon-yellow mb-3">Quick Links</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <a href="/dashboard" className="px-3 py-2 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">Dashboard</a>
                    <a href="/drops" className="px-3 py-2 rounded-lg border border-neon-pink/30 text-neon-pink hover:bg-neon-pink/10">Drops</a>
                    <a href="/newsletter" className="px-3 py-2 rounded-lg border border-neon-green/30 text-neon-green hover:bg-neon-green/10">Newsletter</a>
                    <a href="/wheel" className="px-3 py-2 rounded-lg border border-neon-yellow/30 text-neon-yellow hover:bg-neon-yellow/10">Degen Wheel</a>
                    <a href={SOCIAL_LINKS.discord} className="px-3 py-2 rounded-lg border border-purple-400/30 text-purple-300 hover:bg-purple-500/10">Discord</a>
                    <a href={SOCIAL_LINKS.telegram.bot} className="px-3 py-2 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">Telegram</a>
                  </div>
                </div>
              </div>

              <div className="border-t border-neon-cyan/20 pt-6">
                <h2 className="text-xl font-bold text-neon-cyan mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎟️</span>
                  Raffle Access
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Status</label>
                    <div className="text-text-primary">
                      {profile.user.hasRaffleAccess ? (
                        <span className="text-green-400">✓ Active</span>
                      ) : (
                        <span className="text-red-400">✗ Not joined</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Newsletter</label>
                    <div className="text-text-primary">
                      {newsletterOptIn ? (
                        <span className="text-green-400">✓ Subscribed</span>
                      ) : (
                        <span className="text-red-400">✗ Not subscribed</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Raffle PIN</label>
                    <div className="text-text-primary">
                      {profile.rafflePinSet ? (
                        <span className="text-green-400">✓ Set</span>
                      ) : (
                        <span className="text-red-400">✗ Not set</span>
                      )}
                    </div>
                    {!profile.rafflePinSet && (
                      <button
                        onClick={() => setShowPinForm(true)}
                        className="btn-neon mt-2 px-4 py-2 bg-neon-cyan text-bg-dark rounded-xl text-sm font-semibold hover:shadow-neon-cyan transition-all relative overflow-hidden"
                      >
                        <span className="relative z-10">Set PIN</span>
                      </button>
                    )}
                  </div>
                </div>

                {showPinForm && (
                  <form onSubmit={handleSetPin} className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-neon-cyan mb-2">
                        New PIN (4-6 digits)
                      </label>
                      <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                        maxLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neon-cyan mb-2">
                        Confirm PIN
                      </label>
                      <input
                        type="password"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                        maxLength={6}
                        required
                      />
                    </div>
                    {pinError && (
                      <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 text-sm text-red-200">
                        {pinError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="btn-neon px-4 py-2 bg-neon-cyan text-bg-dark rounded-xl font-semibold hover:shadow-neon-cyan transition-all relative overflow-hidden"
                      >
                        <span className="relative z-10">Set PIN</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPinForm(false);
                          setPin('');
                          setConfirmPin('');
                          setPinError('');
                        }}
                        className="px-4 py-2 text-text-muted hover:text-neon-cyan transition-colors rounded-xl hover:bg-bg-dark"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-4 p-4 bg-neon-yellow/20 border border-neon-yellow/50 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <strong className="text-neon-yellow">Warning:</strong>
                      <p className="text-text-muted mt-1">Your PIN cannot be recovered or reset. Keep it safe.</p>
                    </div>
                  </div>
                </div>

                {!profile.user.cwallet_id && (
                  <div className="mt-6 bg-neon-cyan/20 border border-neon-cyan/50 rounded-lg p-4">
                    <p className="text-sm text-neon-cyan mb-2 font-semibold">💡 Need Cwallet?</p>
                    <p className="text-xs text-text-muted mb-3">
                      Cwallet is required for raffle participation and crypto rewards.
                    </p>
                    <a
                      href={CWALLET_AFFILIATE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 btn-neon px-4 py-2 bg-neon-cyan text-bg-dark rounded-lg font-semibold hover:shadow-neon-cyan transition-all"
                    >
                      Join via our Cwallet link →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
