import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  MoreVertical,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Target,
  User,
  UserCog,
  Users,
  Loader2,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { LiveMatchService, type MatchSquad } from "../../services/live-match.service";
import { MatchService } from "../../services/match.service";
import { SeriesTeamsService } from "../../services/series-teams.service";

interface MatchData {
  team1?: { name?: string };
  team2?: { name?: string };
  series?: string;
  date?: string;
  time?: string;
  venue?: string;
  straightUmpire?: string;
  legUmpire?: string;
  thirdUmpire?: string;
  toss?: string;
  referee?: string;
  pitchReport?: string;
}

interface Player {
  id: number;
  name: string;
  isFavorite: boolean;
  playerId?: string; // Store player ID for API calls
}

interface Squad {
  playingXI: string[]; // Store player IDs, not names
  onBench: Player[];
}

interface PlayerRoles {
  [playerName: string]: {
    captain?: boolean;
    wicketKeeper?: boolean;
    viceCaptain?: boolean;
    role?: "batsman" | "bowler" | "allRounder";
  };
}

interface LiveMatchInfoTabProps {
  matchData: MatchData;
  matchId: string;
  team1Id?: string;
  team2Id?: string;
  seriesId?: string;
  matchFormat?: string;
}

export function LiveMatchInfoTab({
  matchData,
  matchId,
  team1Id,
  team2Id,
  seriesId,
  matchFormat,
}: LiveMatchInfoTabProps) {
  // Debug: Log matchData to see what we're receiving
  useEffect(() => {
    console.log('LiveMatchInfoTab - matchData:', matchData);
    console.log('Team 1:', matchData?.team1);
    console.log('Team 2:', matchData?.team2);
    console.log('Team 1 name:', matchData?.team1?.name);
    console.log('Team 2 name:', matchData?.team2?.name);
  }, [matchData]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team1Squad, setTeam1Squad] = useState<Squad>({
    playingXI: [],
    onBench: [],
  });
  const [team2Squad, setTeam2Squad] = useState<Squad>({
    playingXI: [],
    onBench: [],
  });
  const [playerRoles, setPlayerRoles] = useState<PlayerRoles>({});
  const [matchSquads, setMatchSquads] = useState<MatchSquad[]>([]);

  const [team1Search, setTeam1Search] = useState("");
  const [debouncedTeam1Search, setDebouncedTeam1Search] = useState("");
  const [team2Search, setTeam2Search] = useState("");
  const [debouncedTeam2Search, setDebouncedTeam2Search] = useState("");

  // Match info fields
  const [toss, setToss] = useState("");
  const [straightUmpire, setStraightUmpire] = useState("");
  const [legUmpire, setLegUmpire] = useState("");
  const [thirdUmpire, setThirdUmpire] = useState("");
  const [referee, setReferee] = useState("");
  const [pitchReport, setPitchReport] = useState("");

  // Debounce team1 search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTeam1Search(team1Search);
    }, 500);
    return () => clearTimeout(timer);
  }, [team1Search]);

  // Debounce team2 search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTeam2Search(team2Search);
    }, 500);
    return () => clearTimeout(timer);
  }, [team2Search]);

  const [pitchBehaviour, setPitchBehaviour] = useState("");
  const [teamFormBangladesh, setTeamFormBangladesh] = useState("L.L.W.W.L.W");
  const [teamFormIndia, setTeamFormIndia] = useState("");
  const [headToHeadTeam1, setHeadToHeadTeam1] = useState("3");
  const [headToHeadTeam2, setHeadToHeadTeam2] = useState("7");

  // Load match squads
  const loadSquads = useCallback(async () => {
    if (!matchId) return;
    try {
      setLoading(true);
      const squads = await LiveMatchService.getMatchSquads(matchId);
      console.log('Match squads loaded:', squads);
      console.log('Squads type:', typeof squads, 'Is array:', Array.isArray(squads), 'Length:', squads?.length);

      if (squads && Array.isArray(squads) && squads.length > 0) {
        setMatchSquads(squads);

        // Transform squads to component format
        squads.forEach((squad: MatchSquad) => {
          console.log('Processing squad:', squad);
          const teamId = typeof squad.teamId === 'object' && squad.teamId !== null
            ? (squad.teamId as any)._id || String(squad.teamId)
            : String(squad.teamId);

          console.log('Squad teamId:', teamId, 'team1Id:', team1Id, 'team2Id:', team2Id);
          console.log('Playing XI raw:', squad.playingXI);
          console.log('Bench raw:', squad.bench);

          // Transform playing XI - store player IDs
          const playingXI = (squad.playingXI || []).map((p: any) => {
            if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
              return p._id || String(p);
            }
            return String(p);
          });

          // Transform bench - handle both populated objects and string IDs, store playerId
          const bench = (squad.bench || []).map((p: any, idx: number) => {
            let playerName: string;
            let playerId: string;

            if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
              playerName = p.name || p.fullName || 'Unknown';
              playerId = p._id || String(p);
            } else {
              playerName = String(p);
              playerId = String(p);
            }

            return {
              id: idx + 1,
              name: playerName,
              isFavorite: false,
              playerId: playerId,
            };
          });

          console.log('Transformed Playing XI:', playingXI);
          console.log('Transformed Bench:', bench);

          // Extract role information from squad
          const captainId = typeof squad.captainId === 'object' && squad.captainId !== null
            ? (squad.captainId as any)._id : squad.captainId;
          const viceCaptainId = typeof squad.viceCaptainId === 'object' && squad.viceCaptainId !== null
            ? (squad.viceCaptainId as any)._id : squad.viceCaptainId;
          const wicketKeeperId = typeof squad.wicketKeeperId === 'object' && squad.wicketKeeperId !== null
            ? (squad.wicketKeeperId as any)._id : squad.wicketKeeperId;

          // Update player roles
          const newRoles: PlayerRoles = {};
          [...playingXI, ...bench.map(b => b.name)].forEach(playerName => {
            // Find the player ID from the squad data
            const allPlayers = [...(squad.playingXI || []), ...(squad.bench || [])];
            const playerObj = allPlayers.find((p: any) => {
              if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
                return (p.name || p.fullName) === playerName;
              }
              return false;
            });

            const pid = playerObj && typeof playerObj === 'object' && !Array.isArray(playerObj)
              ? (playerObj as any)._id : null;

            if (pid) {
              newRoles[playerName] = {
                captain: String(pid) === String(captainId),
                viceCaptain: String(pid) === String(viceCaptainId),
                wicketKeeper: String(pid) === String(wicketKeeperId),
              };
            }
          });
          setPlayerRoles(prev => ({ ...prev, ...newRoles }));

          if (String(teamId) === String(team1Id)) {
            console.log('Setting Team 1 squad:', { playingXI, onBench: bench });
            setTeam1Squad({ playingXI, onBench: bench });
          } else if (String(teamId) === String(team2Id)) {
            console.log('Setting Team 2 squad:', { playingXI, onBench: bench });
            setTeam2Squad({ playingXI, onBench: bench });
          }
        });
      } else {
        // No match squads exist - load series squads for manual selection
        console.log('No match squads found. Loading series squads for manual selection.');
        if (seriesId && team1Id && team2Id && matchFormat) {
          try {
            // Map match format to series format
            const formatMap: Record<string, string> = {
              'odi': 'ODI',
              't20': 'T20',
              't20i': 'T20',
              'test': 'Test',
            };
            const seriesFormat = formatMap[matchFormat.toLowerCase()] || 'ODI';

            // Fetch series squads for both teams
            const [team1SeriesSquadResponse, team2SeriesSquadResponse] = await Promise.all([
              SeriesTeamsService.getSquad(seriesId, team1Id, seriesFormat),
              SeriesTeamsService.getSquad(seriesId, team2Id, seriesFormat),
            ]);

            // Load series squad players into bench for manual selection
            const loadSeriesSquadToBench = (seriesSquadResponse: any, team: 'team1' | 'team2') => {
              if (seriesSquadResponse.status && seriesSquadResponse.data?.result) {
                const seriesSquad = seriesSquadResponse.data.result;
                const squadPlayers = seriesSquad.squadPlayers || [];

                if (squadPlayers.length === 0) {
                  console.log(`No players in series squad for ${team}`);
                  return;
                }

                // Transform series squad players to bench format
                const benchPlayers = squadPlayers.map((sp: any, idx: number) => {
                  const playerObj = sp.playerId;
                  const playerName = typeof playerObj === 'object' && playerObj !== null
                    ? (playerObj.name || playerObj.fullName || 'Unknown')
                    : 'Unknown';
                  const playerId = typeof playerObj === 'object' && playerObj !== null
                    ? (playerObj._id || String(playerObj))
                    : String(sp.playerId);

                  return {
                    id: idx + 1,
                    name: playerName,
                    isFavorite: false,
                    playerId: playerId,
                  };
                });

                if (team === 'team1') {
                  setTeam1Squad({ playingXI: [], onBench: benchPlayers });
                } else {
                  setTeam2Squad({ playingXI: [], onBench: benchPlayers });
                }

                console.log(`Loaded ${benchPlayers.length} players from series squad for ${team}`);
              }
            };

            // Load series squads into bench for both teams
            loadSeriesSquadToBench(team1SeriesSquadResponse, 'team1');
            loadSeriesSquadToBench(team2SeriesSquadResponse, 'team2');

            // Reset match squads state
            setMatchSquads([]);
          } catch (error: any) {
            console.error('Failed to load series squads:', error);
            // Reset to empty on error
            setMatchSquads([]);
            setTeam1Squad({ playingXI: [], onBench: [] });
            setTeam2Squad({ playingXI: [], onBench: [] });
          }
        } else {
          // Missing required data - reset to empty
          setMatchSquads([]);
          setTeam1Squad({ playingXI: [], onBench: [] });
          setTeam2Squad({ playingXI: [], onBench: [] });
          console.log('Cannot load series squads (missing seriesId, teamIds, or matchFormat)');
        }
      }
    } catch (error: any) {
      console.error('Failed to load squads:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load match squads');
      // Reset to empty on error
      setMatchSquads([]);
      setTeam1Squad({ playingXI: [], onBench: [] });
      setTeam2Squad({ playingXI: [], onBench: [] });
    } finally {
      setLoading(false);
    }
  }, [matchId, team1Id, team2Id, seriesId, matchFormat, matchData]);

  useEffect(() => {
    loadSquads();
    // Load toss from matchData if available
    if (matchData?.toss) {
      setToss(matchData.toss);
    }

    // Load saved match info from localStorage
    const savedMatchInfo = localStorage.getItem(`match_info_${matchId}`);
    if (savedMatchInfo) {
      try {
        const data = JSON.parse(savedMatchInfo);
        if (data.toss && !matchData?.toss) setToss(data.toss);
        if (data.straightUmpire) setStraightUmpire(data.straightUmpire);
        if (data.legUmpire) setLegUmpire(data.legUmpire);
        if (data.thirdUmpire) setThirdUmpire(data.thirdUmpire);
        if (data.referee) setReferee(data.referee);
        if (data.pitchReport) setPitchReport(data.pitchReport);
        if (data.pitchBehaviour) setPitchBehaviour(data.pitchBehaviour);
        if (data.headToHead) {
          if (data.headToHead.team1 !== undefined) setHeadToHeadTeam1(String(data.headToHead.team1));
          if (data.headToHead.team2 !== undefined) setHeadToHeadTeam2(String(data.headToHead.team2));
        }
        if (data.teamForm) {
          if (data.teamForm.team1) setTeamFormBangladesh(data.teamForm.team1);
          if (data.teamForm.team2) setTeamFormIndia(data.teamForm.team2);
        }
      } catch (error) {
        console.error('Failed to load saved match info:', error);
      }
    }
  }, [loadSquads, matchId]);

  // Copy squad from series
  const copySquadFromSeries = async (teamId: string, team: 'team1' | 'team2') => {
    if (!seriesId || !teamId || !matchFormat) {
      toast.error('Series ID, Team ID, or Match Format is missing');
      return;
    }

    try {
      setLoading(true);

      // Get series squad for this team
      const formatMap: Record<string, string> = {
        'odi': 'ODI',
        't20': 'T20',
        't20i': 'T20',
        'test': 'Test',
      };
      const seriesFormat = formatMap[matchFormat.toLowerCase()] || 'ODI';

      const response = await SeriesTeamsService.getSquad(seriesId, teamId, seriesFormat);
      const seriesSquad = response.data.result;

      if (!seriesSquad || !seriesSquad.squadPlayers || seriesSquad.squadPlayers.length === 0) {
        toast.error('No squad found in series for this team');
        return;
      }

      // Transform series squad players to match squad format
      const allPlayerIds = seriesSquad.squadPlayers.map((sp: any) => {
        const playerId = typeof sp.playerId === 'object' && sp.playerId !== null
          ? (sp.playerId as any)._id || String(sp.playerId)
          : String(sp.playerId);
        return playerId;
      });

      // Split into playing XI (first 11) and bench (rest)
      const playingXIIds = allPlayerIds.slice(0, 11);
      const benchIds = allPlayerIds.slice(11);

      // Get captain, VC, WK IDs
      const captain = seriesSquad.squadPlayers.find((sp: any) => sp.isCaptain);
      const viceCaptain = seriesSquad.squadPlayers.find((sp: any) => sp.isViceCaptain);
      const wicketKeeper = seriesSquad.squadPlayers.find((sp: any) => sp.isWicketKeeper);

      const captainId = captain ? (typeof captain.playerId === 'object'
        ? (captain.playerId as any)._id : captain.playerId) : undefined;
      const viceCaptainId = viceCaptain ? (typeof viceCaptain.playerId === 'object'
        ? (viceCaptain.playerId as any)._id : viceCaptain.playerId) : undefined;
      const wicketKeeperId = wicketKeeper ? (typeof wicketKeeper.playerId === 'object'
        ? (wicketKeeper.playerId as any)._id : wicketKeeper.playerId) : undefined;

      // Create/update match squad
      await LiveMatchService.updateMatchSquad(matchId, teamId, {
        playingXI: playingXIIds,
        bench: benchIds,
        captainId,
        viceCaptainId,
        wicketKeeperId,
      });

      toast.success('Squad copied from series successfully');
      await loadSquads();
    } catch (error: any) {
      console.error('Failed to copy squad from series:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to copy squad from series');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerRole = (
    playerName: string,
    roleType: "captain" | "wicketKeeper" | "viceCaptain" | "role",
    value?: "batsman" | "bowler" | "allRounder"
  ) => {
    const current = playerRoles[playerName] || {};
    let newRoles: PlayerRoles;
    if (roleType === "role") {
      newRoles = {
        ...playerRoles,
        [playerName]: { ...current, role: value },
      };
    } else {
      newRoles = {
        ...playerRoles,
        [playerName]: { ...current, [roleType]: !current[roleType] },
      };
    }
    setPlayerRoles(newRoles);
  };

  const handleSelectLastMatchXI = (team: "team1" | "team2") => {
    if (team === "team1") {
      setTeam1Squad({
        ...team1Squad,
        playingXI: team1Squad.onBench.map((p) => p.name),
      });
    } else {
      setTeam2Squad({
        ...team2Squad,
        playingXI: team2Squad.onBench.map((p) => p.name),
      });
    }
  };

  const togglePlayerToPlayingXI = (
    team: "team1" | "team2",
    playerId: number
  ) => {
    if (team === "team1") {
      const player = team1Squad.onBench.find((p) => p.id === playerId);
      if (!player || !player.playerId) return;

      const isInPlayingXI = team1Squad.playingXI.includes(player.playerId);
      setTeam1Squad({
        ...team1Squad,
        playingXI: isInPlayingXI
          ? team1Squad.playingXI.filter((id) => id !== player.playerId)
          : [...team1Squad.playingXI, player.playerId],
      });
    } else {
      const player = team2Squad.onBench.find((p) => p.id === playerId);
      if (!player || !player.playerId) return;

      const isInPlayingXI = team2Squad.playingXI.includes(player.playerId);
      setTeam2Squad({
        ...team2Squad,
        playingXI: isInPlayingXI
          ? team2Squad.playingXI.filter((id) => id !== player.playerId)
          : [...team2Squad.playingXI, player.playerId],
      });
    }
  };

  const toggleFavorite = (team: "team1" | "team2", playerId: number) => {
    if (team === "team1") {
      setTeam1Squad({
        ...team1Squad,
        onBench: team1Squad.onBench.map((p) =>
          p.id === playerId ? { ...p, isFavorite: !p.isFavorite } : p
        ),
      });
    } else {
      setTeam2Squad({
        ...team2Squad,
        onBench: team2Squad.onBench.map((p) =>
          p.id === playerId ? { ...p, isFavorite: !p.isFavorite } : p
        ),
      });
    }
  };

  // Save squad for a team
  const saveSquad = async (teamId: string, squad: Squad, teamName: string) => {
    // playingXI already contains player IDs
    const playingXIIds = squad.playingXI.filter((id): id is string => id !== undefined && id !== null);

    // Get bench player IDs from the bench array
    const benchIds = squad.onBench
      .map(p => p.playerId)
      .filter((id): id is string => id !== undefined && id !== null);

    // Validate: Playing XI must have exactly 11 players
    if (playingXIIds.length !== 11) {
      const errorMessage = `${teamName}: Playing XI must have exactly 11 players. Currently has ${playingXIIds.length} player${playingXIIds.length !== 1 ? 's' : ''}. Please select ${11 - playingXIIds.length} more player${11 - playingXIIds.length !== 1 ? 's' : ''}.`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Get role player IDs from playerRoles (which uses player names as keys)
    // We need to find the player ID from the bench/playingXI by name
    const allPlayers = [...squad.playingXI.map(id => {
      const benchPlayer = squad.onBench.find(p => p.playerId === id);
      return benchPlayer ? { id, name: benchPlayer.name } : null;
    }).filter(Boolean), ...squad.onBench.map(p => ({ id: p.playerId, name: p.name }))];

    const getRolePlayerId = (roleType: 'captain' | 'viceCaptain' | 'wicketKeeper'): string | undefined => {
      const playerName = Object.entries(playerRoles).find(([_, roles]) => roles[roleType])?.[0];
      if (!playerName) return undefined;
      const player = allPlayers.find(p => p && p.name === playerName);
      return player ? player.id : undefined;
    };

    const updateDto = {
      playingXI: playingXIIds,
      bench: benchIds,
      captainId: getRolePlayerId('captain'),
      viceCaptainId: getRolePlayerId('viceCaptain'),
      wicketKeeperId: getRolePlayerId('wicketKeeper'),
    };

    await LiveMatchService.updateMatchSquad(matchId, teamId, updateDto);
  };

  // Save match info
  const handleSaveMatchInfo = async () => {
    if (!matchId) return;
    try {
      setSaving(true);

      // Get team names for better error messages
      const team1Name = matchData?.team1?.name || 'Team 1';
      const team2Name = matchData?.team2?.name || 'Team 2';

      // Validate and save squads one by one to show specific errors
      if (team1Id) {
        await saveSquad(team1Id, team1Squad, team1Name);
      }
      if (team2Id) {
        await saveSquad(team2Id, team2Squad, team2Name);
      }

      // Save match general info (toss, umpires, referee, pitch report, etc.)
      // Store in localStorage as temporary solution until backend API is available
      const matchInfoData = {
        toss,
        straightUmpire,
        legUmpire,
        thirdUmpire,
        referee,
        pitchReport,
        pitchBehaviour,
        headToHead: {
          team1: parseInt(headToHeadTeam1) || 0,
          team2: parseInt(headToHeadTeam2) || 0,
        },
        teamForm: {
          team1: teamFormBangladesh,
          team2: teamFormIndia,
        },
      };

      // Save to localStorage with matchId as key
      localStorage.setItem(`match_info_${matchId}`, JSON.stringify(matchInfoData));

      // Also try to save via MatchService if the API supports these fields
      // For now, we'll save what we can and use localStorage as backup
      try {
        // If MatchService.updateMatch supports these fields, uncomment below:
        // await MatchService.updateMatch(matchId, {
        //   toss,
        //   straightUmpire,
        //   legUmpire,
        //   thirdUmpire,
        //   referee,
        //   pitchReport,
        //   pitchBehaviour,
        // } as any);
      } catch (updateError) {
        console.log('Match update API may not support all fields, using localStorage as backup');
      }

      toast.success('Match info updated successfully');
      await loadSquads();
    } catch (error: any) {
      console.error('Failed to save match info:', error);
      // Error message is already shown in saveSquad function via toast
      // Only show generic error if it's not a validation error
      if (!error.message || !error.message.includes('Playing XI must have exactly')) {
        toast.error(error.response?.data?.userMessage || error.message || 'Failed to save match info');
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredTeam1Bench = team1Squad.onBench.filter((p) =>
    p.name.toLowerCase().includes(debouncedTeam1Search.toLowerCase())
  );
  const filteredTeam2Bench = team2Squad.onBench.filter((p) =>
    p.name.toLowerCase().includes(debouncedTeam2Search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        {/* Left Side: Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Pencil className="h-3.5 w-3.5" />
            Venue
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Pencil className="h-3.5 w-3.5" />
            Squad
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={loadSquads}
            disabled={loading}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Squads
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Scorecards
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Select All
          </Button>
        </div>

        {/* Right Side: Update Info Button */}
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-8 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={handleSaveMatchInfo}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            'Update info'
          )}
        </Button>
      </div>

      {/* 3 Column Grid */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left Column: General Info */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden relative">
          <CardHeader className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              General Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-y-auto min-h-0 p-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Series
              </Label>
              <Input
                value={matchData.series}
                readOnly
                className="bg-slate-50 dark:bg-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
              </Label>
              <Input
                value={matchData.date}
                readOnly
                className="bg-slate-50 dark:bg-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Time
              </Label>
              <Input
                value={matchData.time}
                readOnly
                className="bg-slate-50 dark:bg-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Venue
              </Label>
              <Input
                value={matchData.venue}
                readOnly
                className="bg-slate-50 dark:bg-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Toss
              </Label>
              <Input
                placeholder="Enter toss result"
                value={toss}
                onChange={(e) => setToss(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Straight Umpire
              </Label>
              <Input
                value={straightUmpire || matchData.straightUmpire || ''}
                onChange={(e) => setStraightUmpire(e.target.value)}
                placeholder="Enter straight umpire name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Leg Umpire
              </Label>
              <Input
                value={legUmpire || matchData.legUmpire || ''}
                onChange={(e) => setLegUmpire(e.target.value)}
                placeholder="Enter leg umpire name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Third Umpire
              </Label>
              <Input
                value={thirdUmpire || matchData.thirdUmpire || ''}
                onChange={(e) => setThirdUmpire(e.target.value)}
                placeholder="Enter third umpire name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Referee
              </Label>
              <Input
                placeholder="Search referee here"
                value={referee}
                onChange={(e) => setReferee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pitch Report
              </Label>
              <Input
                placeholder="Enter pitch report"
                value={pitchReport}
                onChange={(e) => setPitchReport(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pitch Behaviour
              </Label>
              <Select value={pitchBehaviour} onValueChange={setPitchBehaviour}>
                <SelectTrigger className="bg-white dark:bg-slate-700">
                  <SelectValue placeholder="Select pitch behaviour" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batting-friendly">
                    Batting Friendly
                  </SelectItem>
                  <SelectItem value="bowling-friendly">
                    Bowling Friendly
                  </SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="spinning">Spinning</SelectItem>
                  <SelectItem value="seaming">Seaming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Head to Head Section */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase">
                Head to Head
              </Label>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(() => {
                      const team1Name = matchData?.team1?.name ||
                        (typeof matchData?.team1 === 'string' ? matchData.team1 : null) ||
                        (matchData as any)?.team1?.name ||
                        'Team 1';
                      return (team1Name.charAt(0) || 'T').toUpperCase();
                    })()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate min-w-0">
                    {(() => {
                      const team1Name = matchData?.team1?.name ||
                        (typeof matchData?.team1 === 'string' ? matchData.team1 : null) ||
                        (matchData as any)?.team1?.name ||
                        'Team 1';
                      return team1Name;
                    })()}
                  </span>
                  <Input
                    type="number"
                    value={headToHeadTeam1}
                    onChange={(e) => setHeadToHeadTeam1(e.target.value)}
                    className="w-16 h-8 text-center text-sm font-bold bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shrink-0"
                  />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 px-2 shrink-0">vs</div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <Input
                    type="number"
                    value={headToHeadTeam2}
                    onChange={(e) => setHeadToHeadTeam2(e.target.value)}
                    className="w-16 h-8 text-center text-sm font-bold bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shrink-0"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate min-w-0 text-right">
                    {(() => {
                      const team2Name = matchData?.team2?.name ||
                        (typeof matchData?.team2 === 'string' ? matchData.team2 : null) ||
                        (matchData as any)?.team2?.name ||
                        'Team 2';
                      return team2Name;
                    })()}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(() => {
                      const team2Name = matchData?.team2?.name ||
                        (typeof matchData?.team2 === 'string' ? matchData.team2 : null) ||
                        (matchData as any)?.team2?.name ||
                        'Team 2';
                      return (team2Name.charAt(0) || 'T').toUpperCase();
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Team Form Section */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase">
                Team Form
              </Label>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {matchData?.team1?.name || 'Team 1'}
                  </Label>
                  <Input
                    value={teamFormBangladesh}
                    onChange={(e) => setTeamFormBangladesh(e.target.value)}
                    placeholder="e.g. L.L.W.W.L.W"
                    className="bg-white dark:bg-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {matchData?.team2?.name || 'Team 2'}
                  </Label>
                  <Input
                    value={teamFormIndia}
                    onChange={(e) => setTeamFormIndia(e.target.value)}
                    placeholder="e.g. W.W.L.W.L"
                    className="bg-white dark:bg-slate-700"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                >
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Middle Column: Team 1 Squads */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden relative">
          <CardHeader className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              {matchData?.team1?.name || 'Team 1'} Squads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-y-auto flex flex-col min-h-0 p-6">
            <div className="space-y-2 flex flex-col min-h-0 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Playing XI
                </Label>
                <span className={`text-xs font-medium px-2 py-1 rounded ${team1Squad.playingXI.length === 11
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : team1Squad.playingXI.length > 11
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                  {team1Squad.playingXI.length} / 11
                </span>
              </div>
              <div className="min-h-[100px] border border-slate-200 dark:border-slate-700 rounded-md p-3 bg-slate-50 dark:bg-slate-900/50">
                {team1Squad.playingXI.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                    Select players from bench
                  </p>
                ) : (
                  <div className="space-y-2">
                    {team1Squad.playingXI.map((playerId, idx) => {
                      const player = team1Squad.onBench.find(p => p.playerId === playerId);
                      const playerName = player?.name || playerId;
                      return (
                        <div
                          key={idx}
                          className="text-sm text-slate-700 dark:text-slate-300"
                        >
                          {idx + 1}. {playerName}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2 flex flex-col flex-1 min-h-[300px]">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                On Bench
              </Label>
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search players..."
                  value={team1Search}
                  onChange={(e) => setTeam1Search(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectLastMatchXI("team1")}
                className="text-xs h-8 w-full"
              >
                Select last match playing XI
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic flex items-center gap-1">
                <Star className="h-3 w-3" />
                Star represents the player on bench
              </p>
              <div className="border border-slate-200 dark:border-slate-700 rounded-md flex-1 min-h-0 overflow-y-auto">
                {filteredTeam1Bench.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 last:border-0 relative"
                  >
                    <Checkbox
                      checked={player.playerId ? team1Squad.playingXI.includes(player.playerId) : false}
                      onCheckedChange={() =>
                        togglePlayerToPlayingXI("team1", player.id)
                      }
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                      {player.name}
                    </span>
                    <button
                      onClick={() => toggleFavorite("team1", player.id)}
                      className="mr-1"
                    >
                      <Star
                        className={`h-4 w-4 ${player.isFavorite
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-300 dark:text-slate-600"
                          }`}
                      />
                    </button>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        side="left"
                        className="w-48 z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg -translate-x-[200px]"
                      >
                        <DropdownMenuItem
                          onSelect={() => handlePlayerRole(player.name, "captain")}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {playerRoles[player.name]?.captain
                            ? "Remove Captain"
                            : "Choose Captain"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "viceCaptain")
                          }
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          {playerRoles[player.name]?.viceCaptain
                            ? "Remove Vice Captain"
                            : "Choose Vice Captain"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "wicketKeeper")
                          }
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          {playerRoles[player.name]?.wicketKeeper
                            ? "Remove Wicket Keeper"
                            : "Choose Wicket Keeper"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "role", "batsman")
                          }
                        >
                          <User className="h-4 w-4 mr-2" />
                          Batsman
                          {playerRoles[player.name]?.role === "batsman" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "role", "bowler")
                          }
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Bowler
                          {playerRoles[player.name]?.role === "bowler" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "role", "allRounder")
                          }
                        >
                          <Users className="h-4 w-4 mr-2" />
                          All Rounder
                          {playerRoles[player.name]?.role === "allRounder" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Team 2 Squads */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden relative">
          <CardHeader className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              {matchData?.team2?.name || 'Team 2'} Squads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-y-auto flex flex-col min-h-0 p-6">
            <div className="space-y-2 flex flex-col min-h-0 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Playing XI
                </Label>
                <span className={`text-xs font-medium px-2 py-1 rounded ${team2Squad.playingXI.length === 11
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : team2Squad.playingXI.length > 11
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                  {team2Squad.playingXI.length} / 11
                </span>
              </div>
              <div className="min-h-[100px] border border-slate-200 dark:border-slate-700 rounded-md p-3 bg-slate-50 dark:bg-slate-900/50">
                {team2Squad.playingXI.length === 0 && team2Squad.onBench.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">
                      No squad available
                    </p>
                    {seriesId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copySquadFromSeries(team2Id!, 'team2')}
                        className="text-xs h-7"
                        disabled={loading}
                      >
                        Copy from Series Squad
                      </Button>
                    )}
                  </div>
                ) : team2Squad.playingXI.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                    Select players from bench
                  </p>
                ) : (
                  <div className="space-y-2 relative">
                    {team2Squad.playingXI.map((playerId, idx) => {
                      const player = team2Squad.onBench.find(p => p.playerId === playerId);
                      const playerName = player?.name || playerId;
                      const roles = playerRoles[playerName] || {};
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between relative gap-2 group"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {idx + 1}. {playerName}
                            </span>
                            {roles.captain && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0"
                              >
                                C
                              </Badge>
                            )}
                            {roles.viceCaptain && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0"
                              >
                                VC
                              </Badge>
                            )}
                            {roles.wicketKeeper && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0"
                              >
                                WK
                              </Badge>
                            )}
                            {roles.role && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0 capitalize"
                              >
                                {roles.role}
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              side="left"
                              sideOffset={4}
                              alignOffset={0}
                              className="w-48 z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg -translate-x-[200px]"
                            >
                              {/* Your items */}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2 flex flex-col flex-1 min-h-[300px]">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                On Bench
              </Label>
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search players..."
                  value={team2Search}
                  onChange={(e) => setTeam2Search(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectLastMatchXI("team2")}
                className="text-xs h-8 w-full"
              >
                Select last match playing XI
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic flex items-center gap-1">
                <Star className="h-3 w-3" />
                Star represents the player on bench
              </p>
              <div className="border border-slate-200 dark:border-slate-700 rounded-md flex-1 min-h-0 overflow-y-auto">
                {filteredTeam2Bench.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 last:border-0"
                  >
                    <Checkbox
                      checked={player.playerId ? team2Squad.playingXI.includes(player.playerId) : false}
                      onCheckedChange={() =>
                        togglePlayerToPlayingXI("team2", player.id)
                      }
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                      {player.name}
                    </span>
                    <button
                      onClick={() => toggleFavorite("team2", player.id)}
                      className="mr-1"
                    >
                      <Star
                        className={`h-4 w-4 ${player.isFavorite
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-300 dark:text-slate-600"
                          }`}
                      />
                    </button>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        side="left"
                        sideOffset={4}
                        alignOffset={0}
                        className="w-48 z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg -translate-x-[200px]"
                      >
                        <DropdownMenuItem
                          onSelect={() => handlePlayerRole(player.name, "captain")}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {playerRoles[player.name]?.captain
                            ? "Remove Captain"
                            : "Choose Captain"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "viceCaptain")
                          }
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          {playerRoles[player.name]?.viceCaptain
                            ? "Remove Vice Captain"
                            : "Choose Vice Captain"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "wicketKeeper")
                          }
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          {playerRoles[player.name]?.wicketKeeper
                            ? "Remove Wicket Keeper"
                            : "Choose Wicket Keeper"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "role", "batsman")
                          }
                        >
                          <User className="h-4 w-4 mr-2" />
                          Batsman
                          {playerRoles[player.name]?.role === "batsman" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "role", "bowler")
                          }
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Bowler
                          {playerRoles[player.name]?.role === "bowler" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(player.name, "role", "allRounder")
                          }
                        >
                          <Users className="h-4 w-4 mr-2" />
                          All Rounder
                          {playerRoles[player.name]?.role === "allRounder" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

