export async function parseError(error: unknown): Promise<AppError> {
  // Fetch Response (FastAPI, Node, etc.)
  if (error instanceof Response) {
    const status = error.status;
    let message = `Request failed with status ${status}`;

    try {
      const data = await error.json();
      if (data?.detail) message = data.detail;
      if (data?.error) message = data.error;
    } catch {}

    if (status === 429) {
      return {
        type: 'rate_limit',
        message: 'Too many requests. Slow down a bit.',
        retryable: true,
        status,
        originalError: error
      };
    }

    if (status === 401) {
      return {
        type: 'auth',
        message: 'Authentication required.',
        retryable: false,
        status,
        originalError: error
      };
    }

    if (status >= 500) {
      return {
        type: 'server',
        message: 'Server error. Try again shortly.',
        retryable: true,
        status,
        originalError: error
      };
    }

    if (status >= 400) {
      return {
        type: 'validation',
        message,
        retryable: false,
        status,
        originalError: error
      };
    }
  }

  // JS Error object
  if (error instanceof Error) {
    if (/network|fetch|failed/i.test(error.message)) {
      return {
        type: 'network',
        message: 'Network error. Check your connection.',
        retryable: true,
        originalError: error
      };
    }

    return {
      type: 'unknown',
      message: error.message,
      retryable: false,
      originalError: error
    };
  }

  // Fallback
  return {
    type: 'unknown',
    message: 'Unexpected error occurred.',
    retryable: false,
    originalError: error
  };
}
