/**
 * Keyboard Score Hook for Real-time Cricket Scoring
 * 
 * This custom React hook provides keyboard-based scoring functionality for live cricket matches.
 * It listens to keyboard events and dispatches appropriate score events to the backend scoring engine.
 * 
 * Keyboard Mappings:
 * - '0' to '6': Score runs
 * - 'w' or 'W': Wicket
 * - 'u' or 'U': Undo last ball
 * - 'n' or 'N': No ball
 * - 'd' or 'D': Wide ball
 * - 'b' or 'B': Bye
 * - 'l' or 'L': Leg bye
 * - 'o' or 'O': End over
 * 
 * @module useKeyboardScore
 */

import { useEffect, useCallback, useRef } from 'react';
import { ScoreEventDto, ScoreEventType } from '../types/score-event';
import { LiveMatchService } from '../services/live-match.service';
import { toast } from 'sonner';

/**
 * Configuration options for the keyboard scoring hook
 */
export interface UseKeyboardScoreOptions {
  /** Match ID for which to handle scoring */
  matchId: string;
  
  /** Whether keyboard scoring is enabled */
  enabled?: boolean;
  
  /** Callback fired when an event is successfully processed */
  onSuccess?: (event: ScoreEventDto, response: any) => void;
  
  /** Callback fired when an event fails to process */
  onError?: (event: ScoreEventDto, error: any) => void;
  
  /** Whether to show toast notifications for events */
  showToasts?: boolean;
  
  /** Additional elements to ignore keyboard events from (e.g., input fields) */
  ignoreElements?: string[];
}

/**
 * Custom hook for keyboard-based cricket scoring
 * 
 * @param options - Configuration options
 * @returns Object containing helper methods and state
 * 
 * @example
 * ```tsx
 * const { dispatchEvent, isProcessing } = useKeyboardScore({
 *   matchId: 'match123',
 *   enabled: true,
 *   onSuccess: (event, response) => {
 *     console.log('Event processed:', event);
 *     refreshMatchData();
 *   }
 * });
 * ```
 */
export function useKeyboardScore(options: UseKeyboardScoreOptions) {
  const {
    matchId,
    enabled = true,
    onSuccess,
    onError,
    showToasts = true,
    ignoreElements = ['INPUT', 'TEXTAREA', 'SELECT'],
  } = options;

  const isProcessingRef = useRef(false);

  /**
   * Dispatch a score event to the backend
   */
  const dispatchEvent = useCallback(async (event: ScoreEventDto) => {
    if (!matchId) {
      console.warn('No match ID provided for score event');
      return;
    }

    if (isProcessingRef.current) {
      console.log('Already processing an event, skipping...');
      return;
    }

    try {
      isProcessingRef.current = true;
      
      if (showToasts) {
        toast.loading(`Processing ${event.type}...`, { id: 'score-event' });
      }

      const response = await LiveMatchService.handleScoreEvent(matchId, event);
      
      if (showToasts) {
        toast.success(`${event.type} recorded successfully`, { id: 'score-event' });
      }

      onSuccess?.(event, response);
      
      return response;
    } catch (error: any) {
      console.error('Error processing score event:', error);
      
      if (showToasts) {
        toast.error(error.message || 'Failed to process score event', { id: 'score-event' });
      }

      onError?.(event, error);
      throw error;
    } finally {
      isProcessingRef.current = false;
    }
  }, [matchId, onSuccess, onError, showToasts]);

  /**
   * Map keyboard key to score event
   */
  const mapKeyToEvent = useCallback((key: string): ScoreEventDto | null => {
    // Number keys (0-6) - Regular runs
    if (/^[0-6]$/.test(key)) {
      const runs = parseInt(key, 10);
      return {
        type: 'RUN',
        runs,
        isBoundary: runs === 4 || runs === 6,
      };
    }

    // Letter keys for special events
    const lowerKey = key.toLowerCase();
    
    switch (lowerKey) {
      case 'w':
        return { type: 'WICKET', runs: 0 };
      
      case 'u':
        return { type: 'UNDO' };
      
      case 'n':
        // No ball - typically 1 extra + any runs scored
        return { type: 'NO_BALL', runs: 0, extras: 1 };
      
      case 'd':
        // Wide - 1 extra run
        return { type: 'WIDE', runs: 0, extras: 1 };
      
      case 'b':
        // Bye
        return { type: 'BYE', runs: 1 };
      
      case 'l':
        // Leg bye
        return { type: 'LEG_BYE', runs: 1 };
      
      case 'o':
        // End over
        return { type: 'OVER_END' };
      
      default:
        return null;
    }
  }, []);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if disabled
    if (!enabled) return;

    // Ignore if focused on input elements
    const target = event.target as HTMLElement;
    if (ignoreElements.includes(target.tagName)) {
      return;
    }

    // Ignore if modifier keys are pressed (Ctrl, Alt, Meta)
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    // Map key to event
    const scoreEvent = mapKeyToEvent(event.key);
    
    if (scoreEvent) {
      event.preventDefault(); // Prevent default browser behavior
      dispatchEvent(scoreEvent);
    }
  }, [enabled, ignoreElements, mapKeyToEvent, dispatchEvent]);

  /**
   * Set up keyboard event listener
   */
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    /** Manually dispatch a score event */
    dispatchEvent,
    
    /** Whether an event is currently being processed */
    isProcessing: isProcessingRef.current,
    
    /** Map a keyboard key to a score event (for testing/preview) */
    mapKeyToEvent,
  };
}

