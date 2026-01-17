import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";
import { MatchService } from "../../services/match.service";
import { LiveMatchService } from "../../services/live-match.service";
import type { Match } from "../../types/match";
import type { LiveMatchStatus } from "../../services/live-match.service";

interface TransformedMatch {
  id: string;
  gi: string;
  date: string;
  status: string;
  series: string;
  seriesId?: string;
  matchTitle: string;
  team1: {
    name: string;
    score: string;
    over?: string;
    logo?: string;
    commentary?: string;
  };
  team2: {
    name: string;
    score: string;
    over?: string;
    logo?: string;
    commentary?: string;
  };
  odds: {
    teamName: string;
    back: number;
    lay: number;
  };
  fKeyInn?: string;
  inn?: string;
  comment?: string;
}

export function MatchesView() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<TransformedMatch[]>([]);
  const [apiMatches, setApiMatches] = useState<Match[]>([]);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveMatchStatus>>({});

  // Load matches
  useEffect(() => {
    loadMatches();
  }, []);

  // Update matches when live statuses change
  useEffect(() => {
    if (apiMatches.length > 0) {
      const transformed = transformMatches(apiMatches, liveStatuses);
      setMatches(transformed);
    }
  }, [apiMatches, liveStatuses]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await MatchService.getAllMatches({ limit: 1000 });

      if (response.status && response.data?.result) {
        const matches = response.data.result;
        console.log('Matches loaded:', matches.length);
        if (matches.length > 0) {
          console.log('Sample match structure:', {
            teamAId: matches[0].teamAId,
            teamBId: matches[0].teamBId,
            teamA: matches[0].teamA,
            teamB: matches[0].teamB,
            teamAIdType: typeof matches[0].teamAId,
            teamBIdType: typeof matches[0].teamBId,
          });
        }
        setApiMatches(matches);

        // Load live statuses for live matches
        const liveMatches = matches.filter((m: Match) => m.status === 'live');
        if (liveMatches.length > 0) {
          loadLiveStatuses(liveMatches);
        }
      }
    } catch (error: any) {
      console.error('Failed to load matches:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const loadLiveStatuses = async (liveMatches: Match[]) => {
    const statusPromises = liveMatches.map(async (match) => {
      try {
        const status = await LiveMatchService.getLiveStatus(match._id || '');
        return { matchId: match._id || '', status };
      } catch (error) {
        return { matchId: match._id || '', status: null };
      }
    });

    const results = await Promise.all(statusPromises);
    const statusMap: Record<string, LiveMatchStatus> = {};
    results.forEach(({ matchId, status }) => {
      if (status) {
        statusMap[matchId] = status;
      }
    });
    setLiveStatuses(statusMap);
  };

  // Helper function to extract team object from populated field
  const getTeamObject = (teamIdField: any, teamField?: any) => {
    // Check if teamIdField is a populated object (has _id and name properties)
    if (teamIdField && typeof teamIdField === 'object' && teamIdField !== null && !Array.isArray(teamIdField)) {
      if (teamIdField._id || teamIdField.name || teamIdField.shortName) {
        return teamIdField;
      }
    }
    // Check if teamField exists separately
    if (teamField && typeof teamField === 'object' && teamField !== null && !Array.isArray(teamField)) {
      if (teamField._id || teamField.name || teamField.shortName) {
        return teamField;
      }
    }
    return null;
  };

  const transformMatches = (apiMatches: Match[], liveStatuses: Record<string, LiveMatchStatus>): TransformedMatch[] => {
    return apiMatches.map((match) => {
      // Extract team objects - check both teamAId/teamBId (populated) and teamA/teamB (if exists)
      const teamA = getTeamObject(match.teamAId, match.teamA);
      const teamB = getTeamObject(match.teamBId, match.teamB);

      // Handle series - can be populated object or just seriesId string
      let series = null;
      if (typeof match.series === 'object' && match.series !== null) {
        series = match.series;
      } else if (match.seriesId) {
        // If seriesId is populated as object
        if (typeof match.seriesId === 'object' && match.seriesId !== null) {
          series = match.seriesId;
        }
      }

      // Get live status if available
      const liveStatus = liveStatuses[match._id || ''];
      let team1Score = '–';
      let team1Over = '';
      let team2Score = '–';
      let team2Over = '';

      if (liveStatus && match.status === 'live') {
        const [runs, wickets] = liveStatus.score?.split('/') || ['0', '0'];
        team1Score = `${runs}/${wickets}`;
        team1Over = liveStatus.overs || '';
      }

      return {
        id: match._id || '',
        gi: match.matchNumber || `GI-${match._id?.substring(0, 4) || '0000'}`,
        date: match.matchTime
          ? new Date(match.matchTime).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })
          : match.matchDate
            ? new Date(match.matchDate).toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })
            : '',
        status: match.status === 'live' ? 'Live' :
          match.status === 'scheduled' ? 'Upcoming' :
            match.status === 'completed' ? 'Completed' :
              match.status === 'abandoned' ? 'Abandoned' :
                match.status === 'cancelled' ? 'Cancelled' : match.status,
        series: series?.name || 'Unknown Series',
        seriesId: typeof match.seriesId === 'string' ? match.seriesId : match.seriesId?._id || '',
        matchTitle: match.title || match.shortTitle || '',
        team1: {
          name: teamA?.shortName || teamA?.name || 'Team A',
          score: team1Score,
          over: team1Over,
          logo: teamA?.logo,
          commentary: '',
        },
        team2: {
          name: teamB?.shortName || teamB?.name || 'Team B',
          score: team2Score,
          over: team2Over,
          logo: teamB?.logo,
          commentary: '',
        },
        odds: {
          teamName: liveStatus?.oddsTeam || "",
          back: liveStatus?.oddsBlue || 0,
          lay: liveStatus?.oddsRed || 0,
        },
        fKeyInn: match.currentInning ? `Inn ${match.currentInning}` : undefined,
        inn: match.currentInning?.toString() || undefined,
        comment: liveStatus?.comment2 || '',
      };
    });
  };

  // Group matches by series
  const uniqueSeries = Array.from(new Set(matches.map((m) => m.series)));

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 text-lg">No matches found</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Create matches in a series to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-transparent h-10 gap-2">
          <TabsTrigger
            value="live"
            style={getTabStyle(tab === "live")}
          >
            Live Matches
          </TabsTrigger>

          <TabsTrigger
            value="all"
            style={getTabStyle(tab === "all")}
          >
            All Matches
          </TabsTrigger>
        </TabsList>



        {/* -------------------------------------------------- */}
        {/* ALL MATCHES */}
        {/* -------------------------------------------------- */}
        <TabsContent value="all" className="mt-2">
          {uniqueSeries.map((series, i) => (
            <Accordion
              key={series + i}
              type="multiple"
              className="mt-1 space-y-5 bg-slate-100 dark:bg-slate-800"
            >
              <AccordionItem
                value={`series-${i}`}
                className="rounded-lg border bg-slate-200 dark:bg-slate-900 shadow-sm"
              >
                <AccordionTrigger className="px-4 text-lg font-semibold flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{i + 1}</span>
                  <span>{series}</span>
                </AccordionTrigger>

                <AccordionContent className="space-y-3 p-3 bg-white dark:bg-slate-800">

                  {/* SINGLE TABLE HEADER FOR THE SERIES */}
                  <Table className="w-full border-collapse border border-slate-300 dark:border-slate-600">
                    <TableHeader className="align-middle align-center bg-slate-100 dark:bg-slate-800">
                      <TableRow>
                        <TableHead className="w-14">POS</TableHead>
                        <TableHead className="border border-slate-300">GI</TableHead>
                        <TableHead className="border border-slate-300">F_key/Inn</TableHead>
                        <TableHead className="border border-slate-300">Date Time & Status</TableHead>
                        <TableHead className="border border-slate-300">Match</TableHead>
                        <TableHead className="border border-slate-300">Teams Scores & Comment</TableHead>
                        <TableHead className="border border-slate-300">Odds</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {matches
                        .filter((m) => m.series === series)
                        .map((m, index) => (
                          <TableRow
                            key={m.id}
                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            onClick={() => navigate(`/match/live/${m.id}`)}
                          >

                            <TableCell className="border border-slate-300"><Input className="w-20" value={index + 1} /></TableCell>
                            <TableCell className="border border-slate-300"><Input className="w-20" value={m.gi} /></TableCell>
                            <TableCell className="border border-slate-300">
                              <div className="flex flex-col">
                                <span>{m.fKeyInn || "Bhi"}</span>
                                <span>{m.inn || "Inn"}</span>
                              </div>
                            </TableCell>

                            <TableCell className="border border-slate-300">
                              <div className="flex flex-col">
                                <span>{m.date}</span>
                                <span style={getStatusClassesNormalCss(m.status)} className={`text-xs px-2 py-1 rounded`}>
                                  {m.status}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="border border-slate-300">
                              <div className="flex flex-col">
                                <span>{m.series}</span>
                                <span className={`text-xs px-2 py-1 rounded`}>
                                  {m.matchTitle}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="border border-slate-300 align-top">
                              <div className="flex flex-col gap-2 p-2">

                                {/* Score Row */}
                                <div className="flex justify-between items-center">

                                  {/* Team 1 (Left) */}
                                  <div className="flex items-center gap-2">
                                    {m.team1.logo ? (
                                      <img
                                        src={m.team1.logo}
                                        alt={m.team1.name}
                                        className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                                        {m.team1.name.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex flex-col leading-tight text-sm">
                                      <span>{m.team1.name}</span>
                                      <span className="font-medium">{m.team1.score}</span>
                                      {m.team1.over && <span className="text-xs text-slate-500">{m.team1.over}</span>}
                                    </div>
                                  </div>

                                  {/* Team 2 (Right) */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col leading-tight text-sm text-right">
                                      <span className="font-medium">{m.team2.name}</span>
                                      <span>{m.team2.score}</span>
                                      {m.team2.over && <span className="text-xs text-slate-500">{m.team2.over}</span>}
                                    </div>
                                    {m.team2.logo ? (
                                      <img
                                        src={m.team2.logo}
                                        alt={m.team2.name}
                                        className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                                        {m.team2.name.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                  </div>

                                </div>

                                {/* Commentary */}
                                <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                                  {m.comment || "this is comment"}
                                </div>

                              </div>
                            </TableCell>

                            <TableCell className="border border-slate-300">
                              <div className="flex gap-2">
                                <OddsBox
                                  label={m.odds.teamName}
                                  back={m.odds.back}
                                  lay={m.odds.lay}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </TabsContent>

        {/* -------------------------------------------------- */}
        {/* LIVE MATCHES CARDS */}
        {/* -------------------------------------------------- */}
        <TabsContent value="live" className="mt-2">
          {uniqueSeries.map((series, i) => (
            <Accordion
              key={series + i}
              type="multiple"
              className="space-y-3 !bg-slate-100 dark:!bg-slate-800"
            >
              <AccordionItem
                value={`series-${i}`}
                className="rounded-lg border bg-white dark:bg-slate-900 shadow-sm"
              >
                <AccordionTrigger className="px-4 text-lg font-semibold">
                  {series}
                </AccordionTrigger>

                <AccordionContent className="space-y-3 p-3">

                  {/* SINGLE TABLE HEADER FOR THE SERIES */}
                  <Table className="w-full border-collapse border border-slate-300 dark:border-slate-600">
                    <TableHeader className="align-middle align-center bg-slate-100 dark:bg-slate-800">
                      <TableRow>
                        <TableHead className="w-14">POS</TableHead>
                        <TableHead className="border border-slate-300">GI</TableHead>
                        <TableHead className="border border-slate-300">F_key/Inn</TableHead>
                        <TableHead className="border border-slate-300">Date Time & Status</TableHead>
                        <TableHead className="border border-slate-300">Match</TableHead>
                        <TableHead className="border border-slate-300">Teams Scores & Comment</TableHead>
                        <TableHead className="border border-slate-300">Odds</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {matches
                        .filter((m) => m.series === series && m.status.includes("Live"))
                        .map((m, index) => (
                          <TableRow
                            key={m.id}
                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            onClick={() => navigate(`/match/live/${m.id}`)}
                          >

                            <TableCell className="border border-slate-300"><Input className="w-20" value={index + 1} /></TableCell>
                            <TableCell className="border border-slate-300"><Input className="w-20" value={m.gi} /></TableCell>
                            <TableCell className="border border-slate-300">
                              <div className="flex flex-col">
                                <span>{m.fKeyInn || "Bhi"}</span>
                                <span>{m.inn || "Inn"}</span>
                              </div>
                            </TableCell>

                            <TableCell className="border border-slate-300">
                              <div className="flex flex-col">
                                <span>{m.date}</span>
                                <span style={getStatusClassesNormalCss(m.status)} className={`text-xs px-2 py-1 rounded`}>
                                  {m.status}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="border border-slate-300">
                              <div className="flex flex-col">
                                <span>{m.series}</span>
                                <span className={`text-xs px-2 py-1 rounded`}>
                                  {m.matchTitle}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="border border-slate-300 align-top">
                              <div className="flex flex-col gap-2 p-2">

                                {/* Score Row */}
                                <div className="flex justify-between items-center">

                                  {/* Team 1 (Left) */}
                                  <div className="flex items-center gap-2">
                                    {m.team1.logo ? (
                                      <img
                                        src={m.team1.logo}
                                        alt={m.team1.name}
                                        className="w-10 h-10 rounded-full object-contain border border-slate-300 dark:border-slate-600"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                                        {m.team1.name.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex flex-col leading-tight text-sm">
                                      <span>{m.team1.name}</span>
                                      <span className="font-medium">{m.team1.score}</span>
                                      {m.team1.over && <span className="text-xs text-slate-500">{m.team1.over}</span>}
                                    </div>
                                  </div>

                                  {/* Team 2 (Right) */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col leading-tight text-sm text-right">
                                      <span className="font-medium">{m.team2.name}</span>
                                      <span>{m.team2.score}</span>
                                      {m.team2.over && <span className="text-xs text-slate-500">{m.team2.over}</span>}
                                    </div>
                                    {m.team2.logo ? (
                                      <img
                                        src={m.team2.logo}
                                        alt={m.team2.name}
                                        className="w-10 h-10 rounded-full object-contain border border-slate-300 dark:border-slate-600"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                                        {m.team2.name.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                  </div>

                                </div>

                                {/* Commentary */}
                                <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                                  {m.comment || "this is comment"}
                                </div>

                              </div>
                            </TableCell>

                            <TableCell className="border border-slate-300">
                              <div className="flex gap-2">
                                <OddsBox
                                  label={m.odds.teamName}
                                  back={m.odds.back}
                                  lay={m.odds.lay}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </TabsContent>

      </Tabs>
    </div>
  );
}

function TeamCard({ team }: { team: TransformedMatch['team1'] }) {
  return (
    <div className="col-span-4 bg-slate-900 text-white p-4 rounded-md">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {team.name}
      </h3>
      <p className="mt-1 text-2xl font-bold">{team.score}</p>
      {team.commentary && (
        <p className="text-sm mt-3 opacity-80">{team.commentary}</p>
      )}
    </div>
  );
}

function OddsBox({ label, back, lay }: { label: string; back: number; lay: number }) {
  return (
    <table className="text-xs w-full">
      <tbody>
        <tr className="align-middle">

          {/* Wider Label Cell */}
          <td className="pr-2 text-slate-600 whitespace-nowrap min-w-[100px]">
            <span className="font-bold text-slate-600 dark:text-slate-100">{label}</span>
          </td>

          {/* Back Cell */}
          <td className="px-2 py-1 bg-blue-600 text-white rounded text-center min-w-[40px]">
            {back}
          </td>

          {/* Lay Cell */}
          <td className="pl-4 px-2 py-1 bg-red-600 text-white rounded text-center min-w-[40px]">
            {lay}
          </td>

        </tr>
      </tbody>
    </table>
  );
}




function getStatusClasses(status: string) {
  switch (true) {
    case status.startsWith("Live"):
      return "bg-red-100 text-red-700 border border-red-300";

    case status.includes("Break"):
      return "bg-yellow-100 text-yellow-700 border border-yellow-300";

    case status === "Upcoming":
      return "!bg-yellow-100 !text-yellow-700 !border-yellow-300 border";

    case status === "Completed":
      return "bg-green-100 text-green-700 border border-green-300";

    default:
      return "bg-slate-100 text-slate-700 border border-slate-300";
  }
}

function getStatusClassesNormalCss(status: string) {
  switch (true) {
    case status.startsWith("Live"):
      return {
        backgroundColor: "#fee2e2",   // red-100
        color: "#b91c1c",             // red-700
        border: "1px solid #fecaca",  // red-300
      };

    case status.includes("Break"):
      return {
        backgroundColor: "#fef9c3",   // yellow-100
        color: "#a16207",             // yellow-700
        border: "1px solid #fde68a",  // yellow-300
      };

    case status === "Upcoming":
      return {
        backgroundColor: "#fef9c3",   // yellow-100
        color: "#a16207",             // yellow-700
        border: "1px solid #fde68a",  // yellow-300
      };

    case status === "Completed":
      return {
        backgroundColor: "#dcfce7",   // green-100
        color: "#166534",             // green-700
        border: "1px solid #bbf7d0",  // green-300
      };

    default:
      return {
        backgroundColor: "#f1f5f9",   // slate-100
        color: "#334155",             // slate-700
        border: "1px solid #cbd5e1",  // slate-300
      };
  }
}


function getTabStyle(isActive: boolean) {
  return {
    backgroundColor: isActive ? "#2563eb" : "#f1f5f9",
    color: isActive ? "white" : "#334155",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
  };
}
