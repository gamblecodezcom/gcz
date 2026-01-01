import { useState, useEffect } from 'react';
import {
  getRunewagerTips,
  getCryptoTips,
  getLootboxRewards,
  getTelegramNotifications,
  updateCryptoAddresses,
  getTipEligibility,
} from '../../utils/api';
import { PinUnlockModal } from './PinUnlockModal';
import { Tooltip } from '../Common/Tooltip';
import type {
  RunewagerTip,
  CryptoTip,
  LootboxReward,
  TelegramNotification,
  User,
} from '../../types';
import type { TipEligibility } from '../../utils/api';

interface GiveawayRewardsPanelProps {
  user: User;
  isPinUnlocked: boolean;
  onPinRequired: () => void;
}

type TabType = 'runewager' | 'crypto' | 'lootbox' | 'telegram';

export const GiveawayRewardsPanel = ({
  user,
  isPinUnlocked,
  onPinRequired,
}: GiveawayRewardsPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('runewager');
  const [runewagerTips, setRunewagerTips] = useState<RunewagerTip[]>([]);
  const [cryptoTips, setCryptoTips] = useState<CryptoTip[]>([]);
  const [lootboxRewards, setLootboxRewards] = useState<LootboxReward[]>([]);
  const [telegramNotifications, setTelegramNotifications] = useState<TelegramNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [cryptoAddresses, setCryptoAddresses] = useState({
    btc: '',
    eth: '',
    sol: '',
    usdt: '',
  });
  const [editingCrypto, setEditingCrypto] = useState(false);
  const [savingCrypto, setSavingCrypto] = useState(false);
  const [tipEligibility, setTipEligibility] = useState<TipEligibility | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rwTips, crypto, lootbox, telegram, eligibility] = await Promise.allSettled([
          getRunewagerTips(),
          getCryptoTips(),
          getLootboxRewards(),
          getTelegramNotifications(),
          getTipEligibility(),
        ]);
        setRunewagerTips(rwTips.status === 'fulfilled' ? rwTips.value : []);
        setCryptoTips(crypto.status === 'fulfilled' ? crypto.value : []);
        setLootboxRewards(lootbox.status === 'fulfilled' ? lootbox.value : []);
        setTelegramNotifications(telegram.status === 'fulfilled' ? telegram.value : []);
        setTipEligibility(eligibility.status === 'fulfilled' ? eligibility.value : null);
      } catch (error) {
        console.error('Failed to fetch rewards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, isPinUnlocked]);

  const handlePinSuccess = () => {
    setShowPinModal(false);
  };

  const handleViewSensitive = () => {
    if (!isPinUnlocked) {
      setShowPinModal(true);
      onPinRequired();
      return false;
    }
    return true;
  };

  const handleSaveCryptoAddresses = async () => {
    if (!isPinUnlocked) {
      setShowPinModal(true);
      onPinRequired();
      return;
    }

    setSavingCrypto(true);
    try {
      await updateCryptoAddresses(cryptoAddresses);
      setEditingCrypto(false);
      // Refresh data
      const tips = await getCryptoTips().catch(() => []);
      setCryptoTips(tips);
    } catch (error) {
      console.error('Failed to save crypto addresses:', error);
    } finally {
      setSavingCrypto(false);
    }
  };

  const maskString = (str: string, visibleChars = 4): string => {
    if (str.length <= visibleChars * 2) return '•'.repeat(str.length);
    return str.substring(0, visibleChars) + '•'.repeat(str.length - visibleChars * 2) + str.substring(str.length - visibleChars);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-neon-green/20 text-neon-green border border-neon-green/50`;
      case 'pending':
        return `${baseClasses} bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/50`;
      case 'logged':
        return `${baseClasses} bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50`;
      case 'claimed':
        return `${baseClasses} bg-neon-green/20 text-neon-green border border-neon-green/50`;
      case 'expired':
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/50`;
      default:
        return `${baseClasses} bg-text-muted/20 text-text-muted border border-text-muted/50`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const tabs = [
    { id: 'runewager' as TabType, label: 'Runewager SC Tip', icon: '🎰' },
    { id: 'crypto' as TabType, label: 'Crypto Tip', icon: '₿' },
    { id: 'lootbox' as TabType, label: 'Lootbox Claims', icon: '🎁' },
    { id: 'telegram' as TabType, label: 'Telegram', icon: '📱' },
  ];

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-neon-cyan mb-6 flex items-center gap-2 neon-glow-cyan">
        <span className="text-3xl">🎁</span>
        Giveaway & Rewards
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-2 border-neon-cyan/20 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-t-xl font-semibold transition-all relative ${
              activeTab === tab.id
                ? 'bg-neon-cyan/20 text-neon-cyan border-t-2 border-x-2 border-neon-cyan/50 shadow-neon-cyan'
                : 'text-text-muted hover:text-neon-cyan/70 hover:bg-neon-cyan/10'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-cyan" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gradient-to-br from-bg-dark-2 to-bg-dark-3 rounded-xl border-2 border-neon-cyan/20 p-6 card-hover">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
          </div>
        ) : (
          <>
            {/* Runewager SC Tips Tab */}
            {activeTab === 'runewager' && (
              <div>
                <div className="mb-6 p-4 bg-neon-cyan/10 rounded-xl border-2 border-neon-cyan/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-pink/5 animate-pulse" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-neon-cyan flex items-center gap-2">
                        <span>🎰</span>
                        Linked Account Info
                      </h3>
                      {tipEligibility && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            tipEligibility.runewager
                              ? 'bg-neon-green/20 text-neon-green border-neon-green/50'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50'
                          }`}
                        >
                          {tipEligibility.runewager ? '✓ Tip Eligible' : '⚠ Link Account'}
                        </span>
                      )}
                    </div>
                    {tipEligibility?.runewager && tipEligibility.runewagerDetails ? (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-text-muted">{tipEligibility.runewagerDetails.identifierType}: </span>
                          <span className="text-neon-cyan font-mono">
                            {isPinUnlocked
                              ? tipEligibility.runewagerDetails.identifierValue
                              : '••••••••'}
                          </span>
                        </div>
                        <div className="text-xs text-neon-green mt-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Account linked and eligible for SC tips
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-text-muted">Username: </span>
                          <span className="text-neon-cyan font-mono">
                            {isPinUnlocked ? (user.username || 'Not set') : '••••••••'}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted">Email: </span>
                          <span className="text-neon-cyan font-mono">
                            {isPinUnlocked ? (user.email || 'Not set') : '••••••••'}
                          </span>
                        </div>
                        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                          <p className="text-xs text-yellow-400">
                            <strong>Link your Runewager account</strong> in the Linked Casino Accounts section to become eligible for SC tips.
                          </p>
                        </div>
                        {!isPinUnlocked && (
                          <button
                            onClick={() => setShowPinModal(true)}
                            className="mt-2 text-xs text-neon-cyan hover:text-neon-cyan/70 underline"
                          >
                            Unlock with PIN to view
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-4">Reward History</h3>
                {runewagerTips.length === 0 ? (
                  <p className="text-text-muted text-center py-8">No Runewager SC tips logged yet</p>
                ) : (
                  <div className="space-y-3">
                    {runewagerTips.map((tip) => (
                      <div
                        key={tip.id}
                        className="p-4 bg-bg-dark rounded-xl border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all card-hover"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-neon-yellow">{tip.amount} SC</div>
                            <div className="text-sm text-text-muted">{formatDate(tip.createdAt)}</div>
                          </div>
                          <span className={getStatusBadge(tip.status)}>{tip.status}</span>
                        </div>
                        {tip.note && (
                          <div className="text-sm text-text-muted mt-2 italic">"{tip.note}"</div>
                        )}
                        {tip.adminName && (
                          <div className="text-xs text-text-muted mt-2">Logged by: {tip.adminName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Crypto Tips Tab */}
            {activeTab === 'crypto' && (
              <div>
                <div className="mb-6 p-4 bg-neon-cyan/10 rounded-xl border-2 border-neon-cyan/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-pink/5 animate-pulse" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-neon-cyan flex items-center gap-2">
                        <span>₿</span>
                        Crypto Addresses
                      </h3>
                    {!editingCrypto && (
                      <button
                        onClick={() => {
                          if (handleViewSensitive()) {
                            setEditingCrypto(true);
                          }
                        }}
                        className="px-3 py-1 text-sm bg-neon-cyan/20 text-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors"
                      >
                        {isPinUnlocked ? 'Edit' : 'Unlock to Edit'}
                      </button>
                    )}
                    </div>
                    {editingCrypto ? (
                    <div className="space-y-3">
                      {(['btc', 'eth', 'sol', 'usdt'] as const).map((asset) => (
                        <div key={asset}>
                          <label className="block text-sm text-text-muted mb-1">
                            {asset.toUpperCase()} Address
                          </label>
                          <input
                            type="text"
                            value={cryptoAddresses[asset]}
                            onChange={(e) =>
                              setCryptoAddresses({ ...cryptoAddresses, [asset]: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-gray-800 border border-neon-cyan/30 rounded text-neon-cyan font-mono text-sm focus:outline-none focus:border-neon-cyan"
                            placeholder={`Enter ${asset.toUpperCase()} address`}
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleSaveCryptoAddresses}
                          disabled={savingCrypto}
                          className="px-4 py-2 bg-neon-green/20 text-neon-green rounded hover:bg-neon-green/30 transition-colors disabled:opacity-50"
                        >
                          {savingCrypto ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingCrypto(false)}
                          className="px-4 py-2 bg-gray-700 text-text-muted rounded hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {(['btc', 'eth', 'sol', 'usdt'] as const).map((asset) => (
                        <div key={asset}>
                          <span className="text-text-muted">{asset.toUpperCase()}: </span>
                          <span className="text-neon-cyan font-mono">
                            {isPinUnlocked
                              ? (cryptoAddresses[asset] || 'Not set')
                              : maskString(cryptoAddresses[asset] || 'Not set')}
                          </span>
                        </div>
                      ))}
                      <div className="mt-2">
                        <span className="text-text-muted">Cwallet ID: </span>
                        <span className="text-neon-cyan font-mono">
                          {isPinUnlocked
                            ? (user.cwallet_id || 'Not set')
                            : maskString(user.cwallet_id || 'Not set')}
                        </span>
                        {!user.cwallet_id && (
                          <Tooltip content="Don't have Cwallet yet? Use our referral link to create one and unlock rewards. Cwallet is required for raffle participation and crypto rewards.">
                            <span className="ml-2 text-xs text-neon-cyan cursor-help underline">Need Cwallet?</span>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-4">Reward History</h3>
                {cryptoTips.length === 0 ? (
                  <p className="text-text-muted text-center py-8">No crypto tips logged yet</p>
                ) : (
                  <div className="space-y-3">
                    {cryptoTips.map((tip) => (
                      <div
                        key={tip.id}
                        className="p-4 bg-bg-dark rounded-xl border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all card-hover"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-neon-yellow">
                              {tip.amount} {tip.asset}
                            </div>
                            <div className="text-sm text-text-muted">{formatDate(tip.createdAt)}</div>
                            <div className="text-xs text-text-muted mt-1">
                              Delivered via: {tip.deliveryMethod.replace('_', ' ')}
                            </div>
                          </div>
                          <span className={getStatusBadge(tip.status)}>{tip.status}</span>
                        </div>
                        {tip.txHash && (
                          <div className="text-xs text-neon-cyan font-mono mt-2 break-all">
                            TX: {tip.txHash}
                          </div>
                        )}
                        {tip.note && (
                          <div className="text-sm text-text-muted mt-2 italic">"{tip.note}"</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lootbox Claims Tab */}
            {activeTab === 'lootbox' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Lootbox Claim URLs</h3>
                {lootboxRewards.length === 0 ? (
                  <p className="text-text-muted text-center py-8">No lootbox rewards available</p>
                ) : (
                  <div className="space-y-3">
                    {lootboxRewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="p-4 bg-bg-dark rounded-xl border border-neon-pink/20 hover:border-neon-pink/40 transition-all card-hover"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-bold text-neon-pink mb-1">{reward.site}</div>
                            <div className="text-sm text-text-muted mb-2">{reward.prizeType}</div>
                            <div className="text-sm">
                              <span className="text-text-muted">Claim URL: </span>
                              {isPinUnlocked ? (
                                <a
                                  href={reward.claimUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neon-cyan hover:text-neon-cyan/70 underline break-all"
                                >
                                  {reward.claimUrl}
                                </a>
                              ) : (
                                <span className="text-neon-cyan font-mono">
                                  {maskString(reward.claimUrl, 8)}
                                  <button
                                    onClick={() => setShowPinModal(true)}
                                    className="ml-2 text-xs underline hover:text-neon-cyan/70"
                                  >
                                    (Unlock to view)
                                  </button>
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={getStatusBadge(reward.status)}>{reward.status}</span>
                        </div>
                        {reward.expiresAt && (
                          <div className="text-xs text-text-muted mt-2">
                            Expires: {getTimeRemaining(reward.expiresAt)} ({formatDate(reward.expiresAt)})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Telegram Notifications Tab */}
            {activeTab === 'telegram' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Telegram Notifications</h3>
                {telegramNotifications.length === 0 ? (
                  <p className="text-text-muted text-center py-8">No Telegram notifications yet</p>
                ) : (
                  <div className="space-y-3">
                    {telegramNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-4 bg-bg-dark rounded-xl border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all card-hover"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">
                            {notif.type === 'raffle_win' && '🎉'}
                            {notif.type === 'secret_code' && '🔑'}
                            {notif.type === 'claim_notification' && '📬'}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-neon-cyan mb-1">{notif.title}</div>
                            <div className="text-sm text-text-muted mb-2">{notif.body}</div>
                            <div className="text-xs text-text-muted">
                              Sent via Telegram @{notif.telegramUsername} • {formatDate(notif.sentAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* PIN Modal */}
      <PinUnlockModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
};
