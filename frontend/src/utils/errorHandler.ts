/**
 * Unified Error Handling System
 */

export type ErrorType = 
  | 'network'
  | 'auth'
  | 'validation'
  | 'server'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  retryable: boolean;
  originalError?: Error;
}

/**
 * Parse error into AppError format
 */
export function parseError(error: unknown): AppError {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection.',
        retryable: true,
        originalError: error
      };
    }

    // Auth errors
    if (error.message.includes('401') || error.message.includes('authentication')) {
      return {
        type: 'auth',
        message: 'Authentication required. Please log in.',
        code: 401,
        retryable: false,
        originalError: error
      };
    }

    // Validation errors
    if (error.message.includes('400') || error.message.includes('validation')) {
      return {
        type: 'validation',
        message: error.message || 'Invalid input. Please check your data.',
        code: 400,
        retryable: false,
        originalError: error
      };
    }

    // Server errors
    if (error.message.includes('500') || error.message.includes('server')) {
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        code: 500,
        retryable: true,
        originalError: error
      };
    }
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: 'An unexpected error occurred.',
    retryable: false,
    originalError: error instanceof Error ? error : new Error(String(error))
  };
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Toast notification system (placeholder - would integrate with toast library)
 */
export class ToastManager {
  private static instance: ToastManager;
  private listeners: Array<(message: string, type: 'success' | 'error' | 'warning' | 'info') => void> = [];

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  subscribe(listener: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.listeners.forEach(listener => listener(message, type));
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  warning(message: string) {
    this.show(message, 'warning');
  }

  info(message: string) {
    this.show(message, 'info');
  }
}

/**
 * Handle error with toast notification
 */
export function handleErrorWithToast(error: unknown) {
  const appError = parseError(error);
  const toast = ToastManager.getInstance();
  
  toast.error(appError.message);
  
  return appError;
}
