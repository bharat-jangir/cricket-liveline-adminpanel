import { useState } from 'react';
import { Match, Team } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Trash2, Edit, Calendar } from 'lucide-react';

interface MatchManagementProps {
  matches: Match[];
  teams: Team[];
  onAddMatch: (match: Match) => void;
  onUpdateMatch: (match: Match) => void;
  onDeleteMatch: (id: string) => void;
}

export function MatchManagement({ matches, teams, onAddMatch, onUpdateMatch, onDeleteMatch }: MatchManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState({
    team1Id: '',
    team2Id: '',
    venue: '',
    date: '',
    matchType: 'T20' as 'T20' | 'ODI' | 'Test',
    status: 'Scheduled' as 'Scheduled' | 'Live' | 'Completed',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const team1 = teams.find(t => t.id === formData.team1Id);
    const team2 = teams.find(t => t.id === formData.team2Id);

    if (!team1 || !team2) return;

    const matchData: Match = {
      id: editingMatch?.id || `m${Date.now()}`,
      team1,
      team2,
      venue: formData.venue,
      date: formData.date,
      matchType: formData.matchType,
      status: formData.status,
      currentInnings: 1,
      team1Score: { runs: 0, wickets: 0, overs: 0 },
      team2Score: { runs: 0, wickets: 0, overs: 0 },
    };

    if (editingMatch) {
      onUpdateMatch({ ...editingMatch, ...matchData });
    } else {
      onAddMatch(matchData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      team1Id: '',
      team2Id: '',
      venue: '',
      date: '',
      matchType: 'T20',
      status: 'Scheduled',
    });
    setEditingMatch(null);
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setFormData({
      team1Id: match.team1.id,
      team2Id: match.team2.id,
      venue: match.venue,
      date: match.date,
      matchType: match.matchType,
      status: match.status,
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Live':
        return <Badge variant="destructive"><span className="mr-1">●</span> {status}</Badge>;
      case 'Completed':
        return <Badge variant="secondary">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Match Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Match
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingMatch ? 'Edit Match' : 'Add New Match'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team1">Team 1</Label>
                  <Select value={formData.team1Id} onValueChange={(value) => setFormData({ ...formData, team1Id: value })}>
                    <SelectTrigger id="team1">
                      <SelectValue placeholder="Select team 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id} disabled={team.id === formData.team2Id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team2">Team 2</Label>
                  <Select value={formData.team2Id} onValueChange={(value) => setFormData({ ...formData, team2Id: value })}>
                    <SelectTrigger id="team2">
                      <SelectValue placeholder="Select team 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id} disabled={team.id === formData.team1Id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Enter venue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matchType">Match Type</Label>
                  <Select value={formData.matchType} onValueChange={(value: any) => setFormData({ ...formData, matchType: value })}>
                    <SelectTrigger id="matchType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T20">T20</SelectItem>
                      <SelectItem value="ODI">ODI</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Live">Live</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingMatch ? 'Update Match' : 'Create Match'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No matches found. Add your first match to get started.</p>
        ) : (
          <div className="space-y-4">
            {matches.map(match => (
              <div key={match.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3>{match.team1.name} vs {match.team2.name}</h3>
                      {getStatusBadge(match.status)}
                      <Badge variant="outline">{match.matchType}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-3" />
                      {new Date(match.date).toLocaleDateString()} {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="text-sm text-muted-foreground">{match.venue}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(match)}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteMatch(match.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {match.status !== 'Scheduled' && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-sm">{match.team1.shortName}</p>
                      <p>
                        {match.team1Score.runs}/{match.team1Score.wickets} ({match.team1Score.overs})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">{match.team2.shortName}</p>
                      <p>
                        {match.team2Score.runs}/{match.team2Score.wickets} ({match.team2Score.overs})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
