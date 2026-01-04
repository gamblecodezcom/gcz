import { useState, useEffect } from 'react';
import { submitContact, getSocials, type Socials } from '../utils/api';
import { SEOHead, pageSEO } from '../components/Common/SEOHead';

export const Contact = () => {
  const [socials, setSocials] = useState<Socials | null>(null);

  useEffect(() => {
    getSocials().then(setSocials).catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await submitContact(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead {...pageSEO.contact} />
      <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-orbitron mb-4 neon-glow-cyan">
            Contact Us
          </h1>
          <p className="text-text-muted">
            Have a question or feedback? We'd love to hear from you.
          </p>
          {socials && (
            <div className="mt-4 text-sm text-text-muted">
              <p>Or reach us directly:</p>
              <p>
                Email: <a href={`mailto:${socials.email}`} className="text-neon-cyan hover:underline">{socials.email}</a>
              </p>
              <p>
                Telegram: <a href={socials.telegram.channel} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">@GambleCodezDrops</a>
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-neon-cyan mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neon-cyan mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neon-cyan mb-2">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan resize-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-3 text-sm text-green-200">
              Message sent successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full bg-neon-cyan text-bg-dark px-6 py-3 rounded-xl font-semibold hover:shadow-neon-cyan transition-all disabled:opacity-50 relative overflow-hidden"
          >
            <span className="relative z-10">{loading ? 'Sending...' : 'Send Message'}</span>
          </button>
        </form>
      </div>
    </div>
    </>
  );
};
