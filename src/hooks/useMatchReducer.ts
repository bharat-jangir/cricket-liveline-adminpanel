import { useReducer } from 'react';
import { Batsman, Bowler, Session } from '../types/liveScore';
import { oversToBalls, ballsToOvers } from '../utils/cricketUtils';

// Define State Interface
export interface MatchState {
    // Scoreboard
    runs: string;
    wickets: string;
    overs: string;
    currentBall: string;

    // Status
    matchStatus: string;
    currentInning: string;

    // Calculations
    ballsBowled: number;
    projectedScore: string; // Calculated field
    runRate: string; // Calculated field

    // Squads / Lists
    batsmen: Batsman[];
    bowlers: Bowler[];

    // Team IDs (for context)
    battingTeamId: string | null;
    bowlingTeamId: string | null;

    // UI States
    saving: boolean;
    loading: boolean;
    lastUpdated: number; // Timestamp to force refresh if needed
}

// Initial State
export const initialMatchState: MatchState = {
    runs: "0",
    wickets: "0",
    overs: "0.0",
    currentBall: "0",
    matchStatus: "scheduled",
    currentInning: "1",
    ballsBowled: 0,
    projectedScore: "0",
    runRate: "0.00",
    batsmen: [],
    bowlers: [],
    battingTeamId: null,
    bowlingTeamId: null,
    saving: false,
    loading: true,
    lastUpdated: Date.now()
};

// Actions
export type MatchAction =
    | { type: 'SET_LIVE_STATUS'; payload: any } // Raw payload from API
    | { type: 'UPDATE_SCORE_MANUAL'; payload: { runs: string; wickets: string; overs: string } }
    | { type: 'UPDATE_CURRENT_BALL'; payload: string }
    | { type: 'SET_SAVING'; payload: boolean }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_MATCH_STATUS'; payload: string }
    | { type: 'SET_TEAMS'; payload: { battingTeamId: string; bowlingTeamId: string } }
    | { type: 'SET_SQUADS'; payload: { batting: any[], bowling: any[] } }; // Optional, if we store full squad in reducer

// Reducer Function
export function matchReducer(state: MatchState, action: MatchAction): MatchState {
    switch (action.type) {
        case 'SET_LIVE_STATUS': {
            const status = action.payload;
            if (!status) return state;

            // Extract core data
            const runs = status.score?.split('/')[0] || "0";
            const wickets = status.score?.split('/')[1] || "0";
            const overs = status.overs || "0.0";

            // Calculate derived
            const totalBalls = oversToBalls(overs);
            // ... (RR and Projected can be calculated here or in utils)

            return {
                ...state,
                runs,
                wickets,
                overs,
                currentBall: status.currentBall || "0",
                ballsBowled: totalBalls,
                currentInning: String(status.currentInning || "1"),
                batsmen: status.batsmen || [],
                bowlers: status.bowlers || [],
                loading: false,
                lastUpdated: Date.now()
            };
        }
        case 'UPDATE_SCORE_MANUAL': {
            const { runs, wickets, overs } = action.payload;
            return {
                ...state,
                runs,
                wickets,
                overs,
                ballsBowled: oversToBalls(overs)
            };
        }
        case 'UPDATE_CURRENT_BALL': {
            return { ...state, currentBall: action.payload };
        }
        case 'SET_SAVING': {
            return { ...state, saving: action.payload };
        }
        case 'SET_LOADING': {
            return { ...state, loading: action.payload };
        }
        case 'SET_MATCH_STATUS': {
            return { ...state, matchStatus: action.payload };
        }
        case 'SET_TEAMS': {
            return {
                ...state,
                battingTeamId: action.payload.battingTeamId,
                bowlingTeamId: action.payload.bowlingTeamId
            };
        }
        case 'SET_SQUADS': {
            // If we chose to store full squads here
            return state;
        }
        default:
            return state;
    }
}

// Hook Wrapper
export function useMatchReducer(initialState: MatchState = initialMatchState) {
    return useReducer(matchReducer, initialState);
}
