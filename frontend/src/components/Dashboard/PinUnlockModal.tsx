import { useState, useEffect } from 'react';
import { verifyPin } from '../../utils/api';

interface PinUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinUnlockModal = ({ isOpen, onClose, onSuccess }: PinUnlockModalProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [crownFlipped, setCrownFlipped] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError('');
      setCrownFlipped(false);
    }
  }, [isOpen]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyPin(pin);
      if (result.success) {
        setCrownFlipped(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      } else {
        setError('Invalid PIN');
        setPin('');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-bg-dark-2 border-2 border-neon-cyan/50 rounded-xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-pink/10 to-neon-yellow/10 animate-pulse" />

        <div className="relative z-10">
          {/* Crown Icon */}
          <div className="flex justify-center mb-6">
            <svg
              className={`w-16 h-16 transition-transform duration-600 ${crownFlipped ? 'animate-flip' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
                fill="url(#crownGradient)"
                className="drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
              />
              <defs>
                <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD600" />
                  <stop offset="100%" stopColor="#FFA500" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2 neon-glow-cyan">Unlock with PIN</h2>
          <p className="text-text-muted text-center mb-6">Enter your PIN to reveal sensitive information</p>

          {/* PIN Display */}
          <div className="flex justify-center gap-2 mb-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  i < pin.length
                    ? 'border-neon-cyan bg-neon-cyan/20 shadow-neon-cyan'
                    : 'border-neon-cyan/30 bg-bg-dark'
                }`}
              >
                {i < pin.length && (
                  <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-neon-cyan" />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-sm text-red-200 text-center animate-shake">
              {error}
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePinInput(num.toString())}
                disabled={isVerifying}
                className="btn-neon px-4 py-4 bg-bg-dark border-2 border-neon-cyan/30 rounded-xl text-xl font-bold text-neon-cyan hover:border-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {num}
              </button>
            ))}
            <button
              onClick={onClose}
              disabled={isVerifying}
              className="btn-neon px-4 py-4 bg-bg-dark border-2 border-neon-pink/30 rounded-xl text-sm font-bold text-neon-pink hover:border-neon-pink hover:bg-neon-pink/10 hover:shadow-neon-pink transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={() => handlePinInput('0')}
              disabled={isVerifying}
              className="btn-neon px-4 py-4 bg-bg-dark border-2 border-neon-cyan/30 rounded-xl text-xl font-bold text-neon-cyan hover:border-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              disabled={isVerifying || pin.length === 0}
              className="btn-neon px-4 py-4 bg-bg-dark border-2 border-neon-yellow/30 rounded-xl text-lg font-bold text-neon-yellow hover:border-neon-yellow hover:bg-neon-yellow/10 hover:shadow-neon-yellow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⌫
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={pin.length < 4 || isVerifying}
            className="w-full btn-neon px-6 py-3 bg-neon-cyan text-bg-dark rounded-xl font-bold hover:shadow-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Unlock'}
          </button>
        </div>

        {/* Neon ripple effect on success */}
        {crownFlipped && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-radial from-neon-cyan/20 via-transparent to-transparent animate-ping" />
          </div>
        )}
      </div>
    </div>
  );
};
