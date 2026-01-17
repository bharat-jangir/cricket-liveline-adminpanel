import { useState, useEffect, useCallback, useRef } from "react";
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
  Zap,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { LiveMatchService, type MatchSquad } from "../../services/live-match.service";
import { MatchService } from "../../services/match.service";
import { SeriesTeamsService } from "../../services/series-teams.service";
import { UmpireSelect } from "../ui/umpire-select";
import { VenueSelect } from "../ui/venue-select";
import { venueService } from "../../services/venue.service";
import type { Venue } from "../../types/venue";

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
  venueId?: string;
  venueObj?: Venue;
}

interface Player {
  id: number;
  name: string;
  isFavorite: boolean;
  isImpactPlayer?: boolean;
  playerId?: string; // Store player ID for API calls
}

interface Squad {
  playingXI: string[]; // Store player IDs, not names
  onBench: Player[];
  playerNameMap?: Map<string, string>; // Map of playerId -> playerName
}

interface PlayerRoles {
  [playerName: string]: {
    captain?: boolean;
    wicketKeeper?: boolean;
    viceCaptain?: boolean;
    impact?: boolean;
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
  const [selectedVenueId, setSelectedVenueId] = useState("");

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
  const [teamFormBangladesh, setTeamFormBangladesh] = useState("");
  const [teamFormIndia, setTeamFormIndia] = useState("");
  const [headToHeadTeam1, setHeadToHeadTeam1] = useState("");
  const [headToHeadTeam2, setHeadToHeadTeam2] = useState("");

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

          // Transform playing XI - store player IDs and create player map
          const playingXI = (squad.playingXI || []).map((p: any) => {
            if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
              return p._id || String(p);
            }
            return String(p);
          });

