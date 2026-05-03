import { useState } from 'react';
import { Team } from '../types/team';
import { Player } from '../types/player';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Trash2, Edit, Users } from 'lucide-react';

interface TeamWithPlayers extends Team {
  players: Player[];
}

interface TeamManagementProps {
  teams: TeamWithPlayers[];
  onAddTeam: (team: TeamWithPlayers) => void;
  onUpdateTeam: (team: TeamWithPlayers) => void;
  onDeleteTeam: (id: string) => void;
}

export function TeamManagement({ teams, onAddTeam, onUpdateTeam, onDeleteTeam }: TeamManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithPlayers | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    code: '',
    country: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const teamData: TeamWithPlayers = {
      ...editingTeam,
      _id: editingTeam?._id || `t${Date.now()}`,
      name: formData.name,
      shortName: formData.shortName,
      code: formData.code,
      country: formData.country || 'International',
      type: editingTeam?.type || 'international',
      isActive: editingTeam?.isActive !== undefined ? editingTeam.isActive : true,
      players: editingTeam?.players || [],
    };

    if (editingTeam) {
      onUpdateTeam(teamData);
    } else {
      onAddTeam(teamData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      shortName: '',
      code: '',
      country: '',
    });
    setEditingTeam(null);
  };

  const handleEdit = (team: TeamWithPlayers) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      shortName: team.shortName,
      code: team.code,
      country: team.country,
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Team Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shortName">Short Name</Label>
                    <Input
                      id="shortName"
                      value={formData.shortName}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                      placeholder="e.g., MI, CSK"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">F-Key / Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="Unique Code"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Team country"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {editingTeam ? 'Update Team' : 'Create Team'}
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
        {teams.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No teams found. Add your first team to get started.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map(team => (
              <div key={team._id} className="rounded-lg border p-4 hover:shadow-md transition-shadow bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{team.name}</h3>
                      <Badge variant="secondary">{team.shortName}</Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="size-3" />
                        <span>{team.players?.length || 0} players</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">Code: {team.code}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(team)} className="size-8 p-0">
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => team._id && onDeleteTeam(team._id)} className="size-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {team.players && team.players.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Recent Players:</p>
                    <div className="space-y-1">
                      {team.players.slice(0, 3).map(player => (
                        <p key={player._id} className="text-sm truncate">{player.name}</p>
                      ))}
                      {team.players.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">+{team.players.length - 3} more...</p>
                      )}
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
