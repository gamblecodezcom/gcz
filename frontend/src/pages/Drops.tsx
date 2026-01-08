import { useState } from 'react';
import { DropsBoard } from '../components/Drops/DropsBoard';
import { SEOHead, pageSEO } from '../components/Common/SEOHead';

export const Drops = () => {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitText, setSubmitText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitText.trim()) return;

    try {
      const response = await fetch('/api/drops/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'site_form',
          source_user_id: 'anonymous',
          raw_text: submitText,
          metadata: {
            submitted_via: 'site_form'
          }
        }),
      });

      if (response.ok) {
        alert('✅ Thanks! Your promo submission has been received and will be reviewed.');
        setSubmitText('');
        setShowSubmitForm(false);
      } else {
        alert('❌ Error submitting promo. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting promo:', error);
      alert('❌ Error submitting promo. Please try again.');
    }
  };

  return (
    <>
      <SEOHead {...pageSEO.drops} />
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 md:p-12 mb-10 relative overflow-hidden">
            <div className="absolute inset-0 hero-grid opacity-30" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neon-cyan mb-4">
                  Live Drops
                </div>
                <h1 className="text-4xl md:text-5xl font-orbitron mb-3">
                  Sweeps promos, <span className="text-neon-green">curated fresh.</span>
                </h1>
                <p className="text-text-muted max-w-2xl">
                  We collect sweepstakes casino drops, verified bonuses, and community finds. Submit a promo to
                  keep the vault full.
                </p>
              </div>
              <button
                onClick={() => setShowSubmitForm(!showSubmitForm)}
                className="btn-neon px-6 py-3 rounded-2xl bg-neon-cyan text-bg-dark font-semibold shadow-glow-cyan"
              >
                {showSubmitForm ? 'Close Form' : 'Submit a Promo'}
              </button>
            </div>
          </div>

          {showSubmitForm && (
            <div className="glass-sheen border border-white/10 rounded-2xl p-6 md:p-8 mb-10">
              <h2 className="text-xl font-semibold mb-4 text-neon-cyan">Drop a promo</h2>
              <form onSubmit={handleSubmit}>
                <textarea
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder="Paste promo code, URL, or short description..."
                  className="w-full p-4 bg-bg-dark-2 border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-neon-cyan focus:outline-none mb-4"
                  rows={4}
                  required
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="btn-neon px-6 py-2 rounded-xl bg-neon-green text-bg-dark font-semibold"
                  >
                    Submit Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubmitForm(false)}
                    className="px-6 py-2 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <DropsBoard />

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-text-muted">
            Sweepstakes only. No real-money gambling. Always check eligibility and redemption rules in your
            jurisdiction.
          </div>
        </div>
      </div>
    </>
  );
};
