import { useState } from 'react';
import { Player, Team } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Trash2, Edit, Filter } from 'lucide-react';

interface PlayerManagementProps {
  teams: Team[];
  onAddPlayer: (player: Player) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (id: string, teamId: string) => void;
}

export function PlayerManagement({ teams, onAddPlayer, onUpdatePlayer, onDeletePlayer }: PlayerManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    role: 'Batsman' as 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper',
    teamId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const playerData: Player = {
      id: editingPlayer?.id || `p${Date.now()}`,
      name: formData.name,
      role: formData.role,
      teamId: formData.teamId,
    };

    if (editingPlayer) {
      onUpdatePlayer(playerData);
    } else {
      onAddPlayer(playerData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'Batsman',
      teamId: '',
    });
    setEditingPlayer(null);
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      role: player.role,
      teamId: player.teamId,
    });
    setIsDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Batsman':
        return 'default';
      case 'Bowler':
        return 'secondary';
      case 'All-rounder':
        return 'outline';
      case 'Wicket-keeper':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const allPlayers = teams.flatMap(team => 
    team.players.map(player => ({ ...player, teamName: team.name, teamShortName: team.shortName }))
  );

  const filteredPlayers = allPlayers.filter(player => {
    const teamMatch = filterTeam === 'all' || player.teamId === filterTeam;
    const roleMatch = filterRole === 'all' || player.role === filterRole;
    return teamMatch && roleMatch;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Player Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPlayer ? 'Edit Player' : 'Add New Player'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playerName">Player Name</Label>
                  <Input
                    id="playerName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter player name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select value={formData.teamId} onValueChange={(value) => setFormData({ ...formData, teamId: value })}>
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Batsman">Batsman</SelectItem>
                      <SelectItem value="Bowler">Bowler</SelectItem>
                      <SelectItem value="All-rounder">All-rounder</SelectItem>
                      <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingPlayer ? 'Update Player' : 'Add Player'}
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
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
          <Filter className="size-4 text-muted-foreground" />
          <div className="flex gap-4 flex-1">
            <div className="flex-1">
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Batsman">Batsman</SelectItem>
                  <SelectItem value="Bowler">Bowler</SelectItem>
                  <SelectItem value="All-rounder">All-rounder</SelectItem>
                  <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Players List */}
        {filteredPlayers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {allPlayers.length === 0 ? 'No players found. Add your first player to get started.' : 'No players match the selected filters.'}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlayers.map(player => (
              <div key={player.id} className="rounded-lg border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="mb-1">{player.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={getRoleBadgeVariant(player.role)} className="text-xs">
                        {player.role}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {player.teamShortName}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(player)}>
                      <Edit className="size-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeletePlayer(player.id, player.teamId)}>
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{player.teamName}</p>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl">{allPlayers.filter(p => p.role === 'Batsman').length}</p>
            <p className="text-xs text-muted-foreground">Batsmen</p>
          </div>
          <div className="text-center">
            <p className="text-2xl">{allPlayers.filter(p => p.role === 'Bowler').length}</p>
            <p className="text-xs text-muted-foreground">Bowlers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl">{allPlayers.filter(p => p.role === 'All-rounder').length}</p>
            <p className="text-xs text-muted-foreground">All-rounders</p>
          </div>
          <div className="text-center">
            <p className="text-2xl">{allPlayers.filter(p => p.role === 'Wicket-keeper').length}</p>
            <p className="text-xs text-muted-foreground">Wicket-keepers</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
