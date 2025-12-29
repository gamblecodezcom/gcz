import { useState } from 'react';

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
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-orbitron mb-4 neon-glow-yellow">
            Degen Daily Wheel
          </h1>
          <p className="text-text-muted">
            Spin once per day for instant rewards
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative w-80 h-80">
            <div
              className={`absolute inset-0 rounded-full border-8 border-neon-yellow ${
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
                transition: spinning ? 'none' : 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-bg-dark-2 rounded-full w-32 h-32 flex items-center justify-center border-4 border-neon-yellow">
                {result ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-yellow">{result}</div>
                  </div>
                ) : (
                  <div className="text-text-muted text-sm">Spin to win!</div>
                )}
              </div>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-neon-yellow" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="btn-neon px-8 py-4 bg-neon-yellow text-bg-dark font-bold text-xl rounded-xl hover:shadow-neon-yellow transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <span className="relative z-10">{spinning ? 'Spinning...' : 'Spin Wheel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
