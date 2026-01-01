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
      
      // Update entries count if provided
      if (result.entriesAdded) {
        setEntriesFromWheel(prev => prev + result.entriesAdded!);
      }

      // Reload eligibility to get next spin time
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
      return 'JACKPOT!';
    }
    return reward;
  };

  return (
    <div className="mt-8 bg-bg-dark-2 rounded-2xl border-2 border-neon-cyan/30 p-6 shadow-lg shadow-neon-cyan/10 card-hover relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-yellow/5 via-neon-pink/5 to-neon-cyan/5 animate-pulse pointer-events-none" />
      
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-bg-dark rounded-full w-32 h-32 flex items-center justify-center border-4 border-neon-yellow">
                {spinning ? (
                  <div className="text-neon-cyan animate-pulse">Spinning...</div>
                ) : lastResult ? (
                  <div className="text-center">
                    {lastResult.jackpot ? (
                      <div className="text-2xl font-bold text-neon-yellow animate-pulse">
                        🎉 JACKPOT!
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-neon-cyan">
                        {getRewardDisplay(lastResult.reward)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-text-muted text-sm text-center">Spin to win!</div>
                )}
              </div>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-transparent border-t-neon-pink drop-shadow-lg" />
            </div>
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning || !eligibility.eligible}
            className="btn-neon relative px-8 py-4 bg-gradient-to-r from-neon-yellow to-neon-pink text-bg-dark font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-neon-yellow/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              {spinning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-bg-dark"></div>
                  Spinning...
                </>
              ) : (
                <>
                  <span>🎡</span>
                  Spin Wheel
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-pink opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="bg-bg-dark rounded-xl p-4 border-2 border-neon-cyan/20 card-hover">
            <div className="text-sm text-text-muted mb-1">Spins Remaining Today</div>
            <div className="text-3xl font-bold text-neon-cyan">{spinsRemaining}</div>
          </div>

          {nextResetTime && (
            <div className="bg-bg-dark rounded-xl p-4 border-2 border-neon-pink/20 card-hover">
              <div className="text-sm text-text-muted mb-1">Next Reset</div>
              <div className="text-lg font-semibold text-neon-pink">
                {formatTimeUntilReset(nextResetTime)}
              </div>
            </div>
          )}

          {lastResult && (
            <div className={`bg-bg-dark rounded-xl p-4 border-2 ${lastResult.jackpot ? 'border-neon-gold/50 gold-pulse' : 'border-neon-green/20'} card-hover`}>
              <div className="text-sm text-text-muted mb-1">Last Spin Result</div>
              <div className={`text-xl font-bold ${lastResult.jackpot ? 'text-neon-gold neon-glow-gold' : 'text-neon-green'}`}>
                {getRewardDisplay(lastResult.reward)}
              </div>
              {lastResult.entriesAdded && (
                <div className="text-sm text-text-muted mt-1">
                  +{lastResult.entriesAdded} raffle entries
                </div>
              )}
            </div>
          )}

          {entriesFromWheel > 0 && (
            <div className="bg-bg-dark rounded-xl p-4 border-2 border-neon-cyan/20 card-hover">
              <div className="text-sm text-text-muted mb-1">Total Entries from Wheel</div>
              <div className="text-2xl font-bold text-neon-cyan neon-glow-cyan">{entriesFromWheel}</div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
