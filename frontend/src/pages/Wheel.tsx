import { useState } from 'react';
import { SEOHead, pageSEO } from '../components/Common/SEOHead';

export const Wheel = () => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const prizes = ['10 USDT', '5 USDT', 'Free Spin', '50 USDT', '2 USDT', 'Try Again', '100 USDT', '1 USDT'];

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    // Simulate spin
    setTimeout(() => {
      const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
      setResult(randomPrize);
      setSpinning(false);
    }, 3000);
  };

  return (
    <>
      <SEOHead {...pageSEO.wheel} />
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto max-w-5xl">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 md:p-10 mb-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neon-yellow mb-4">
                Degen Wheel
              </div>
              <h1 className="text-4xl md:text-5xl font-orbitron mb-3">
                Spin for sweepstakes
                <span className="text-neon-green"> rewards.</span>
              </h1>
              <p className="text-text-muted max-w-2xl">
                One spin per day, live streak bonuses, and instant prizes. Verified by GCZ for fairness.
              </p>
            </div>
            <div className="glass-sheen rounded-2xl px-6 py-4 border border-white/10">
              <div className="text-xs uppercase tracking-[0.3em] text-text-muted">Daily Spins</div>
              <div className="text-3xl font-semibold text-neon-yellow">1</div>
              <div className="text-xs text-text-muted">Cooldown resets at 12am UTC</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
            <div className="glass-sheen rounded-3xl p-8 border border-white/10">
              <div className="flex justify-center mb-8">
                <div className="wheel-container">
                  <div className="wheel-wrapper">
                    <div className={`wheel ${spinning ? 'animate-spin-slow' : ''}`} />
                    <div className="wheel-inner">
                      <div className="text-center">
                        <div className="text-xs uppercase tracking-[0.3em] text-text-muted">Result</div>
                        <div className="text-2xl font-semibold text-neon-yellow mt-2">
                          {result || 'Spin to win'}
                        </div>
                      </div>
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[18px] border-transparent border-t-neon-yellow" />
                  </div>
                  <button
                    onClick={handleSpin}
                    disabled={spinning}
                    className="btn-neon px-8 py-4 bg-neon-yellow text-bg-dark font-semibold text-lg rounded-2xl hover:shadow-neon-yellow transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                  >
                    <span className="relative z-10">{spinning ? 'Spinning...' : 'Spin Wheel'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-sheen rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-text-primary mb-3">Today’s Prize Pool</h2>
                <div className="grid grid-cols-2 gap-3 text-sm text-text-muted">
                  {prizes.map((prize) => (
                    <div key={prize} className="rounded-xl border border-white/10 px-3 py-2">
                      {prize}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-sheen rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-text-primary mb-3">How it works</h3>
                <ul className="space-y-2 text-sm text-text-muted">
                  <li>1. Verify your raffle PIN in your Degen profile.</li>
                  <li>2. Spin daily for sweepstakes bonuses.</li>
                  <li>3. Rewards post to your GCZ dashboard.</li>
                </ul>
              </div>

              <div className="bg-bg-dark-2 rounded-2xl border border-white/10 p-6 text-sm text-text-muted">
                Sweepstakes only. No real-money wagering. Must be 18+ where permitted.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
