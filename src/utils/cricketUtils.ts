/**
 * Utility functions for cricket-related calculations and formatting.
 * Centralizes logic to ensure consistency across the application.
 */

/**
 * Converts an overs string (e.g., "10.3") or number to total balls.
 * @param overs - The overs value as string (e.g., "10.3") or number (e.g., 10.3).
 * @param ballsPerOver - Number of balls in a standard over for this match (default 6).
 * @returns The total number of balls.
 */
export const oversToBalls = (overs: string | number, ballsPerOver: number = 6): number => {
    if (overs === undefined || overs === null) return 0;
    const oversStr = String(overs);
    const parts = oversStr.split('.');
    const completedOvers = parseInt(parts[0]) || 0;
    const ballsInOver = parseInt(parts[1]) || 0;
    return (completedOvers * ballsPerOver) + ballsInOver;
};

/**
 * Converts total balls to an overs string (e.g., "10.3").
 * @param balls - The total number of balls.
 * @param ballsPerOver - Number of balls in a standard over for this match (default 6).
 * @returns The formatted overs string.
 */
export const ballsToOvers = (balls: number, ballsPerOver: number = 6): string => {
    if (!balls || balls < 0) return "0.0";
    const completedOvers = Math.floor(balls / ballsPerOver);
    const remainingBalls = balls % ballsPerOver;
    return `${completedOvers}.${remainingBalls}`;
};

/**
 * Calculates the Run Rate (RR).
 * @param runs - Total runs scored.
 * @param balls - Total balls faced/bowled.
 * @param ballsPerOver - Number of balls in a standard over for this match (default 6).
 * @returns The Run Rate formatted to 2 decimal places.
 */
export const calculateRunRate = (runs: number, balls: number, ballsPerOver: number = 6): string => {
    if (!balls || balls === 0) return "0.00";
    const overs = balls / ballsPerOver;
    const rr = runs / overs;
    return rr.toFixed(2);
};

/**
 * Calculates the Economy Rate (Econ).
 * @param runs - Runs conceded.
 * @param balls - Balls bowled.
 * @param ballsPerOver - Number of balls in a standard over for this match (default 6).
 * @returns The Economy Rate formatted to 2 decimal places.
 */
export const calculateEcon = (runs: number, balls: number, ballsPerOver: number = 6): string => {
    return calculateRunRate(runs, balls, ballsPerOver);
};

/**
 * Validates if a string is a valid representation of overs (e.g., "10", "10.0", "10.5").
 * @param overs - The over string to test.
 * @param ballsPerOver - Number of balls in a standard over for this match (default 6).
 * @returns True if valid.
 */
export const isValidOverString = (overs: string, ballsPerOver: number = 6): boolean => {
    if (!overs) return false;
    const parts = overs.split('.');
    if (parts.length > 2) return false;

    // Check integer part
    if (!/^\d+$/.test(parts[0])) return false;

    // Check decimal part if exists
    if (parts.length === 2) {
        if (!/^\d+$/.test(parts[1])) return false;
        const balls = parseInt(parts[1]);
        if (balls >= ballsPerOver) return false;
    }

    return true;
};

/**
 * Calculates the Projected Score based on current Run Rate.
 * @param currentRuns - Current runs scored.
 * @param ballsBowled - Total balls bowled so far.
 * @param totalOvers - Total overs in the match (default 20).
 * @param ballsPerOver - Number of balls in a standard over for this match (default 6).
 * @returns The projected score as a rounded integer string.
 */
export const calculateProjectedScore = (currentRuns: number, ballsBowled: number, totalOvers: number = 20, ballsPerOver: number = 6): string => {
    if (ballsBowled === 0) return "0";
    const runRate = (currentRuns / ballsBowled) * ballsPerOver;
    const projected = runRate * totalOvers;
    return Math.round(projected).toString();
};

export type MatchFormat = 'T20' | 'ODI' | 'Test' | 'T10' | 'The Hundred';
export type MatchStatus = 'Scheduled' | 'Live' | 'Completed' | 'Abandoned';

export interface FormatSettings {
    ballsPerOver: number;
    oversPerInning: number;
    maxBowlerLimit: number;
}

export const FORMAT_CONFIG: Record<string, FormatSettings> = {
    'T20': { ballsPerOver: 6, oversPerInning: 20, maxBowlerLimit: 4 },
    'ODI': { ballsPerOver: 6, oversPerInning: 50, maxBowlerLimit: 10 },
    'Test': { ballsPerOver: 6, oversPerInning: 90, maxBowlerLimit: 0 },
    'T10': { ballsPerOver: 6, oversPerInning: 10, maxBowlerLimit: 2 },
    'The Hundred': { ballsPerOver: 5, oversPerInning: 20, maxBowlerLimit: 20 },
};
