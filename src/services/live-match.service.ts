import { axiosInstance } from '../lib/axios';

export interface LiveMatchStatus {
  _id?: string;
  matchId: string | { _id: string; name?: string };
  currentInning: number;
  currentOver: number;
  currentBall: number;
  battingTeamId: string | { _id: string; name?: string; shortName?: string; code?: string; logo?: string };
  bowlingTeamId: string | { _id: string; name?: string; shortName?: string; code?: string; logo?: string };
  score: string; // Format: "runs/wickets"
  overs: string; // Format: "overs.balls"
  balls: number;
  runRate: number;
  requiredRunRate: number;
  target: number;
  ballsRemaining: number;
  // Odds fields
  oddsTeam?: string;
  oddsBlue?: number;
  oddsRed?: number;
  session?: number;
  sessionBlue?: number;
  sessionRed?: number;
  lambi?: number;
  lambiBlue?: number;
  lambiRed?: number;
  lastUpdated: Date;
  lastBallTimestamp: Date;
  comment2?: string;
  comment3?: string;
  currentStrikerId?: string | null;
  currentNonStrikerId?: string | null;
  currentBowlerId?: string | null;
  ballsPerOver?: number;
  oversPerInning?: number;
  maxBowlerLimit?: number;
}

export interface UpdateLiveStatusDto {
  currentInning?: number;
  currentOver?: number;
  currentBall?: string;
  battingTeamId?: string;
  bowlingTeamId?: string;
  score?: string;
  overs?: string;
  balls?: number;
  runRate?: number;
  requiredRunRate?: number;
  target?: number;
  ballsRemaining?: number;
  // Odds fields
  oddsTeam?: string;
  oddsBlue?: number;
  oddsRed?: number;
  session?: number;
  sessionBlue?: number;
  sessionRed?: number;
  lambi?: number;
  lambiBlue?: number;
  lambiRed?: number;
  comment2?: string;
  comment3?: string;
  ballsPerOver?: number;
  oversPerInning?: number;
  maxBowlerLimit?: number;
}

export interface SwitchTeamDto {
  battingTeamId: string;
  bowlingTeamId: string;
}

export interface UpdateTossDto {
  tossText: string;
  winnerId: string;
  elected: 'bat' | 'bowl';
}

export interface MatchSquad {
  _id?: string;
  matchId: string | { _id: string };
  teamId: string | { _id: string; name?: string; shortName?: string; code?: string; logo?: string };
  playingXI?: (string | { _id: string; name?: string; fullName?: string; image?: string; role?: string })[];
  bench?: (string | { _id: string; name?: string; fullName?: string; image?: string; role?: string })[];
  captainId?: string | { _id: string; name?: string; fullName?: string };
  viceCaptainId?: string | { _id: string; name?: string; fullName?: string };
  wicketKeeperId?: string | { _id: string; name?: string; fullName?: string };
  impactPlayerId?: string | { _id: string; name?: string; fullName?: string };
}

export interface UpdateMatchSquadDto {
  playingXI?: string[];
  bench?: string[];
  captainId?: string | null;
  viceCaptainId?: string | null;
  wicketKeeperId?: string | null;
  impactPlayerId?: string | null;
}

export interface BattingScorecard {
  _id?: string;
  matchId: string | { _id: string };
  inningId: string | { _id: string };
  playerId: string | { _id: string; name?: string; fullName?: string; image?: string; role?: string };
  teamId: string | { _id: string; name?: string; shortName?: string; code?: string; logo?: string };
  battingPosition: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  isRetiredHurt: boolean;
  isAbsent: boolean;
  dismissalType: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'not_out' | 'retired_hurt' | 'absent';
  bowlerId?: string | { _id: string; name?: string; fullName?: string };
  fielderId?: string | { _id: string; name?: string; fullName?: string };
  fielder2Id?: string | { _id: string; name?: string; fullName?: string };
  dismissalText?: string;
  dots: number;
  ones: number;
  twos: number;
  threes: number;
  isOnStrike: boolean;
  isVisible?: boolean;
  to?: string; // This Over - runs scored in current over
  tr?: string; // Total Runs or other custom field
}

export interface UpdateBatsmanDto {
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  battingPosition?: number;
  isOut?: boolean;
  isRetiredHurt?: boolean;
  isAbsent?: boolean;
  dismissalType?: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'not_out' | 'retired_hurt' | 'absent';
  bowlerId?: string;
  fielderId?: string;
  fielder2Id?: string;
  dismissalText?: string;
  dots?: number;
  ones?: number;
  twos?: number;
  threes?: number;
  isOnStrike?: boolean;
  calculationMode?: 'auto' | 'manual';
  to?: string; // This Over - runs scored in current over
  tr?: string; // Total Runs or other custom field
  isVisible?: boolean;
}

