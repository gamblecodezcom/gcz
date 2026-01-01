import React from 'react';
import { AppError } from '../../utils/errorHandler';

interface FallbackUIProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const FallbackUI: React.FC<FallbackUIProps> = ({
  error,
  onRetry,
  onDismiss
}) => {
  const getIcon = () => {
    switch (error.type) {
      case 'network':
        return '📡';
      case 'auth':
        return '🔒';
      case 'validation':
        return '⚠️';
      case 'server':
        return '🔧';
      default:
        return '❌';
    }
  };

  return (
    <div className="bg-gray-900/50 border border-red-500/50 rounded-lg p-6 text-center">
      <div className="text-4xl mb-4">{getIcon()}</div>
      <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
      <p className="text-text-muted mb-6">{error.message}</p>
      
      <div className="flex gap-4 justify-center">
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-gray-700 text-text-muted rounded hover:bg-gray-600 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
