import { useState, useEffect } from 'react';
import { getProfile, setRafflePin } from '../utils/api';
import { CWALLET_AFFILIATE_URL, SOCIAL_LINKS } from '../utils/constants';
import { SEOHead } from '../components/Common/SEOHead';
import { TelegramLinkWidget } from '../components/TelegramLinkWidget';
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
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/6 to-transparent p-8 md:p-10 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 hero-grid opacity-30" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neon-cyan mb-4">
                  Degen Identity
                </div>
                <h1 className="text-4xl md:text-5xl font-orbitron mb-3">
                  Degen Profile
                  <span className="text-neon-pink"> control room.</span>
                </h1>
                <p className="text-text-muted">Secure your raffles, manage your handles, and track your sweeps.</p>
              </div>
              <div className="glass-sheen rounded-2xl px-6 py-4 border border-white/10">
                <div className="text-xs uppercase tracking-[0.3em] text-text-muted">Degen Score</div>
                <div className="text-3xl font-semibold text-neon-yellow">{degenScore}</div>
              </div>
            </div>
          </div>

          <div className="bg-bg-dark-2 border border-white/10 rounded-2xl p-8 space-y-8 card-hover relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/8 via-neon-pink/6 to-neon-yellow/6 pointer-events-none" />
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getAvatarGradient(profile.user.username)} flex items-center justify-center text-2xl font-bold text-bg-dark border border-white/15`}>
                    {profile.user.username ? profile.user.username.slice(0, 2).toUpperCase() : 'DG'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-text-primary">
                      {profile.user.username ? `@${profile.user.username}` : 'Anonymous Degen'}
                    </h2>
                    <p className="text-text-muted">Drops redeemed: <span className="text-neon-green font-semibold">{dropsRedeemed}</span></p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full border border-white/10 text-text-primary">Wheel spins: {wheelSpins}</span>
                      <span className="px-2 py-1 rounded-full border border-white/10 text-text-primary">Linked accounts: {linkedAccounts}</span>
                      <span className="px-2 py-1 rounded-full border border-white/10 text-text-primary">{newsletterOptIn ? 'Newsletter on' : 'Newsletter off'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-sheen rounded-xl p-4 border border-white/10">
                    <label className="block text-xs uppercase tracking-widest text-text-muted mb-2">Discord</label>
                    <div className="text-text-primary font-semibold">
                      {profile.user.discord_username || 'Not linked'}
                    </div>
                  </div>
                  <div className="glass-sheen rounded-xl p-4 border border-white/10">
                    <label className="block text-xs uppercase tracking-widest text-text-muted mb-2">Telegram</label>
                    <div className="text-text-primary">
                      {profile.user.telegram_username ? (
                        <span className="font-semibold">@{profile.user.telegram_username}</span>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-text-muted">Not linked yet</p>
                          {profile.user.cwallet_id ? (
                            <TelegramLinkWidget cwalletId={profile.user.cwallet_id} />
                          ) : (
                            <p className="text-xs text-neon-yellow">
                              Set your Cwallet ID first so the Telegram bot can attach to your Degen identity.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="glass-sheen rounded-xl p-4 border border-white/10">
                    <label className="block text-xs uppercase tracking-widest text-text-muted mb-2">Newsletter</label>
                    <div className="text-text-primary font-semibold">
                      {newsletterOptIn ? 'Subscribed' : 'Not subscribed'}
                    </div>
                  </div>
                  <div className="glass-sheen rounded-xl p-4 border border-white/10">
                    <label className="block text-xs uppercase tracking-widest text-text-muted mb-2">Cwallet ID</label>
                    <div className="text-text-primary font-mono">
                      {profile.user.cwallet_id || 'Not set'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg-dark rounded-2xl p-5 border border-white/10">
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

                <div className="bg-bg-dark rounded-2xl p-5 border border-white/10">
                  <h3 className="text-sm font-semibold text-neon-yellow mb-3">Quick Links</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <a href="/dashboard" className="px-3 py-2 rounded-lg border border-white/10 text-text-primary hover:bg-white/5">Dashboard</a>
                    <a href="/drops" className="px-3 py-2 rounded-lg border border-white/10 text-text-primary hover:bg-white/5">Drops</a>
                    <a href="/newsletter" className="px-3 py-2 rounded-lg border border-white/10 text-text-primary hover:bg-white/5">Newsletter</a>
                    <a href="/wheel" className="px-3 py-2 rounded-lg border border-white/10 text-text-primary hover:bg-white/5">Degen Wheel</a>
                    <a href={SOCIAL_LINKS.discord} className="px-3 py-2 rounded-lg border border-white/10 text-text-primary hover:bg-white/5">Discord</a>
                    <a href={SOCIAL_LINKS.telegram.bot} className="px-3 py-2 rounded-lg border border-white/10 text-text-primary hover:bg-white/5">Telegram</a>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h2 className="text-xl font-semibold text-neon-cyan mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎟️</span>
                  Raffle Access
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Status</label>
                    <div className="text-text-primary">
                      {profile.user.hasRaffleAccess ? (
                        <span className="text-neon-green">✓ Active</span>
                      ) : (
                        <span className="text-neon-pink">✗ Not joined</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Newsletter</label>
                    <div className="text-text-primary">
                      {newsletterOptIn ? (
                        <span className="text-neon-green">✓ Subscribed</span>
                      ) : (
                        <span className="text-neon-pink">✗ Not subscribed</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Raffle PIN</label>
                    <div className="text-text-primary">
                      {profile.rafflePinSet ? (
                        <span className="text-neon-green">✓ Set</span>
                      ) : (
                        <span className="text-neon-pink">✗ Not set</span>
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
                      <div className="bg-neon-pink/20 border border-neon-pink/40 rounded-lg p-3 text-sm text-neon-pink">
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

                <div className="mt-4 p-4 bg-neon-yellow/15 border border-neon-yellow/40 rounded-2xl text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <strong className="text-neon-yellow">Warning:</strong>
                      <p className="text-text-muted mt-1">Your PIN cannot be recovered or reset. Keep it safe.</p>
                    </div>
                  </div>
                </div>

                {!profile.user.cwallet_id && (
                  <div className="mt-6 bg-neon-cyan/15 border border-neon-cyan/40 rounded-2xl p-4">
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
