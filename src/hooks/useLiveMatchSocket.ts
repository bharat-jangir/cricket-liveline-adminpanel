import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BASE_API_URL.replace(/\/api\/?$/, '');

// ─── Payload types ───────────────────────────────────────────────────────────

export interface TeamLiveScore {
  teamId: string;
  name: string;
  code: string;
  score: string;
  overs: string;
}

export interface MatchUpdatePayload {
  matchId: string;
  type: 'BALL' | 'WICKET' | 'OVER_END' | 'MATCH_RESET';
  timestamp: string;
  toss?: {
    tossText: string;
    winnerId: string;
    elected: 'bat' | 'bowl';
  };
  // Unified root-level fields
  score?: string;
  overs?: string;
  runRate?: number;
  currentInning?: number;
  currentBall?: string;
  recentBalls?: any[];
  currentStrikerId?: string;
  currentNonStrikerId?: string;
  currentBowlerId?: string;
  inning: {
    number: number;
    totalRuns: number;
    totalBalls: number;
    wickets: number;
    overs: number;
    runRate: number;
    extras: number;
  };
  striker?: {
    playerId: string;
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
  };
  nonStriker?: {
    playerId: string;
    name: string;
    runs: number;
    balls: number;
  };
  bowler?: {
    playerId: string;
    name: string;
    overs: number;
    runs: number;
    wickets: number;
    economy: number;
  };
  lastBall?: {
    runs: number;
    extras: number;
    isWicket: boolean;
    ballType: string;
    ballLabel: string;
  };
  teamA: TeamLiveScore;
  teamB: TeamLiveScore;
}

export interface ScorecardDeltaPayload {
  matchId: string;
  inningNumber: number;
  batting: {
    playerId: string;
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    isOut: boolean;
    dismissalText?: string;
    isOnStrike: boolean;
  }[];
  bowling: {
    playerId: string;
    name: string;
    overs: number;
    maidens: number;
    runs: number;
    wickets: number;
    economy: number;
    isCurrentBowler: boolean;
    isCurrent: boolean;
  }[];
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalties: number;
    total: number;
  };
  totalRuns: number;
  wickets: number;
  timestamp: string;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseLiveMatchSocketOptions {
  /** Called on every ball/wicket/over-end event */
  onUpdate?: () => void;
}

interface UseLiveMatchSocketReturn {
  isConnected: boolean;
  /** Last full match update — use for header score display */
  lastUpdate: MatchUpdatePayload | null;
  /** Last scorecard delta — use for table rows */
  lastScorecardDelta: ScorecardDeltaPayload | null;
}

export function useLiveMatchSocket(
  matchId: string,
  onUpdate?: (() => void) | UseLiveMatchSocketOptions,
): UseLiveMatchSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<MatchUpdatePayload | null>(null);
  const [lastScorecardDelta, setLastScorecardDelta] = useState<ScorecardDeltaPayload | null>(null);

  // Support both legacy (function) and new object option styles
  const legacyOnUpdate = typeof onUpdate === 'function' ? onUpdate : onUpdate?.onUpdate;

  useEffect(() => {
    if (!matchId) return;

    const socket = io(`${SOCKET_URL}/live`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[AdminSocket] Connected:', socket.id);
      setIsConnected(true);
      socket.emit('join_match', { matchId });
    });

    socket.on('disconnect', () => {
      console.log('[AdminSocket] Disconnected');
      setIsConnected(false);
    });

    socket.on('match_joined', (data: any) => {
      console.log('[AdminSocket] Joined room:', data);
    });

    socket.on('scoreUpdate', (data: MatchUpdatePayload) => {
      console.log('[AdminSocket] scoreUpdate type:', data.type);
      setLastUpdate(data);
      legacyOnUpdate?.();
    });

    socket.on('scorecard_delta', (data: ScorecardDeltaPayload) => {
      console.log('[AdminSocket] scorecard_delta inn=', data.inningNumber);
      setLastScorecardDelta(data);
    });

    return () => {
      if (socket.connected) {
        socket.emit('leave_match', { matchId });
        socket.disconnect();
      }
    };
  }, [matchId]);

  return { isConnected, lastUpdate, lastScorecardDelta };
}
