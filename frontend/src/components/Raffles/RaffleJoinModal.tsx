import { useState } from 'react';
import { CWALLET_AFFILIATE_URL } from '../../utils/constants';
import { Tooltip, InlineHelper } from '../Common/Tooltip';

interface RaffleJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (data: { cwalletId: string; pin: string; newsletterAgreed: boolean }) => Promise<void>;
  hasCwallet: boolean;
}

export const RaffleJoinModal = ({ isOpen, onClose, onJoin, hasCwallet }: RaffleJoinModalProps) => {
  const [cwalletId, setCwalletId] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [newsletterAgreed, setNewsletterAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cwalletId.trim()) {
      setError('Cwallet ID is required');
      return;
    }

    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be 4-6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!newsletterAgreed) {
      setError('You must agree to newsletters to join raffles');
      return;
    }

    setLoading(true);
    try {
      await onJoin({ cwalletId, pin, newsletterAgreed });
      onClose();
      setCwalletId('');
      setPin('');
      setConfirmPin('');
      setNewsletterAgreed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join raffles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-bg-dark-2 border-2 border-neon-cyan rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neon-cyan">Join Raffle System</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-neon-cyan transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-3 mb-4 text-sm text-yellow-200">
          <strong>⚠️ Important:</strong> Your Raffle PIN cannot be reset automatically. If you forget it, you may lose access to your entries. Choose something memorable and keep it safe.
        </div>
        <InlineHelper text="Your PIN is used to verify your identity when entering raffles. It's encrypted and cannot be recovered if forgotten." />

        {!hasCwallet && (
          <div className="bg-cyan-500/20 border border-cyan-400/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-cyan-200 mb-2">Need Cwallet?</p>
            <a
              href={CWALLET_AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-neon-cyan hover:underline"
            >
              Join via our Cwallet link →
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neon-cyan mb-2">
              Cwallet ID *
            </label>
            <input
              type="text"
              value={cwalletId}
              onChange={(e) => setCwalletId(e.target.value)}
              className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
              placeholder="e.g., 49657363"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neon-cyan mb-2">
              Raffle PIN (4-6 digits) *
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
              placeholder="Enter PIN"
              maxLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neon-cyan mb-2">
              Confirm PIN *
            </label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
              placeholder="Confirm PIN"
              maxLength={6}
              required
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="newsletter"
              checked={newsletterAgreed}
              onChange={(e) => setNewsletterAgreed(e.target.checked)}
              className="mt-1 mr-2"
              required
            />
            <label htmlFor="newsletter" className="text-sm text-text-muted">
              I agree to join the GambleCodez Newsletter and receive raffle updates *
              <Tooltip content="Newsletter subscription is required to participate in raffles. You'll receive updates about new raffles, winners, and exclusive opportunities.">
                <span className="ml-1 text-neon-cyan cursor-help">ℹ️</span>
              </Tooltip>
            </label>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-neon-cyan text-bg-dark px-4 py-2 rounded-lg font-semibold hover:shadow-neon-cyan transition-all disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Raffles'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:text-neon-cyan transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
