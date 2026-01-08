import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead, pageSEO } from '../components/Common/SEOHead';

type DropPreview = {
  name?: string;
  url?: string;
  category?: string;
  bonus_code?: string;
  bonus_description?: string;
};

const fallbackDrops: DropPreview[] = [
  {
    name: 'Sugarplay Sweeps',
    category: 'Sweeps',
    bonus_description: 'Welcome pack + daily claims',
  },
  {
    name: 'NeonJelly Casino',
    category: 'Sweeps',
    bonus_description: 'Stacked SC boosts on weekends',
  },
  {
    name: 'LemonLuck',
    category: 'Sweeps',
    bonus_description: 'Instant reward drops + streaks',
  },
];

const launchStats = [
  { label: 'Sweeps Drops', value: 'Daily' },
  { label: 'Live Communities', value: 'TG + Discord' },
  { label: 'Raffles', value: 'Weekly' },
  { label: 'New Casinos', value: 'Every Friday' },
];

const sweepSteps = [
  {
    title: 'Discover',
    copy: 'We curate sweeps-only bonuses, verified sites, and live drops.',
  },
  {
    title: 'Claim',
    copy: 'Grab codes, links, and quick signups without the noise.',
  },
  {
    title: 'Redeem',
    copy: 'Track redemptions and cash-outs with clear rules and timing.',
  },
];

const launchPerks = [
  {
    title: 'Sweeps Radar',
    copy: 'Realtime drop detection across casino channels and communities.',
  },
  {
    title: 'Reward Stack',
    copy: 'Auto-sorted promos by value, redemption speed, and region.',
  },
  {
    title: 'Vault Access',
    copy: 'Invite-only raffles and degen wheel bonuses.',
  },
];

export const Home = () => {
  const [drops, setDrops] = useState<DropPreview[]>(fallbackDrops);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadDrops = async () => {
      try {
        const response = await fetch('/api/drops/list');
        if (!response.ok) {
          throw new Error('Failed to load drops');
        }
        const data = await response.json();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setDrops(data.slice(0, 3));
        }
      } catch (error) {
        console.error('Drops preview failed:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadDrops();
    return () => {
      mounted = false;
    };
  }, []);

  const previewDrops = useMemo(() => (loading ? fallbackDrops : drops), [loading, drops]);

  return (
    <>
      <SEOHead {...pageSEO.home} />
      <div className="min-h-screen">
        <section className="relative overflow-hidden pt-28 pb-20 px-4">
          <div className="absolute inset-0 hero-grid opacity-50" />
          <div className="absolute -top-20 right-12 w-64 h-64 rounded-full bg-neon-cyan/15 blur-3xl float-slow" />
          <div className="absolute bottom-10 left-8 w-72 h-72 rounded-full bg-neon-pink/15 blur-3xl float-slow" />
          <div className="container mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fadeInUp">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neon-cyan border border-white/10">
                Launch 2.0
                <span className="w-2 h-2 rounded-full bg-neon-green shadow-neon-green" />
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-orbitron leading-tight">
                <span className="gradient-text">Sweeps-First</span>
                <br />
                Casino Drops
                <span className="text-neon-green"> You Crave</span>
              </h1>
              <p className="text-lg md:text-xl text-text-muted max-w-xl text-balance">
                GambleCodez curates sweepstakes casino drops, verified promos, and raffle rewards with a
                neon-candy glow. Fast, clean, and built for daily collectors.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/drops"
                  className="btn-neon px-8 py-4 rounded-2xl bg-neon-cyan text-bg-dark font-semibold shadow-glow-cyan sparkle"
                >
                  View Drops
                </Link>
                <a
                  href="https://t.me/GCZDrops"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon px-8 py-4 rounded-2xl bg-neon-pink text-white font-semibold shadow-glow-pink"
                >
                  Join Telegram
                </a>
                <a
                  href="https://discord.gg/gcz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon px-8 py-4 rounded-2xl border border-white/20 text-white font-semibold hover:bg-white/5"
                >
                  Join Discord
                </a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-text-muted">
                {launchStats.map((stat) => (
                  <div key={stat.label} className="glass-sheen rounded-xl px-4 py-3 text-center">
                    <div className="text-lg font-semibold text-text-primary">{stat.value}</div>
                    <div className="text-xs uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
              <div className="glass-sheen rounded-3xl p-8 border border-white/10 shadow-card-hover">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-text-primary">Live Sweeps Radar</h3>
                  <span className="text-xs uppercase tracking-[0.2em] text-neon-cyan">Now</span>
                </div>
                <div className="space-y-4">
                  {previewDrops.map((drop, index) => (
                    <div
                      key={`${drop.name}-${index}`}
                      className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 border border-white/10"
                    >
                      <div>
                        <div className="text-sm font-semibold text-text-primary">
                          {drop.name || 'Mystery Drop'}
                        </div>
                        <div className="text-xs text-text-muted">
                          {drop.bonus_description || 'Fresh sweeps bonuses just landed'}
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-neon-green/20 text-neon-green">
                        {drop.category || 'Sweeps'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-text-muted">
                  <span>Auto-refreshes every 30s</span>
                  <span className="text-neon-cyan">Verified sources only</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {launchPerks.map((perk) => (
                  <div
                    key={perk.title}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition-all hover:border-neon-cyan/60 hover:shadow-neon-cyan/30"
                  >
                    <div className="text-sm font-semibold text-text-primary mb-2">{perk.title}</div>
                    <div className="text-xs text-text-muted">{perk.copy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-20 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1">
                <h2 className="text-4xl md:text-5xl font-orbitron mb-6">
                  Sweeps flow,
                  <span className="text-neon-pink"> zero drama.</span>
                </h2>
                <p className="text-text-muted">
                  Launch 2.0 is built for sweepstakes players: transparent rewards, fast redemptions, and
                  community-first drops.
                </p>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                {sweepSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="glass-sheen rounded-3xl p-6 border border-white/10"
                  >
                    <div className="text-xs uppercase tracking-[0.25em] text-neon-yellow mb-4">
                      0{index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">{step.title}</h3>
                    <p className="text-sm text-text-muted">{step.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-20 px-4">
          <div className="container mx-auto">
            <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-10 md:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-orbitron mb-4">
                  Your casino list,
                  <span className="text-neon-green"> curated daily.</span>
                </h2>
                <p className="text-text-muted max-w-2xl">
                  We highlight sweepstakes casinos with fast redemptions, strong bonuses, and compliance-first
                  terms. No fluff, just clean drops and clear rules.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/affiliates"
                  className="btn-neon px-6 py-3 rounded-2xl bg-neon-green text-bg-dark font-semibold shadow-glow-green"
                >
                  Browse Casinos
                </Link>
                <Link
                  to="/raffles"
                  className="btn-neon px-6 py-3 rounded-2xl border border-white/20 text-white font-semibold hover:bg-white/5"
                >
                  Enter Raffles
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
