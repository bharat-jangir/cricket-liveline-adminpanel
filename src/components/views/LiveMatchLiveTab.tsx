import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { LiveMatchService, type LiveMatchStatus, type Scorecard, type BattingScorecard, type BowlingScorecard, type UpdateBatsmanDto, type UpdateBowlerDto, type UpdateTossDto, type Inning } from "../../services/live-match.service";
import { MatchService } from "../../services/match.service";
import { useKeyboardScore } from "../../hooks/useKeyboardScore";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreVertical, RefreshCw, Plus } from "lucide-react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface Bowler {
  id: number;
  name: string;
  overs: string;
  maidens: number | string;
  runs: number | string;
  wickets: number | string;
  isSelected: boolean;
  inScorecard: boolean;
  _playerId: string;
}

interface Batsman {
  id: number;
  name: string;
  dismissal?: string;
  runs: number | string;
  balls: number | string;
  fours: number | string;
  sixes: number | string;
  to: string;
  tr: string | number;
  status: "batting" | "out" | "yetToBat";
  inScorecard: boolean;
  _playerId: string;
}

interface Session {
  id: number | string;
  session: number;
  open: number;
  pass: number;
  min: number;
  max: number;
}

interface LiveMatchLiveTabProps {
  matchId: string;
  matchData?: {
    team1: { name: string; _id?: string };
    team2: { name: string; _id?: string };
    toss?: string;
    status?: string;
  };
  matchFormat?: 'test' | 'odi' | 't20' | 't20i';
  liveStatus?: any;
}

