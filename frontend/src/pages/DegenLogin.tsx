import { useState, useEffect } from 'react';
import { SEOHead } from '../components/Common/SEOHead';
import { SOCIAL_LINKS } from '../utils/constants';
import { setDegenLoginSession, clearDegenLoginSession } from '../utils/api';

const features = [
  {
    title: 'Degen Profile',
    description: 'Track your degen score, spins, drops, and linked accounts.',
    link: '/degen-profile',
    textClass: 'text-neon-cyan',
    borderClass: 'border-neon-cyan/40',
    hoverClass: 'hover:bg-neon-cyan/10',
  },
  {
    title: 'Dashboard',
    description: 'Your live command center for raffles, rewards, and activity.',
    link: '/dashboard',
    textClass: 'text-neon-pink',
    borderClass: 'border-neon-pink/40',
    hoverClass: 'hover:bg-neon-pink/10',
  },
  {
    title: 'Drops',
    description: 'Daily promo drops, codes, and verified affiliate offers.',
    link: '/drops',
    textClass: 'text-neon-yellow',
    borderClass: 'border-neon-yellow/40',
    hoverClass: 'hover:bg-neon-yellow/10',
  },
  {
    title: 'Newsletter',
    description: 'Unlock spins and alerts by joining the GCZ newsletter.',
    link: '/newsletter',
    textClass: 'text-neon-green',
    borderClass: 'border-neon-green/40',
    hoverClass: 'hover:bg-neon-green/10',
  },
  {
    title: 'Degen Wheel',
    description: 'Spin daily for raffle entries and jackpot boosts.',
    link: '/wheel',
    textClass: 'text-neon-cyan',
    borderClass: 'border-neon-cyan/40',
    hoverClass: 'hover:bg-neon-cyan/10',
  },
];

const integrations = [
  {
    title: 'Telegram Integration',
    description: 'Link the official bot for drops and winner alerts.',
    link: SOCIAL_LINKS.telegram.bot,
    textClass: 'text-neon-pink',
    borderClass: 'border-neon-pink/40',
    hoverClass: 'hover:bg-neon-pink/10',
    external: true,
  },
  {
    title: 'Discord Integration',
    description: 'Join the GCZ Discord for real-time community drops.',
    link: SOCIAL_LINKS.discord,
    textClass: 'text-purple-300',
    borderClass: 'border-purple-400/40',
    hoverClass: 'hover:bg-purple-500/10',
    external: true,
  },
];

export const DegenLogin = () => {
  const [telegramId, setTelegramId] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setActiveSession(window.localStorage.getItem('gcz_user_id'));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!telegramId.trim()) {
      setError('Telegram ID is required.');
      return;
    }

    if (!/^\d+$/.test(telegramId.trim())) {
      setError('Telegram ID must be numeric.');
      return;
    }

    setDegenLoginSession(telegramId.trim(), username.trim() || undefined);
    setActiveSession(telegramId.trim());
    setMessage('Degen session locked in. Your profile is now active.');
    setTelegramId('');
  };

  const handleClear = () => {
    clearDegenLoginSession();
    setActiveSession(null);
    setMessage('Session cleared. Enter a new Telegram ID to continue.');
  };

  return (
    <>
      <SEOHead
        title="GambleCodez Degen Login"
        description="Unified Degen Login for GambleCodez profiles, drops, dashboard, wheel, and integrations."
        noindex={false}
      />
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold font-orbitron neon-glow-cyan mb-4">
              GambleCodez Degen Login
            </h1>
            <p className="text-text-muted max-w-2xl mx-auto">
              Central access for every degen feature. Verify your Telegram ID, unlock your
              profile, and flex across drops, raffles, and spins.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-bg-dark-2 border border-neon-cyan/30 rounded-2xl p-6 shadow-lg shadow-neon-cyan/10">
              <h2 className="text-2xl font-bold text-neon-cyan mb-4">Secure Degen Session</h2>
              <p className="text-text-muted mb-6">
                Use your Telegram ID to establish a verified degen session for the GCZ ecosystem.
              </p>

              {activeSession && (
                <div className="mb-6 rounded-xl border border-neon-green/40 bg-neon-green/5 p-4">
                  <div className="text-sm text-neon-green font-semibold">Active Session</div>
                  <div className="text-lg text-text-primary font-bold">Telegram ID: {activeSession}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href="/dashboard"
                      className="px-4 py-2 rounded-lg border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                    >
                      Go to Dashboard
                    </a>
                    <a
                      href="/degen-profile"
                      className="px-4 py-2 rounded-lg border border-neon-pink/40 text-neon-pink hover:bg-neon-pink/10 transition-all"
                    >
                      View Degen Profile
                    </a>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-2">Telegram ID</label>
                  <input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                    placeholder="Enter numeric Telegram ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Username (optional)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                    placeholder="@YourHandle"
                  />
                </div>
                {error && (
                  <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="bg-neon-green/10 border border-neon-green/40 rounded-lg p-3 text-sm text-neon-green">
                    {message}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full btn-neon px-6 py-3 bg-neon-cyan text-bg-dark rounded-xl font-bold hover:shadow-neon-cyan transition-all"
                >
                  Activate Degen Login
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full px-6 py-3 rounded-xl border border-neon-pink/40 text-neon-pink hover:bg-neon-pink/10 transition-all"
                >
                  Clear Session
                </button>
              </form>

              <div className="mt-6 p-4 bg-bg-dark border border-neon-yellow/40 rounded-xl">
                <p className="text-sm text-text-muted">
                  <strong className="text-neon-yellow">Admin Access:</strong> Use the separate
                  admin login to enter control tools.
                </p>
                <a
                  href="/admin/login.html"
                  className="inline-flex items-center gap-2 mt-3 text-neon-yellow hover:text-neon-yellow/80"
                >
                  Open GambleCodez Admin Control →
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-bg-dark-2 border border-neon-pink/30 rounded-2xl p-6 shadow-lg shadow-neon-pink/10">
                <h2 className="text-2xl font-bold text-neon-pink mb-4">Degen Access Grid</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {features.map((feature) => (
                    <a
                      key={feature.title}
                      href={feature.link}
                      className={`border ${feature.borderClass} rounded-xl p-4 bg-bg-dark ${feature.hoverClass} transition-all`}
                    >
                      <div className={`${feature.textClass} font-semibold mb-1`}>{feature.title}</div>
                      <p className="text-xs text-text-muted">{feature.description}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-bg-dark-2 border border-neon-cyan/30 rounded-2xl p-6 shadow-lg shadow-neon-cyan/10">
                <h2 className="text-2xl font-bold text-neon-cyan mb-4">Integrations</h2>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <a
                      key={integration.title}
                      href={integration.link}
                      target={integration.external ? '_blank' : undefined}
                      rel={integration.external ? 'noopener noreferrer' : undefined}
                      className={`block border ${integration.borderClass} rounded-xl p-4 bg-bg-dark ${integration.hoverClass} transition-all`}
                    >
                      <div className={`${integration.textClass} font-semibold mb-1`}>{integration.title}</div>
                      <p className="text-xs text-text-muted">{integration.description}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-bg-dark-2 border border-neon-yellow/30 rounded-2xl p-6 shadow-lg shadow-neon-yellow/10">
                <h2 className="text-xl font-bold text-neon-yellow mb-3">Motto</h2>
                <p className="text-text-muted">“Redeem today, flex tomorrow.”</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
