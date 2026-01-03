import { useState } from 'react';
import { Match } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Radio, RadioGroup } from './ui/radio-group';
import { Activity, Plus } from 'lucide-react';

interface LiveScoreUpdateProps {
  matches: Match[];
  selectedMatch: Match | null;
  onSelectMatch: (match: Match) => void;
  onUpdateMatch: (match: Match) => void;
}

export function LiveScoreUpdate({ matches, selectedMatch, onSelectMatch, onUpdateMatch }: LiveScoreUpdateProps) {
  const [ballUpdate, setBallUpdate] = useState({
    runs: '0',
    isWicket: false,
    extras: '0',
  });

  const handleBallUpdate = (value: string) => {
    if (!selectedMatch) return;

    const runs = parseInt(value);
    const extras = parseInt(ballUpdate.extras);
    const totalRuns = runs + extras;

    const updatedMatch = { ...selectedMatch };
    const currentTeamScore = updatedMatch.currentInnings === 1 ? updatedMatch.team1Score : updatedMatch.team2Score;

    currentTeamScore.runs += totalRuns;
    
    if (ballUpdate.isWicket) {
      currentTeamScore.wickets += 1;
    }

    // Update overs (simplified - increments by 0.1 for each ball)
    const currentOvers = currentTeamScore.overs;
    const ballsInOver = Math.floor((currentOvers % 1) * 10);
    
    if (ballsInOver === 5) {
      currentTeamScore.overs = Math.floor(currentOvers) + 1;
    } else {
      currentTeamScore.overs = Math.floor(currentOvers) + (ballsInOver + 1) / 10;
    }

    // Add to last balls
    const lastBalls = updatedMatch.lastBalls || [];
    const ballResult = ballUpdate.isWicket ? 'W' : value;
    updatedMatch.lastBalls = [ballResult, ...lastBalls].slice(0, 6);

    onUpdateMatch(updatedMatch);
    setBallUpdate({ runs: '0', isWicket: false, extras: '0' });
  };

  const quickUpdateRuns = (value: string) => {
    setBallUpdate({ ...ballUpdate, runs: value });
    handleBallUpdate(value);
  };

  const updateMatchStatus = (status: 'Scheduled' | 'Live' | 'Completed') => {
    if (!selectedMatch) return;
    onUpdateMatch({ ...selectedMatch, status });
  };

  const switchInnings = () => {
    if (!selectedMatch) return;
    const newInnings = selectedMatch.currentInnings === 1 ? 2 : 1;
    onUpdateMatch({ ...selectedMatch, currentInnings: newInnings });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Select Match</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-muted-foreground">No active or scheduled matches</p>
          ) : (
            <div className="space-y-2">
              {matches.map(match => (
                <button
                  key={match.id}
                  onClick={() => onSelectMatch(match)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent ${
                    selectedMatch?.id === match.id ? 'border-primary bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{match.team1.shortName} vs {match.team2.shortName}</span>
                    {match.status === 'Live' && (
                      <Badge variant="destructive" className="text-xs">
                        <span className="mr-1">●</span> LIVE
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{match.venue}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMatch ? (
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live Score Update</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedMatch.status === 'Live' ? 'default' : 'outline'}
                  onClick={() => updateMatchStatus('Live')}
                >
                  Start Live
                </Button>
                <Button
                  size="sm"
                  variant={selectedMatch.status === 'Completed' ? 'default' : 'outline'}
                  onClick={() => updateMatchStatus('Completed')}
                >
                  End Match
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scoreboard */}
            <div className="rounded-lg border p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-4">
                <h3>{selectedMatch.team1.name} vs {selectedMatch.team2.name}</h3>
                <Badge variant={selectedMatch.status === 'Live' ? 'destructive' : 'secondary'}>
                  {selectedMatch.status === 'Live' && <span className="mr-1">●</span>}
                  {selectedMatch.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded p-3 ${selectedMatch.currentInnings === 1 ? 'bg-white border-2 border-blue-500' : 'bg-white/50'}`}>
                  <p className="text-sm text-muted-foreground mb-1">{selectedMatch.team1.shortName}</p>
                  <p className="text-2xl">
                    {selectedMatch.team1Score.runs}/{selectedMatch.team1Score.wickets}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Overs: {selectedMatch.team1Score.overs.toFixed(1)}
                  </p>
                </div>
                <div className={`rounded p-3 ${selectedMatch.currentInnings === 2 ? 'bg-white border-2 border-blue-500' : 'bg-white/50'}`}>
                  <p className="text-sm text-muted-foreground mb-1">{selectedMatch.team2.shortName}</p>
                  <p className="text-2xl">
                    {selectedMatch.team2Score.runs}/{selectedMatch.team2Score.wickets}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Overs: {selectedMatch.team2Score.overs.toFixed(1)}
                  </p>
                </div>
              </div>
              {selectedMatch.lastBalls && selectedMatch.lastBalls.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Last 6 balls:</p>
                  <div className="flex gap-2">
                    {selectedMatch.lastBalls.map((ball, i) => (
                      <div
                        key={i}
                        className={`size-8 rounded-full flex items-center justify-center text-sm ${
                          ball === 'W' ? 'bg-red-500 text-white' :
                          ball === '6' ? 'bg-purple-500 text-white' :
                          ball === '4' ? 'bg-blue-500 text-white' :
                          'bg-gray-200'
                        }`}
                      >
                        {ball}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Innings Control */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4>Innings {selectedMatch.currentInnings}</h4>
                <Button size="sm" variant="outline" onClick={switchInnings}>
                  Switch Innings
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Batting: {selectedMatch.currentInnings === 1 ? selectedMatch.team1.name : selectedMatch.team2.name}
              </p>
            </div>

            {/* Ball Updates */}
            <div className="rounded-lg border p-4 space-y-4">
              <h4>Update Score</h4>
              
              {/* Quick Run Buttons */}
              <div>
                <Label>Quick Update</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <Button onClick={() => quickUpdateRuns('0')} variant="outline">0</Button>
                  <Button onClick={() => quickUpdateRuns('1')} variant="outline">1</Button>
                  <Button onClick={() => quickUpdateRuns('2')} variant="outline">2</Button>
                  <Button onClick={() => quickUpdateRuns('3')} variant="outline">3</Button>
                  <Button onClick={() => quickUpdateRuns('4')} variant="outline" className="bg-blue-50">4</Button>
                  <Button onClick={() => quickUpdateRuns('6')} variant="outline" className="bg-purple-50">6</Button>
                  <Button 
                    onClick={() => {
                      setBallUpdate({ ...ballUpdate, isWicket: true });
                      handleBallUpdate('0');
                    }} 
                    variant="outline" 
                    className="bg-red-50 col-span-2"
                  >
                    Wicket
                  </Button>
                </div>
              </div>

              {/* Manual Entry */}
              <div className="pt-4 border-t space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="runs">Runs</Label>
                    <Input
                      id="runs"
                      type="number"
                      min="0"
                      value={ballUpdate.runs}
                      onChange={(e) => setBallUpdate({ ...ballUpdate, runs: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extras">Extras</Label>
                    <Input
                      id="extras"
                      type="number"
                      min="0"
                      value={ballUpdate.extras}
                      onChange={(e) => setBallUpdate({ ...ballUpdate, extras: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="wicket"
                    checked={ballUpdate.isWicket}
                    onChange={(e) => setBallUpdate({ ...ballUpdate, isWicket: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="wicket">Wicket</Label>
                </div>
                <Button onClick={() => handleBallUpdate(ballUpdate.runs)} className="w-full">
                  <Plus className="mr-2 size-4" />
                  Add Ball
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="lg:col-span-2">
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center text-muted-foreground">
              <Activity className="size-12 mx-auto mb-2 opacity-50" />
              <p>Select a match to update live scores</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
