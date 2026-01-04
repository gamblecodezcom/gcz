import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: string;
}

interface UseRealtimeOptions {
  userId?: string;
  onEvent?: (event: RealtimeEvent) => void;
  eventTypes?: string[];
  emitRateLimitMs?: number;
}

const DEFAULT_RATE_LIMIT_MS = 2000;

export function useRealtime({
  userId,
  onEvent,
  eventTypes,
  emitRateLimitMs = DEFAULT_RATE_LIMIT_MS,
}: UseRealtimeOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const lastEmitRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!userId) return;

    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
      randomizationFactor: 0.5,
      timeout: 20000,
      auth: {
        userId,
      },
    });

    const emitWithRateLimit = (event: string, payload: unknown) => {
      const now = Date.now();
      const lastEmit = lastEmitRef.current[event] || 0;
      if (now - lastEmit < emitRateLimitMs) return;
      lastEmitRef.current[event] = now;
      socket.emit(event, payload);
    };

    socketRef.current = socket;

    socket.on('connect', () => {
      emitWithRateLimit('user:authenticate', userId);
      if (eventTypes && eventTypes.length > 0) {
        emitWithRateLimit('realtime:subscribe', eventTypes);
      }
    });

    socket.on('realtime:event', (event: RealtimeEvent) => {
      if (onEvent) {
        onEvent(event);
      }
    });

    socket.on('disconnect', () => {
      // Intentionally silent - handled by UI subscriptions
    });

    socket.on('connect_error', (error) => {
      console.warn('Real-time connection error:', error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, onEvent, eventTypes, emitRateLimitMs]);

  return socketRef.current;
}
