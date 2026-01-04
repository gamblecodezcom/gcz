import { useState, useEffect } from 'react';
import { getRaffles, getPastRaffles, submitSecretCode, getRaffleEntries, getEndlessRaffle } from '../../utils/api';
import type { Raffle, RaffleEntry, SecretCodeResponse } from '../../types';

interface RafflesPanelProps {
  onEntryAdded?: () => void;
}

export const RafflesPanel = ({ onEntryAdded }: RafflesPanelProps) => {
  const [activeRaffles, setActiveRaffles] = useState<Raffle[]>([]);
  const [pastRaffles, setPastRaffles] = useState<Raffle[]>([]);
  const [raffleEntries, setRaffleEntries] = useState<Map<string, RaffleEntry[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [secretCode, setSecretCode] = useState('');
  const [submittingCode, setSubmittingCode] = useState(false);
  const [codeResult, setCodeResult] = useState<SecretCodeResponse | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [showPastRaffles, setShowPastRaffles] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [endlessRaffle, setEndlessRaffle] = useState<{ raffle: Raffle | null; userEntries: number; totalEntries: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [active, past, endless] = await Promise.all([
          getRaffles().catch(() => []),
          getPastRaffles().catch(() => []),
          getEndlessRaffle().catch(() => ({ raffle: null, userEntries: 0, totalEntries: 0 })),
        ]);
        setActiveRaffles(active);
        setPastRaffles(past);
        setEndlessRaffle(endless);

        // Fetch entries for active raffles
        const entriesMap = new Map<string, RaffleEntry[]>();
        const entryPromises = active.map(async (raffle) => {
          try {
            const entries = await getRaffleEntries(raffle.id);
            return { raffleId: raffle.id, entries };
          } catch (error) {
            console.error(`Failed to fetch entries for raffle ${raffle.id}:`, error);
            return { raffleId: raffle.id, entries: [] };
          }
        });
        const entryResults = await Promise.allSettled(entryPromises);
        entryResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            entriesMap.set(result.value.raffleId, result.value.entries);
          }
        });
        setRaffleEntries(entriesMap);
      } catch (error) {
        console.error('Failed to fetch raffles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmitSecretCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretCode.trim()) return;

    setSubmittingCode(true);
    setCodeError(null);
    setCodeResult(null);

    try {
      const result = await submitSecretCode(secretCode.trim());
      setCodeResult(result);
      setSecretCode('');

      if (result.success) {
        setShowConfetti(true);
        // Add success wave animation
        const codeInput = document.querySelector('.secret-code-input');
        if (codeInput) {
          codeInput.classList.add('success-wave-active');
          setTimeout(() => {
            codeInput.classList.remove('success-wave-active');
          }, 500);
        }
        setTimeout(() => setShowConfetti(false), 3000);
        if (onEntryAdded) onEntryAdded();
        // Refresh raffles and entries
        const [active, past] = await Promise.all([
          getRaffles().catch(() => []),
          getPastRaffles().catch(() => []),
        ]);
        setActiveRaffles(active);
        setPastRaffles(past);
      } else {
        // Shake animation will be handled by CSS
        setCodeError(result.message || 'Invalid or expired code');
      }
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Failed to submit code');
    } finally {
      setSubmittingCode(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (endsAt: string) => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTotalEntries = (raffleId: string) => {
    const entries = raffleEntries.get(raffleId) || [];
    return entries.reduce((sum, entry) => sum + entry.entries, 0);
  };

  const getEntryBreakdown = (raffleId: string) => {
    const entries = raffleEntries.get(raffleId) || [];
    const breakdown: Record<string, number> = {};
    entries.forEach((entry) => {
      breakdown[entry.source] = (breakdown[entry.source] || 0) + entry.entries;
    });
    return breakdown;
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-neon-cyan mb-6 flex items-center gap-2">
        <span className="text-3xl">🎟️</span>
        Raffles
      </h2>

      {/* Endless Raffle Banner */}
      {endlessRaffle?.raffle && (
        <div className="mb-6 p-6 bg-gradient-to-r from-neon-pink/20 via-neon-cyan/20 to-neon-pink/20 rounded-xl border-2 border-neon-cyan/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-pink/5 animate-pulse" />
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl animate-spin" style={{ animationDuration: '3s' }}>♾️</span>
                  <h3 className="text-xl font-bold text-neon-cyan">Never-Ending Raffle</h3>
                  <span className="px-3 py-1 bg-neon-green/20 border border-neon-green/50 rounded-full text-xs font-semibold text-neon-green">
                    Active
                  </span>
                </div>
                <p className="text-text-muted mb-3">{endlessRaffle.raffle.description || 'Spin the wheel daily to earn entries!'}</p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-text-muted">Your Entries: </span>
                    <span className="text-neon-cyan font-bold text-lg">{endlessRaffle.userEntries}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Total Entries: </span>
                    <span className="text-neon-pink font-bold text-lg">{endlessRaffle.totalEntries}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Prize: </span>
                    <span className="text-neon-yellow font-bold">{endlessRaffle.raffle.prize}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Raffles - Left Side */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-neon-pink mb-4">Active Raffles</h3>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
            </div>
          ) : activeRaffles.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-lg border border-neon-cyan/20 p-8 text-center">
              <p className="text-text-muted">No active raffles at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRaffles.map((raffle) => {
                const totalEntries = getTotalEntries(raffle.id);
                const breakdown = getEntryBreakdown(raffle.id);
                return (
                  <div
                    key={raffle.id}
                    className={`bg-gradient-to-br from-bg-dark-2 to-bg-dark-3 rounded-lg border border-neon-cyan/20 p-6 hover:border-neon-cyan/40 transition-all card-hover ${
                      raffle.winners && raffle.winners.length > 0 ? 'gold-pulse' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-neon-pink mb-2">{raffle.title}</h4>
                        {raffle.description && (
                          <p className="text-text-muted text-sm mb-3">{raffle.description}</p>
                        )}
                        <div className="text-lg font-bold text-neon-yellow mb-2">{raffle.prize}</div>
                      </div>
                      {raffle.isSecret && (
                        <span className="px-2 py-1 bg-neon-pink/20 text-neon-pink rounded-full text-xs font-semibold border border-neon-pink/50">
                          🔒 Secret
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-text-muted mb-1">Your Entries</div>
                        <div className="text-xl font-bold text-neon-cyan">{totalEntries}</div>
                      </div>
                      <div>
                        <div className="text-text-muted mb-1">Time Left</div>
                        <div className="text-lg font-bold text-neon-yellow">{getTimeRemaining(raffle.endsAt)}</div>
                      </div>
                    </div>

                    {Object.keys(breakdown).length > 0 && (
                      <div className="mb-4 p-3 bg-gray-800/50 rounded border border-neon-cyan/10">
                        <div className="text-xs text-text-muted mb-2">Entry Sources:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(breakdown).map(([source, count]) => (
                            <span
                              key={source}
                              className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan rounded text-xs"
                            >
                              {source.replace('_', ' ')}: +{count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors text-sm">
                        View Details
                      </button>
                      {totalEntries > 0 && (
                        <button className="px-4 py-2 bg-gray-700 text-text-muted rounded hover:bg-gray-600 transition-colors text-sm">
                          View Entries Breakdown
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past Raffles - Collapsible */}
          {pastRaffles.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowPastRaffles(!showPastRaffles)}
                className="w-full flex justify-between items-center p-4 bg-gray-800/50 rounded-lg border border-neon-cyan/20 hover:border-neon-cyan/40 transition-colors"
              >
                <h3 className="text-lg font-bold text-neon-pink">Past Raffles</h3>
                <span className="text-neon-cyan">{showPastRaffles ? '▼' : '▶'}</span>
              </button>

              {showPastRaffles && (
                <div className="mt-4 space-y-3">
                  {pastRaffles.map((raffle) => {
                    const isWinner = raffle.winners && raffle.winners.length > 0;
                    return (
                      <div
                        key={raffle.id}
                        className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-neon-cyan mb-1">{raffle.title}</h4>
                            <div className="text-sm text-text-muted mb-2">
                              Ended: {formatDate(raffle.endsAt)}
                            </div>
                            <div className="text-sm text-neon-yellow">{raffle.prize}</div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                isWinner
                                  ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                                  : 'bg-gray-700/50 text-text-muted'
                              }`}
                            >
                              {isWinner ? 'Won' : 'Lost'}
                            </span>
                            {isWinner && (
                              <div className="text-xs text-text-muted mt-1">
                                Reward: {raffle.prizeType}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Secret Code Entry - Right Side */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-neon-pink/10 to-neon-cyan/10 rounded-lg border-2 border-neon-pink/30 p-6 relative overflow-hidden">
            {/* Confetti Animation */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-xl">
                {[...Array(50)].map((_, i) => {
                  const colors = ['#00F5FF', '#FF007A', '#FFD600', '#00FF85'];
                  const color = colors[i % colors.length];
                  return (
                    <div
                      key={i}
                      className="confetti-particle"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        color: color,
                        top: '-10px',
                      }}
                    />
                  );
                })}
              </div>
            )}

            <h3 className="text-xl font-bold text-neon-pink mb-2">Secret Code Entry</h3>
            <p className="text-sm text-text-muted mb-4">
              Enter the secret code phrase from our socials to unlock hidden raffles and extra entries.
            </p>

            <form onSubmit={handleSubmitSecretCode}>
              <div className="mb-4 relative">
                <input
                  type="text"
                  value={secretCode}
                  onChange={(e) => {
                    setSecretCode(e.target.value);
                    setCodeError(null);
                    setCodeResult(null);
                  }}
                  className={`secret-code-input w-full px-4 py-3 bg-bg-dark border-2 rounded-lg text-neon-cyan font-semibold focus:outline-none transition-all ${
                    codeError
                      ? 'border-red-500 animate-shake'
                      : codeResult?.success
                      ? 'border-neon-green shadow-neon-green'
                      : 'border-neon-cyan/30 focus:border-neon-cyan focus:shadow-neon-cyan'
                  }`}
                  placeholder="Enter secret code..."
                  disabled={submittingCode}
                />
                {codeResult?.success && (
                  <div className="success-wave" />
                )}
              </div>

              {codeError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
                  {codeError}
                </div>
              )}

              {codeResult?.success && (
                <div className="mb-4 p-3 bg-neon-green/20 border border-neon-green/50 rounded text-neon-green text-sm">
                  ✅ Code accepted — +{codeResult.entriesAdded || 0} entries added!
                </div>
              )}

              <button
                type="submit"
                disabled={submittingCode || !secretCode.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold rounded-lg hover:from-neon-pink/80 hover:to-neon-cyan/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {submittingCode ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Submitting...
                  </span>
                ) : (
                  'Submit Code'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Shake animation for errors - using global CSS */}
    </div>
  );
};
