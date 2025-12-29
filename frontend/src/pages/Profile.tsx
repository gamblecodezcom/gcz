import { useState, useEffect } from 'react';
import { getProfile, setRafflePin } from '../utils/api';
import { CWALLET_AFFILIATE_URL } from '../utils/constants';
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
    } catch (error: any) {
      setPinError(error.message || 'Failed to set PIN');
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
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-orbitron mb-4 neon-glow-cyan">
            Profile
          </h1>
        </div>

        <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-lg p-8 space-y-6">
          {/* User Info */}
          <div>
            <h2 className="text-xl font-bold text-neon-cyan mb-4">User Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-text-muted mb-1">Username</label>
                <div className="text-text-primary">{profile.user.username || 'Not set'}</div>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Cwallet ID</label>
                <div className="text-text-primary">{profile.user.cwallet_id || 'Not set'}</div>
              </div>
              {!profile.user.cwallet_id && (
                <div className="bg-cyan-500/20 border border-cyan-400/50 rounded-lg p-3">
                  <p className="text-sm text-cyan-200 mb-2">Need Cwallet?</p>
                  <a
                    href={CWALLET_AFFILIATE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-neon-cyan hover:underline"
                  >
                    Join via our Cwallet link →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Raffle Section */}
          <div className="border-t border-neon-cyan/20 pt-6">
            <h2 className="text-xl font-bold text-neon-cyan mb-4">Raffle Access</h2>
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

            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-400/50 rounded-lg text-xs text-yellow-200">
              <strong>⚠️ Warning:</strong> PIN cannot be reset via support. Use at your own risk.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
