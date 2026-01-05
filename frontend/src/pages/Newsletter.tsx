import { useState } from 'react';
import { SEOHead } from '../components/Common/SEOHead';
import { subscribeNewsletter, unsubscribeNewsletter } from '../utils/api';

export const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await subscribeNewsletter(email.trim());
      setStatus(`Subscribed: ${result.status}`);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email.trim()) {
      setError('Enter an email to unsubscribe.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await unsubscribeNewsletter(email.trim());
      setStatus(`Unsubscribed: ${result.status}`);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="GambleCodez Newsletter"
        description="Join the GambleCodez newsletter for drops, raffles, and degen alerts."
      />
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold font-orbitron neon-glow-cyan mb-4">
              GCZ Newsletter
            </h1>
            <p className="text-text-muted">
              Subscribe for drop alerts, raffles, and VIP promos. Opt out anytime.
            </p>
          </div>

          <div className="bg-bg-dark-2 border border-neon-cyan/30 rounded-2xl p-8 shadow-lg shadow-neon-cyan/10">
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                  placeholder="you@degenmail.com"
                  required
                />
              </div>
              {error && (
                <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              {status && (
                <div className="bg-neon-green/10 border border-neon-green/40 rounded-lg p-3 text-sm text-neon-green">
                  {status}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-neon px-6 py-3 bg-neon-cyan text-bg-dark rounded-xl font-bold hover:shadow-neon-cyan transition-all disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Subscribe'}
                </button>
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="flex-1 px-6 py-3 rounded-xl border border-neon-pink/40 text-neon-pink hover:bg-neon-pink/10 transition-all disabled:opacity-50"
                >
                  Unsubscribe
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 text-sm text-text-muted text-center">
            By subscribing you agree to receive occasional updates. We never sell your data.
          </div>
        </div>
      </div>
    </>
  );
};