export interface BowlingScorecard {
  _id?: string;
  matchId: string | { _id: string };
  inningId: string | { _id: string };
  playerId: string | { _id: string; name?: string; fullName?: string; image?: string; role?: string };
  teamId: string | { _id: string; name?: string; shortName?: string; code?: string; logo?: string };
  bowlingOrder: number;
  overs: number;
  completedOvers: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  noBalls: number;
  wides: number;
  economy: number;
  strikeRate: number;
  average: number;
  dots: number;
  fours: number;
  sixes: number;
  isVisible?: boolean;
  isCurrentBowler?: boolean;
}

export interface UpdateBowlerDto {
  overs?: number;
  completedOvers?: number;
  balls?: number;
  maidens?: number;
  runs?: number;
  wickets?: number;
  noBalls?: number;
  wides?: number;
  bowlingOrder?: number;
  dots?: number;
  fours?: number;
  sixes?: number;
  calculationMode?: 'auto' | 'manual';
  isVisible?: boolean;
}

export interface Inning {
  _id?: string;
  matchId: string | { _id: string };
  inningNumber: number;
  battingTeamId: string | { _id: string; name?: string; shortName?: string; code?: string; logo?: string };
  bowlingTeamId: string | { _id: string; name?: string; shortName?: string; code?: string; logo?: string };
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  runRate: number;
  extras: number;
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalties: number;
  target?: number;
  isDeclared: boolean;
  isAllOut: boolean;
  isCompleted: boolean;
  isFollowOn: boolean;
  startTime?: Date;
  endTime?: Date;
  lastWicket?: LastWicket;
}

export interface LastWicket {
  name: string;
  dismissal: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  to: string;
  tr: string | number;
  playerId: string;
}

export interface UpdateInningDto {
  battingTeamId?: string;
  bowlingTeamId?: string;
  totalRuns?: number;
  totalWickets?: number;
  totalOvers?: number;
  totalBalls?: number;
  runRate?: number;
  extras?: number;
  wides?: number;
  noBalls?: number;
  byes?: number;
  legByes?: number;
  penalties?: number;
  target?: number;
  isDeclared?: boolean;
  isAllOut?: boolean;
  isCompleted?: boolean;
  isFollowOn?: boolean;
  startTime?: Date;
  endTime?: Date;
  calculationMode?: 'auto' | 'manual';
  lastWicket?: LastWicket;
}

export interface Scorecard {
  inning: Inning;
  batting: BattingScorecard[];
  bowling: BowlingScorecard[];
}

export class LiveMatchService {
  // Match Details APIs (toss, officials, conditions)
  static async getMatchDetails(matchId: string): Promise<any> {
    try {
      const response = await axiosInstance.get(`/admin/matches/${matchId}/match-details`);
      return response.data?.data?.result || response.data?.result || {};
    } catch (error: any) {
      console.error('Error fetching match details:', error);
      return {};
    }
  }

  static async updateMatchDetails(matchId: string, updateDto: any): Promise<any> {
    const response = await axiosInstance.patch(`/admin/matches/${matchId}/match-details`, updateDto);
    return response.data?.data?.result || response.data?.result;
  }

  // Live Status APIs
  static async getLiveStatus(matchId: string): Promise<LiveMatchStatus | null> {
    try {
      const response = await axiosInstance.get(`/admin/matches/${matchId}/live-status`);
      if (response.data?.status === false) {
        console.warn('Live status API returned error:', response.data);
        return null;
      }
      return response.data?.data?.result || response.data?.result || null;
    } catch (error: any) {
      console.error('Error fetching live status:', error);
      return null;
    }
  }

  static async updateLiveStatus(matchId: string, updateDto: UpdateLiveStatusDto): Promise<LiveMatchStatus> {
    const response = await axiosInstance.put(`/admin/matches/${matchId}/live-status`, updateDto);
    return response.data?.data?.result;
  }

