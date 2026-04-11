import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5002'; // Point to Socket Service

export function useLiveMatchSocket(matchId: string, onUpdate: () => void) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!matchId) return;

    // Connect to the /live namespace matching the backend MatchGateway
    socketRef.current = io(`${SOCKET_URL}/live`, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      // Join the match room
      socket.emit('join_match', { matchId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Listen for events to trigger refetch
    socket.on('match_update', (data) => {
      console.log('Received match_update via socket:', data);
      onUpdate();
    });

    socket.on('match_reset', (data) => {
      console.log('Received match_reset via socket:', data);
      onUpdate();
    });

    return () => {
      if (socket.connected) {
        socket.emit('leave_match', { matchId });
        socket.disconnect();
      }
    };
  }, [matchId, onUpdate]);

  return { socket: socketRef.current, isConnected };
}
