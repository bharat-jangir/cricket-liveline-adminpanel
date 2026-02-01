import {
  ArrowLeft,
  BarChart3,
  Bell,
  ChevronUp,
  ChevronDown,
  FileText,
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Target,
  Trash2,
  User,
  UserCog,
  Users,
  Wifi,
} from "lucide-react";
import React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { MatchService } from "../../services/match.service";
import { LiveMatchService } from "../../services/live-match.service";
import { TeamService } from "../../services/team.service";
import type { Match } from "../../types/match";
import { Badge } from "../ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { LiveMatchInfoTab } from "./LiveMatchInfoTab";
import { LiveMatchLiveTab } from "./LiveMatchLiveTab";
import { LiveMatchCommentaryTab } from "./LiveMatchCommentaryTab";
import { LiveMatchAPTab } from "./LiveMatchAPTab";
import { LiveMatchPartnershipTab } from "./LiveMatchPartnershipTab";

export function LiveMatchView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<Match | null>(null);
  const [liveStatus, setLiveStatus] = useState<any>(null);

  // Fetch match data
  useEffect(() => {
    if (id) {
      loadMatchData();
      loadLiveStatus();
    }
  }, [id]);

  // Handle automatic tab switching when match is live
  useEffect(() => {
    if (matchData && matchData.status === 'live' && activeTab === 'info') {
      setActiveTab('live');
    }
  }, [matchData]);

  // Helper function to extract team name from populated or string ID
  const getTeamName = (teamId: any, teamField?: any): string => {
    // First, check if teamField (teamA/teamB) is a populated object (this is the actual populated data)
    if (teamField && typeof teamField === 'object' && teamField !== null && !Array.isArray(teamField)) {
      const name = (teamField as any)?.name || (teamField as any)?.shortName || (teamField as any)?.fullName || '';
      if (name) {
        console.log('Team name found in teamField:', name);
        return name;
      }
    }

    // Check if teamId is a populated object (when Mongoose populates, it replaces the ID with the object)
    if (teamId && typeof teamId === 'object' && teamId !== null && !Array.isArray(teamId)) {
      // Check if it's a Mongoose populated object (has _id and other properties)
      if ((teamId as any)?._id || (teamId as any)?.name) {
        const name = (teamId as any)?.name || (teamId as any)?.shortName || (teamId as any)?.fullName || '';
        if (name) {
          console.log('Team name found in teamId object:', name);
          return name;
        }
      }

      // If object has _id but no name, it might be a reference that wasn't fully populated
      if ((teamId as any)?._id) {
        console.warn('Team object found but no name property. Object keys:', Object.keys(teamId), 'Full object:', teamId);
      }
    }

    // If teamId is a string (ID), log warning as it should be populated
    if (typeof teamId === 'string' && teamId.length > 0) {
      console.warn('Team ID is a string (not populated):', teamId);
    }

    return '';
  };

  // Helper function to extract team ID
  const getTeamId = (teamId: any, teamField?: any): string => {
    // Check if teamId is a populated object
    if (teamId && typeof teamId === 'object' && teamId !== null && !Array.isArray(teamId)) {
      return (teamId as any)?._id || String(teamId);
    }
    // Check if teamField (teamA/teamB) is a populated object
    if (teamField && typeof teamField === 'object' && teamField !== null && !Array.isArray(teamField)) {
      return (teamField as any)?._id || String(teamId);
    }
    return String(teamId || '');
  };

  const loadMatchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await MatchService.getMatch(id);
      if (response.data?.result) {
        const match = response.data.result;

        // Detailed logging to debug team population
        const teamAName = getTeamName(match.teamAId, match.teamA);
        const teamBName = getTeamName(match.teamBId, match.teamB);

        console.log('Match data received:', {
          matchId: match._id,
          teamA: {
            teamAId: match.teamAId,
            teamA: match.teamA,
            teamAIdType: typeof match.teamAId,
            teamAIdIsObject: match.teamAId && typeof match.teamAId === 'object',
            teamAIdKeys: match.teamAId && typeof match.teamAId === 'object' ? Object.keys(match.teamAId) : [],
            teamAKeys: match.teamA && typeof match.teamA === 'object' ? Object.keys(match.teamA) : [],
            extractedName: teamAName,
          },
          teamB: {
            teamBId: match.teamBId,
            teamB: match.teamB,
            teamBIdType: typeof match.teamBId,
            teamBIdIsObject: match.teamBId && typeof match.teamBId === 'object',
            teamBIdKeys: match.teamBId && typeof match.teamBId === 'object' ? Object.keys(match.teamBId) : [],
            teamBKeys: match.teamB && typeof match.teamB === 'object' ? Object.keys(match.teamB) : [],
            extractedName: teamBName,
          },
        });

        // If teams aren't populated, log error with full match data
        if (!teamAName || !teamBName) {
          // Silently handle this as we have fallback logic below
        }

        // If teams aren't populated, try to fetch them manually
        if (!teamAName && match.teamAId) {
          const teamAIdStr = typeof match.teamAId === 'object' ? (match.teamAId as any)._id : match.teamAId;
          if (teamAIdStr) {
            try {
              const teamAResponse = await TeamService.getTeam(teamAIdStr.toString());
              if (teamAResponse.data && teamAResponse.data.result) {
                // Manually patch the match object
                match.teamA = teamAResponse.data.result;
                // Update the name variable
                if (teamAResponse.data.result.name) {
                  // Re-run getTeamName logic or just assign it
                  (match as any)._teamAName = teamAResponse.data.result.name;
                }
              }
            } catch (e) {
              console.error('Failed to fetch Team A details', e);
            }
          }
        }

        if (!teamBName && match.teamBId) {
          const teamBIdStr = typeof match.teamBId === 'object' ? (match.teamBId as any)._id : match.teamBId;
          if (teamBIdStr) {
            try {
              const teamBResponse = await TeamService.getTeam(teamBIdStr.toString());
              if (teamBResponse.data && teamBResponse.data.result) {
                // Manually patch the match object
                match.teamB = teamBResponse.data.result;
              }
            } catch (e) {
              console.error('Failed to fetch Team B details', e);
            }
          }
        }

        setMatchData(match);
      } else {
        console.error('No match data in response:', response);
        toast.error('No match data found');
      }
    } catch (error: any) {
      console.error('Failed to load match:', error);
      toast.error('Failed to load match data');
    } finally {
      setLoading(false);
    }
  };

  const loadLiveStatus = async () => {
    if (!id) return;
    try {
      const status = await LiveMatchService.getLiveStatus(id);
      if (status) {
        setLiveStatus(status);
      }
    } catch (error: any) {
      console.error('Failed to load live status:', error);
      // Don't show error toast for live status as it might not exist yet
    }
  };

  const transformedMatchData = useMemo(() => {
    if (!matchData) return undefined;

    // Try to get name via helper
    let team1Name = getTeamName(matchData.teamAId, matchData.teamA);
    let team2Name = getTeamName(matchData.teamBId, matchData.teamB);

    // If helper failed, check if we manually patched it or if fetched team is in teamA/teamB property directly
    if (!team1Name && (matchData as any)._teamAName) team1Name = (matchData as any)._teamAName;
    if (!team1Name && matchData.teamA?.name) team1Name = matchData.teamA.name;

    if (!team2Name && matchData.teamB?.name) team2Name = matchData.teamB.name;

    const team1Id = getTeamId(matchData.teamAId, matchData.teamA);
    const team2Id = getTeamId(matchData.teamBId, matchData.teamB);

    console.log('Transformed match data (memoized):', {
      team1Name,
      team2Name,
      team1Id,
      team2Id,
    });

    return {
      id: matchData._id || id || "101",
      status: (() => {
        const s = matchData.status || "scheduled";
        if (s === 'scheduled') return 'Upcoming';
        if (s === 'live') return 'Live';
        if (s === 'completed') return 'Finished';
        if (s === 'abandoned') return 'Abandoned';
        if (s === 'cancelled') return 'Cancelled';
        const str = s as string;
        return str.charAt(0).toUpperCase() + str.slice(1);
      })(),
      team1: {
        name: team1Name || 'Team 1',
        _id: team1Id,
      },
      team2: {
        name: team2Name || 'Team 2',
        _id: team2Id,
      },
      series: typeof matchData.seriesId === 'object' && matchData.seriesId !== null
        ? (matchData.seriesId as any)?.name || ''
        : typeof matchData.series === 'object' && matchData.series !== null
          ? matchData.series?.name || ''
          : '',
      matchTitle: matchData.title || '',
      date: matchData.matchDate ? new Date(matchData.matchDate).toLocaleDateString() : '',
      time: matchData.matchTime ? new Date(matchData.matchTime).toLocaleTimeString() : '',
      venueId: matchData.venueId,
      venue: typeof matchData.venueId === 'object' && matchData.venueId !== null
        ? (matchData.venueId as any)?.name || ''
        : typeof matchData.venue === 'object' && matchData.venue !== null
          ? matchData.venue?.name || ''
          : '',
      toss: typeof matchData.toss === 'object' && matchData.toss !== null
        ? (matchData as any).toss?.tossText || ""
        : (matchData.toss as string) || "",
      straightUmpire: "",
      legUmpire: "",
      thirdUmpire: "",
      referee: "",
      pitchReport: "",
      ballsPerOver: matchData.ballsPerOver,
      oversPerInning: matchData.oversPerInning,
    };
  }, [matchData, id]);

  // Mock squad data
  const [team1Squad, setTeam1Squad] = useState({
    playingXI: [] as string[],
    onBench: [
      { id: 1, name: "Shakib Al Hasan", isFavorite: false },
      { id: 2, name: "Litton Das", isFavorite: false },
      { id: 3, name: "Najmul Hossain Shanto", isFavorite: false },
      { id: 4, name: "Mushfiqur Rahim", isFavorite: false },
      { id: 5, name: "Mahmudullah", isFavorite: false },
      { id: 6, name: "Taskin Ahmed", isFavorite: false },
      { id: 7, name: "Mustafizur Rahman", isFavorite: false },
    ],
  });

  const [team2Squad, setTeam2Squad] = useState({
    playingXI: [] as string[],
    onBench: [
      { id: 1, name: "Dasun Shanaka", isFavorite: false },
      { id: 2, name: "Kusal Mendis", isFavorite: false },
      { id: 3, name: "Kusal Perera", isFavorite: false },
      { id: 4, name: "Dhananjaya de Silva", isFavorite: false },
      { id: 5, name: "Wanindu Hasaranga", isFavorite: false },
      { id: 6, name: "Maheesh Theekshana", isFavorite: false },
      { id: 7, name: "Pathum Nissanka", isFavorite: false },
    ],
  });

  // Player roles state: { playerName: { captain, wicketKeeper, viceCaptain, role } }
  const [playerRoles, setPlayerRoles] = useState<
    Record<
      string,
      {
        captain?: boolean;
        wicketKeeper?: boolean;
        viceCaptain?: boolean;
        role?: "batsman" | "bowler" | "allRounder";
      }
    >
  >({});

  const [team1Search, setTeam1Search] = useState("");
  const [team2Search, setTeam2Search] = useState("");
  const [pitchBehaviour, setPitchBehaviour] = useState("");
  const [teamFormBangladesh, setTeamFormBangladesh] = useState("L.L.W.W.L.W");
  const [teamFormIndia, setTeamFormIndia] = useState("");
  const [headToHeadTeam1, setHeadToHeadTeam1] = useState("3");
  const [headToHeadTeam2, setHeadToHeadTeam2] = useState("7");
  const [isConnected, setIsConnected] = useState(true);

  // Partnership state
  const [partnerships, setPartnerships] = useState([
    {
      id: 1,
      batsman: '104',
      nbKey: 'PA',
      obKey: 'SU',
      nbName: '',
      obName: '',
      nbRun: '',
      obRun: '',
      nbBall: '',
      obBall: '',
      score: '',
      wicket: '',
    },
    {
      id: 2,
      batsman: '',
      nbKey: '',
      obKey: '',
      nbName: '',
      obName: '',
      nbRun: '',
      obRun: '',
      nbBall: '',
      obBall: '',
      score: '',
      wicket: '',
    },
    {
      id: 3,
      batsman: '',
      nbKey: '',
      obKey: '',
      nbName: '',
      obName: '',
      nbRun: '',
      obRun: '',
      nbBall: '',
      obBall: '',
      score: '',
      wicket: '',
    },
  ]);

  const [selectedInning, setSelectedInning] = useState('1');

  const handleAddPartnershipRow = (afterId?: number) => {
    const newRow = {
      id: Math.max(...partnerships.map(p => p.id), 0) + 1,
      batsman: '',
      nbKey: '',
      obKey: '',
      nbName: '',
      obName: '',
      nbRun: '',
      obRun: '',
      nbBall: '',
      obBall: '',
      score: '',
      wicket: '',
    };

    if (afterId) {
      const afterIndex = partnerships.findIndex(p => p.id === afterId);
      const newPartnerships = [...partnerships];
      newPartnerships.splice(afterIndex + 1, 0, newRow);
      setPartnerships(newPartnerships);
    } else {
      setPartnerships([...partnerships, newRow]);
    }
  };

  const handleDeletePartnershipRow = (id: number) => {
    setPartnerships(partnerships.filter(p => p.id !== id));
  };

  const handlePartnershipChange = (id: number, field: string, value: string) => {
    setPartnerships(partnerships.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Commentary state
  const [commentary, setCommentary] = useState([
    {
      id: 1,
      over: "44.5",
      score: "210/8",
      bowler: "J Bumrah",
      batsman: "Linda",
      ballResult: "1/wd",
      commentaryText:
        "Fuller length around off, Linda works it away to the short fine leg region for a single.",
      isVoiceCard: false,
      isLinked: false,
      checkbox1: false,
      checkbox2: false,
    },
    {
      id: 2,
      over: "44.6",
      score: "211/8",
      bowler: "M Klaas",
      batsman: "L Tahuhu",
      ballResult: "2",
      commentaryText:
        "Fuller length around off, Tahuhu works it away to the short fine leg region for a couple of runs to end the over.",
      isVoiceCard: false,
      isLinked: false,
      checkbox1: false,
      checkbox2: false,
    },
    {
      id: 3,
      over: "45.1",
      score: "213/8",
      bowler: "M Kapp",
      batsman: "H Rowe",
      ballResult: "1",
      commentaryText:
        "Fuller length around off, Rowe works it away to the short fine leg region for a single.",
      isVoiceCard: false,
      isLinked: false,
      checkbox1: false,
      checkbox2: false,
    },
  ]);

  const [overSummary, setOverSummary] = useState({
    currentOver: "45",
    recentBalls: ["1", "1", "2", "w", "d", "1", "w", "0", "3"],
    batsmen: [
      { name: "Lea Tahuhu", runs: 3, balls: 11 },
      { name: "Hannah Rowe", runs: 21, balls: 41 },
    ],
    bowler: { name: "Marizanne Kapp", wickets: 2, runs: 46, overs: 8.0 },
    teamScore: "New Zealand Women 212/8",
  });

  const handleAddNormalBall = (afterBallId?: number) => {
    // If afterBallId is provided, insert after that ball with next ball number
    let newOver = "45.1";
    let newScore = "213/8";

    if (afterBallId) {
      const afterBall = commentary.find((b) => b.id === afterBallId);
      if (afterBall) {
        // Parse the over (e.g., "45.1" -> over: 45, ball: 1)
        const [overNum, ballNum] = afterBall.over.split(".").map(Number);
        const newBallNum = ballNum + 1; // Increment ball number

        if (newBallNum <= 6) {
          // Same over, next ball (e.g., 45.1 -> 45.2)
          newOver = `${overNum}.${newBallNum}`;
        } else {
          // Move to next over, ball 1 (e.g., 45.6 -> 46.1)
          newOver = `${overNum + 1}.1`;
        }
        newScore = afterBall.score;
      }
    }

    const newBall = {
      id: Math.max(...commentary.map((b) => b.id), 0) + 1,
      over: newOver,
      score: newScore,
      bowler: "",
      batsman: "",
      ballResult: "",
      commentaryText: "",
      isVoiceCard: false,
      isLinked: false,
      checkbox1: false,
      checkbox2: false,
    };

    if (afterBallId) {
      // Insert the new ball right after the current ball
      const afterIndex = commentary.findIndex((b) => b.id === afterBallId);
      const newCommentary = [...commentary];
      newCommentary.splice(afterIndex + 1, 0, newBall);
      setCommentary(newCommentary);
    } else {
      setCommentary([newBall, ...commentary]);
    }
  };

  // Sort commentary in descending order (44.6, 44.5, 44.3...)
  const sortedCommentary = [...commentary].sort((a, b) => {
    const [aOver, aBall] = a.over.split(".").map(Number);
    const [bOver, bBall] = b.over.split(".").map(Number);

    if (aOver !== bOver) {
      return bOver - aOver; // Descending by over
    }
    return bBall - aBall; // Descending by ball number
  });

  const handleDeleteBall = (ballId: number) => {
    setCommentary(commentary.filter((ball) => ball.id !== ballId));
  };

  const handlePlayerRole = (
    playerName: string,
    roleType: "captain" | "wicketKeeper" | "viceCaptain" | "role",
    value?: "batsman" | "bowler" | "allRounder"
  ) => {
    setPlayerRoles((prev) => {
      const current = prev[playerName] || {};
      if (roleType === "role") {
        return {
          ...prev,
          [playerName]: { ...current, role: value },
        };
      } else {
        // For captain, wicketKeeper, viceCaptain - toggle boolean
        const boolValue =
          roleType === "captain" ||
          roleType === "wicketKeeper" ||
          roleType === "viceCaptain";
        return {
          ...prev,
          [playerName]: { ...current, [roleType]: !current[roleType] },
        };
      }
    });
  };

  const handleSelectLastMatchXI = (team: "team1" | "team2") => {
    // Mock: Select all players from bench as playing XI
    if (team === "team1") {
      setTeam1Squad((prev) => ({
        ...prev,
        playingXI: prev.onBench.map((p) => p.name),
      }));
    } else {
      setTeam2Squad((prev) => ({
        ...prev,
        playingXI: prev.onBench.map((p) => p.name),
      }));
    }
  };

  const togglePlayerToPlayingXI = (
    team: "team1" | "team2",
    playerId: number
  ) => {
    if (team === "team1") {
      setTeam1Squad((prev) => {
        const player = prev.onBench.find((p) => p.id === playerId);
        if (!player) return prev;

        const isInPlayingXI = prev.playingXI.includes(player.name);
        return {
          ...prev,
          playingXI: isInPlayingXI
            ? prev.playingXI.filter((name) => name !== player.name)
            : [...prev.playingXI, player.name],
        };
      });
    } else {
      setTeam2Squad((prev) => {
        const player = prev.onBench.find((p) => p.id === playerId);
        if (!player) return prev;

        const isInPlayingXI = prev.playingXI.includes(player.name);
        return {
          ...prev,
          playingXI: isInPlayingXI
            ? prev.playingXI.filter((name) => name !== player.name)
            : [...prev.playingXI, player.name],
        };
      });
    }
  };

  const toggleFavorite = (team: "team1" | "team2", playerId: number) => {
    if (team === "team1") {
      setTeam1Squad((prev) => ({
        ...prev,
        onBench: prev.onBench.map((p) =>
          p.id === playerId ? { ...p, isFavorite: !p.isFavorite } : p
        ),
      }));
    } else {
      setTeam2Squad((prev) => ({
        ...prev,
        onBench: prev.onBench.map((p) =>
          p.id === playerId ? { ...p, isFavorite: !p.isFavorite } : p
        ),
      }));
    }
  };

  const filteredTeam1Bench = team1Squad.onBench.filter((p) =>
    p.name.toLowerCase().includes(team1Search.toLowerCase())
  );
  const filteredTeam2Bench = team2Squad.onBench.filter((p) =>
    p.name.toLowerCase().includes(team2Search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("live")) {
      return "bg-red-500 text-white";
    }
    if (s.includes("break") || s.includes("upcoming") || s.includes("scheduled")) {
      return "bg-yellow-500 text-white";
    }
    if (s.includes("finished") || s.includes("completed")) {
      return "bg-green-600 text-white";
    }
    if (s.includes("abandoned") || s.includes("cancelled")) {
      return "bg-red-700 text-white";
    }
    return "bg-slate-500 text-white";
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col overflow-hidden">
      {/* Header Strip */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 h-16">
          {/* Left Side: Back Button, Status, Teams */}
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/matches")}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {transformedMatchData && (
              <div className="flex items-center gap-3">
                <Badge
                  className={`${getStatusColor(
                    transformedMatchData.status
                  )} text-xs px-2 py-1 font-semibold`}
                >
                  {transformedMatchData.status}
                </Badge>

                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                  <span>{transformedMatchData.team1.name || 'Team 1'}</span>
                  <span className="text-slate-400 dark:text-slate-500">vs</span>
                  <span>{transformedMatchData.team2.name || 'Team 2'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Center: Tabs */}
          <div className="flex-1 flex justify-center">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-auto"
            >
              <TabsList className="bg-slate-100 dark:bg-slate-800 h-9">
                <TabsTrigger
                  value="info"
                  className="text-xs px-4 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:font-semibold"
                >
                  Info
                </TabsTrigger>
                <TabsTrigger
                  value="live"
                  className="text-xs px-4 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:font-semibold"
                >
                  Live
                </TabsTrigger>
                <TabsTrigger
                  value="commentary"
                  className="text-xs px-4 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:font-semibold"
                >
                  Commentary
                </TabsTrigger>
                <TabsTrigger
                  value="ap#"
                  className="text-xs px-4 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:font-semibold"
                >
                  AP#
                </TabsTrigger>
                <TabsTrigger
                  value="partnership"
                  className="text-xs px-4 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:font-semibold"
                >
                  Partnership
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right Side: Empty for now, can add actions later */}
          <div className="flex-1 flex-end">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm ml-auto">
                <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-1 relative">
        <div className="max-w-[1600px] mx-auto h-full flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full h-full flex flex-col"
          >
            {/* Info Tab */}
            {activeTab === "info" && transformedMatchData && matchData && (
              <LiveMatchInfoTab
                matchData={transformedMatchData}
                matchId={id || ''}
                team1Id={transformedMatchData.team1._id}
                team2Id={transformedMatchData.team2._id}
                seriesId={typeof matchData.seriesId === 'object' && matchData.seriesId !== null
                  ? (matchData.seriesId as any)._id
                  : typeof matchData.seriesId === 'string'
                    ? matchData.seriesId
                    : undefined}
                matchFormat={matchData.matchFormat}
              />
            )}

            {/* Live Tab */}
            {activeTab === "live" && transformedMatchData && (
              <LiveMatchLiveTab
                matchId={id || ''}
                matchData={transformedMatchData}
                matchFormat={matchData?.matchFormat}
                liveStatus={liveStatus}
                ballsPerOver={transformedMatchData.ballsPerOver}
                oversPerInning={transformedMatchData.oversPerInning}
              />
            )}

            {/* Commentary Tab */}
            {activeTab === "commentary" && (
              <LiveMatchCommentaryTab
                matchId={id || ''}
              />
            )}

            {/* AP# Tab */}
            {activeTab === "ap#" && <LiveMatchAPTab />}

            {/* Partnership Tab */}
            {activeTab === "partnership" && (
              <LiveMatchPartnershipTab
                partnerships={partnerships}
                onPartnershipsChange={setPartnerships}
              />
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
