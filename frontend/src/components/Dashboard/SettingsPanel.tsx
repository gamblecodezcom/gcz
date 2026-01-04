import { useState, useEffect } from 'react';
import { 
  getNotificationSettings, 
  updateNotificationSettings, 
  changePin, 
  logoutAllSessions, 
  deleteAccount,
  getLinkedSites,
} from '../../utils/api';
import type { User, NotificationSettings, LinkedSite } from '../../types';

interface SettingsPanelProps {
  user: User;
  onUpdate?: () => void;
}

export const SettingsPanel = ({ user, onUpdate }: SettingsPanelProps) => {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNewsletter: false,
    telegramRaffleAlerts: true,
    telegramGiveawayAlerts: true,
    telegramSecretCodeHints: false,
    telegramDropsAlerts: true,
    emailDropsAlerts: false,
    pushDropsAlerts: true,
  });
  const [linkedSites, setLinkedSites] = useState<LinkedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pinAction, setPinAction] = useState<'change' | 'delete' | null>(null);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [notifSettings, sites] = await Promise.all([
        getNotificationSettings(),
        getLinkedSites().catch(() => []),
      ]);
      setNotifications(notifSettings);
      setLinkedSites(sites);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key: keyof NotificationSettings, value: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const updated = { ...notifications, [key]: value };
      await updateNotificationSettings(updated);
      setNotifications(updated);
      setSuccess('Settings updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePin = async () => {
    if (!oldPin || !newPin || !confirmPin) {
      setError('Please fill in all PIN fields');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PINs do not match');
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      setError('PIN must be 4-6 digits');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await changePin(oldPin, newPin);
      setSuccess('PIN changed successfully');
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setPinAction(null);
      setTimeout(() => setSuccess(null), 3000);
      // Refresh dashboard data after PIN change
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to change PIN');
    } finally {
      setSaving(false);
    }
  };

  const [deletePin, setDeletePin] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    if (!deletePin) {
      setError('Please enter your PIN');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await deleteAccount(deletePin);
      setSuccess('Account deletion initiated');
      // Redirect to home after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete account');
      setDeletePin('');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to logout from all devices?')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await logoutAllSessions();
      setSuccess('Logged out from all devices');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to logout');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 bg-bg-dark-2 rounded-2xl border border-neon-cyan/30 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 bg-bg-dark-2 rounded-2xl border-2 border-neon-cyan/30 p-6 shadow-lg shadow-neon-cyan/10 card-hover relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-neon-pink/5 to-neon-yellow/5 animate-pulse pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-neon-cyan flex items-center gap-2 mb-6 neon-glow-cyan">
            <span className="text-3xl">⚙️</span>
            Settings
          </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Section */}
          <section className="bg-bg-dark rounded-xl p-5 border border-neon-cyan/20">
            <h3 className="text-xl font-semibold text-neon-cyan mb-4">Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-muted">Username</label>
                <div className="mt-1 text-text-primary font-medium">{user.username || 'Not set'}</div>
              </div>
              {user.email && (
                <div>
                  <label className="text-sm text-text-muted">Email</label>
                  <div className="mt-1 text-text-primary font-medium">{user.email}</div>
                </div>
              )}
              <div>
                <label className="text-sm text-text-muted">Jurisdiction</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.jurisdiction === 'US' ? 'bg-blue-500/20 text-blue-400' :
                    user.jurisdiction === 'NON_US' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.jurisdiction || 'GLOBAL'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="bg-bg-dark rounded-xl p-5 border border-neon-cyan/20">
            <h3 className="text-xl font-semibold text-neon-cyan mb-4">Security</h3>
            <div className="space-y-4">
              {pinAction === 'change' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Old PIN</label>
                    <input
                      type="password"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value)}
                      className="w-full bg-bg-dark-2 border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                      placeholder="Enter old PIN"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">New PIN</label>
                    <input
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full bg-bg-dark-2 border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                      placeholder="Enter new PIN (4-6 digits)"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Confirm New PIN</label>
                    <input
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full bg-bg-dark-2 border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                      placeholder="Confirm new PIN"
                      maxLength={6}
                    />
                  </div>
                  <div className="p-3 bg-neon-yellow/20 border border-neon-yellow/50 rounded-lg text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-sm">⚠️</span>
                      <p className="text-text-muted">
                        <strong className="text-neon-yellow">Warning:</strong> Your PIN cannot be recovered or reset. Keep it safe.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleChangePin}
                      disabled={saving}
                      className="px-4 py-2 bg-neon-cyan text-bg-dark rounded-lg font-semibold hover:bg-neon-cyan/80 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save PIN'}
                    </button>
                    <button
                      onClick={() => {
                        setPinAction(null);
                        setOldPin('');
                        setNewPin('');
                        setConfirmPin('');
                      }}
                      className="px-4 py-2 bg-bg-dark-2 text-text-primary rounded-lg border border-neon-cyan/30 hover:border-neon-cyan transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setPinAction('change')}
                  className="px-4 py-2 bg-bg-dark-2 text-neon-cyan rounded-lg border border-neon-cyan/30 hover:border-neon-cyan transition-colors"
                >
                  Change PIN
                </button>
              )}

              <button
                onClick={handleLogoutAll}
                disabled={saving}
                className="block w-full px-4 py-2 bg-bg-dark-2 text-neon-pink rounded-lg border border-neon-pink/30 hover:border-neon-pink transition-colors disabled:opacity-50"
              >
                Logout All Sessions
              </button>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="bg-bg-dark rounded-xl p-5 border border-neon-cyan/20">
            <h3 className="text-xl font-semibold text-neon-cyan mb-4">Notifications</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-text-primary">Email Newsletter</span>
                <input
                  type="checkbox"
                  checked={notifications.emailNewsletter}
                  onChange={(e) => handleNotificationChange('emailNewsletter', e.target.checked)}
                  className="w-5 h-5 rounded bg-bg-dark-2 border-neon-cyan/30 text-neon-cyan focus:ring-neon-cyan"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-text-primary">Telegram Raffle Alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.telegramRaffleAlerts}
                  onChange={(e) => handleNotificationChange('telegramRaffleAlerts', e.target.checked)}
                  className="w-5 h-5 rounded bg-bg-dark-2 border-neon-cyan/30 text-neon-cyan focus:ring-neon-cyan"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-text-primary">Telegram Giveaway Alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.telegramGiveawayAlerts}
                  onChange={(e) => handleNotificationChange('telegramGiveawayAlerts', e.target.checked)}
                  className="w-5 h-5 rounded bg-bg-dark-2 border-neon-cyan/30 text-neon-cyan focus:ring-neon-cyan"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-text-primary">Telegram Secret Code Hints</span>
                <input
                  type="checkbox"
                  checked={notifications.telegramSecretCodeHints}
                  onChange={(e) => handleNotificationChange('telegramSecretCodeHints', e.target.checked)}
                  className="w-5 h-5 rounded bg-bg-dark-2 border-neon-cyan/30 text-neon-cyan focus:ring-neon-cyan"
                />
              </label>
              <div className="pt-3 mt-3 border-t border-neon-cyan/20">
                <div className="text-sm text-text-muted mb-2 font-semibold">Drops Notifications</div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-text-primary">Telegram Drops Alerts</span>
                  <input
                    type="checkbox"
                    checked={notifications.telegramDropsAlerts !== false}
                    onChange={(e) => handleNotificationChange('telegramDropsAlerts', e.target.checked)}
                    className="w-5 h-5 rounded bg-bg-dark-2 border-neon-cyan/30 text-neon-cyan focus:ring-neon-cyan"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-text-primary">Email Drops Alerts</span>
                  <input
                    type="checkbox"
                    checked={notifications.emailDropsAlerts || false}
                    onChange={(e) => handleNotificationChange('emailDropsAlerts', e.target.checked)}
                    className="w-5 h-5 rounded bg-bg-dark-2 border-neon-cyan/30 text-neon-cyan focus:ring-neon-cyan"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-text-primary">Push Drops Alerts</span>
                  <input
                    type="checkbox"
                    checked={notifications.pushDropsAlerts !== false}
                    onChange={(e) => handleNotificationChange('pushDropsAlerts', e.target.checked)}
                    className="w-5 h-5 rounded bg-bg-dark-2 border-neon-cyan/30 text-neon-cyan focus:ring-neon-cyan"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Linked Accounts Section */}
          <section className="bg-bg-dark rounded-xl p-5 border border-neon-cyan/20">
            <h3 className="text-xl font-semibold text-neon-cyan mb-4">Linked Accounts</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-primary">Telegram</span>
                <span className={user.telegram_username ? 'text-neon-green' : 'text-text-muted'}>
                  {user.telegram_username ? `@${user.telegram_username}` : 'Not linked'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-primary">Cwallet ID</span>
                <span className={user.cwallet_id ? 'text-neon-green' : 'text-text-muted'}>
                  {user.cwallet_id ? 'Linked' : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-primary">Linked Casinos</span>
                <span className="text-neon-cyan font-semibold">{linkedSites.length}</span>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-bg-dark rounded-xl p-5 border border-red-500/30">
            <h3 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="space-y-4">
              {pinAction === 'delete' ? (
                <div className="space-y-3">
                  <p className="text-text-muted text-sm">
                    This action cannot be undone. Type <strong className="text-red-400">DELETE</strong> to confirm and enter your PIN.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full bg-bg-dark-2 border border-red-500/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-red-500"
                    placeholder="Type DELETE to confirm"
                  />
                  <input
                    type="password"
                    value={deletePin}
                    onChange={(e) => setDeletePin(e.target.value)}
                    className="w-full bg-bg-dark-2 border border-red-500/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-red-500"
                    placeholder="Enter your PIN"
                    maxLength={6}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== 'DELETE' || !deletePin || saving}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Deleting...' : 'Delete Account'}
                    </button>
                    <button
                      onClick={() => {
                        setPinAction(null);
                        setDeleteConfirm('');
                        setDeletePin('');
                      }}
                      className="px-4 py-2 bg-bg-dark-2 text-text-primary rounded-lg border border-red-500/30 hover:border-red-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setPinAction('delete')}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  Delete Account
                </button>
              )}
            </div>
          </section>
        </div>
        </div>
      </div>

    </>
  );
};
