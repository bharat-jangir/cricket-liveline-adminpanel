/**
 * Simple Keyboard Score Hook for Real-time Cricket Scoring
 * 
 * This custom React hook provides keyboard-based scoring functionality using simple string events.
 * It listens to keyboard events and sends simple string events to the backend which automatically
 * determines the event type and parameters.
 * 
 * Keyboard Mappings:
 * - '1' to '6': Score runs
 * - 'lb1' to 'lb4': Leg byes
 * - 'nb': No ball
 * - 'fh': Free hit
 * - 'uf': Umpires fall
 * - 'ba': Ball in air
 * - 'o': Over
 * - 'roc': Run out check
 * - 'w': Wicket
 * - 'wd': Wide ball
 * - 'wdnb': Wide + No ball
 * - 'bs': Bowler stopped
 * 
 * @module useSimpleKeyboardScore
 */

import { useEffect, useCallback, useRef } from 'react';
import { LiveMatchService } from '../services/live-match.service';
import { toast } from 'sonner';

/**
 * Configuration options for the simple keyboard scoring hook
 */
export interface UseSimpleKeyboardScoreOptions {
  /** Match ID for which to handle scoring */
  matchId: string;
  
  /** Whether keyboard scoring is enabled */
  enabled?: boolean;
  
  /** Callback fired when an event is successfully processed */
  onSuccess?: (eventString: string, response: any) => void;
  
  /** Callback fired when an event fails to process */
  onError?: (eventString: string, error: any) => void;
  
  /** Whether to show toast notifications for events */
  showToasts?: boolean;
  
  /** Additional elements to ignore keyboard events from (e.g., input fields) */
  ignoreElements?: string[];
}

/**
 * Custom hook for simple keyboard-based cricket scoring
 * 
 * @param options - Configuration options
 * @returns Object containing helper methods and state
 */
export function useSimpleKeyboardScore(options: UseSimpleKeyboardScoreOptions) {
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
   * Dispatch a simple event to the backend
   */
  const dispatchEvent = useCallback(async (eventString: string) => {
    if (!matchId) {
      console.warn('No match ID provided for simple event');
      return;
    }

    if (isProcessingRef.current) {
      console.log('Already processing an event, skipping...');
      return;
    }

    try {
      isProcessingRef.current = true;
      
      if (showToasts) {
        toast.loading(`Processing ${eventString}...`, { id: 'simple-score-event' });
      }

      const response = await LiveMatchService.handleSimpleEvent(matchId, eventString);
      
      if (showToasts) {
        toast.success(`${eventString} recorded successfully`, { id: 'simple-score-event' });
      }

      onSuccess?.(eventString, response);
      
      return response;
    } catch (error: any) {
      console.error('Error processing simple score event:', error);
      
      if (showToasts) {
        toast.error(error.message || 'Failed to process score event', { id: 'simple-score-event' });
      }

      onError?.(eventString, error);
      throw error;
    } finally {
      isProcessingRef.current = false;
    }
  }, [matchId, onSuccess, onError, showToasts]);

  /**
   * Map keyboard key to simple event string
   */
  const mapKeyToEventString = useCallback((key: string): string | null => {
    // Number keys (1-6) - Regular runs
    if (/^[1-6]$/.test(key)) {
      return key;
    }

    // Special key combinations and single keys
    const lowerKey = key.toLowerCase();
    
    switch (lowerKey) {
      case '0':
        return '0'; // Dot ball
      case 'w':
        return 'w'; // Wicket
      case 'n':
        return 'nb'; // No ball
      case 'd':
        return 'wd'; // Wide ball
      case 'o':
        return 'o'; // Over
      case 'b':
        return 'bs'; // Bowler stopped
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

    // Map key to event string
    const eventString = mapKeyToEventString(event.key);
    
    if (eventString) {
      event.preventDefault(); // Prevent default browser behavior
      dispatchEvent(eventString);
    }
  }, [enabled, ignoreElements, mapKeyToEventString, dispatchEvent]);

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
    /** Manually dispatch a simple event */
    dispatchEvent,
    
    /** Whether an event is currently being processed */
    isProcessing: isProcessingRef.current,
    
    /** Map a keyboard key to a simple event string (for testing/preview) */
    mapKeyToEventString,
  };
}