  static async switchTeams(matchId: string, switchTeamDto: SwitchTeamDto): Promise<LiveMatchStatus> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/switch-teams`, switchTeamDto);
    return response.data?.data?.result;
  }

  static async updateToss(matchId: string, updateTossDto: UpdateTossDto): Promise<any> {
    const response = await axiosInstance.put(`/admin/matches/${matchId}/toss`, updateTossDto);
    return response.data?.data?.result;
  }

  static async getInnings(matchId: string): Promise<Inning[]> {
    try {
      const response = await axiosInstance.get(`/admin/matches/${matchId}/innings`);
      if (response.data?.status === false) {
        console.warn('Innings API returned error:', response.data);
        return [];
      }
      return response.data?.data?.result || response.data?.result || [];
    } catch (error: any) {
      console.error('Error fetching innings:', error);
      return [];
    }
  }

  // Match Squad APIs
  static async getMatchSquads(matchId: string): Promise<MatchSquad[]> {
    const response = await axiosInstance.get(`/admin/matches/${matchId}/squads`);
    return response.data?.data?.result || [];
  }

  static async updateMatchSquad(matchId: string, teamId: string, updateDto: UpdateMatchSquadDto): Promise<MatchSquad> {
    const response = await axiosInstance.put(`/admin/matches/${matchId}/squads/${teamId}`, updateDto);
    return response.data?.data?.result;
  }

  // Scorecard APIs
  static async getScorecard(matchId: string, inningNumber: number): Promise<Scorecard | null> {
    try {
      const response = await axiosInstance.get(`/admin/matches/${matchId}/scorecard/${inningNumber}`);
      if (response.data?.status === false) {
        console.warn('Scorecard API returned error:', response.data);
        return null;
      }
      return response.data?.data?.result || response.data?.result || null;
    } catch (error: any) {
      console.error('Error fetching scorecard:', error);
      return null;
    }
  }

  static async updateBatsman(
    matchId: string,
    inningNumber: number,
    playerId: string,
    updateDto: UpdateBatsmanDto,
  ): Promise<BattingScorecard> {
    const response = await axiosInstance.put(`/admin/matches/${matchId}/scorecard/${inningNumber}/batsman/${playerId}`, updateDto);
    return response.data?.data?.result;
  }

  static async updateBowler(
    matchId: string,
    inningNumber: number,
    playerId: string,
    updateDto: UpdateBowlerDto,
  ): Promise<BowlingScorecard> {
    const response = await axiosInstance.put(`/admin/matches/${matchId}/scorecard/${inningNumber}/bowler/${playerId}`, updateDto);
    return response.data?.data?.result;
  }

  static async updateInning(matchId: string, inningNumber: number, updateDto: UpdateInningDto): Promise<Inning> {
    const response = await axiosInstance.put(`/admin/matches/${matchId}/scorecard/${inningNumber}/inning`, updateDto);
    return response.data?.data?.result;
  }

  // Over Summaries APIs
  static async getOverSummaries(matchId: string, inningNumber: number): Promise<any[]> {
    try {
      const response = await axiosInstance.get(`/admin/matches/${matchId}/over-summaries/${inningNumber}`);
      if (response.data?.status === false) {
        console.warn('Over summaries API returned error:', response.data);
        return [];
      }
      return response.data?.data?.result || response.data?.result || [];
    } catch (error: any) {
      console.error('Error fetching over summaries:', error);
      return [];
    }
  }

  static async upsertOverSummary(
    matchId: string,
    inningNumber: number,
    overNumber: number,
    bowlerId: string,
    ballsData: any[],
  ): Promise<any> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/over-summaries/${inningNumber}`, {
      overNumber,
      bowlerId,
      ballsData,
    });
    return response.data?.data?.result;
  }

  // Initialize scorecards from playing XI
  static async initializeScorecards(matchId: string, inningNumber: number, teamId: string): Promise<any> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/scorecard/${inningNumber}/initialize/${teamId}`);
    return response.data?.data?.result;
  }

  // Session APIs
  static async getSessions(matchId: string): Promise<any[]> {
    try {
      const response = await axiosInstance.get(`/admin/matches/${matchId}/sessions`);
      if (response.data?.status === false) {
        console.warn('Sessions API returned error:', response.data);
        return [];
      }
      return response.data?.data?.result || response.data?.result || [];
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  static async addSession(matchId: string, createDto: any): Promise<any> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/sessions`, createDto);
    return response.data?.data?.result;
  }

  static async updateSession(matchId: string, sessionId: string, updateDto: any): Promise<any> {
    const response = await axiosInstance.put(`/admin/matches/${matchId}/sessions/${sessionId}`, updateDto);
    return response.data?.data?.result;
  }

  static async deleteSession(matchId: string, sessionId: string): Promise<any> {
    const response = await axiosInstance.delete(`/admin/matches/${matchId}/sessions/${sessionId}`);
    return response.data?.data?.result;
  }

  // Update specific over summary (for editing history)
  static async updateOverSummary(
    matchId: string,
    inningNumber: number,
    overNumber: number,
    ballsData: any[],
  ): Promise<any> {
    const response = await axiosInstance.put(`/admin/matches/${matchId}/over-summaries/update`, {
      inningNumber,
      overNumber,
      ballsData,
    });
    return response.data?.data?.result;
  }

  /**
   * Handle Score Event - Process scoring events through the backend score engine
   * 
   * This method dispatches scoring events (runs, wickets, extras, undo, etc.) to the 
   * backend scoring engine which handles all the business logic and state management.
   * 
   * Keyboard Scoring Integration:
   * This is the primary method used by the useKeyboardScore hook to process real-time
   * scoring events. The backend engine handles:
   * - Score calculations (runs, extras, wickets)
   * - Over progression and management
   * - Batsman/bowler statistics updates
   * - Scorecard state persistence
   * - Undo/redo functionality
   * - Over summaries
   * 
   * @param matchId - The ID of the match
   * @param event - Score event DTO containing event type and details
   * @returns Promise with the updated live status
   * 
   * @example
   * ```ts
   * // Score 4 runs
   * await LiveMatchService.handleScoreEvent('match123', {
   *   type: 'RUN',
   *   runs: 4,
   *   isBoundary: true
   * });
   * 
   * // Record a wicket
   * await LiveMatchService.handleScoreEvent('match123', {
   *   type: 'WICKET',
   *   runs: 0,
   *   wicketType: 'bowled',
   *   playerId: 'player123'
   * });
   * 
   * // Undo last ball
   * await LiveMatchService.handleScoreEvent('match123', {
   *   type: 'UNDO'
   * });
   * ```
   */
  static async handleScoreEvent(matchId: string, event: any): Promise<any> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/event`, event);
    return response.data?.data?.result;
  }

  /**
   * Handle Simple Event - Process simple string-based scoring events
   * 
   * This method accepts simple string events and converts them to appropriate
   * scoring events on the backend. The backend will parse the string and
   * determine the event type and parameters automatically.
   * 
   * Supported event strings:
   * - '1', '2', '3', '4', '5', '6' - Runs
   * - 'lb1', 'lb2', 'lb3', 'lb4' - Leg byes
   * - 'nb' - No ball
   * - 'fh' - Free hit
   * - 'uf' - Umpires fall
   * - 'ba' - Ball in air
   * - 'o' - Over
   * - 'roc' - Run out check
   * - 'w' - Wicket
   * - 'wd' - Wide ball
   * - 'wdnb' - Wide + No ball
   * - 'bs' - Bowler stopped
   * 
   * @param matchId - The ID of the match
   * @param eventString - Simple string representing the event
   * @returns Promise with the updated live status
   */
  static async handleSimpleEvent(matchId: string, eventString: string, bowlerName?: string, batsmanName?: string): Promise<any> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/simple-event`, {
      event: eventString,
      bowlerName,
      batsmanName,
    });
    // Return full response data to check for requiresWicketSelection
    return response.data?.data || response.data;
  }

  /**
   * Submit wicket with dismissal type after wdw/nbw event
   * 
   * This is called after the user selects a dismissal type from the modal
   * when a wide+wicket or no-ball+wicket event is triggered.
   * 
   * @param matchId - The ID of the match
   * @param dismissalType - The selected dismissal type (run_out, stumped, etc.)
   * @returns Promise with the updated live status
   */
  static async submitWicketWithDismissalType(matchId: string, dismissalType: string): Promise<any> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/event`, {
      type: 'WICKET',
      runs: 0,
      wicketType: dismissalType,
      isComposite: true
    });
    return response.data?.data?.result;
  }

  /**
   * Set a batsman as striker (on strike)
   * 
   * This will automatically set all other batsmen in the same inning to non-striker.
   * Only one batsman can be on strike at a time.
   * 
   * @param matchId - The ID of the match
   * @param inningNumber - The inning number (1, 2, etc.)
   * @param playerId - The ID of the player to set as striker
   * @returns Promise with the updated batsman data
   */
  static async setStriker(matchId: string, inningNumber: number, playerId: string): Promise<BattingScorecard> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/set-striker/${inningNumber}/${playerId}`);
    return response.data?.data?.result;
  }

  /**
   * Set a batsman as non-striker
   * 
   * @param matchId - The ID of the match
   * @param inningNumber - The inning number (1, 2, etc.)
   * @param playerId - The ID of the player to set as non-striker
   * @returns Promise with the updated batsman data
   */
  static async setNonStriker(matchId: string, inningNumber: number, playerId: string): Promise<BattingScorecard> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/set-non-striker/${inningNumber}/${playerId}`);
    return response.data?.data?.result;
  }

  /**
   * Swap striker and non-striker
   * 
   * This is useful when batsmen cross after a run or when changing ends.
   * 
   * @param matchId - The ID of the match
   * @param inningNumber - The inning number (1, 2, etc.)
   * @returns Promise with success message
   */
  static async swapBatsmen(matchId: string, inningNumber: number): Promise<any> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/swap-batsmen/${inningNumber}`);
    return response.data?.data?.result;
  }

  /**
   * Get recent overs for admin panel (last 3 overs with ball details)
   * 
   * This optimized API returns only the most recent 3 overs for the current or specified inning,
   * providing ball-by-ball details for editing and management purposes.
   * 
   * @param matchId - The ID of the match
   * @param inningNumber - Optional inning number (defaults to current inning)
   * @returns Promise with recent overs data including current over number and overs array
   */
  static async getRecentOvers(matchId: string, inningNumber?: number): Promise<any> {
    try {
      const params = inningNumber ? `?inningNumber=${inningNumber}` : '';
      const response = await axiosInstance.get(`/admin/matches/${matchId}/recent-overs${params}`);
      if (response.data?.status === false) {
        console.warn('Recent overs API returned error:', response.data);
        return { inningNumber: inningNumber || 1, currentOver: 1, overs: [] };
      }
      return response.data?.data?.result || response.data?.result || { inningNumber: inningNumber || 1, currentOver: 1, overs: [] };
    } catch (error: any) {
      console.error('Error fetching recent overs:', error);
      return { inningNumber: inningNumber || 1, currentOver: 1, overs: [] };
    }
  }

  /**
   * Set a bowler as current bowler
   * 
   * This will automatically set all other bowlers in the same inning to not current.
   * Only one bowler can be bowling at a time.
   * 
   * @param matchId - The ID of the match
   * @param inningNumber - The inning number (1, 2, etc.)
   * @param playerId - The ID of the player to set as current bowler
   * @returns Promise with the updated bowler and live status data
   */
  static async setCurrentBowler(matchId: string, inningNumber: number, playerId: string): Promise<any> {
    const response = await axiosInstance.post(`/admin/matches/${matchId}/set-current-bowler/${inningNumber}/${playerId}`);
    return response.data?.data?.result;
  }

  // ==================== COMMENTARY APIS ====================

  /**
   * Get match commentary (all or for specific inning)
   * 
   * Fetches ball-by-ball commentary including highlights (wickets, milestones, etc.)
   * for the specified match. Can optionally filter by inning.
   * 
   * @param matchId - The ID of the match
   * @param inningId - Optional inning ID to filter commentary
   * @returns Promise with array of commentary entries
   */
  static async getCommentary(matchId: string, inningId?: string): Promise<any[]> {
    try {
      const params = inningId ? `?inningId=${inningId}` : '';
      const response = await axiosInstance.get(`/admin/matches/${matchId}/commentary${params}`);
      if (response.data?.status === false) {
        console.warn('Commentary API returned error:', response.data);
        return [];
      }
      return response.data?.data?.result || response.data?.result || [];
    } catch (error: any) {
      console.error('Error fetching commentary:', error);
      return [];
    }
  }

  /**
   * Update commentary text
   * 
   * Updates the commentary text for a specific commentary entry.
   * This will mark the commentary as manually edited (isAutoGenerated: false).
   * 
   * @param commentaryId - The ID of the commentary entry to update
   * @param commentary - The new commentary text
   * @returns Promise with the updated commentary entry
   */
  static async updateCommentary(matchId: string, commentaryId: string, commentary: string): Promise<any> {
    const response = await axiosInstance.patch(`/admin/matches/${matchId}/commentary/${commentaryId}`, { commentary });
    return response.data?.data?.result || response.data?.result;
  }

  /**
   * Delete commentary entry
   * 
   * Removes a commentary entry from the database.
   * 
   * @param commentaryId - The ID of the commentary entry to delete
   * @returns Promise with deletion confirmation
   */
  static async deleteCommentary(matchId: string, commentaryId: string): Promise<any> {
    const response = await axiosInstance.delete(`/admin/matches/${matchId}/commentary/${commentaryId}`);
    return response.data?.data?.result || response.data?.result;
  }
}


