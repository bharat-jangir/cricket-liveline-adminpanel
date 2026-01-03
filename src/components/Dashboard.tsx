import { Match, Team } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Users, Calendar, Activity } from 'lucide-react';

interface DashboardProps {
  matches: Match[];
  teams: Team[];
}

export function Dashboard({ matches, teams }: DashboardProps) {
  const liveMatches = matches.filter(m => m.status === 'Live');
  const scheduledMatches = matches.filter(m => m.status === 'Scheduled');
  const completedMatches = matches.filter(m => m.status === 'Completed');
  const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Live Matches</CardTitle>
            <Activity className="size-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{liveMatches.length}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Scheduled</CardTitle>
            <Calendar className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{scheduledMatches.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming matches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Teams</CardTitle>
            <Trophy className="size-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{teams.length}</div>
            <p className="text-xs text-muted-foreground">Registered teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Players</CardTitle>
            <Users className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalPlayers}</div>
            <p className="text-xs text-muted-foreground">Across all teams</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Live Matches</CardTitle>
          </CardHeader>
          <CardContent>
            {liveMatches.length === 0 ? (
              <p className="text-muted-foreground">No live matches at the moment</p>
            ) : (
              <div className="space-y-4">
                {liveMatches.map(match => (
                  <div key={match.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="destructive" className="animate-pulse">
                        <span className="mr-1">●</span> LIVE
                      </Badge>
                      <span className="text-xs text-muted-foreground">{match.matchType}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>{match.team1.name}</span>
                        <span>
                          {match.team1Score.runs}/{match.team1Score.wickets} ({match.team1Score.overs})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>{match.team2.name}</span>
                        <span>
                          {match.team2Score.runs}/{match.team2Score.wickets} ({match.team2Score.overs})
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{match.venue}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Matches</CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledMatches.length === 0 ? (
              <p className="text-muted-foreground">No scheduled matches</p>
            ) : (
              <div className="space-y-4">
                {scheduledMatches.slice(0, 5).map(match => (
                  <div key={match.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge>{match.matchType}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(match.date).toLocaleDateString()} {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p>{match.team1.name} vs {match.team2.name}</p>
                      <p className="text-xs text-muted-foreground">{match.venue}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teams Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => (
              <div key={team.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3>{team.name}</h3>
                  <Badge variant="secondary">{team.shortName}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{team.players.length} players</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
