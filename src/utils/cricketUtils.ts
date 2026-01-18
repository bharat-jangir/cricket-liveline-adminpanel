/**
 * Utility functions for cricket-related calculations and formatting.
 * Centralizes logic to ensure consistency across the application.
 */

/**
 * Converts an overs string (e.g., "10.3") or number to total balls.
 * @param overs - The overs value as string (e.g., "10.3") or number (e.g., 10.3).
 * @returns The total number of balls.
 */
export const oversToBalls = (overs: string | number): number => {
    if (overs === undefined || overs === null) return 0;
    const oversStr = String(overs);
    const parts = oversStr.split('.');
    const completedOvers = parseInt(parts[0]) || 0;
    const ballsInOver = parseInt(parts[1]) || 0;
    return (completedOvers * 6) + ballsInOver;
};

/**
 * Converts total balls to an overs string (e.g., "10.3").
 * @param balls - The total number of balls.
 * @returns The formatted overs string.
 */
export const ballsToOvers = (balls: number): string => {
    if (!balls || balls < 0) return "0.0";
    const completedOvers = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${completedOvers}.${remainingBalls}`;
};

/**
 * Calculates the Run Rate (RR).
 * @param runs - Total runs scored.
 * @param balls - Total balls faced/bowled.
 * @returns The Run Rate formatted to 2 decimal places.
 */
export const calculateRunRate = (runs: number, balls: number): string => {
    if (!balls || balls === 0) return "0.00";
    const overs = balls / 6;
    const rr = runs / overs;
    return rr.toFixed(2);
};

/**
 * Calculates the Economy Rate (Econ).
 * @param runs - Runs conceded.
 * @param balls - Balls bowled.
 * @returns The Economy Rate formatted to 2 decimal places.
 */
export const calculateEcon = (runs: number, balls: number): string => {
    return calculateRunRate(runs, balls); // Same formula, semantic difference
};

/**
 * Validates if a string is a valid representation of overs (e.g., "10", "10.0", "10.5").
 * Reject "10.6" or invalid characters.
 * @param overs - The over string to test.
 * @returns True if valid.
 */
export const isValidOverString = (overs: string): boolean => {
    // Matches integers or decimals .0 to .5
    const regex = /^\d+(\.[0-5])?$/;
    return regex.test(overs);
};

/**
 * Calculates the Projected Score based on current Run Rate.
 * @param currentRuns - Current runs scored.
 * @param ballsBowled - Total balls bowled so far.
 * @param totalOvers - Total overs in the match (default 20).
 * @returns The projected score as a rounded integer string.
 */
export const calculateProjectedScore = (currentRuns: number, ballsBowled: number, totalOvers: number = 20): string => {
    if (ballsBowled === 0) return "0";
    const runRate = (currentRuns / ballsBowled) * 6;
    const projected = runRate * totalOvers;
    return Math.round(projected).toString();
};
