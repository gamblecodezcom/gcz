import { useState, useEffect } from 'react';
import { checkWheelEligibility, spinWheel, getWheelHistory } from '../../utils/api';
import type { WheelEligibility, WheelSpinResult } from '../../types';
import '../DegenWheel.css';

interface DegenWheelPanelProps {
  spinsRemaining: number;
  onSpinComplete?: () => void;
}

export const DegenWheelPanel = ({ spinsRemaining, onSpinComplete }: DegenWheelPanelProps) => {
  const [eligibility, setEligibility] = useState<WheelEligibility>({ eligible: false });
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<WheelSpinResult | null>(null);
  const [nextResetTime, setNextResetTime] = useState<string | null>(null);
  const [entriesFromWheel, setEntriesFromWheel] = useState(0);

  // NEW: Modal for % breakdown
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Wheel probability breakdown
  const probabilityData = [
    { label: "+5 Entries", chance: "40%" },
    { label: "+10 Entries", chance: "30%" },
    { label: "+20 Entries", chance: "20%" },
    { label: "+50 Entries", chance: "9%" },
    { label: "JACKPOT", chance: "0.01%" },
    { label: "Try Again", chance: "0.99%" }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eligibilityData, historyData] = await Promise.all([
        checkWheelEligibility(),
        getWheelHistory().catch(() => []),
      ]);
      setEligibility(eligibilityData);
      
      if (eligibilityData.nextSpin) {
        setNextResetTime(eligibilityData.nextSpin);
      }

      if (Array.isArray(historyData) && historyData.length > 0) {
        const last = historyData[0];
        if (last.entriesAdded) {
          setEntriesFromWheel(last.entriesAdded);
        }
      }
    } catch (error) {
      console.error('Failed to load wheel data:', error);
    }
  };

  const handleSpin = async () => {
    if (spinning || !eligibility.eligible) return;

    setSpinning(true);
    setLastResult(null);

    try {
      const result = await spinWheel();
      setLastResult(result);
      
      if (result.entriesAdded) {
        setEntriesFromWheel(prev => prev + result.entriesAdded!);
      }

      await loadData();
      
      if (onSpinComplete) {
        onSpinComplete();
      }
    } catch (error) {
      console.error('Spin failed:', error);
      setLastResult({
        reward: 'Error',
        jackpot: false,
      });
    } finally {
      setSpinning(false);
    }
  };

  const formatTimeUntilReset = (nextSpin: string) => {
    const now = new Date();
    const next = new Date(nextSpin);
    const diff = next.getTime() - now.getTime();
    
    if (diff <= 0) return 'Available now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getRewardDisplay = (reward: number | string) => {
    if (typeof reward === 'number') {
      return `+${reward} Entries`;
    }
    if (reward === 'JACKPOT') {
      return (
        <span className="text-neon-gold font-bold gold-pulse" style={{ fontSize: '1.4rem' }}>
          🎉 JACKPOT!
        </span>
      );
    }
    return reward;
  };

  return (
    <div className="mt-8 bg-bg-dark-2 rounded-2xl border-2 border-neon-cyan/30 p-6 shadow-lg shadow-neon-cyan/10 card-hover relative overflow-hidden">

      {/* Hover tooltip icon */}
      <div className="absolute top-4 right-4 z-20 group cursor-pointer">
        <div className="text-neon-cyan text-xl">ℹ️</div>
        <div className="absolute right-0 mt-2 w-64 bg-bg-dark border border-neon-pink/40 text-text-muted text-xs p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg">
          <div className="font-semibold text-neon-pink mb-1">Wheel Fairness</div>
          Every spin is logged and verifiable.  
          <button
            onClick={() => setShowBreakdown(true)}
            className="text-neon-cyan underline mt-1 block"
          >
            View % breakdown
          </button>
        </div>
      </div>

      {/* Fairness badge */}
      <div className="absolute top-4 left-4 bg-neon-green/20 border border-neon-green/40 text-neon-green px-3 py-1 rounded-full text-xs font-bold shadow-md">
        Provably Fair
      </div>

      {/* Locked wheel overlay */}
      {!eligibility.eligible && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-4">
          <div className="text-neon-pink text-lg font-bold mb-2">Wheel Locked</div>

          {!eligibility.loggedIn && (
            <a href="/degen-login" className="text-neon-cyan underline text-sm">Login to unlock</a>
          )}

          {eligibility.loggedIn && !eligibility.profileComplete && (
            <a href="/degen-profile" className="text-neon-yellow underline text-sm">Complete your Degen Profile</a>
          )}

          {eligibility.loggedIn && eligibility.profileComplete && !eligibility.newsletter && (
            <a href="/newsletter" className="text-neon-green underline text-sm">Subscribe to newsletter</a>
          )}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neon-cyan flex items-center gap-2 neon-glow-cyan">
            <span className="text-3xl">🎡</span>
            Degen Wheel
          </h2>
          <div className="text-sm text-text-muted">
            {eligibility.eligible ? (
              <span className="text-neon-green">Ready to spin!</span>
            ) : nextResetTime ? (
              <span>Next spin: {formatTimeUntilReset(nextResetTime)}</span>
            ) : (
              <span>Loading...</span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Wheel */}
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 mb-6">
              <div
                className={`absolute inset-0 rounded-full border-4 border-neon-yellow transition-all ${
                  spinning ? 'animate-spin' : ''
                }`}
                style={{
                  background: `conic-gradient(
                    from 0deg,
                    #FFD600 0deg 45deg,
                    #FF007A 45deg 90deg,
                    #00F5FF 90deg 135deg,
                    #00FF85 135deg 180deg,
                    #FFD600 180deg 225deg,
                    #FF007A 225deg 270deg,
                    #00F5FF 270deg 315deg,
                    #00FF85 315deg 360deg
                  )`,
                  boxShadow: '0 0 30px rgba(255, 214, 0, 0.5)',
                  animationDuration: spinning ? '3s' : 'none',
                }}
              />

              {/* Center result */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-bg-dark rounded-full w-32 h-32 flex items-center justify-center border-4 border-neon-yellow">
                  {spinning ? (
                    <div className="text-neon-cyan animate-pulse">Spinning...</div>
                  ) : lastResult ? (
                    <div className="text-center">
                      {lastResult.jackpot ? (
                        <div className="text-neon-gold font-bold animate-pulse" style={{ fontSize: '1.4rem' }}>
                          🎉 JACKPOT!
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-neon-cyan">
                          {getRewardDisplay(lastResult.reward)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-text-muted text-sm">Spin to win</div>
                  )}
                </div>
              </div>
            </div>

            {/* Spin Button */}
            <button
              onClick={handleSpin}
              disabled={!eligibility.eligible || spinning}
              className={`px-8 py-4 rounded-full font-bold text-lg transition-all ${
                eligibility.eligible && !spinning
                  ? 'bg-neon-cyan text-bg-dark hover:shadow-neon-cyan animate-pulse'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {spinning ? 'Spinning...' : eligibility.eligible ? 'SPIN NOW' : 'Locked'}
            </button>
          </div>

          {/* Stats + Entries */}
          <div className="space-y-4">
            <div className="bg-bg-dark p-4 rounded-lg border border-neon-cyan/20">
              <div className="text-sm text-text-muted">Daily Spins Remaining</div>
              <div className="text-3xl font-bold text-neon-cyan">{spinsRemaining}</div>
            </div>
            <div className="bg-bg-dark p-4 rounded-lg border border-neon-pink/20">
              <div className="text-sm text-text-muted">Entries Earned from Wheel</div>
              <div className="text-3xl font-bold text-neon-pink">{entriesFromWheel}</div>
            </div>
            <div className="bg-bg-dark p-4 rounded-lg border border-neon-yellow/20">
              <div className="text-sm text-text-muted">Last Spin Result</div>
              <div className="text-lg font-bold text-neon-yellow">
                {lastResult ? getRewardDisplay(lastResult.reward) : '—'}
              </div>
            </div>
            <div className="bg-bg-dark p-4 rounded-lg border border-neon-green/20">
              <div className="text-sm text-text-muted">Next Reset</div>
              <div className="text-lg font-bold text-neon-green">
                {nextResetTime ? formatTimeUntilReset(nextResetTime) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Probability Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-dark-2 border-2 border-neon-pink/50 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-neon-pink mb-4">Wheel Odds</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              {probabilityData.map((item) => (
                <li key={item.label} className="flex justify-between">
                  <span>{item.label}</span>
                  <span className="text-neon-cyan font-semibold">{item.chance}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowBreakdown(false)}
              className="mt-6 w-full px-4 py-2 bg-neon-cyan text-bg-dark rounded-lg font-semibold hover:shadow-neon-cyan transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
