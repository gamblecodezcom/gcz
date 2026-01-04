import { useState, useEffect } from 'react';
import { getProfile, setRafflePin } from '../utils/api';
import { CWALLET_AFFILIATE_URL } from '../utils/constants';
import { SEOHead } from '../components/Common/SEOHead';
import type { Profile as ProfileType } from '../types';

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

  return (
    <>
      <SEOHead
        title="Profile"
        description="Manage your GambleCodez profile, PIN, and account settings."
        noindex={true}
      />
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto max-w-2xl">
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
          <p className="text-text-muted">Manage your identity, security, and raffle access</p>
        </div>

        <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-xl p-8 space-y-6 card-hover relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-neon-pink/5 to-neon-yellow/5 animate-pulse pointer-events-none" />
          <div className="relative z-10">
          {/* User Info */}
          <div>
            <h2 className="text-xl font-bold text-neon-cyan mb-4 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              User Information
            </h2>
            <div className="space-y-4">
              <div className="bg-bg-dark rounded-lg p-4 border border-neon-cyan/20">
                <label className="block text-sm text-text-muted mb-1">Username</label>
                <div className="text-text-primary font-semibold text-lg">
                  {profile.user.username ? `@${profile.user.username}` : 'Not set'}
                </div>
              </div>
              <div className="bg-bg-dark rounded-lg p-4 border border-neon-cyan/20">
                <label className="block text-sm text-text-muted mb-1">Cwallet ID</label>
                <div className="text-text-primary font-mono">
                  {profile.user.cwallet_id || 'Not set'}
                </div>
              </div>
              {!profile.user.cwallet_id && (
                <div className="bg-neon-cyan/20 border border-neon-cyan/50 rounded-lg p-4">
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

          {/* Raffle Section */}
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
                  {profile.user.newsletterAgreed ? (
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
          </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
