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
}

export function useRealtime({ userId, onEvent, eventTypes }: UseRealtimeOptions = {}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Authenticate user
    socket.on('connect', () => {
      socket.emit('user:authenticate', userId);
      console.log('Real-time connection established');
    });

    // Subscribe to event types
    if (eventTypes && eventTypes.length > 0) {
      socket.emit('realtime:subscribe', eventTypes);
    }

    // Listen for real-time events
    socket.on('realtime:event', (event: RealtimeEvent) => {
      if (onEvent) {
        onEvent(event);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Real-time connection disconnected');
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, onEvent, eventTypes]);

  return socketRef.current;
}
