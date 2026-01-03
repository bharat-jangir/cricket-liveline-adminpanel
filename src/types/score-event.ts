/**
 * Score Event Types for Real-time Cricket Scoring
 * 
 * This module defines TypeScript types for cricket score events that map to the backend ScoreEventDto.
 * These types are used by the keyboard scoring hook to dispatch events to the backend scoring engine.
 * 
 * @module ScoreEventTypes
 */

/**
 * Enum for all possible score event types
 */
export type ScoreEventType = 
  | 'RUN' 
  | 'WIDE' 
  | 'NO_BALL' 
  | 'BYE' 
  | 'LEG_BYE' 
  | 'WICKET' 
  | 'UNDO' 
  | 'OVER_END' 
  | 'SWAP_BATSMAN';

/**
 * Wicket dismissal types
 */
export type WicketType = 
  | 'bowled' 
  | 'caught' 
  | 'lbw' 
  | 'run_out' 
  | 'stumped' 
  | 'hit_wicket'
  | 'retired_hurt'
  | 'timed_out'
  | 'obstructing_field'
  | 'hit_ball_twice';

/**
 * Score Event DTO that maps to backend ScoreEventDto
 * This is sent via POST /admin/matches/:matchId/event
 */
export interface ScoreEventDto {
  /** Type of the scoring event */
  type: ScoreEventType;
  
  /** Number of runs scored (0-6 for regular runs) */
  runs?: number;
  
  /** Extra runs (for wides, no balls, etc.) */
  extras?: number;
  
  /** Whether the run was a boundary (4 or 6) */
  isBoundary?: boolean;
  
  /** Type of wicket dismissal */
  wicketType?: WicketType;
  
  /** Player ID involved in the event (for wickets) */
  playerId?: string;
  
  /** Ball number in the over (0-5) */
  ballNumber?: number;
}

/**
 * Response from the score event API
 */
export interface ScoreEventResponse {
  status: boolean;
  statusCode: number;
  message?: string;
  userMessage?: string;
  data?: {
    result: any; // LiveMatchStatus or updated state
  };
}

