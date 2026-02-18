import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";

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
import type { Match } from "../../types/match";

interface TransformedMatch {
  id: string;
  gi: string;
  date: string;
  status: string;
  series: string;
  seriesId?: string;
  matchTitle: string;
  team1: {
    id?: string;
    name: string;
    score: string;
    over?: string;
    logo?: string;
    commentary?: string;
    scores?: { score: string; over?: string }[]; // Array of score objects
  };
  team2: {
    id?: string;
    name: string;
    score: string;
    over?: string;
    logo?: string;
    commentary?: string;
    scores?: { score: string; over?: string }[]; // Array of score objects
  };
  odds: {
    teamName: string;
    back: number;
    lay: number;
  };
  fKeyInn?: string;
  inn?: string;
  comment?: string;
  result?: string;
}

export function MatchesView() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<TransformedMatch[]>([]);
  const [apiMatches, setApiMatches] = useState<Match[]>([]);

  // Load matches
  useEffect(() => {
    loadMatches();
  }, []);

  // Update matches when apiMatches changes
  useEffect(() => {
    if (apiMatches.length > 0) {
      const transformed = transformMatches(apiMatches);
      setMatches(transformed);
    }
  }, [apiMatches]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await MatchService.getAllMatches({ limit: 1000 });

      if (response.status && response.data?.result) {
        const matches = response.data.result;
        setApiMatches(matches);
      }
    } catch (error: any) {
      console.error('Failed to load matches:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract team object from populated field

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

  const transformMatches = (apiMatches: Match[]): TransformedMatch[] => {
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

      // Get live status if available (now injected by backend)
      const liveStatus = match.liveStatus;
      let team1Score = '–';
      let team1Over = '';
      let team2Score = '–';
      let team2Over = '';
      let team1Scores: { score: string; over?: string }[] = [];
      let team2Scores: { score: string; over?: string }[] = [];

      if (liveStatus && (match.status === 'live' || match.status === 'completed')) {
        const [runs, wickets] = liveStatus.score?.split('/') || ['0', '0'];
        team1Score = `${runs}/${wickets}`;
        team1Over = liveStatus.overs || '';

        // Process innings if available for multi-inning display
        if (liveStatus.innings && Array.isArray(liveStatus.innings)) {
          // Filter super overs logic:
          // Keep only the innings from the latest super over (highest superOverNumber)
          const superOverInnings = liveStatus.innings.filter((inn: any) => inn.type === 'super_over');
          let maxSuperOverNumber = -1;
          if (superOverInnings.length > 0) {
            maxSuperOverNumber = Math.max(...superOverInnings.map((inn: any) => inn.superOverNumber || 0));
          }

          const validInnings = liveStatus.innings.filter((inn: any) => {
            if (inn.type === 'super_over') {
              return (inn.superOverNumber || 0) === maxSuperOverNumber;
            }
            return true; // Keep all regular innings
          });

          // Now map scores to teams
          validInnings.forEach((inn: any) => {
            const battingTeamId = typeof inn.battingTeamId === 'object' ? inn.battingTeamId._id : inn.battingTeamId;

            // Determine if this inning belongs to Team A (team1) or Team B (team2)
            const teamAId = teamA?._id || (typeof match.teamAId === 'string' ? match.teamAId : '');
            const teamBId = teamB?._id || (typeof match.teamBId === 'string' ? match.teamBId : '');

            // Format score string: "Runs/Wickets (Overs)" or just "Runs" if all out? 
            // Requirement image shows: "736 & 299-6"
            // Let's format as "Runs/Wickets" or "Runs-Wickets" as per user image style "299-6"

            // Check if inning is current to add overs? The image shows overs "63.5" alongside the last score.
            // We will just push the score string here.

            const scoreStr = `${inn.totalRuns}${inn.totalWickets < 10 && !inn.isAllOut ? `-${inn.totalWickets}` : ''}`;
            let overStr = '';

            const ballsPerOver = match.ballsPerOver || 6;
            const currentOver = Math.floor(inn.totalBalls / ballsPerOver);
            const currentBall = inn.totalBalls % ballsPerOver;
            overStr = `${currentOver}.${currentBall}`;

            if (battingTeamId === teamAId) {
              team1Scores.push({ score: scoreStr, over: overStr });
              // If this is the current active inning, capture the over
              if (inn.inningNumber === liveStatus.currentInning) {
                team1Over = overStr;
              }
            } else if (battingTeamId === teamBId) {
              team2Scores.push({ score: scoreStr, over: overStr });
              if (inn.inningNumber === liveStatus.currentInning) {
                team2Over = overStr;
              }
            }
          });

          // If we have collected scores, use their joined string.
          // However, the "Teams Scores & Comment" column in the image puts the over NEXT to the score.
          // "KAR 736 & 299-6 63.5"
          // We can pass the array of scores and let rendering handle it, or join them here.
          // The image logic: TeamName [Scores joined by &] [Over if batting]
        }
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
          id: teamA?._id,
          name: teamA?.shortName || teamA?.name || 'Team A',
          score: team1Score,
          over: team1Over,
          logo: teamA?.logo,
          commentary: '',
          scores: team1Scores.length > 0 ? team1Scores : [{ score: team1Score, over: team1Over }]
        },
        team2: {
          id: teamB?._id,
          name: teamB?.shortName || teamB?.name || 'Team B',
          score: team2Score,
          over: team2Over,
          logo: teamB?.logo,
          commentary: '',
          scores: team2Scores.length > 0 ? team2Scores : [{ score: team2Score, over: team2Over }]
        },
        odds: {
          teamName: match.oddsTeam || "",
          back: match.oddsBlue || 0,
          lay: match.oddsRed || 0,
        },
        fKeyInn: match.currentInning ? `Inn ${match.currentInning}` : '',
        inn: match.currentInning ? `${match.currentInning}` : '',
        comment: match.result?.resultText || match.comment2 || '',
        result: match.result?.resultText || ''
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
                                      <div className="flex flex-col">
                                        {m.team1.scores && m.team1.scores.length > 0 && m.team1.scores[0].score !== '–' ? (
                                          m.team1.scores.map((s, idx) => (
                                            <div key={idx} className="flex items-center gap-1">
                                              <span className="font-medium">{s.score}</span>
                                              {s.over && s.over !== '' && <span className="text-xs text-slate-500">{s.over}</span>}
                                            </div>
                                          ))
                                        ) : (
                                          <span className="font-medium">{m.team1.score}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Team 2 (Right) */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col leading-tight text-sm text-right">
                                      <span className="font-medium">{m.team2.name}</span>
                                      <div className="flex flex-col items-end">
                                        {m.team2.scores && m.team2.scores.length > 0 && m.team2.scores[0].score !== '–' ? (
                                          m.team2.scores.map((s, idx) => (
                                            <div key={idx} className="flex items-center justify-end gap-1">
                                              {s.over && s.over !== '' && <span className="text-xs text-slate-500">{s.over}</span>}
                                              <span className="font-medium">{s.score}</span>
                                            </div>
                                          ))
                                        ) : (
                                          <span className="font-medium">{m.team2.score}</span>
                                        )}
                                      </div>
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

                                {/* Commentary / Result */}
                                <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                                  {m.result || m.comment || ""}
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
                                      <div className="flex flex-col">
                                        {m.team1.scores && m.team1.scores.length > 0 && m.team1.scores[0].score !== '–' ? (
                                          m.team1.scores.map((s, idx) => (
                                            <div key={idx} className="flex items-center gap-1">
                                              <span className="font-medium">{s.score}</span>
                                              {s.over && s.over !== '' && <span className="text-xs text-slate-500">{s.over}</span>}
                                            </div>
                                          ))
                                        ) : (
                                          <span className="font-medium">{m.team1.score}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Team 2 (Right) */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col leading-tight text-sm text-right">
                                      <span className="font-medium">{m.team2.name}</span>
                                      <div className="flex flex-col items-end">
                                        {m.team2.scores && m.team2.scores.length > 0 && m.team2.scores[0].score !== '–' ? (
                                          m.team2.scores.map((s, idx) => (
                                            <div key={idx} className="flex items-center justify-end gap-1">
                                              {s.over && s.over !== '' && <span className="text-xs text-slate-500">{s.over}</span>}
                                              <span className="font-medium">{s.score}</span>
                                            </div>
                                          ))
                                        ) : (
                                          <span className="font-medium">{m.team2.score}</span>
                                        )}
                                      </div>
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

                                {/* Commentary / Result */}
                                <div className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                                  {m.result || m.comment || ""}
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