export function LiveMatchLiveTab({ matchId, matchData, matchFormat, liveStatus: initialLiveStatus }: LiveMatchLiveTabProps) {
  // Get team names - ensure we get the actual names from matchData
  const team1Name = matchData?.team1?.name || '';
  const team2Name = matchData?.team2?.name || '';
  const team1Id = matchData?.team1?._id || '';
  const team2Id = matchData?.team2?._id || '';


  const defaultTossInfo = initialLiveStatus?.toss?.tossText || (
    typeof matchData?.toss === 'object' && matchData?.toss !== null
      ? (matchData as any).toss?.tossText || "Toss Pending"
      : (matchData?.toss || "Toss Pending")
  );
  const [tossInfo, setTossInfo] = useState(defaultTossInfo);

  // API Data State
  const [liveStatus, setLiveStatus] = useState<LiveMatchStatus | null>(null);
  const [allInnings, setAllInnings] = useState<Inning[]>([]);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'auto' | 'manual'>('auto');

  // Team Selection State - Initialize with empty values
  const [currentBattingTeam, setCurrentBattingTeam] = useState<string>('');
  const [currentBattingTeamId, setCurrentBattingTeamId] = useState<string>('');
  const [currentBowlingTeam, setCurrentBowlingTeam] = useState<string>('');
  const [currentBowlingTeamId, setCurrentBowlingTeamId] = useState<string>('');

  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [batsmen, setBatsmen] = useState<Batsman[]>([]);

  // Squad states for full Playing XI display
  const [battingSquad, setBattingSquad] = useState<any[]>([]);
  const [bowlingSquad, setBowlingSquad] = useState<any[]>([]);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [addPlayerType, setAddPlayerType] = useState<'batsman' | 'bowler' | null>(null);

  const [pendingTeam, setPendingTeam] = useState<string | null>(null);
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [showTeamConfirm, setShowTeamConfirm] = useState(false);

  // Scoreboard related states
  const [comment2, setComment2] = useState("");
  const [commentSV3SV4, setCommentSV3SV4] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [powerPlayOn, setPowerPlayOn] = useState(false);
  const [oddsHistory, setOddsHistory] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [noScorecards, setNoScorecards] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [showing, setShowing] = useState(false);
  const [dls, setDls] = useState(false);
  const [noCommentry, setNoCommentry] = useState(false);
  const [onOC, setOnOC] = useState(false);

  const initialStatus = useMemo(() => {
    const s = matchData?.status?.toLowerCase() || 'upcoming';
    if (s === 'upcoming' || s === 'scheduled' || s === 'not-started') return 'not-started';
    if (s === 'live') return 'live';
    if (s === 'finished' || s === 'completed') return 'completed';
    return 'not-started';
  }, [matchData?.status]);

  const [matchStatus, setMatchStatus] = useState(initialStatus);

  const [lastWicket, setLastWicket] = useState({
    name: "",
    dismissal: "",
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    to: "",
    tr: 0 as string | number,
    _playerId: "",
  });

  const [extras, setExtras] = useState({
    ex: 0,
    w: 0,
    nb: 0,
    lb: 0,
    b: 0,
    p: 0,
  });

  // Session State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Auto Refresh State
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [newSession, setNewSession] = useState({
    session: "",
    open: "",
    pass: "",
    min: "",
    max: "",
  });

  const originalValuesRef = useRef<Map<string, string>>(new Map());

  /**
   * Keyboard Scoring Integration
   * 
   * This hook enables real-time keyboard-based scoring. All scoring events are dispatched
   * to the backend score engine which handles the business logic.
   * 
   * Features:
   * - Press 0-6 to score runs
   * - Press 'W' for wicket
   * - Press 'U' to undo last ball
   * - Press 'N' for no ball
   * - Press 'D' for wide
   * - Press 'B' for bye
   * - Press 'L' for leg bye
   * - Press 'O' to end over
   * 
   * The hook is only active when matchStatus is 'live' to prevent accidental scoring
   * during match setup or after completion.
   */
  const { dispatchEvent: dispatchScoreEvent } = useKeyboardScore({
    matchId,
    enabled: matchStatus === 'live' && !loading && !saving,
    onSuccess: async (event, response) => {
      console.log('Score event processed successfully:', event, response);
      // Silently refresh data to update UI with latest state from backend
      await loadLiveData(true);
    },
    onError: (event, error) => {
      console.error('Failed to process score event:', event, error);
      // Error toast is already shown by the hook
    },
    showToasts: true,
  });

  const availablePlayers = useMemo(() => {
    const activeSquad = addPlayerType === 'batsman' ? battingSquad : bowlingSquad;
    const inScorecardIds = new Set((addPlayerType === 'batsman' ? batsmen : bowlers)
      .filter(p => p.inScorecard)
      .map(p => p._playerId));

    return activeSquad.filter(player => !inScorecardIds.has(String(player._id)));
  }, [addPlayerType, battingSquad, bowlingSquad, batsmen, bowlers]);

  // Toss confirmation state
  const [showTossConfirm, setShowTossConfirm] = useState(false);
  const [pendingTossInfo, setPendingTossInfo] = useState<string>('');
  const [pendingTeams, setPendingTeams] = useState<{ battingTeamId: string; bowlingTeamId: string; winnerId: string; elected: 'bat' | 'bowl' } | null>(null);

  // Match state
  const [currentBall, setCurrentBall] = useState("0");
  const [runs, setRuns] = useState("0");
  const [wickets, setWickets] = useState("0");
  const [overs, setOvers] = useState("0.0");
  const [currentInning, setCurrentInning] = useState("1");

  // Helper function to get team name from ID (handles both populated objects and string IDs)
  const getTeamNameFromId = useCallback((teamId: string | { _id: string; name?: string; shortName?: string } | null | undefined): string | null => {
    if (!teamId) return null;

    // If it's already a populated object with name
    if (typeof teamId === 'object' && teamId !== null && !Array.isArray(teamId)) {
      if (teamId.name) return teamId.name;
      if (teamId.shortName) return teamId.shortName;
      // If object but no name, try to get _id and resolve from matchData
      const id = teamId._id?.toString() || '';
      if (id === team1Id) return team1Name;
      if (id === team2Id) return team2Name;
      return null;
    }

    // If it's a string ID, resolve from matchData
    if (typeof teamId === 'string') {
      if (teamId === team1Id) return team1Name;
      if (teamId === team2Id) return team2Name;
    }

    return null;
  }, [team1Id, team1Name, team2Id, team2Name]);

  // Helper function to get team ID string from value (handles both populated objects and string IDs)
  const getTeamIdString = useCallback((teamId: any): string | null => {
    if (!teamId) return null;

    if (typeof teamId === 'object' && teamId !== null) {
      if (teamId._id) return teamId._id.toString();
      return null;
    }

    if (typeof teamId === 'string') {
      return teamId;
    }

    return null;
  }, []);

  // Helper function to get player ID string from value (handles both populated objects and string IDs)
  const getPlayerIdString = useCallback((playerId: any): string | null => {
    if (!playerId) return null;

    if (typeof playerId === 'object' && playerId !== null) {
      if (playerId._id) return playerId._id.toString();
      return null;
    }

    if (typeof playerId === 'string') {
      return playerId;
    }

    return null;
  }, []);

  const getTeamScoreDisplay = (teamId: string) => {
    if (!currentBattingTeamId) {
      return <div className="text-xs text-slate-500 mt-1">Pending</div>;
    }

    // If team is currently batting, show current live score
    if (currentBattingTeamId === teamId) {
      return (
        <>
          <div className="flex items-end gap-2">
            <div className={`text-xl font-bold ${currentBattingTeamId === teamId ? 'text-white' : ''}`}>{runs}-{wickets}</div>
            <div className={`text-xs mb-1 ${currentBattingTeamId === teamId ? 'text-slate-300' : 'text-slate-500'}`}>{overs}</div>
          </div>
          <div className={`text-[10px] ${currentBattingTeamId === teamId ? 'text-slate-400' : 'text-slate-400'}`}>
            CRR: {(() => {
              const r = parseFloat(runs);
              const o = parseFloat(overs);
              if (isNaN(r) || isNaN(o) || o <= 0) return "0.00";
              return (r / o).toFixed(2);
            })()}
          </div>
        </>
      );
    }

    // Determine current cycle context (1-2 or 3-4)
    const currentInningNum = parseInt(currentInning) || 1;
    const maxInningAllowed = currentInningNum <= 2 ? 2 : 4;
    const minInningAllowed = currentInningNum <= 2 ? 1 : 3;

    // Filter innings based on context
    // We only want to show scores from the current "cycle" or pair of innings
    const validInnings = allInnings.filter(inn =>
      inn.inningNumber >= minInningAllowed && inn.inningNumber <= maxInningAllowed
    );

    // If team is NOT batting, look for their scores in VALID innings
    const teamInnings = validInnings.filter(inn => {
      const innBattingTeamId = typeof inn.battingTeamId === 'object' ? inn.battingTeamId?._id : inn.battingTeamId;
      return String(innBattingTeamId) === String(teamId);
    });

    if (teamInnings.length > 0) {
      // For Test matches, there might be multiple innings
      const latestInning = teamInnings[teamInnings.length - 1];
      const totalOvers = Math.floor(latestInning.totalBalls / 6);
      const remainderBalls = latestInning.totalBalls % 6;

      return (
        <>
          <div className={`flex items-end gap-2 ${currentBattingTeamId === teamId ? '' : 'justify-end'}`}>
            <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
              {latestInning.totalRuns}-{latestInning.totalWickets}
            </div>
            <div className="text-xs text-slate-500 mb-1">
              {totalOvers}.{remainderBalls}
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            {`Inn ${latestInning.inningNumber}`}
          </div>
        </>
      );
    }

    // Default: Yet to bat
    return (
      <>
        <div className="text-xs text-slate-500">Yet to bat</div>
        <div className="text-[10px] text-slate-400">CRR: -</div>
      </>
    );
  };

  const loadLiveData = useCallback(async (silent = false) => {
    if (!matchId) return;
    try {
      if (!silent) setLoading(true);
      const [statusResponse, scorecardResponse] = await Promise.allSettled([
        LiveMatchService.getLiveStatus(matchId),
        LiveMatchService.getScorecard(matchId, parseInt(currentInning)),
      ]);

      // Handle live status
      if (statusResponse.status === 'fulfilled' && statusResponse.value) {
        const status = statusResponse.value as any;
        console.log('Live status loaded:', status);
        console.log('Team data in status:', {
          battingTeamId: status.battingTeamId,
          bowlingTeamId: status.bowlingTeamId,
          battingTeamIdType: typeof status.battingTeamId,
          bowlingTeamIdType: typeof status.bowlingTeamId,
        });
        setLiveStatus(status);

        // Extract team information - handle both populated objects and string IDs
        const battingTeamIdValue = status.battingTeamId;
        const bowlingTeamIdValue = status.bowlingTeamId;

        // Get team names - try populated object first, then resolve from matchData
        const battingTeamName = getTeamNameFromId(battingTeamIdValue);
        const bowlingTeamName = getTeamNameFromId(bowlingTeamIdValue);
        const battingTeamIdStr = getTeamIdString(battingTeamIdValue);
        const bowlingTeamIdStr = getTeamIdString(bowlingTeamIdValue);

        // Update batting team if we have valid data
        if (battingTeamName && battingTeamIdStr) {
          // Only update if current state is empty or different
          if (!currentBattingTeam || currentBattingTeam !== battingTeamName) {
            setCurrentBattingTeam(battingTeamName);
            setCurrentBattingTeamId(battingTeamIdStr);
          }
        }

        // Update bowling team if we have valid data
        // Update bowling team if we have valid data
        if (bowlingTeamName && bowlingTeamIdStr) {
          // Only update if current state is empty or different
          if (!currentBowlingTeam || currentBowlingTeam !== bowlingTeamName) {
            setCurrentBowlingTeam(bowlingTeamName);
            setCurrentBowlingTeamId(bowlingTeamIdStr);
          }
        }

        // If teams still aren't set after loading live status, keep them empty
        // This honors the user's request to have null teams at initialization
        if (!battingTeamIdStr && !currentBattingTeamId) {
          setCurrentBattingTeam('');
          setCurrentBattingTeamId('');
          setCurrentBowlingTeam('');
          setCurrentBowlingTeamId('');
        }

        // Update score, runs, wickets, overs from live status
        if (status.score) {
          const [runs, wickets] = status.score.split('/');
          setRuns(runs || '0');
          setWickets(wickets || '0');
        }
        // Load odds from live status - always update if live status exists
        // This ensures we get the latest odds from DB even if some values are 0
        const loadedOdds = {
          team: status.oddsTeam !== undefined ? status.oddsTeam : (team1Name || ""),
          oddsBlue: status.oddsBlue !== undefined ? status.oddsBlue : 0,
          oddsRed: status.oddsRed !== undefined ? status.oddsRed : 0,
          session: status.session !== undefined ? status.session : 0,
          sessionBlue: status.sessionBlue !== undefined ? status.sessionBlue : 0,
          sessionRed: status.sessionRed !== undefined ? status.sessionRed : 0,
          lambi: status.lambi !== undefined ? status.lambi : 0,
          lambiBlue: status.lambiBlue !== undefined ? status.lambiBlue : 0,
          lambiRed: status.lambiRed !== undefined ? status.lambiRed : 0,
        };

        console.log('Loading odds from DB:', loadedOdds);
        setOdds(loadedOdds);
        if (status.overs) {
          setOvers(status.overs);
        }
        if (status.currentBall !== undefined) {
          setCurrentBall(String(status.currentBall));
        }
        if (status.currentInning) {
          setCurrentInning(String(status.currentInning));
        }

        // Load toss info from live status
        if (status.toss?.tossText) {
          setTossInfo(status.toss.tossText);
        }

        // Load UI controls state
        if (status.powerPlay !== undefined) setPowerPlayOn(status.powerPlay);
        if (status.isNew !== undefined) setIsNew(status.isNew);
        if (status.noScorecards !== undefined) setNoScorecards(status.noScorecards);
        if (status.viewMode !== undefined) setViewMode(status.viewMode);
        if (status.isNotShowing !== undefined) setShowing(status.isNotShowing);
        if (status.dls !== undefined) setDls(status.dls);
        if (status.noCommentry !== undefined) setNoCommentry(status.noCommentry);
        if (status.onOC !== undefined) setOnOC(status.onOC);

        // Load comments
        if (status.comment2 !== undefined) setComment2(status.comment2);
        if (status.comment3 !== undefined) setCommentSV3SV4(status.comment3);
      } else {
        console.warn('Failed to load live status:', statusResponse);
      }

      // Handle scorecard
      if (scorecardResponse.status === 'fulfilled' && scorecardResponse.value) {
        const scorecardData = scorecardResponse.value;
        setScorecard(scorecardData);
        // Transform scorecard data to component state
        transformScorecardToState(scorecardData);

        // Load extras from inning data
        if (scorecardData.inning) {
          setExtras({
            ex: scorecardData.inning.extras || 0,
            w: scorecardData.inning.wides || 0,
            nb: scorecardData.inning.noBalls || 0,
            lb: scorecardData.inning.legByes || 0,
            b: scorecardData.inning.byes || 0,
            p: scorecardData.inning.penalties || 0,
          });

          // If teams weren't set from live status, try to get them from inning data or fall back to matchData
          if (!currentBattingTeamId) {
            const inningBattingTeamId = getTeamIdString(scorecardData?.inning?.battingTeamId);
            const inningBattingTeamName = getTeamNameFromId(scorecardData?.inning?.battingTeamId);

            if (inningBattingTeamId && inningBattingTeamName) {
              setCurrentBattingTeam(inningBattingTeamName);
              setCurrentBattingTeamId(inningBattingTeamId);
            } else {
              // Fallback to Team 1
              setCurrentBattingTeam(team1Name);
              setCurrentBattingTeamId(team1Id);
            }
          }

          if (!currentBowlingTeamId) {
            const inningBowlingTeamId = getTeamIdString(scorecardData?.inning?.bowlingTeamId);
            const inningBowlingTeamName = getTeamNameFromId(scorecardData?.inning?.bowlingTeamId);

            if (inningBowlingTeamId && inningBowlingTeamName) {
              setCurrentBowlingTeam(inningBowlingTeamName);
              setCurrentBowlingTeamId(inningBowlingTeamId);
            } else {
              // Fallback to Team 2
              setCurrentBowlingTeam(team2Name);
              setCurrentBowlingTeamId(team2Id);
            }
          }
        }
      } else {
        console.warn('Failed to load scorecard:', scorecardResponse);
        // If scorecard fails, at least clear the old data
        setBatsmen([]);
        setBowlers([]);
      }
    } catch (error: any) {
      console.error('Failed to load live data:', error);
      toast.error(error?.response?.data?.userMessage || 'Failed to load live match data');
      // Clear data on error
      setBatsmen([]);
      setBowlers([]);
    } finally {
      setLoading(false);
    }
  }, [matchId, currentInning, getTeamNameFromId, getTeamIdString, currentBattingTeam, currentBowlingTeamId]);

  // Load over history from database
  const loadOverHistory = useCallback(async () => {
    if (!matchId) return;
    try {
      const overSummaries = await LiveMatchService.getOverSummaries(matchId, parseInt(currentInning));

      // Transform over summaries to overHistory format
      const transformedHistory = overSummaries.map((over: any) => ({
        over: over.overNumber,
        runs: over.ballsData || [],
      })).sort((a: any, b: any) => b.over - a.over); // Sort descending

      setOverHistory(transformedHistory);
    } catch (error: any) {
      console.error('Failed to load over history:', error);
      // Don't show error toast, just log it
    }
  }, [matchId, currentInning]);

  // Load all innings summaries
  const loadAllInnings = useCallback(async () => {
    if (!matchId) return;
    try {
      const innings = await LiveMatchService.getInnings(matchId);
      setAllInnings(innings);
    } catch (error) {
      console.error('Failed to load all innings:', error);
    }
  }, [matchId]);

  // Load playing XI players for both teams
  const loadSquads = useCallback(async () => {
    if (!matchId || !currentBattingTeamId || !currentBowlingTeamId) return;

    try {
      const squads = await LiveMatchService.getMatchSquads(matchId);

      const getPlayersFromSquad = (teamId: string) => {
        const squad = squads.find((s: any) => {
          const squadTeamId = typeof s.teamId === 'object' ? s.teamId._id : s.teamId;
          return String(squadTeamId) === String(teamId);
        });

        return squad?.playingXI?.map((p: any) => ({
          _id: typeof p === 'object' ? p._id : p,
          name: typeof p === 'object' ? (p.name || p.fullName || 'Unknown') : 'Unknown',
          fullName: typeof p === 'object' ? p.fullName : undefined,
          role: typeof p === 'object' ? p.role : undefined,
        })) || [];
      };

      setBattingSquad(getPlayersFromSquad(currentBattingTeamId).filter(p => p.name !== 'Batsmen' && p.name !== 'Bowler'));
      setBowlingSquad(getPlayersFromSquad(currentBowlingTeamId).filter(p => p.name !== 'Batsmen' && p.name !== 'Bowler'));

    } catch (error: any) {
      console.error('Failed to load squads:', error);
      setBattingSquad([]);
      setBowlingSquad([]);
    }
  }, [matchId, currentBattingTeamId, currentBowlingTeamId]);

  // Initialize scorecards from playing XI
  const initializeScorecards = useCallback(async (teamId: string, teamName: string, silent: boolean = false) => {
    if (!matchId || !teamId) {
      if (!silent) toast.error('Missing match or team information');
      return;
    }
    try {
      if (!silent) setSaving(true);
      const result = await LiveMatchService.initializeScorecards(matchId, parseInt(currentInning), teamId);
      if (!silent) toast.success(`${teamName}: ${result?.message || 'Scorecards initialized successfully'}`);
      // Let's reload quietly if silent to update the UI
      loadLiveData(true);
    } catch (error: any) {
      console.error('Failed to initialize scorecards:', error);
      const errorMsg = error?.response?.data?.userMessage || 'Failed to initialize scorecards';
      if (!silent) toast.error(errorMsg);
      if (!silent && errorMsg.includes('Playing XI not found')) {
        toast.info('Please go to Info tab and select Playing XI first');
      }
    } finally {
      if (!silent) setSaving(false);
    }
  }, [matchId, currentInning, loadLiveData]);

  // Load match squads when teams change
  useEffect(() => {
    loadSquads();
  }, [loadSquads]);

  // Load live status and scorecard
  useEffect(() => {
    if (matchId) {
      loadLiveData();
      loadOverHistory();
      loadSquads();
      loadAllInnings();

      // Sync tossInfo from matchData if available
      if (matchData?.toss) {
        const info = typeof matchData.toss === 'object'
          ? (matchData as any).toss?.tossText
          : matchData.toss;
        setTossInfo(info || 'Toss Pending');
      }
      // ... (rest of the effect)
    }
  }, [matchId, currentInning, loadLiveData, loadOverHistory, loadSquads, matchData]);

  const transformScorecardToState = useCallback((data: Scorecard) => {
    if (!data || !data.batting || !data.bowling) {
      setBatsmen([]);
      setBowlers([]);
      return;
    }

    // Transform batting scorecard merging with squad
    const transformedBatsmen: Batsman[] = battingSquad.map((player, index) => {
      const scorecardEntry = data.batting.find(b => {
        const pId = typeof b.playerId === 'object' ? b.playerId._id : b.playerId;
        return String(pId) === String(player._id);
      });

      if (scorecardEntry) {
        const inScorecard = (scorecardEntry as any).isVisible !== undefined ? (scorecardEntry as any).isVisible : true;
        // Determine status: if in scorecard and not out, they're batting (either striker or non-striker)
        let status: 'batting' | 'out' | 'yetToBat' = 'yetToBat';
        if (scorecardEntry.isOut) {
          status = 'out';
        } else if (inScorecard) {
          // If they're in the scorecard and not out, they're batting (could be striker or non-striker)
          status = 'batting';
        }
        return {
          id: index + 1,
          name: player.name,
          dismissal: scorecardEntry.dismissalText || undefined,
          runs: scorecardEntry.runs ?? 0,
          balls: scorecardEntry.balls ?? 0,
          fours: scorecardEntry.fours ?? 0,
          sixes: scorecardEntry.sixes ?? 0,
          to: scorecardEntry.to ?? '',
          tr: scorecardEntry.tr ?? 0,
          status,
          inScorecard,
          _playerId: String(player._id),
        };
      }

      return {
        id: index + 1,
        name: player.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        to: '',
        tr: 0,
        status: 'yetToBat',
        inScorecard: false,
        _playerId: String(player._id),
      };
    });

    // Transform bowling scorecard merging with squad
    const transformedBowlers: Bowler[] = bowlingSquad.map((player, index) => {
      const scorecardEntry = data.bowling.find(b => {
        const pId = typeof b.playerId === 'object' ? b.playerId._id : b.playerId;
        return String(pId) === String(player._id);
      });

      if (scorecardEntry) {
        const inScorecard = (scorecardEntry as any).isVisible !== undefined ? (scorecardEntry as any).isVisible : true;
        const isCurrentBowler = (scorecardEntry as any).isCurrentBowler === true;
        return {
          id: index + 1,
          name: player.name,
          overs: scorecardEntry.completedOvers !== undefined && scorecardEntry.balls !== undefined
            ? `${scorecardEntry.completedOvers}.${scorecardEntry.balls % 6}`
            : '0.0',
          maidens: scorecardEntry.maidens ?? 0,
          runs: scorecardEntry.runs ?? 0,
          wickets: scorecardEntry.wickets ?? 0,
          isSelected: isCurrentBowler,
          inScorecard,
          _playerId: String(player._id),
        };
      }

      return {
        id: index + 1,
        name: player.name,
        overs: '0.0',
        maidens: 0,
        runs: 0,
        wickets: 0,
        isSelected: false,
        inScorecard: false,
        _playerId: String(player._id),
      };
    });

    // Find last wicket
    if (data.inning?.lastWicket) {
      setLastWicket({
        name: data.inning.lastWicket.name,
        dismissal: data.inning.lastWicket.dismissal,
        runs: data.inning.lastWicket.runs,
        balls: data.inning.lastWicket.balls,
        fours: data.inning.lastWicket.fours,
        sixes: data.inning.lastWicket.sixes,
        to: data.inning.lastWicket.to || '',
        tr: data.inning.lastWicket.tr || 0,
        _playerId: String(data.inning.lastWicket.playerId)
      });
    } else {
      // Fallback to logical calculation if DB doesn't have it yet
      const dismissedBatsmen = [...data.batting]
        .filter(b => b.isOut)
        .sort((a, b) => (b.battingPosition || 0) - (a.battingPosition || 0));

      if (dismissedBatsmen.length > 0) {
        const last = dismissedBatsmen[0];
        const player = battingSquad.find(p => String(p._id) === String(typeof last.playerId === 'object' ? last.playerId._id : last.playerId));

        setLastWicket({
          name: player?.name || (typeof last.playerId === 'object' ? (last.playerId as any).name : 'Unknown'),
          dismissal: last.dismissalText || '',
          runs: last.runs || 0,
          balls: last.balls || 0,
          fours: last.fours || 0,
          sixes: last.sixes || 0,
          to: last.to || '',
          tr: last.tr || 0,
          _playerId: player?._id ? String(player._id) : (typeof last.playerId === 'object' ? String(last.playerId._id) : String(last.playerId))
        });
      } else {
        // Reset last wicket if no data found
        setLastWicket({
          name: "",
          dismissal: "",
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          to: "",
          tr: 0,
          _playerId: "",
        });
      }
    }

    setBatsmen(transformedBatsmen);
    setBowlers(transformedBowlers);
  }, [battingSquad, bowlingSquad]);

  const handleTeamClick = (team: string, teamId: string) => {
    if (team !== currentBattingTeam) {
      setPendingTeam(team);
      setPendingTeamId(teamId);
      setShowTeamConfirm(true);
    }
  };

  const confirmTeamSwitch = async () => {
    if (pendingTeam && pendingTeamId) {
      try {
        setSaving(true);
        const newBowlingTeamId = pendingTeamId === team1Id ? team2Id : team1Id;
        await LiveMatchService.switchTeams(matchId, {
          battingTeamId: pendingTeamId,
          bowlingTeamId: newBowlingTeamId,
        });
        setCurrentBattingTeam(pendingTeam);
        setCurrentBattingTeamId(pendingTeamId);
        setCurrentBowlingTeamId(newBowlingTeamId);
        toast.success('Teams switched successfully');
        // Reload data
        loadLiveData();
      } catch (error: any) {
        console.error('Failed to switch teams:', error);
        toast.error(error.response?.data?.userMessage || 'Failed to switch teams');
      } finally {
        setSaving(false);
      }
    }
    setPendingTeam(null);
    setPendingTeamId(null);
    setShowTeamConfirm(false);
  };



  // Check if we need to auto-initialize scorecards from Playing XI
  useEffect(() => {
    // Don't run if loading or critical info missing
    if (!matchId || !currentInning) return;

    // Only run if we actually have missing data to prevent loops
    // We check for !scorecard?.inning to ensure we only init once per inning
    const needsBattingInit = !!currentBattingTeamId && !scorecard?.inning;
    const needsBowlingInit = !!currentBowlingTeamId && !scorecard?.inning;

    if (!needsBattingInit && !needsBowlingInit) return;

    const autoInit = async () => {
      // If we have a batting team and list is empty
      if (needsBattingInit) {
        await initializeScorecards(currentBattingTeamId, currentBattingTeam || 'Batting Team', true);
      }

      // If we have a bowling team and list is empty
      if (needsBowlingInit) {
        await initializeScorecards(currentBowlingTeamId, getTeamNameFromId(currentBowlingTeamId) || 'Bowling Team', true);
      }
    };

    // Small delay to ensure state is settled
    const timeout = setTimeout(autoInit, 1500);
    return () => clearTimeout(timeout);
  }, [matchId, currentInning, currentBattingTeamId, currentBowlingTeamId, batsmen.length, bowlers.length, initializeScorecards]);

  // Re-transform scorecard when squads are loaded
  useEffect(() => {
    if (scorecard && (battingSquad.length > 0 || bowlingSquad.length > 0)) {
      transformScorecardToState(scorecard);
    }
  }, [battingSquad, bowlingSquad, scorecard, transformScorecardToState]);

  // Odds state
  const [odds, setOdds] = useState({
    team: team1Name || "",
    oddsBlue: 0,
    oddsRed: 0,
    session: 0,
    sessionBlue: 0,
    sessionRed: 0,
    lambi: 0,
    lambiBlue: 0,
    lambiRed: 0,
  });

  const [editOddsMode, setEditOddsMode] = useState(false);
  const [editingOdds, setEditingOdds] = useState(odds);

  // Over History State
  const [overHistory, setOverHistory] = useState<Array<{ over: number; runs: string[] }>>([]);

  // Load sessions from API
  const loadSessions = useCallback(async () => {
    if (!matchId) return;
    try {
      const dbSessions = await LiveMatchService.getSessions(matchId);
      setSessions(dbSessions.map((s: any) => ({
        id: s._id, // Use _id as id
        session: s.session,
        open: s.open,
        pass: s.pass,
        min: s.min,
        max: s.max,
      })));
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, [matchId]);

  // Handle Add Session via API
  const handleAddSession = async () => {
    if (!newSession.session || !newSession.open) {
      toast.error('Session and Open fields are required');
      return;
    }

    try {
      setSessionLoading(true);
      await LiveMatchService.addSession(matchId, {
        session: parseFloat(newSession.session) || 0,
        open: parseFloat(newSession.open) || 0,
        pass: parseFloat(newSession.pass) || 0,
        min: parseFloat(newSession.min) || 0,
        max: parseFloat(newSession.max) || 0,
      });

      setNewSession({
        session: "",
        open: "",
        pass: "",
        min: "",
        max: "",
      });

      await loadSessions();
      toast.success('Session added');
    } catch (error: any) {
      console.error('Failed to add session:', error);
      toast.error('Failed to add session');
    } finally {
      setSessionLoading(false);
    }
  };

  // Handle Session Change via API (Auto-save)
  const handleSessionChange = async (id: number | string, field: keyof Session, value: string) => {
    // Optimistic update
    const numValue = parseFloat(value) || 0;
    setSessions(sessions.map(s => s.id === id ? { ...s, [field]: numValue } : s));

    try {
      // Create session update object
      const session = sessions.find(s => s.id === id);
      if (!session) return;

      const updateDto = {
        [field]: numValue
      };

      await LiveMatchService.updateSession(matchId, id.toString(), updateDto);
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session');
      // Revert on error (could be improved by storing previous state)
      loadSessions();
    }
  };

  // Setup Auto Refresh
  useEffect(() => {
    let intervalId: any;

    if (autoRefresh && matchId) {
      intervalId = setInterval(() => {
        loadLiveData(true);
        loadOverHistory();
        loadSessions(); // Also refresh sessions
      }, 5000); // 5 seconds interval
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, matchId, loadLiveData, loadOverHistory, loadSessions]);

  // Initial load of sessions
  useEffect(() => {
    if (matchId) {
      loadSessions();
    }
  }, [matchId, loadSessions]);

  // Handle saving past over history
  const handleSaveOverHistory = async (overIndex: number) => {
    try {
      const overData = overHistory[overIndex];
      if (!overData) return;

      const overNumber = overData.over;
      const ballsData = overData.runs;

      await LiveMatchService.updateOverSummary(
        matchId,
        parseInt(currentInning),
        overNumber,
        ballsData
      );
      toast.success(`Over ${overNumber} updated`);
    } catch (error: any) {
      console.error('Failed to update over history:', error);
      toast.error('Failed to update over history');
    }
  };


  const [activeBall, setActiveBall] = useState<{ overIndex: number; ballIndex: number } | null>(null);

  // This Over State
  const [thisOver, setThisOver] = useState(["0", "0", "0", "0", "0", "0"]);

  const handleThisOverChange = (index: number, value: string) => {
    const newThisOver = [...thisOver];
    newThisOver[index] = value;
    setThisOver(newThisOver);
  };

  const handleOverRunChange = (overIndex: number, ballIndex: number, value: string) => {
    const newHistory = [...overHistory];
    newHistory[overIndex].runs[ballIndex] = value;
    setOverHistory(newHistory);
  };

  const handleKeypadClick = (val: string) => {
    if (activeBall) {
      handleOverRunChange(activeBall.overIndex, activeBall.ballIndex, val);
    }
  };

  const handleOverNumberChange = (overIndex: number, value: string) => {
    const newHistory = [...overHistory];
    newHistory[overIndex].over = parseInt(value) || 0;
    setOverHistory(newHistory);
  };

  const handleOddsClick = () => {
    if (!editOddsMode) {
      // Calculate differences for edit mode: Red - Blue
      setEditingOdds({
        ...odds,
        oddsRed: Math.max(0, (odds.oddsRed || 0) - (odds.oddsBlue || 0)),
        sessionRed: Math.max(0, (odds.sessionRed || 0) - (odds.sessionBlue || 0)),
        lambiRed: Math.max(0, (odds.lambiRed || 0) - (odds.lambiBlue || 0)),
      });
      setEditOddsMode(true);
    }
  };

  const handleUpdateOdds = async () => {
    try {
      // Update odds via API (DB level only, no localStorage)
      const updateData = {
        oddsTeam: editingOdds.team || '',
        oddsBlue: editingOdds.oddsBlue || 0,
        oddsRed: (editingOdds.oddsBlue || 0) + (editingOdds.oddsRed || 0),
        session: editingOdds.session || 0,
        sessionBlue: editingOdds.sessionBlue || 0,
        sessionRed: (editingOdds.sessionBlue || 0) + (editingOdds.sessionRed || 0),
        lambi: editingOdds.lambi || 0,
        lambiBlue: editingOdds.lambiBlue || 0,
        lambiRed: (editingOdds.lambiBlue || 0) + (editingOdds.lambiRed || 0),
      };

      console.log('Saving odds:', updateData);
      await LiveMatchService.updateLiveStatus(matchId, updateData);

      // Reload data to get the saved odds from DB (silent refresh)
      await loadLiveData(true);

      setOdds({
        ...editingOdds,
        oddsRed: updateData.oddsRed,
        sessionRed: updateData.sessionRed,
        lambiRed: updateData.lambiRed
      });
      setEditOddsMode(false);
      toast.success('Odds updated');
    } catch (error: any) {
      console.error('Failed to update odds:', error);
      toast.error(error?.response?.data?.userMessage || 'Failed to update odds');
    }
  };

  const handleCancelOdds = () => {
    setEditingOdds(odds);
    setEditOddsMode(false);
  };

  const handleBowlerSelect = useCallback(async (bowlerId: number) => {
    const bowler = bowlers.find(b => b.id === bowlerId);
    if (!bowler || !bowler.inScorecard) return;
    
    try {
      setSaving(true);
      await LiveMatchService.setCurrentBowler(matchId, parseInt(currentInning), bowler._playerId);
      toast.success(`${bowler.name} set as current bowler`);
      setBowlers(prev => prev.map(b => ({ ...b, isSelected: b.id === bowlerId })));
      await loadLiveData(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to set current bowler');
    } finally {
      setSaving(false);
    }
  }, [bowlers, matchId, currentInning, loadLiveData]);

  // Handle bowler stat input change (local state only) - memoized to prevent re-renders
  const handleBowlerStatInputChange = useCallback((id: number, field: keyof Bowler, value: string) => {
    setBowlers(prev => prev.map(b => {
      if (b.id === id) {
        // Store original value on first change
        const key = `bowler-${id}-${field}`;
        if (!originalValuesRef.current.has(key)) {
          originalValuesRef.current.set(key, String(b[field] || ''));
        }
        return { ...b, [field]: value };
      }
      return b;
    }));
  }, []);

  // Handle bowler stat save on Enter key - memoized to prevent re-renders
  const handleBowlerStatSave = useCallback(async (id: number, field: keyof Bowler, value: string) => {
    const key = `bowler-${id}-${field}`;
    const originalValue = originalValuesRef.current.get(key);

    // Only save if value actually changed
    if (originalValue !== undefined && originalValue === value) {
      return; // No change, don't save
    }

    setBowlers(prev => {
      const bowler = prev.find(b => b.id === id);
      if (!bowler || !bowler._playerId) return prev;

      // Clear the original value since we're saving
      originalValuesRef.current.delete(key);

      // Save to API (async, don't block UI - no saving state to avoid affecting other buttons)
      const saveToAPI = async () => {
        try {
          const updateDto: UpdateBowlerDto = {
            calculationMode,
          };

          if (field === 'overs') {
            const [completed, balls] = value.split('.').map(v => parseInt(v) || 0);
            updateDto.completedOvers = completed;
            updateDto.balls = balls % 6;
            updateDto.overs = completed + balls / 6;
          } else if (field === 'maidens') {
            updateDto.maidens = value === '' ? 0 : parseInt(value) || 0;
          } else if (field === 'runs') {
            updateDto.runs = value === '' ? 0 : parseInt(value) || 0;
          } else if (field === 'wickets') {
            updateDto.wickets = value === '' ? 0 : parseInt(value) || 0;
          }

          await LiveMatchService.updateBowler(
            matchId,
            parseInt(currentInning),
            bowler._playerId || '',
            updateDto
          );
          toast.success('Bowler stats updated');
        } catch (error: any) {
          console.error('Failed to update bowler:', error);
          toast.error(error.response?.data?.userMessage || 'Failed to update bowler stats');
        }
      };

      saveToAPI();
      return prev; // Return unchanged state - API call is async
    });
  }, [matchId, currentInning, calculationMode]);

  // Handle batsman stat input change (local state only) - memoized to prevent re-renders
  const handleBatsmanStatInputChange = useCallback((id: number, field: keyof Batsman, value: string) => {
    setBatsmen(prev => prev.map(b => {
      if (b.id === id) {
        // Store original value on first change
        const key = `batsman-${id}-${field}`;
        if (!originalValuesRef.current.has(key)) {
          originalValuesRef.current.set(key, String(b[field] || ''));
        }
        return { ...b, [field]: value };
      }
      return b;
    }));
  }, []);

  // Handle batsman stat save on Enter key - memoized to prevent re-renders
  const handleBatsmanStatSave = useCallback(async (id: number, field: keyof Batsman, value: string) => {
    const key = `batsman-${id}-${field}`;
    const originalValue = originalValuesRef.current.get(key);

    // Only save if value actually changed
    if (originalValue !== undefined && originalValue === value) {
      return; // No change, don't save
    }

    setBatsmen(prev => {
      const batsman = prev.find(b => b.id === id);
      if (!batsman || !batsman._playerId) return prev;

      // Clear the original value since we're saving
      originalValuesRef.current.delete(key);

      // Save to API (async, don't block UI - no saving state to avoid affecting other buttons)
      const saveToAPI = async () => {
        try {
          const updateDto: UpdateBatsmanDto = {
            calculationMode,
          };

          if (field === 'runs') {
            updateDto.runs = value === '' ? 0 : parseInt(value) || 0;
          } else if (field === 'balls') {
            updateDto.balls = value === '' ? 0 : parseInt(value) || 0;
          } else if (field === 'fours') {
            updateDto.fours = value === '' ? 0 : parseInt(value) || 0;
          } else if (field === 'sixes') {
            updateDto.sixes = value === '' ? 0 : parseInt(value) || 0;
          } else if (field === 'to') {
            updateDto.to = value;
          } else if (field === 'tr') {
            updateDto.tr = value;
          } else if (field === 'dismissal') {
            updateDto.dismissalText = value;
          } else if (field === 'status') {
            updateDto.isOut = value === 'out';
            updateDto.isOnStrike = value === 'batting';
          }

          await LiveMatchService.updateBatsman(
            matchId,
            parseInt(currentInning),
            batsman._playerId,
            updateDto
          );
          toast.success('Batsman stats updated');
        } catch (error: any) {
          console.error('Failed to update batsman:', error);
          toast.error(error.response?.data?.userMessage || 'Failed to update batsman stats');
        }
      };

      saveToAPI();
      return prev; // Return unchanged state - API call is async
    });
  }, [matchId, currentInning, calculationMode]);

  const toggleBowlerScorecard = async (id: number) => {
    const bowler = bowlers.find(b => b.id === id);
    if (!bowler || !bowler._playerId) {
      toast.error('Player not found');
      return;
    }

    const newIsVisible = !bowler.inScorecard;

    // Update local state immediately for better UX
    setBowlers(prev => prev.map(b => b.id === id ? { ...b, inScorecard: newIsVisible } : b));

    // Save to database via API (async, don't block UI - no saving state to avoid affecting other buttons)
    (async () => {
      try {
        await LiveMatchService.updateBowler(
          matchId,
          parseInt(currentInning),
          bowler._playerId,
          {
            isVisible: newIsVisible,
            calculationMode,
          }
        );

        // Don't reload all data, just keep the updated local state
        toast.success(`${bowler.name} ${newIsVisible ? 'added to' : 'removed from'} scorecard`);
      } catch (error: any) {
        console.error('Failed to update bowler visibility:', error);
        toast.error(error?.response?.data?.userMessage || 'Failed to update bowler visibility');
        // Revert local state on error
        setBowlers(prev => prev.map(b => b.id === id ? { ...b, inScorecard: !newIsVisible } : b));
      }
    })();
  };

  const toggleBatsmanScorecard = async (id: number) => {
    const batsman = batsmen.find(b => b.id === id);
    if (!batsman || !batsman._playerId) {
      toast.error('Player not found');
      return;
    }

    const newIsVisible = !batsman.inScorecard;

    // Update local state immediately for better UX
    setBatsmen(prev => prev.map(b => b.id === id ? { ...b, inScorecard: newIsVisible } : b));

    // Save to database via API (async, don't block UI - no saving state to avoid affecting other buttons)
    (async () => {
      try {
        await LiveMatchService.updateBatsman(
          matchId,
          parseInt(currentInning),
          batsman._playerId,
          {
            isVisible: newIsVisible,
            calculationMode,
          }
        );

        // Don't reload all data, just keep the updated local state
        toast.success(`${batsman.name} ${newIsVisible ? 'added to' : 'removed from'} scorecard`);
      } catch (error: any) {
        console.error('Failed to update batsman visibility:', error);
        toast.error(error?.response?.data?.userMessage || 'Failed to update batsman visibility');
        // Revert local state on error
        setBatsmen(prev => prev.map(b => b.id === id ? { ...b, inScorecard: !newIsVisible } : b));
      }
    })();
  };

  const setBatsmanStatus = async (id: number, status: 'batting' | 'out' | 'yetToBat') => {
    const batsman = batsmen.find(b => b.id === id);
    if (!batsman || !batsman._playerId) return;

    const updatedBatsmen = batsmen.map(b => b.id === id ? { ...b, status } : b);
    setBatsmen(updatedBatsmen);

    // Save to API
    try {
      const updateDto: UpdateBatsmanDto = {
        calculationMode,
        isOut: status === 'out',
        isOnStrike: status === 'batting',
      };

      await LiveMatchService.updateBatsman(
        matchId,
        parseInt(currentInning),
        batsman._playerId,
        updateDto
      );
      toast.success('Batsman status updated');
      await loadLiveData(true);
    } catch (error: any) {
      console.error('Failed to update batsman status:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to update batsman status');
    }
  };

  const handleLastWicketStatChange = (field: string, value: string) => {
    setLastWicket({ ...lastWicket, [field]: field === 'to' || field === 'name' || field === 'dismissal' || field === 'tr' ? value : (parseInt(value) || 0) });
  };

  const handleLastWicketStatSave = async (field: string, value: string) => {
    if (!matchId || !lastWicket._playerId) return;

    try {
      setSaving(true);
      const val = field === 'to' || field === 'name' || field === 'dismissal' || field === 'tr' ? value : (parseInt(value) || 0);

      const updateDto: UpdateBatsmanDto = {
        calculationMode,
        [field === 'dismissal' ? 'dismissalText' : field]: val
      };

      // Update the batsman scorecard
      await LiveMatchService.updateBatsman(
        matchId,
        parseInt(currentInning),
        lastWicket._playerId,
        updateDto
      );

      // Explicitly update the inning's lastWicket for direct overrides
      const updatedLastWicket = {
        ...lastWicket,
        [field]: val
      };

      await LiveMatchService.updateInning(matchId, parseInt(currentInning), {
        lastWicket: {
          name: updatedLastWicket.name,
          dismissal: updatedLastWicket.dismissal,
          runs: Number(updatedLastWicket.runs),
          balls: Number(updatedLastWicket.balls),
          fours: Number(updatedLastWicket.fours),
          sixes: Number(updatedLastWicket.sixes),
          to: updatedLastWicket.to,
          tr: updatedLastWicket.tr,
          playerId: updatedLastWicket._playerId
        }
      });

      toast.success('Last wicket updated');
      await loadLiveData(true);
    } catch (error: any) {
      console.error('Failed to update last wicket:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to update last wicket');
    } finally {
      setSaving(false);
    }
  };

  const setAsLastWicket = async (batsmanId: number) => {
    const batsman = batsmen.find(b => b.id === batsmanId);
    if (!batsman || !matchId) return;

    try {
      setSaving(true);
      await LiveMatchService.updateInning(matchId, parseInt(currentInning), {
        lastWicket: {
          name: batsman.name,
          dismissal: batsman.dismissal || '',
          runs: Number(batsman.runs),
          balls: Number(batsman.balls),
          fours: Number(batsman.fours),
          sixes: Number(batsman.sixes),
          to: batsman.to || '',
          tr: String(batsman.tr || 0),
          playerId: batsman._playerId
        }
      });
      toast.success(`${batsman.name} set as last wicket`);
      await loadLiveData(true);
    } catch (error: any) {
      console.error('Failed to set last wicket:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to set last wicket');
    } finally {
      setSaving(false);
    }
  };



  // Update scoreboard (runs, wickets, overs)
  const handleUpdateScoreboard = async () => {
    if (!matchId) return;
    try {
      setSaving(true);
      await LiveMatchService.updateLiveStatus(matchId, {
        score: `${runs}/${wickets}`,
        overs: overs,
      });
      toast.success('Scoreboard updated successfully');
      await loadLiveData(true);
    } catch (error: any) {
      console.error('Failed to update scoreboard:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to update scoreboard');
    } finally {
      setSaving(false);
    }
  };

  // Update current ball
  const handleUpdateCurrentBall = async () => {
    if (!matchId) return;
    try {
      setSaving(true);
      await LiveMatchService.updateLiveStatus(matchId, {
        currentBall: parseInt(currentBall) || 0,
        currentInning: parseInt(currentInning),
      });
      toast.success('Current ball updated');
      await loadLiveData(true);
    } catch (error: any) {
      console.error('Failed to update current ball:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to update current ball');
    } finally {
      setSaving(false);
    }
  };

  // Update match status
  const handleMatchStatusChange = async (status: string) => {
    if (!matchId) return;
    try {
      setSaving(true);
      // Update match status via MatchService
      const statusMap: Record<string, string> = {
        'not-started': 'scheduled',
        'live': 'live',
        'completed': 'completed',
      };
      await MatchService.updateMatch(matchId, {
        status: statusMap[status] || status,
      } as any);
      setMatchStatus(status);
      toast.success('Match status updated');
    } catch (error: any) {
      console.error('Failed to update match status:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to update match status');
    } finally {
      setSaving(false);
    }
  };

  // Update innings
  const handleInningChange = async (inning: string) => {
    if (!matchId) return;
    try {
      setSaving(true);
      await LiveMatchService.updateLiveStatus(matchId, {
        currentInning: parseInt(inning),
      });
      setCurrentInning(inning);
      toast.success('Inning updated');
      await loadLiveData(true);
      await loadAllInnings();
    } catch (error: any) {
      console.error('Failed to update inning:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to update inning');
    } finally {
      setSaving(false);
    }
  };

  // Parse toss text to extract team information
  const parseTossAndGetTeams = (tossText: string): { battingTeamId: string; bowlingTeamId: string; winnerId: string; elected: 'bat' | 'bowl' } | null => {
    if (!tossText || !team1Id || !team2Id) return null;

    const text = tossText.toLowerCase();
    const team1NameLower = team1Name.toLowerCase();
    const team2NameLower = team2Name.toLowerCase();

    let winnerId = '';
    if (text.includes(team1NameLower)) winnerId = team1Id;
    else if (text.includes(team2NameLower)) winnerId = team2Id;
    else return null;

    let elected: 'bat' | 'bowl';
    if (text.includes('bat')) elected = 'bat';
    else if (text.includes('bowl') || text.includes('field')) elected = 'bowl';
    else return null;

    const battingTeamId = elected === 'bat' ? winnerId : (winnerId === team1Id ? team2Id : team1Id);
    const bowlingTeamId = elected === 'bat' ? (winnerId === team1Id ? team2Id : team1Id) : winnerId;

    return { battingTeamId, bowlingTeamId, winnerId, elected };
  };

  // Generic handler for boolean toggles
  const updateControlState = async (key: string, value: boolean, label: string, stateSetter: (val: boolean) => void) => {
    console.log(`[updateControlState] Attempting to update ${label} (${key}) to ${value}`);
    if (!matchId) {
      console.error('[updateControlState] Missing matchId');
      return;
    }

    try {
      // Optimistic update
      stateSetter(value);

      console.log(`[updateControlState] Calling API for ${key}...`);
      // Update DB
      const result = await LiveMatchService.updateLiveStatus(matchId, {
        [key]: value
      });
      console.log(`[updateControlState] API success for ${key}:`, result);
      // toast.success(`${label} updated`);
    } catch (error: any) {
      console.error(`Failed to update ${label}:`, error);
      // Revert on error
      stateSetter(!value);
      toast.error(error.response?.data?.userMessage || `Failed to update ${label}`);
    }
  };

  const togglePowerPlay = () => {
    updateControlState('powerPlay', !powerPlayOn, 'Power Play', setPowerPlayOn);
  };


  // Update toss info
  const handleUpdateToss = async () => {
    if (!tossInfo.trim()) {
      toast.error('Please enter toss information');
      return;
    }

    const teams = parseTossAndGetTeams(tossInfo);
    if (!teams) {
      toast.error('Could not parse team information from toss text. Please check the format.');
      return;
    }

    // Show confirmation dialog
    setPendingTossInfo(tossInfo);
    setPendingTeams(teams);
    setShowTossConfirm(true);
  };

  const handleUpdateTossInfo = async () => {
    if (!tossInfo.trim()) {
      toast.error('Please enter toss information');
      return;
    }

    const teams = parseTossAndGetTeams(tossInfo);
    if (!teams) {
      toast.error('Could not parse team information from toss text. Please check the format.');
      return;
    }

    // Show confirmation dialog
    setPendingTossInfo(tossInfo);
    setPendingTeams(teams);
    setShowTossConfirm(true);
  };

  // Confirm toss update
  const confirmTossUpdate = async () => {
    if (!pendingTossInfo || !pendingTeams || !matchId) return;

    try {
      setSaving(true);

      // Update toss in database
      const updateTossDto: UpdateTossDto = {
        tossText: pendingTossInfo,
        winnerId: pendingTeams.winnerId,
        elected: pendingTeams.elected,
      };

      await LiveMatchService.updateToss(matchId, updateTossDto);

      // Update live status with batting and bowling teams
      await LiveMatchService.updateLiveStatus(matchId, {
        battingTeamId: pendingTeams.battingTeamId,
        bowlingTeamId: pendingTeams.bowlingTeamId,
      });

      // Update local state
      setTossInfo(pendingTossInfo);
      const battingTeamName = pendingTeams.battingTeamId === team1Id ? team1Name : team2Name;
      setCurrentBattingTeam(battingTeamName);
      setCurrentBattingTeamId(pendingTeams.battingTeamId);
      setCurrentBowlingTeamId(pendingTeams.bowlingTeamId);

      // Reload live data
      await loadLiveData(true);

      toast.success('Toss information and teams updated successfully');
      setShowTossConfirm(false);
      setPendingTossInfo('');
      setPendingTeams(null);
    } catch (error: any) {
      console.error('Failed to update toss:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to update toss');
    } finally {
      setSaving(false);
    }
  };

  // Update extras
  const handleUpdateExtras = async () => {
    if (!matchId) return;
    try {
      setSaving(true);
      await LiveMatchService.updateInning(matchId, parseInt(currentInning), {
        extras: extras.ex,
        wides: extras.w,
        noBalls: extras.nb,
        legByes: extras.lb,
        byes: extras.b,
        penalties: extras.p,
        calculationMode,
      });
      toast.success('Extras updated');
      await loadLiveData(true);
    } catch (error: any) {
      console.error('Failed to update extras:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to update extras');
    } finally {
      setSaving(false);
    }
  };

  // Update comment 2
  const handleUpdateComment2 = async () => {
    if (!matchId) return;
    try {
      setSaving(true);
      await LiveMatchService.updateLiveStatus(matchId, { comment2 });
      toast.success('Comment 2 updated');
    } catch (error: any) {
      console.error('Failed to update comment 2:', error);
      toast.error('Failed to update comment 2');
    } finally {
      setSaving(false);
    }
  };

  // Update comment SV3/SV4
  const handleUpdateCommentSV3SV4 = async () => {
    if (!matchId) return;
    try {
      setSaving(true);
      await LiveMatchService.updateLiveStatus(matchId, { comment3: commentSV3SV4 });
      toast.success('Comment updated');
    } catch (error: any) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setSaving(false);
    }
  };

  // Update This Over
  const handleUpdateThisOver = async () => {
    if (!matchId) return;
    try {
      setSaving(true);

      // Get selected bowler
      const selectedBowler = bowlers.find(b => b.isSelected);
      if (!selectedBowler || !selectedBowler._playerId) {
        toast.error('Please select a bowler first');
        return;
      }

      const overNumber = parseInt(currentBall) || 1;

      // Save over summary to database
      await LiveMatchService.upsertOverSummary(
        matchId,
        parseInt(currentInning),
        overNumber,
        selectedBowler._playerId,
        thisOver,
      );

      // Update live status with current ball
      await LiveMatchService.updateLiveStatus(matchId, {
        currentBall: parseInt(currentBall) || 0,
        currentInning: parseInt(currentInning),
      });

      toast.success('This over updated and saved');
      // Reset this over
      setThisOver(["0", "0", "0", "0", "0", "0"]);
      setCurrentBall(String((parseInt(currentBall) || 0) + 1));

      // Reload over history
      await loadOverHistory();
    } catch (error: any) {
      console.error('Failed to update this over:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to update this over');
    } finally {
      setSaving(false);
    }
  };

  // Finish the match
  const handleFinishMatch = async () => {
    if (!matchId) return;
    if (!window.confirm('Are you sure you want to finish this match? This will set the match status to completed.')) {
      return;
    }
    try {
      setSaving(true);
      await MatchService.updateMatch(matchId, {
        status: 'completed',
      } as any);
      setMatchStatus('completed');
      toast.success('Match finished successfully');
    } catch (error: any) {
      console.error('Failed to finish match:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to finish match');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading live match data...</p>
        </div>
      </div>
    );
  }

  // Initialize live status if it doesn't exist
  const initializeLiveStatus = async () => {
    if (!matchId) {
      toast.error('Missing match information');
      return;
    }
    try {
      setSaving(true);
      // Create initial live status WITHOUT setting teams automatically
      // Teams should be set manually by user or from toss result
      await LiveMatchService.updateLiveStatus(matchId, {
        currentInning: 1,
        currentOver: 0,
        currentBall: 0,
        // Teams are NOT set automatically - user must set them manually
        score: '0/0',
        overs: '0.0',
        balls: 0,
      });
      toast.success('Live status initialized. Please set batting/bowling teams manually.');
      await loadLiveData(true);
    } catch (error: any) {
      console.error('Failed to initialize live status:', error);
      toast.error(error?.response?.data?.userMessage || 'Failed to initialize live status');
    } finally {
      setSaving(false);
    }
  };


  // Add player to scorecard (batsman or bowler)
  const addPlayerToScorecard = async (playerId: string, playerName: string, type: 'batsman' | 'bowler') => {
    if (!matchId || !playerId) return;
    try {
      setSaving(true);

      if (type === 'batsman') {
        // Get current batting position by counting players already in scorecard
        const nextPosition = batsmen.filter(b => b.inScorecard).length + 1;
        await LiveMatchService.updateBatsman(matchId, parseInt(currentInning), playerId, {
          battingPosition: nextPosition,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          isOnStrike: (batsmen.filter(b => b.inScorecard).length === 0), // First batsman is on strike
          calculationMode,
          isVisible: true,
        });
        toast.success(`${playerName} added as batsman`);
      } else {
        // Get current bowling order by counting players already in scorecard
        const nextOrder = bowlers.filter(b => b.inScorecard).length + 1;
        await LiveMatchService.updateBowler(matchId, parseInt(currentInning), playerId, {
          bowlingOrder: nextOrder,
          overs: 0,
          completedOvers: 0,
          balls: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
          calculationMode,
          isVisible: true,
        });
        toast.success(`${playerName} added as bowler`);
      }

      await loadLiveData(true);
      setShowAddPlayerModal(false);
      setAddPlayerType(null);
    } catch (error: any) {
      console.error('Failed to add player to scorecard:', error);
      toast.error(error?.response?.data?.userMessage || 'Failed to add player to scorecard');
    } finally {
      setSaving(false);
    }
  };

  // Open add player modal
  const openAddPlayerModal = (type: 'batsman' | 'bowler') => {
    setAddPlayerType(type);
    setShowAddPlayerModal(true);
  };

  // Show message if no data is available
  const hasNoData = !liveStatus;
  if (hasNoData && !loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Live Status Not Initialized</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No live match data has been loaded yet. This could mean:
            <ul className="text-left mt-2 space-y-1 text-sm">
              <li>• Backend services may not be running</li>
              <li>• Live status hasn't been initialized for this match</li>
              <li>• The match doesn't have scorecard data yet</li>
            </ul>
          </p>
          <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-2">
              <Button onClick={loadLiveData} variant="outline" disabled={saving}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading Data
              </Button>
              {!liveStatus && (
                <Button onClick={initializeLiveStatus} disabled={saving}>
                  Initialize Live Status
                </Button>
              )}
            </div>
            {liveStatus && (batsmen.length === 0 || bowlers.length === 0) && (
              <div className="text-center mt-4 text-slate-500 text-sm">
                <p>Use the "Add Batsman" and "Add Bowler" buttons in the scorecard sections to add players manually</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-auto">
      {/* Top Controls Bar */}
      <div className="flex flex-col gap-2 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-sm">
        {/* Calculation Mode Toggle */}
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-xs font-semibold">Calculation Mode:</Label>
          <Select value={calculationMode} onValueChange={(value: 'auto' | 'manual') => setCalculationMode(value)}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <Checkbox
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={(checked: boolean | string) => setAutoRefresh(checked === true)}
              />
              <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">Auto Refresh</Label>
            </div>
            {matchStatus === 'live' && !loading && !saving && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 mr-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">⌨️ Keyboard Scoring</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={loadLiveData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full">
          {/* Row 1: Toss (Left Column) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 w-10">Toss:</span>
              <div className="flex-1 min-w-0">
                <Select value={tossInfo} onValueChange={(value) => setTossInfo(value)}>
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Select Toss" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={`${team1Name} won the toss and opt to bowl`}>{team1Name} won the toss and opt to bowl</SelectItem>
                    <SelectItem value={`${team1Name} won the toss and opt to bat`}>{team1Name} won the toss and opt to bat</SelectItem>
                    <SelectItem value={`${team2Name} won the toss and opt to bowl`}>{team2Name} won the toss and opt to bowl</SelectItem>
                    <SelectItem value={`${team2Name} won the toss and opt to bat`}>{team2Name} won the toss and opt to bat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input value={tossInfo} onChange={(e) => setTossInfo(e.target.value)} className="h-8 flex-1 min-w-0" />
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                onClick={handleUpdateToss}
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>

          {/* Middle: Odds/Powerplay (Center Column) */}
          <div className="flex flex-col gap-2">

            {/* match status and innings */}
            <div className="flex items-center gap-2 w-full">
              <Select value={matchStatus} onValueChange={handleMatchStatusChange}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Upcoming</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Finished</SelectItem>
                </SelectContent>
              </Select>

              {/* innings select */}
              <div className="flex items-center gap-1">
                <Label className="whitespace-nowrap">Inn:</Label>
                <Select value={currentInning} onValueChange={handleInningChange}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Inning 1</SelectItem>
                    <SelectItem value="2">Inning 2</SelectItem>
                    {matchFormat === 'test' && (
                      <>
                        <SelectItem value="3">Inning 3</SelectItem>
                        <SelectItem value="4">Inning 4</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* power play and odds history */}
            <div className="flex items-center gap-2 w-full flex-wrap">
              <Button size="sm" className={`h-6 px-4 w-40 rounded-full ${powerPlayOn ? "bg-green-700 hover:bg-green-800" : "bg-red-700 hover:bg-red-800"}`} onClick={togglePowerPlay}>
                {powerPlayOn ? "Power Play On" : "Power Play Off"}
              </Button>

              <div className="flex items-center gap-1 ml-2">
                <Label className="whitespace-nowrap text-xs">Odds History:</Label>
                <Checkbox
                  checked={isNew}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateControlState('isNew', checked === true, 'Is New', setIsNew)}
                  className="w-3 h-3"
                />
              </div>

              <div className="flex items-center gap-1 ml-2">
                <Label className="whitespace-nowrap text-xs">No Scorecards:</Label>
                <Checkbox
                  checked={noScorecards}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateControlState('noScorecards', checked === true, 'No Scorecards', setNoScorecards)}
                  className="w-3 h-3"
                />
              </div>

              <div className="flex items-center gap-1 ml-2">
                <Label className="whitespace-nowrap text-xs">View Mode:</Label>
                <Checkbox
                  checked={viewMode}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateControlState('viewMode', checked === true, 'View Mode', setViewMode)}
                  className="w-3 h-3"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Match Controls (Right Column) */}
          <div className="flex flex-col gap-2 ">

            {/* showing and dls buttons */}
            <div className="flex items-center gap-2 w-full justify-end">
              <Button size="sm" className={`h-6 px-6 w-32 rounded-full ${showing ? "bg-green-700 hover:bg-green-800" : "bg-red-700 hover:bg-red-800"}`} onClick={() => updateControlState('isNotShowing', !showing, 'Not Showing', setShowing)}>
                {showing ? "Showing" : "Not Showing"}
              </Button>

              <Button size="sm" className={`h-6 px-6 w-32 rounded-full ${dls ? "bg-green-700 hover:bg-green-800" : "bg-red-700 hover:bg-red-800"}`} onClick={() => updateControlState('dls', !dls, 'DLS', setDls)}>
                DLS {dls ? "On" : "Off"}
              </Button>
            </div>

            {/* commentory cont */}
            <div className="flex items-center gap-2 w-full justify-end">
              <div className="flex items-center gap-1 border px-2 py-0.5 rounded text-xs bg-slate-50">
                <span className="text-slate-600">No Commentary</span>
                <Checkbox
                  checked={noCommentry}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateControlState('noCommentry', checked === true, 'No Commentary', setNoCommentry)}
                  className="w-3 h-3"
                />
              </div>

              <div className="flex items-center gap-1 border px-2 py-0.5 rounded text-xs bg-slate-50">
                <span>On OC</span>
                <Checkbox
                  checked={onOC}
                  onCheckedChange={(checked: boolean | 'indeterminate') => updateControlState('onOC', checked === true, 'On OC', setOnOC)}
                  className="w-3 h-3"
                />
              </div>
            </div>
          </div>
        </div>


        {/* Row 3: Score & Odds Banner */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">

          {/* Left: Score */}
          {/* Left: Score */}
          <div className="flex items-center gap-4">
            {/* Team 2 - Left Side */}
            <div
              className={`flex items-center gap-2 rounded-br-none rounded-full pr-6 pl-2 py-2 cursor-pointer transition-all ${currentBattingTeamId === team2Id ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              onClick={() => handleTeamClick(team2Name, team2Id)}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                {team2Name.charAt(0)}
              </div>
              <div className="leading-tight">
                <div className={`font-bold text-sm ${currentBattingTeamId === team2Id ? '' : 'text-slate-700 dark:text-slate-300'}`}>{team2Name}</div>
                {getTeamScoreDisplay(team2Id)}
              </div>
            </div>

            {/* Team 1 - Right Side */}
            <div
              className={`flex items-center gap-2 rounded-bl-none rounded-full pr-2 pl-6 py-2 cursor-pointer transition-all ${currentBattingTeamId === team1Id ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              onClick={() => handleTeamClick(team1Name, team1Id)}
            >
              <div className="text-right">
                <div className={`text-sm font-medium ${currentBattingTeamId === team1Id ? '' : 'text-slate-600'}`}>{team1Name}</div>
                {getTeamScoreDisplay(team1Id)}
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs">
                {team1Name.charAt(0)}
              </div>
            </div>

            <ConfirmDialog
              open={showTeamConfirm}
              onOpenChange={setShowTeamConfirm}
              title="Change Batting Team?"
              description={`Are you sure you want to switch the batting team to ${pendingTeam}?`}
              onConfirm={confirmTeamSwitch}
              confirmLabel="Switch Team"
            />

            <ConfirmDialog
              open={showTossConfirm}
              onOpenChange={setShowTossConfirm}
              title="Update Toss Information?"
              description={
                pendingTeams
                  ? `This will update the toss information and set:\n• Batting Team: ${pendingTeams.battingTeamId === team1Id ? team1Name : team2Name}\n• Bowling Team: ${pendingTeams.bowlingTeamId === team1Id ? team1Name : team2Name}\n\nAre you sure you want to proceed?`
                  : 'This will update the toss information and set the batting and bowling teams. Are you sure you want to proceed?'
              }
              onConfirm={confirmTossUpdate}
              confirmLabel="Update Toss"
            />
          </div>

          {/* Middle: Odds */}
          <div className={`cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-1 ${editOddsMode ? 'ring-2 ring-blue-500 bg-white dark:bg-slate-900' : ''}`}
            onClick={handleOddsClick}
          >
            {editOddsMode ? (
              <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-[60px_1fr_auto] gap-2 items-center text-sm border-2 border-dotted border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded">
                  {/* Col 1: Labels */}
                  <div className="flex flex-col gap-2 font-medium text-slate-600 dark:text-slate-400 justify-center">
                    <div className="h-6 flex items-center">Odds:</div>
                    <div className="h-6 flex items-center">Session:</div>
                    <div className="h-6 flex items-center">Lambi:</div>
                  </div>

                  {/* Col 2: Values (Editable) */}
                  <div className="flex flex-col gap-2 justify-center min-w-0">
                    {/* Team Select */}
                    <div className="h-6 mb-2">
                      <Select value={editingOdds.team || undefined} onValueChange={(v) => setEditingOdds({ ...editingOdds, team: v })}>
                        <SelectTrigger className="h-6 text-xs w-full px-2 bg-white dark:bg-slate-950 dark:border-slate-700"><SelectValue placeholder="Select Team" /></SelectTrigger>
                        <SelectContent>
                          {team1Name && <SelectItem value={team1Name}>{team1Name}</SelectItem>}
                          {team2Name && <SelectItem value={team2Name}>{team2Name}</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Session Over */}
                    <Input
                      type="number"
                      className="h-6 w-full text-xs px-2 bg-white dark:bg-slate-950 dark:border-slate-700"
                      placeholder="Over"
                      value={editingOdds.session || ''}
                      onChange={(e) => setEditingOdds({ ...editingOdds, session: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                    />
                    {/* Lambi Over */}
                    <Input
                      type="number"
                      className="h-6 w-full text-xs px-2 bg-white dark:bg-slate-950 dark:border-slate-700"
                      placeholder="Over"
                      value={editingOdds.lambi || ''}
                      onChange={(e) => setEditingOdds({ ...editingOdds, lambi: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {/* Col 3: Inputs (Blue/Red) */}
                  <div className="grid grid-cols gap-1 text-center">
                    {/* Odds */}
                    <div className="flex items-center gap-1">
                      <Input type="number" className="h-6 w-12 bg-blue-100 text-blue-900 border-blue-300 px-1 text-center font-bold text-xs" value={editingOdds.oddsBlue || ''} onChange={(e) => setEditingOdds({ ...editingOdds, oddsBlue: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })} />
                      <span>+</span>
                      <Select value={editingOdds.oddsRed && editingOdds.oddsRed > 0 ? editingOdds.oddsRed.toString() : undefined} onValueChange={(v) => setEditingOdds({ ...editingOdds, oddsRed: parseInt(v) || 0 })}>
                        <SelectTrigger className="h-6 text-xs text-white w-12 px-2 bg-slate-900 border-slate-700 font-bold"><SelectValue placeholder="0" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Session */}
                    <div className="flex items-center gap-1">
                      <Input type="number" className="h-6 w-12 bg-blue-100 text-blue-900 border-blue-300 px-1 text-center font-bold text-xs" value={editingOdds.sessionBlue || ''} onChange={(e) => setEditingOdds({ ...editingOdds, sessionBlue: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })} />
                      <span>+</span>
                      <Select value={editingOdds.sessionRed && editingOdds.sessionRed > 0 ? editingOdds.sessionRed.toString() : undefined} onValueChange={(v) => setEditingOdds({ ...editingOdds, sessionRed: parseInt(v) || 0 })}>
                        <SelectTrigger className="h-6 text-xs text-white w-12 px-2 bg-slate-900 border-slate-700 font-bold"><SelectValue placeholder="0" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lambi */}
                    <div className="flex items-center gap-1">
                      <Input type="number" className="h-6 w-12 bg-blue-100 text-blue-900 border-blue-300 px-1 text-center font-bold text-xs" value={editingOdds.lambiBlue || ''} onChange={(e) => setEditingOdds({ ...editingOdds, lambiBlue: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })} />
                      <span>+</span>
                      <Select value={editingOdds.lambiRed && editingOdds.lambiRed > 0 ? editingOdds.lambiRed.toString() : undefined} onValueChange={(v) => setEditingOdds({ ...editingOdds, lambiRed: parseInt(v) || 0 })}>
                        <SelectTrigger className="h-6 text-xs text-white w-12 px-2 bg-slate-900 border-slate-700 font-bold"><SelectValue placeholder="0" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button size="sm" className="h-6 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleUpdateOdds}>Update</Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={handleCancelOdds}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-[60px_1fr_auto] gap-2 items-center text-sm border-2 border-dotted border-blue-200 p-2 rounded">
                <div className="space-y-1 font-medium text-slate-600">
                  <div>Odds:</div>
                  <div>Session:</div>
                  <div>Lambi:</div>
                </div>
                <div className="space-y-1 text-slate-800 dark:text-slate-200">
                  <div>{odds.team}</div>
                  <div>{odds.session}</div>
                  <div>{odds.lambi}</div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-white font-bold text-center">
                  <div className="bg-[#004d99] rounded px-2 py-0.5 w-12">{odds.oddsBlue}</div>
                  <div className="bg-[#b30000] rounded px-2 py-0.5 w-12">{odds.oddsRed}</div>

                  <div className="bg-[#004d99] rounded px-2 py-0.5 w-12">{odds.sessionBlue}</div>
                  <div className="bg-[#b30000] rounded px-2 py-0.5 w-12">{odds.sessionRed}</div>

                  <div className="bg-[#004d99] rounded px-2 py-0.5 w-12">{odds.lambiBlue}</div>
                  <div className="bg-[#b30000] rounded px-2 py-0.5 w-12">{odds.lambiRed}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-right text-slate-500">
              <textarea
                className="w-full h-12 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                value={tossInfo}
                onChange={(e) => setTossInfo(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7"
              onClick={handleUpdateTossInfo}
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update'}
            </Button>
          </div>

        </div>

        {/* Row 4: This Over History */}
        {/* Row 4: This Over History */}
        <div className="flex flex-col gap-2 mt-2 border-t pt-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 mx-4">
              <span className="font-bold text-sm text-nowrap">This Over:</span>
              <Input
                className="w-8 h-8 rounded-full bg-red-900 text-white flex items-center justify-center text-xs font-bold text-center p-0 border-none focus:ring-1 focus:ring-red-500"
                value={currentBall}
                onChange={(e) => setCurrentBall(e.target.value)}
              />
              <div className="flex items-center gap-1">
                {thisOver.map((val, index) => (
                  <input
                    key={index}
                    className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
                    value={val}
                    onChange={(e) => handleThisOverChange(index, e.target.value)}
                  />
                ))}
              </div>
            </div>

            {/* History Blocks */}
            <div className="flex-1 flex gap-1 overflow-x-auto w-full">
              {overHistory.map((overData, overIndex) => (
                <div key={overIndex} className="flex gap-1 border border-slate-300 dark:border-slate-600 rounded px-1 bg-slate-50 dark:bg-slate-900 flex-1 min-w-0">
                  <input
                    className="w-8 border-r border-slate-300 dark:border-slate-600 pr-1 mr-1 text-xs font-bold text-slate-500 dark:text-slate-400 bg-transparent text-center focus:outline-none"
                    value={overData.over}
                    onChange={(e) => handleOverNumberChange(overIndex, e.target.value)}
                  />
                  <div className="flex gap-1 flex-1 ">
                    {overData.runs.map((run, ballIndex) => (
                      <input
                        key={ballIndex}
                        className={`w-6 h-6 rounded-full text-white text-[10px] font-bold text-center focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer ${activeBall?.overIndex === overIndex && activeBall?.ballIndex === ballIndex ? 'bg-red-700 ring-2 ring-red-400' : 'bg-red-900'}`}
                        value={run}
                        onChange={(e) => handleOverRunChange(overIndex, ballIndex, e.target.value)}
                        onClick={() => setActiveBall({ overIndex, ballIndex })}
                        onFocus={() => setActiveBall({ overIndex, ballIndex })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Update/Cancel Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              className="h-7 w-40 bg-gray-600 hover:bg-gray-700"
              onClick={handleUpdateThisOver}
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => {
                setThisOver(["0", "0", "0", "0", "0", "0"]);
                setCurrentBall("1");
              }}
            >
              Reset
            </Button>
          </div>
        </div>

      </div>

      {/* Main Content Areas */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-[300px_1fr_1fr] gap-4">

        {/* Column 1: Scoreboard Controls */}
        <div className="flex flex-col gap-4">
          <div className="rounded-t-lg overflow-hidden border border-blue-800">
            <div className="bg-blue-800 text-white px-3 py-2 flex items-center gap-2">
              {/* Icon placeholder */}
              <span className="w-4 h-4 rounded-full border border-white"></span>
              <span className="font-bold">Scoreboard</span>
            </div>
            <div className="bg-blue-100 dark:bg-slate-800 p-4 flex flex-col gap-3">
              <Input
                className="text-center text-2xl font-bold h-12 bg-white dark:bg-slate-900"
                value={currentBall}
                onChange={(e) => setCurrentBall(e.target.value)}
              />
              <Button
                className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600"
                onClick={handleUpdateCurrentBall}
                disabled={saving || !currentBattingTeamId}
              >
                Ball Update
              </Button>


              <div className="grid grid-cols-[60px_1fr] gap-2 items-center mt-2">
                <Label className="text-right">Runs:</Label>
                <Input className="h-8 bg-white dark:bg-slate-900 text-right" value={runs} onChange={(e) => setRuns(e.target.value)} />

                <Label className="text-right">Wickets:</Label>
                <Input className="h-8 bg-white dark:bg-slate-900 text-right" value={wickets} onChange={(e) => setWickets(e.target.value)} />

                <Label className="text-right">Overs:</Label>
                <Input className="h-8 bg-white dark:bg-slate-900 text-right" value={overs} onChange={(e) => setOvers(e.target.value)} />
              </div>
              <Button variant="outline" className="w-full">Update</Button>

              <div className="mt-2">
                <Input placeholder="Comment 2" className="h-8 mb-2 bg-white dark:bg-slate-900" value={comment2} onChange={(e) => setComment2(e.target.value)} />
                <Button
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={handleUpdateScoreboard}
                  disabled={saving || !currentBattingTeamId}
                >
                  {saving ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </div>

          {/* Sessions Table (placed below Scoreboard in col 1 as per space, or could be separate) */}
          <div className="border rounded overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 dark:bg-slate-800">
                  <TableHead className="h-8 p-1 text-center text-xs font-bold text-slate-700">Session</TableHead>
                  <TableHead className="h-8 p-1 text-center text-xs font-bold text-slate-700">Open</TableHead>
                  <TableHead className="h-8 p-1 text-center text-xs font-bold text-slate-700">Pass</TableHead>
                  <TableHead className="h-8 p-1 text-center text-xs font-bold text-slate-700">Min</TableHead>
                  <TableHead className="h-8 p-1 text-center text-xs font-bold text-slate-700">Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map(sess => (
                  <TableRow key={sess.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 border-b last:border-0 border-slate-200 dark:border-slate-800">
                    <TableCell className="p-1 text-center text-xs dark:text-slate-300">
                      <Input className="h-6 w-full px-1 text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded py-0.5" value={sess.session} onChange={(e) => handleSessionChange(sess.id, 'session', e.target.value)} />
                    </TableCell>
                    <TableCell className="p-1 text-center text-xs dark:text-slate-300">
                      <Input className="h-6 w-full px-1 text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded py-0.5" value={sess.open} onChange={(e) => handleSessionChange(sess.id, 'open', e.target.value)} />
                    </TableCell>
                    <TableCell className="p-1 text-center text-xs dark:text-slate-300">
                      <Input className="h-6 w-full px-1 text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded py-0.5" value={sess.pass} onChange={(e) => handleSessionChange(sess.id, 'pass', e.target.value)} />
                    </TableCell>
                    <TableCell className="p-1 text-center text-xs dark:text-slate-300">
                      <Input className="h-6 w-full px-1 text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded py-0.5" value={sess.min} onChange={(e) => handleSessionChange(sess.id, 'min', e.target.value)} />
                    </TableCell>
                    <TableCell className="p-1 text-center text-xs dark:text-slate-300">
                      <Input className="h-6 w-full px-1 text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded py-0.5" value={sess.max} onChange={(e) => handleSessionChange(sess.id, 'max', e.target.value)} />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="p-1"><Input className="h-6 w-full px-1 text-xs bg-white dark:bg-slate-950 dark:border-slate-700" placeholder="" value={newSession.session} onChange={(e) => setNewSession({ ...newSession, session: e.target.value })} /></TableCell>
                  <TableCell className="p-1"><Input className="h-6 w-full px-1 text-xs bg-white dark:bg-slate-950 dark:border-slate-700" placeholder="" value={newSession.open} onChange={(e) => setNewSession({ ...newSession, open: e.target.value })} /></TableCell>
                  <TableCell className="p-1"><Input className="h-6 w-full px-1 text-xs bg-white dark:bg-slate-950 dark:border-slate-700" placeholder="" value={newSession.pass} onChange={(e) => setNewSession({ ...newSession, pass: e.target.value })} /></TableCell>
                  <TableCell className="p-1"><Input className="h-6 w-full px-1 text-xs bg-white dark:bg-slate-950 dark:border-slate-700" placeholder="" value={newSession.min} onChange={(e) => setNewSession({ ...newSession, min: e.target.value })} /></TableCell>
                  <TableCell className="p-1"><Input className="h-6 w-full px-1 text-xs bg-white dark:bg-slate-950 dark:border-slate-700" placeholder="" value={newSession.max} onChange={(e) => setNewSession({ ...newSession, max: e.target.value })} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="p-1">
              <Button size="sm" variant="destructive" className="w-full h-7 text-xs" onClick={handleAddSession}>Add</Button>
            </div>
          </div>

          <div className="mt-2">
            <Input placeholder="Comment for sV3/sV4" className="h-8 mb-1 bg-white dark:bg-slate-900" value={commentSV3SV4} onChange={(e) => setCommentSV3SV4(e.target.value)} />
            <Button
              variant="outline"
              className="w-full h-8"
              onClick={handleUpdateCommentSV3SV4}
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>

        {/* Column 2: Bowlers */}
        <div className="flex flex-col">
          <div className="rounded-t-lg overflow-hidden border border-emerald-600">
            <div className="bg-emerald-600 text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold">Bowlers {currentBowlingTeam ? `(${currentBowlingTeam})` : ''}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 bg-white/10 hover:bg-white/20 border-white/30 text-white"
                onClick={() => openAddPlayerModal('bowler')}
                disabled={saving}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Bowler
              </Button>
            </div>
            <div className="bg-white dark:bg-slate-900 border-x border-b border-emerald-600 h-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-50">
                    <TableHead className="w-[30px] p-2 text-center text-xs font-bold text-slate-600">ST</TableHead>
                    <TableHead className="p-2 text-left text-xs font-bold text-slate-600">Bowler</TableHead>
                    <TableHead className="w-[40px] p-2 text-center text-xs font-bold text-slate-600">O</TableHead>
                    <TableHead className="w-[40px] p-2 text-center text-xs font-bold text-slate-600">M</TableHead>
                    <TableHead className="w-[40px] p-2 text-center text-xs font-bold text-slate-600">R</TableHead>
                    <TableHead className="w-[40px] p-2 text-center text-xs font-bold text-slate-600">W</TableHead>
                    <TableHead className="w-[30px] p-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bowlers.map((bowler) => (
                    <TableRow key={bowler.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${bowler.isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${bowler.inScorecard ? 'bg-emerald-50/50 dark:bg-emerald-900/30' : 'opacity-60'}`}>
                      <TableCell className="p-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="radio"
                            name="selectedBowler"
                            checked={bowler.isSelected || (scorecard?.bowling?.some((sc: any) => getPlayerIdString(sc.playerId) === bowler._playerId && sc.isCurrentBowler))}
                            onChange={() => handleBowlerSelect(bowler.id)}
                            className="accent-blue-600 cursor-pointer"
                            disabled={!bowler.inScorecard || saving}
                          />
                          {scorecard?.bowling?.some((sc: any) => getPlayerIdString(sc.playerId) === bowler._playerId && sc.isCurrentBowler) && (
                            <span className="text-[10px] text-blue-600 font-bold">🎯</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs font-medium">
                        {bowler.name}
                        {scorecard?.bowling?.some((sc: any) => getPlayerIdString(sc.playerId) === bowler._playerId && sc.isCurrentBowler) && (
                          <span className="ml-2 text-[10px] text-blue-600 font-bold">Current Bowler</span>
                        )}
                        {!bowler.inScorecard && <span className="ml-2 text-[10px] text-slate-500 italic">(Yet to bowl)</span>}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs dark:text-slate-300">
                        {bowler.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded py-0.5"
                            value={bowler.overs || ''}
                            onChange={(e) => handleBowlerStatInputChange(bowler.id, 'overs', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBowlerStatSave(bowler.id, 'overs', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs dark:text-slate-300">
                        {bowler.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded py-0.5"
                            value={bowler.maidens || ''}
                            onChange={(e) => handleBowlerStatInputChange(bowler.id, 'maidens', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBowlerStatSave(bowler.id, 'maidens', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs dark:text-slate-300">
                        {bowler.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded py-0.5"
                            value={bowler.runs || ''}
                            onChange={(e) => handleBowlerStatInputChange(bowler.id, 'runs', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBowlerStatSave(bowler.id, 'runs', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs dark:text-slate-300">
                        {bowler.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded py-0.5"
                            value={bowler.wickets || ''}
                            onChange={(e) => handleBowlerStatInputChange(bowler.id, 'wickets', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBowlerStatSave(bowler.id, 'wickets', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center cursor-pointer text-slate-400">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left" align="start" className="-translate-x-[120px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {bowler.inScorecard ? (
                              <DropdownMenuItem onClick={() => toggleBowlerScorecard(bowler.id)}>
                                Remove from Scorecard
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => addPlayerToScorecard(bowler._playerId, bowler.name, 'bowler')}>
                                Add to Scorecard
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  setSaving(true);
                                  await LiveMatchService.setCurrentBowler(matchId, parseInt(currentInning), bowler._playerId);
                                  toast.success(`${bowler.name} set as current bowler`);
                                  await loadLiveData(true);
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to set current bowler');
                                } finally {
                                  setSaving(false);
                                }
                              }} 
                              disabled={!bowler.inScorecard}
                            >
                              Set as Current Bowler
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Column 3: Batsmen */}
        <div className="flex flex-col">
          <div className="rounded-t-lg overflow-hidden border border-red-800">
            <div className="bg-red-800 text-white px-2 py-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Batsmen {currentBattingTeam ? `(${currentBattingTeam})` : ''}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 bg-white/10 hover:bg-white/20 border-white/30 text-white text-xs px-2"
                  onClick={() => openAddPlayerModal('batsman')}
                  disabled={saving}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1"><span>eX</span><Input value={extras.ex} className="h-5 w-8 p-0 text-center text-black bg-white dark:bg-slate-200" onChange={(e) => setExtras({ ...extras, ex: parseInt(e.target.value) || 0 })} /></div>
                <div className="flex items-center gap-1"><span>w</span><Input value={extras.w} className="h-5 w-8 p-0 text-center text-black bg-white dark:bg-slate-200" onChange={(e) => setExtras({ ...extras, w: parseInt(e.target.value) || 0 })} /></div>
                <div className="flex items-center gap-1"><span>nb</span><Input value={extras.nb} className="h-5 w-8 p-0 text-center text-black bg-white dark:bg-slate-200" onChange={(e) => setExtras({ ...extras, nb: parseInt(e.target.value) || 0 })} /></div>
                <div className="flex items-center gap-1"><span>lb</span><Input value={extras.lb} className="h-5 w-8 p-0 text-center text-black bg-white dark:bg-slate-200" onChange={(e) => setExtras({ ...extras, lb: parseInt(e.target.value) || 0 })} /></div>
                <div className="flex items-center gap-1"><span>b</span><Input value={extras.b} className="h-5 w-8 p-0 text-center text-black bg-white dark:bg-slate-200" onChange={(e) => setExtras({ ...extras, b: parseInt(e.target.value) || 0 })} /></div>
                <div className="flex items-center gap-1"><span>p</span><Input value={extras.p} className="h-5 w-8 p-0 text-center text-black bg-white dark:bg-slate-200" onChange={(e) => setExtras({ ...extras, p: parseInt(e.target.value) || 0 })} /></div>
                <Button
                  disabled={saving || !currentBattingTeamId}
                  onClick={handleUpdateExtras}
                >
                  Save
                </Button>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border-x border-b border-red-800 h-full">
              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={async () => {
                      try {
                        setSaving(true);
                        await LiveMatchService.swapBatsmen(matchId, parseInt(currentInning));
                        toast.success('Batsmen swapped successfully');
                        await loadLiveData(true);
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to swap batsmen');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    🔄 Swap Batsmen
                  </Button>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Click dropdown menu on any batsman to set striker/non-striker
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-50 dark:bg-red-900/20 hover:bg-red-50">
                    <TableHead className="w-[30px] p-2 text-center text-xs font-bold text-slate-600">ST</TableHead>
                    <TableHead className="p-2 text-left text-xs font-bold text-slate-600">Batsmen</TableHead>
                    <TableHead className="w-[40px] p-2 text-center text-xs font-bold text-slate-600">Runs</TableHead>
                    <TableHead className="w-[40px] p-2 text-center text-xs font-bold text-slate-600">Balls</TableHead>
                    <TableHead className="w-[30px] p-2 text-center text-xs font-bold text-slate-600">4s</TableHead>
                    <TableHead className="w-[30px] p-2 text-center text-xs font-bold text-slate-600">6s</TableHead>
                    <TableHead className="w-[40px] p-2 text-center text-xs font-bold text-slate-600">TO</TableHead>
                    <TableHead className="w-[40px] p-2 text-center text-xs font-bold text-slate-600">TR</TableHead>
                    <TableHead className="w-[20px] p-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batsmen.map((batsman) => (
                    <TableRow key={batsman.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${batsman.status === 'out' ? 'opacity-70' : ''} ${batsman.inScorecard ? 'bg-red-50/50 dark:bg-red-900/30 font-medium' : 'opacity-60'}`}>
                      <TableCell className="p-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input 
                            type="radio" 
                            name="activeBatsman" 
                            checked={scorecard?.batting?.some((sc: any) => {
                              const scPlayerId = getPlayerIdString(sc.playerId);
                              return scPlayerId === batsman._playerId && sc.isOnStrike === true;
                            }) || false}
                            onChange={async () => {
                              if (!batsman.inScorecard || batsman.status === 'out' || saving) return;
                              try {
                                setSaving(true);
                                await LiveMatchService.setStriker(matchId, parseInt(currentInning), batsman._playerId);
                                toast.success(`${batsman.name} set as striker`);
                                await loadLiveData(true);
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to set striker');
                              } finally {
                                setSaving(false);
                              }
                            }}
                            className="accent-green-600 cursor-pointer" 
                            disabled={!batsman.inScorecard || batsman.status === 'out' || saving}
                          />
                          {batsman.inScorecard && !batsman.dismissal && (
                            <>
                              {scorecard?.batting?.some((sc: any) => {
                                const scPlayerId = getPlayerIdString(sc.playerId);
                                return scPlayerId === batsman._playerId && sc.isOnStrike === true;
                              }) && (
                                <span className="text-[10px] text-orange-600 font-bold" title="On Strike">⚡</span>
                              )}
                              {scorecard?.batting?.some((sc: any) => {
                                const scPlayerId = getPlayerIdString(sc.playerId);
                                return scPlayerId === batsman._playerId && sc.isOnStrike === false && sc.isOut === false;
                              }) && (
                                <span className="text-[10px] text-blue-600 font-bold" title="Non-Striker">🔄</span>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="text-slate-900 dark:text-slate-200">{batsman.name}</div>
                        {batsman.dismissal && <div className="text-[10px] text-red-600">{batsman.dismissal}</div>}
                        {batsman.inScorecard && !batsman.dismissal && (
                          <div className="text-[10px] font-bold">
                            {scorecard?.batting?.some((sc: any) => {
                              const scPlayerId = getPlayerIdString(sc.playerId);
                              return scPlayerId === batsman._playerId && sc.isOnStrike === true;
                            }) ? (
                              <span className="text-orange-600">⚡ On Strike</span>
                            ) : scorecard?.batting?.some((sc: any) => {
                              const scPlayerId = getPlayerIdString(sc.playerId);
                              return scPlayerId === batsman._playerId && sc.isOnStrike === false && sc.isOut === false;
                            }) ? (
                              <span className="text-blue-600">🔄 Non-Striker</span>
                            ) : batsman.status === 'batting' ? (
                              <span className="text-green-600">Batting</span>
                            ) : null}
                          </div>
                        )}
                        {batsman.status === 'out' && <div className="text-[10px] text-red-600 font-bold">Out</div>}
                        {!batsman.inScorecard && <div className="text-[10px] text-slate-500 italic">Yet to bat</div>}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs font-bold dark:text-slate-200">
                        {batsman.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                            value={batsman.runs || ''}
                            onChange={(e) => handleBatsmanStatInputChange(batsman.id, 'runs', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBatsmanStatSave(batsman.id, 'runs', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs dark:text-slate-300">
                        {batsman.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                            value={batsman.balls || ''}
                            onChange={(e) => handleBatsmanStatInputChange(batsman.id, 'balls', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBatsmanStatSave(batsman.id, 'balls', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs dark:text-slate-300">
                        {batsman.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                            value={batsman.fours || ''}
                            onChange={(e) => handleBatsmanStatInputChange(batsman.id, 'fours', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBatsmanStatSave(batsman.id, 'fours', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs dark:text-slate-300">
                        {batsman.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                            value={batsman.sixes || ''}
                            onChange={(e) => handleBatsmanStatInputChange(batsman.id, 'sixes', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBatsmanStatSave(batsman.id, 'sixes', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs dark:text-slate-300">
                        {batsman.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                            value={batsman.to || ''}
                            onChange={(e) => handleBatsmanStatInputChange(batsman.id, 'to', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBatsmanStatSave(batsman.id, 'to', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs dark:text-slate-300">
                        {batsman.inScorecard ? (
                          <input
                            className="w-10 bg-white dark:bg-black/20 border border-slate-300 dark:border-slate-600 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                            value={batsman.tr || ''}
                            onChange={(e) => handleBatsmanStatInputChange(batsman.id, 'tr', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBatsmanStatSave(batsman.id, 'tr', e.currentTarget.value);
                              }
                            }}
                          />
                        ) : "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center cursor-pointer text-slate-400">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left" align="start" className="-translate-x-[120px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {batsman.inScorecard ? (
                              <DropdownMenuItem onClick={() => toggleBatsmanScorecard(batsman.id)}>
                                Remove from Scorecard
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => addPlayerToScorecard(batsman._playerId, batsman.name, 'batsman')}>
                                Add to Scorecard
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Strike Position</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  setSaving(true);
                                  await LiveMatchService.setStriker(matchId, parseInt(currentInning), batsman._playerId);
                                  toast.success(`${batsman.name} set as striker`);
                                  await loadLiveData(true);
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to set striker');
                                } finally {
                                  setSaving(false);
                                }
                              }} 
                              disabled={!batsman.inScorecard || batsman.status === 'out'}
                            >
                              Set as Striker (On Strike)
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  setSaving(true);
                                  await LiveMatchService.setNonStriker(matchId, parseInt(currentInning), batsman._playerId);
                                  toast.success(`${batsman.name} set as non-striker`);
                                  await loadLiveData(true);
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to set non-striker');
                                } finally {
                                  setSaving(false);
                                }
                              }} 
                              disabled={!batsman.inScorecard || batsman.status === 'out'}
                            >
                              Set as Non-Striker
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Status</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setBatsmanStatus(batsman.id, 'batting')} disabled={!batsman.inScorecard}>
                              Set Batting
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setBatsmanStatus(batsman.id, 'out')} disabled={!batsman.inScorecard}>
                              Set Out
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setBatsmanStatus(batsman.id, 'yetToBat')} disabled={!batsman.inScorecard}>
                              Set Yet To Bat
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setAsLastWicket(batsman.id)} disabled={!batsman.inScorecard || batsman.status !== 'out'}>
                              Set as Last Wicket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Last Wicket Row */}
                  <TableRow className="bg-red-100 dark:bg-red-900/30">
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="p-2 text-xs">
                      <span className="bg-red-600 text-white text-[10px] px-1 rounded mr-1">Last Wicket</span>
                      <span className="font-medium">{lastWicket.name}</span>
                      <div className="text-[10px] text-red-700">{lastWicket.dismissal}</div>
                    </TableCell>
                    <TableCell className="p-2 text-center text-xs font-bold">
                      <input
                        className="w-10 bg-white dark:bg-black/20 border border-red-200 dark:border-red-800 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                        value={lastWicket.runs}
                        onChange={(e) => handleLastWicketStatChange('runs', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLastWicketStatSave('runs', e.currentTarget.value);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-center text-xs">
                      <input
                        className="w-10 bg-white dark:bg-black/20 border border-red-200 dark:border-red-800 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                        value={lastWicket.balls}
                        onChange={(e) => handleLastWicketStatChange('balls', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLastWicketStatSave('balls', e.currentTarget.value);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-center text-xs">
                      <input
                        className="w-10 bg-white dark:bg-black/20 border border-red-200 dark:border-red-800 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                        value={lastWicket.fours}
                        onChange={(e) => handleLastWicketStatChange('fours', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLastWicketStatSave('fours', e.currentTarget.value);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-center text-xs">
                      <input
                        className="w-10 bg-white dark:bg-black/20 border border-red-200 dark:border-red-800 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                        value={lastWicket.sixes}
                        onChange={(e) => handleLastWicketStatChange('sixes', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLastWicketStatSave('sixes', e.currentTarget.value);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-center text-xs">
                      <input
                        className="w-10 bg-white dark:bg-black/20 border border-red-200 dark:border-red-800 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                        value={lastWicket.to}
                        onChange={(e) => handleLastWicketStatChange('to', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLastWicketStatSave('to', e.currentTarget.value);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-center text-xs">
                      <input
                        className="w-10 bg-white dark:bg-black/20 border border-red-200 dark:border-red-800 text-center focus:outline-none focus:ring-1 focus:ring-red-500 rounded py-0.5"
                        value={lastWicket.tr}
                        onChange={(e) => handleLastWicketStatChange('tr', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLastWicketStatSave('tr', e.currentTarget.value);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="p-2"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10"
              onClick={handleFinishMatch}
              disabled={saving}
            >
              {saving ? 'Finishing...' : 'Finish the Match'}
            </Button>

          </div>
        </div>

      </div>

      {/* Add Player Modal */}
      <Dialog open={showAddPlayerModal} onOpenChange={setShowAddPlayerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add {addPlayerType === 'batsman' ? 'Batsman' : 'Bowler'} to Scorecard
            </DialogTitle>
            <DialogDescription>
              Select a player from the playing XI to add to the scorecard
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {availablePlayers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>All players from playing XI are already in the scorecard</p>
                <p className="text-sm mt-2">Check the table to manage existing players</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availablePlayers.map((player) => (
                  <div
                    key={player._id}
                    className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => addPlayerToScorecard(player._id, player.name, addPlayerType!)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {player.name}
                      </div>
                      {player.fullName && player.fullName !== player.name && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {player.fullName}
                        </div>
                      )}
                      {player.role && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {player.role}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        addPlayerToScorecard(player._id, player.name, addPlayerType!);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
