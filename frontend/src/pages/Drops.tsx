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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold font-orbitron mb-2 neon-glow-cyan">
                🎯 GambleCodez Drops
              </h1>
              <p className="text-text-muted">
                Real-time promo codes, bonus links, and exclusive drops from casinos
              </p>
            </div>
            <button
              onClick={() => setShowSubmitForm(!showSubmitForm)}
              className="px-6 py-3 bg-neon-cyan text-bg-dark font-bold rounded-xl hover:shadow-neon-cyan transition-all"
            >
              {showSubmitForm ? '✕ Cancel' : '+ Submit Promo'}
            </button>
          </div>

          {/* Submit Form */}
          {showSubmitForm && (
            <div className="bg-bg-dark-2 border-2 border-neon-cyan/30 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-neon-cyan">Submit a Promo</h2>
              <form onSubmit={handleSubmit}>
                <textarea
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder="Paste promo code, URL, or description here..."
                  className="w-full p-4 bg-bg-dark border-2 border-neon-cyan/30 rounded-lg text-white placeholder-text-muted focus:border-neon-cyan focus:outline-none mb-4"
                  rows={4}
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-neon-cyan text-bg-dark font-bold rounded-lg hover:bg-neon-cyan/80 transition-all"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubmitForm(false)}
                    className="px-6 py-2 bg-bg-dark-2 border-2 border-neon-cyan/30 text-neon-cyan font-bold rounded-lg hover:border-neon-cyan transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <DropsBoard />
      </div>
    </div>
    </>
  );
};