          // Transform ALL squad players (playing XI + bench) into a master list
          const allSquadPlayers = [...(squad.playingXI || []), ...(squad.bench || [])];
          const allPlayersForState = allSquadPlayers.map((p: any, idx: number) => {
            let playerName: string;
            let playerId: string;

            if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
              playerName = p.name || p.fullName || 'Unknown';
              playerId = (p._id || p.id || String(p)).toString();
            } else {
              playerId = String(p);
              playerName = 'Player ' + playerId.substring(playerId.length - 4); // Fallback to last 4 chars of ID if unknown
            }

            return {
              id: idx + 1,
              name: playerName,
              isFavorite: false,
              playerId: playerId,
            };
          });

          // Create robust player map from the master list
          const playerNameMap = new Map<string, string>();
          allPlayersForState.forEach(p => {
            if (p.playerId) {
              playerNameMap.set(p.playerId, p.name);
            }
          });

          console.log('Transformed Playing XI:', playingXI);
          console.log('Transformed All Players:', allPlayersForState);

          // Extract role information from squad
          const captainId = typeof squad.captainId === 'object' && squad.captainId !== null
            ? (squad.captainId as any)._id : squad.captainId;
          const viceCaptainId = typeof squad.viceCaptainId === 'object' && squad.viceCaptainId !== null
            ? (squad.viceCaptainId as any)._id : squad.viceCaptainId;
          const wicketKeeperId = typeof squad.wicketKeeperId === 'object' && squad.wicketKeeperId !== null
            ? (squad.wicketKeeperId as any)._id : squad.wicketKeeperId;
          const impactPlayerId = typeof squad.impactPlayerId === 'object' && squad.impactPlayerId !== null
            ? (squad.impactPlayerId as any)._id : squad.impactPlayerId;

          // Update player roles
          const newRoles: PlayerRoles = {};

          allPlayersForState.forEach((player) => {
            const pid = player.playerId;
            newRoles[String(pid)] = {
              captain: String(pid) === String(captainId),
              viceCaptain: String(pid) === String(viceCaptainId),
              wicketKeeper: String(pid) === String(wicketKeeperId),
              impact: String(pid) === String(impactPlayerId),
            };
          });
          setPlayerRoles(prev => ({ ...prev, ...newRoles }));

          if (String(teamId) === String(team1Id)) {
            console.log('Setting Team 1 squad:', { playingXI, onBench: allPlayersForState });
            setTeam1Squad({ playingXI, onBench: allPlayersForState, playerNameMap } as any);
          } else if (String(teamId) === String(team2Id)) {
            console.log('Setting Team 2 squad:', { playingXI, onBench: allPlayersForState });
            setTeam2Squad({ playingXI, onBench: allPlayersForState, playerNameMap } as any);
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


  const initialDetailsLoadDone = useRef(false);
  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!matchId || initialDetailsLoadDone.current) return;
      try {
        const data = await LiveMatchService.getMatchDetails(matchId);
        if (data) {
          if (data.toss?.tossText) setToss(data.toss.tossText);
          if (data.officials?.umpire1Id) setStraightUmpire(typeof data.officials.umpire1Id === 'string' ? data.officials.umpire1Id : data.officials.umpire1Id._id);
          if (data.officials?.umpire2Id) setLegUmpire(typeof data.officials.umpire2Id === 'string' ? data.officials.umpire2Id : data.officials.umpire2Id._id);
          if (data.officials?.thirdUmpireId) setThirdUmpire(typeof data.officials.thirdUmpireId === 'string' ? data.officials.thirdUmpireId : data.officials.thirdUmpireId._id);
          if (data.officials?.refereeId) setReferee(typeof data.officials.refereeId === 'string' ? data.officials.refereeId : data.officials.refereeId._id);
          if (data.conditions?.pitchReport) setPitchReport(data.conditions.pitchReport);
          if (data.conditions?.pitchCondition) setPitchBehaviour(data.conditions.pitchCondition);
          if (data.headToHead) {
            if (data.headToHead.team1Wins !== undefined) setHeadToHeadTeam1(String(data.headToHead.team1Wins));
            if (data.headToHead.team2Wins !== undefined) setHeadToHeadTeam2(String(data.headToHead.team2Wins));
          }
          if (data.teamForm) {
            if (data.teamForm.team1Form) setTeamFormBangladesh(data.teamForm.team1Form);
            if (data.teamForm.team2Form) setTeamFormIndia(data.teamForm.team2Form);
          }
          if (data.venueId) {
            setSelectedVenueId(typeof data.venueId === 'string' ? data.venueId : data.venueId._id);
          }
        }
        initialDetailsLoadDone.current = true;
      } catch (error) {
        console.error('Failed to fetch match details:', error);
      }
    };

    const loadData = async () => {
      await loadSquads();
      await fetchMatchDetails();

      // Load toss from matchData if available (as fallback)
      if (matchData?.toss && !toss) {
        setToss(matchData.toss);
      }
    };

    loadData();
  }, [matchId, loadSquads]); // Only re-run if matchId or loadSquads reference changes

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
    team: "team1" | "team2",
    playerId: string,
    roleType: "captain" | "wicketKeeper" | "viceCaptain" | "role" | "impact",
    value?: "batsman" | "bowler" | "allRounder"
  ) => {
    const current = playerRoles[playerId] || {};
    let newRoles: PlayerRoles;
    if (roleType === "role") {
      newRoles = {
        ...playerRoles,
        [playerId]: { ...current, role: value },
      };
    } else {
      const isEnabling = !current[roleType];
      newRoles = { ...playerRoles };

      // If enabling a role that should be unique (captain, viceCaptain, wicketKeeper, impact),
      // remove it from everyone else on the same team first
      if (isEnabling && (roleType === "captain" || roleType === "viceCaptain" || roleType === "wicketKeeper" || roleType === "impact")) {
        const teamSquad = team === "team1" ? team1Squad : team2Squad;
        const teamPlayerIds = teamSquad.onBench.map(p => p.playerId).filter(Boolean);

        teamPlayerIds.forEach(pid => {
          if (newRoles[pid as string]) {
            newRoles[pid as string] = { ...newRoles[pid as string], [roleType]: false };
          }
        });
      }

      newRoles[playerId] = { ...current, [roleType]: !current[roleType] };
    }
    setPlayerRoles(newRoles);
  };

  const handleSelectLastMatchXI = (team: "team1" | "team2") => {
    if (team === "team1") {
      setTeam1Squad({
        ...team1Squad,
        playingXI: team1Squad.onBench.map((p) => p.playerId!).filter(Boolean),
      });
    } else {
      setTeam2Squad({
        ...team2Squad,
        playingXI: team2Squad.onBench.map((p) => p.playerId!).filter(Boolean),
      });
    }
  };

  const togglePlayerToPlayingXI = (
    team: "team1" | "team2",
    playerId: string
  ) => {
    if (team === "team1") {
      const isInPlayingXI = team1Squad.playingXI.includes(playerId);
      setTeam1Squad({
        ...team1Squad,
        playingXI: isInPlayingXI
          ? team1Squad.playingXI.filter((id) => id !== playerId)
          : [...team1Squad.playingXI, playerId],
      });
    } else {
      const isInPlayingXI = team2Squad.playingXI.includes(playerId);
      setTeam2Squad({
        ...team2Squad,
        playingXI: isInPlayingXI
          ? team2Squad.playingXI.filter((id) => id !== playerId)
          : [...team2Squad.playingXI, playerId],
      });
    }
  };

  const toggleImpactPlayer = (team: "team1" | "team2", playerId: string) => {
    if (team === "team1") {
      setTeam1Squad({
        ...team1Squad,
        onBench: team1Squad.onBench.map((p) =>
          p.playerId === playerId ? { ...p, isImpactPlayer: !p.isImpactPlayer } : p
        ),
      });
    } else {
      setTeam2Squad({
        ...team2Squad,
        onBench: team2Squad.onBench.map((p) =>
          p.playerId === playerId ? { ...p, isImpactPlayer: !p.isImpactPlayer } : p
        ),
      });
    }
  };

  const toggleFavorite = (team: "team1" | "team2", playerId: string) => {
    if (team === "team1") {
      setTeam1Squad({
        ...team1Squad,
        onBench: team1Squad.onBench.map((p) =>
          p.playerId === playerId ? { ...p, isFavorite: !p.isFavorite } : p
        ),
      });
    } else {
      setTeam2Squad({
        ...team2Squad,
        onBench: team2Squad.onBench.map((p) =>
          p.playerId === playerId ? { ...p, isFavorite: !p.isFavorite } : p
        ),
      });
    }
  };

  // Save squad for a team
  const saveSquad = async (teamId: string, squad: Squad, teamName: string) => {
    // playingXI already contains player IDs
    const playingXIIds = squad.playingXI.filter((id): id is string => id !== undefined && id !== null);

    // Get bench player IDs from the bench array (only players NOT in playing XI)
    const benchIds = squad.onBench
      .filter(p => p.playerId && !squad.playingXI.includes(p.playerId))
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

    const getRolePlayerId = (roleType: 'captain' | 'viceCaptain' | 'wicketKeeper' | 'impact'): string | null => {
      const teamPlayerIds = allPlayers.map(p => p?.id).filter(Boolean);
      const entry = Object.entries(playerRoles).find(([pid, roles]) =>
        teamPlayerIds.includes(pid) && roles[roleType]
      );
      return entry ? entry[0] : null;
    };

    const updateDto = {
      playingXI: playingXIIds,
      bench: benchIds,
      captainId: getRolePlayerId('captain'),
      viceCaptainId: getRolePlayerId('viceCaptain'),
      wicketKeeperId: getRolePlayerId('wicketKeeper'),
      impactPlayerId: getRolePlayerId('impact'),
    };

    await LiveMatchService.updateMatchSquad(matchId, teamId, updateDto);
  };

  // Save general match info only
  const handleSaveGeneralInfo = async () => {
    if (!matchId) return;
    try {
      setSaving(true);

      const matchDetailsData: any = {
        toss: toss ? {
          tossText: toss,
        } : undefined,
        officials: {
          umpire1Id: straightUmpire || undefined,
          umpire2Id: legUmpire || undefined,
          thirdUmpireId: thirdUmpire || undefined,
          refereeId: referee || undefined,
        },
        conditions: {
          pitchReport: pitchReport || undefined,
          pitchCondition: pitchBehaviour || undefined,
        },
        headToHead: {
          team1Wins: parseInt(headToHeadTeam1) || 0,
          team2Wins: parseInt(headToHeadTeam2) || 0,
        },
        teamForm: {
          team1Form: teamFormBangladesh || undefined,
          team2Form: teamFormIndia || undefined,
        },
      };

      if (selectedVenueId) {
        matchDetailsData.venueId = selectedVenueId;
      }

      // Save to database via API - use match-details endpoint
      await LiveMatchService.updateMatchDetails(matchId, matchDetailsData);
      toast.success('General info updated successfully');
    } catch (error: any) {
      console.error('Failed to save general info:', error);
      toast.error(error.response?.data?.userMessage || error.message || 'Failed to save general info');
    } finally {
      setSaving(false);
    }
  };

  // Save squads only
  const handleSaveSquads = async () => {
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

      toast.success('Squads updated successfully');
      await loadSquads();
    } catch (error: any) {
      console.error('Failed to save squads:', error);
      // Error message is already shown in saveSquad function via toast
      if (!error.message || !error.message.includes('Playing XI must have exactly')) {
        toast.error(error.response?.data?.userMessage || error.message || 'Failed to save squads');
      }
    } finally {
      setSaving(false);
    }
  };

  // Create a complete player lookup map for both teams
  const getAllPlayers = (squad: Squad) => {
    const playerMap = new Map<string, string>();
    squad.onBench.forEach(player => {
      if (player.playerId && player.name) {
        playerMap.set(player.playerId, player.name);
      }
    });
    console.log('Player map:', Object.fromEntries(playerMap));
    return playerMap;
  };

  const team1PlayerMap = getAllPlayers(team1Squad);
  const team2PlayerMap = getAllPlayers(team2Squad);

  console.log('Team1 Playing XI:', team1Squad.playingXI);
  console.log('Team1 Player Map:', Object.fromEntries(team1PlayerMap));
  console.log('Player Roles:', playerRoles);

  const filteredTeam1Bench = team1Squad.onBench.filter((p) => {
    const isInPlayingXI = team1Squad.playingXI.includes(p.playerId!);
    const matchesSearch = p.name.toLowerCase().includes(debouncedTeam1Search.toLowerCase());
    return !isInPlayingXI && matchesSearch;
  });
  const filteredTeam2Bench = team2Squad.onBench.filter((p) => {
    const isInPlayingXI = team2Squad.playingXI.includes(p.playerId!);
    const matchesSearch = p.name.toLowerCase().includes(debouncedTeam2Search.toLowerCase());
    return !isInPlayingXI && matchesSearch;
  });

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

        {/* Right Side: Update Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={handleSaveGeneralInfo}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Update General Info'
            )}
          </Button>
          <Button
            size="sm"
            variant="default"
            className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSaveSquads}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Update Squads'
            )}
          </Button>
        </div>
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
              <VenueSelect
                value={selectedVenueId}
                onChange={setSelectedVenueId}
                placeholder="Select venue"
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
              <UmpireSelect
                value={straightUmpire}
                onChange={setStraightUmpire}
                placeholder="Select straight umpire"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Leg Umpire
              </Label>
              <UmpireSelect
                value={legUmpire}
                onChange={setLegUmpire}
                placeholder="Select leg umpire"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Third Umpire
              </Label>
              <UmpireSelect
                value={thirdUmpire}
                onChange={setThirdUmpire}
                placeholder="Select third umpire"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Referee
              </Label>
              <UmpireSelect
                value={referee}
                onChange={setReferee}
                placeholder="Select referee"
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
                      const playerName = team1Squad.playerNameMap?.get(playerId) || team1PlayerMap.get(playerId) || 'Unknown Player';
                      const player = team1Squad.onBench.find(p => p.playerId === playerId);
                      const roles = playerRoles[playerId] || {};
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 p-2 bg-white dark:bg-slate-800 rounded border"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span>{idx + 1}. {playerName}</span>
                            {player?.isImpactPlayer && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 bg-orange-100 text-orange-700">
                                Impact
                              </Badge>
                            )}
                            {(() => {
                              return (
                                <>
                                  {roles.captain && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 font-bold">
                                      C
                                    </Badge>
                                  )}
                                  {roles.viceCaptain && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 font-bold">
                                      VC
                                    </Badge>
                                  )}
                                  {roles.wicketKeeper && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 font-bold">
                                      WK
                                    </Badge>
                                  )}
                                  {(roles.impact || player?.isImpactPlayer) && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 font-bold">
                                      <Zap className="h-2.5 w-2.5 mr-0.5 fill-orange-500" />
                                      Impact
                                    </Badge>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onSelect={() => handlePlayerRole("team1", playerId, "captain")}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  {playerRoles[playerId]?.captain ? "Remove Captain" : "Make Captain"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handlePlayerRole("team1", playerId, "viceCaptain")}>
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  {playerRoles[playerId]?.viceCaptain ? "Remove Vice Captain" : "Make Vice Captain"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handlePlayerRole("team1", playerId, "wicketKeeper")}>
                                  <UserCog className="h-4 w-4 mr-2" />
                                  {playerRoles[playerId]?.wicketKeeper ? "Remove Wicket Keeper" : "Make Wicket Keeper"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handlePlayerRole("team1", playerId, "impact")}>
                                  <Zap className="h-4 w-4 mr-2 text-orange-500" />
                                  {playerRoles[playerId]?.impact ? "Remove Impact Player" : "Make Impact Player"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => togglePlayerToPlayingXI('team1', playerId)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Remove from XI
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                        togglePlayerToPlayingXI("team1", player.playerId!)
                      }
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                      {player.name}
                    </span>
                    <button
                      onClick={() => toggleFavorite("team1", player.playerId!)}
                      className="mr-1"
                    >
                      <Star
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
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
                          onSelect={() => handlePlayerRole("team1", player.playerId!, "captain")}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {playerRoles[player.playerId!]?.captain
                            ? "Remove Captain"
                            : "Choose Captain"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole("team1", player.playerId!, "viceCaptain")
                          }
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          {playerRoles[player.playerId!]?.viceCaptain
                            ? "Remove Vice Captain"
                            : "Choose Vice Captain"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole("team1", player.playerId!, "wicketKeeper")
                          }
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          {playerRoles[player.playerId!]?.wicketKeeper
                            ? "Remove Wicket Keeper"
                            : "Choose Wicket Keeper"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole("team1", player.playerId!, "role", "batsman")
                          }
                        >
                          <User className="h-4 w-4 mr-2" />
                          Batsman
                          {playerRoles[player.playerId!]?.role === "batsman" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole("team1", player.playerId!, "role", "bowler")
                          }
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Bowler
                          {playerRoles[player.playerId!]?.role === "bowler" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(
                              "team1",
                              player.playerId!,
                              "role",
                              "allRounder"
                            )
                          }
                        >
                          <Users className="h-4 w-4 mr-2" />
                          All Rounder
                          {playerRoles[player.playerId!]?.role === "allRounder" && (
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
                  <div className="space-y-2">
                    {team2Squad.playingXI.map((playerId, idx) => {
                      const playerName = team2Squad.playerNameMap?.get(playerId) || team2PlayerMap.get(playerId) || 'Unknown Player';
                      const player = team2Squad.onBench.find(p => p.playerId === playerId);
                      const roles = playerRoles[playerId] || {};
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 p-2 bg-white dark:bg-slate-800 rounded border"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span>{idx + 1}. {playerName}</span>
                            {player?.isImpactPlayer && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 bg-orange-100 text-orange-700">
                                Impact
                              </Badge>
                            )}
                            {roles.captain && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 font-bold">
                                C
                              </Badge>
                            )}
                            {roles.viceCaptain && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 font-bold">
                                VC
                              </Badge>
                            )}
                            {roles.wicketKeeper && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 font-bold">
                                WK
                              </Badge>
                            )}
                            {(roles.impact || player?.isImpactPlayer) && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 font-bold">
                                <Zap className="h-2.5 w-2.5 mr-0.5 fill-orange-500" />
                                Impact
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onSelect={() => handlePlayerRole("team2", playerId, "captain")}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  {playerRoles[playerId]?.captain ? "Remove Captain" : "Make Captain"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handlePlayerRole("team2", playerId, "viceCaptain")}>
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  {playerRoles[playerId]?.viceCaptain ? "Remove Vice Captain" : "Make Vice Captain"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handlePlayerRole("team2", playerId, "wicketKeeper")}>
                                  <UserCog className="h-4 w-4 mr-2" />
                                  {playerRoles[playerId]?.wicketKeeper ? "Remove Wicket Keeper" : "Make Wicket Keeper"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handlePlayerRole("team2", playerId, "impact")}>
                                  <Zap className="h-4 w-4 mr-2 text-orange-500" />
                                  {playerRoles[playerId]?.impact ? "Remove Impact Player" : "Make Impact Player"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => togglePlayerToPlayingXI('team2', playerId)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Remove from XI
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                Filled star = On bench
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
                        togglePlayerToPlayingXI("team2", player.playerId!)
                      }
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                      {player.name}
                    </span>
                    <button
                      onClick={() => toggleFavorite("team2", player.playerId!)}
                      className="mr-1"
                    >
                      <Star
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
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
                          onSelect={() => handlePlayerRole("team2", player.playerId!, "captain")}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {playerRoles[player.playerId!]?.captain
                            ? "Remove Captain"
                            : "Choose Captain"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole("team2", player.playerId!, "viceCaptain")
                          }
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          {playerRoles[player.playerId!]?.viceCaptain
                            ? "Remove Vice Captain"
                            : "Choose Vice Captain"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole("team2", player.playerId!, "wicketKeeper")
                          }
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          {playerRoles[player.playerId!]?.wicketKeeper
                            ? "Remove Wicket Keeper"
                            : "Choose Wicket Keeper"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole("team2", player.playerId!, "role", "batsman")
                          }
                        >
                          <User className="h-4 w-4 mr-2" />
                          Batsman
                          {playerRoles[player.playerId!]?.role === "batsman" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole("team2", player.playerId!, "role", "bowler")
                          }
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Bowler
                          {playerRoles[player.playerId!]?.role === "bowler" && (
                            <span className="ml-auto">✓</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            handlePlayerRole(
                              "team2",
                              player.playerId!,
                              "role",
                              "allRounder"
                            )
                          }
                        >
                          <Users className="h-4 w-4 mr-2" />
                          All Rounder
                          {playerRoles[player.playerId!]?.role === "allRounder" && (
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

