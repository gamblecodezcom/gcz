import { useState } from 'react';

interface CodeEntryBoxProps {
  onSubmit?: (code: string) => void;
  confirmedCode?: string | null;
}

export const CodeEntryBox = ({ onSubmit, confirmedCode = null }: CodeEntryBoxProps) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(code);
      }
      setCode('');
    } catch (error) {
      console.error('Failed to submit code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-text-muted mb-2 leading-relaxed">
            Enter the secret code phrase from my socials to unlock hidden raffles & extra entries.
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter secret code..."
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-bg-dark border-2 border-neon-pink/30 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-pink focus:shadow-neon-pink transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!code.trim() || isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-neon-pink to-neon-purple rounded-xl font-bold uppercase tracking-wider text-bg-dark hover:shadow-neon-pink transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                'SUBMIT'
              )}
            </button>
          </div>
        </div>
      </form>

      {confirmedCode && (
        <div className="flex items-center gap-2 p-3 bg-neon-green/20 border border-neon-green/40 rounded-lg">
          <span className="text-neon-green text-xl">✓</span>
          <span className="text-neon-green font-semibold text-sm">
            Logged {confirmedCode}
          </span>
        </div>
      )}
    </div>
  );
};
