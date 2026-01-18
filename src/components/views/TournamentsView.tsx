import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Search, Trophy, Calendar as CalendarIcon, MapPin, Users, Edit } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

/* -------------------------------------------------------------------------- */
/*                           FIXED FORM DIALOG                               */
/* -------------------------------------------------------------------------- */

function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: any;
  onSubmit: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border border-slate-700 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-slate-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">{children}</div>

        <DialogFooter>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Tournament {
  id: number;
  name: string;
  format: 'ODI' | 'T20' | 'Test' | 'T10' | '100B';
  status: 'Live' | 'Upcoming' | 'Completed';
  startDate: string;
  endDate: string;
  teams: number;
  matches: number;
  venue: string;
  logo: string;
}

export function TournamentsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Form State
  const [formData, setFormData] = useState<Omit<Tournament, 'id'>>({
    name: '',
    format: 'T20',
    status: 'Upcoming',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    teams: 0,
    matches: 0,
    venue: '',
    logo: '🏆'
  });

  const [tournaments, setTournaments] = useState<Tournament[]>([
    {
      id: 1,
      name: 'ICC World Cup 2023',
      format: 'ODI',
      status: 'Live',
      startDate: '2023-10-05',
      endDate: '2023-11-19',
      teams: 10,
      matches: 48,
      venue: 'India',
      logo: '🏆'
    },
    {
      id: 2,
      name: 'IPL 2024',
      format: 'T20',
      status: 'Live',
      startDate: '2024-03-22',
      endDate: '2024-05-26',
      teams: 10,
      matches: 74,
      venue: 'India',
      logo: '🏏'
    },
    {
      id: 3,
      name: 'The Ashes 2025',
      format: 'Test',
      status: 'Upcoming',
      startDate: '2025-06-16',
      endDate: '2025-08-04',
      teams: 2,
      matches: 5,
      venue: 'England',
      logo: '⚔️'
    },
  ]);

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      format: 'T20',
      status: 'Upcoming',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      teams: 0,
      matches: 0,
      venue: '',
      logo: '🏆'
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tournament: Tournament) => {
    setEditingId(tournament.id);
    setFormData({ ...tournament });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (editingId) {
        setTournaments(prev => prev.map(t => t.id === editingId ? { ...formData, id: editingId } : t));
      } else {
        setTournaments(prev => [...prev, { ...formData, id: Math.max(...prev.map(t => t.id), 0) + 1 }]);
      }
      setIsDialogOpen(false);
      setLoading(false);
    }, 500);
  };

  const filteredTournaments = tournaments.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="size-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      {/* Tournaments Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <Card key={tournament.id} className="bg-slate-800 border-slate-700 hover:border-blue-600 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl">
                    {tournament.logo}
                  </div>
                  <div>
                    <h3 className="text-white mb-1">{tournament.name}</h3>
                    <Badge
                      variant="outline"
                      className={
                        tournament.format === 'Test' ? 'border-red-500 text-red-400' :
                          tournament.format === 'ODI' ? 'border-blue-500 text-blue-400' :
                            tournament.format === 'T10' ? 'border-yellow-500 text-yellow-400' :
                              tournament.format === '100B' ? 'border-green-500 text-green-400' :
                                'border-purple-500 text-purple-400'
                      }
                    >
                      {tournament.format}
                    </Badge>
                  </div>
                </div>
                <Badge
                  variant={tournament.status === 'Live' ? 'destructive' : 'secondary'}
                  className={tournament.status === 'Live' ? 'animate-pulse' : ''}
                >
                  {tournament.status}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CalendarIcon className="size-4" />
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="size-4" />
                  <span>{tournament.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="size-4" />
                  <span>{tournament.teams} Teams • {tournament.matches} Matches</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700 text-white hover:bg-slate-700"
                >
                  <Trophy className="size-4 mr-2" />
                  Points Table
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-white hover:bg-slate-700"
                  onClick={() => handleEdit(tournament)}
                >
                  <Edit className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingId ? "Edit Tournament" : "Create Tournament"}
        description={editingId ? "Update tournament details" : "Add a new tournament"}
        onSubmit={handleSubmit}
        loading={loading}
      >
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-slate-300">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3 bg-slate-900 border-slate-700 text-white"
              placeholder="Tournament Name"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right text-slate-300">
              Format
            </Label>
            <Select
              value={formData.format}
              onValueChange={(value: any) => setFormData({ ...formData, format: value })}
            >
              <SelectTrigger className="col-span-3 bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="T20">T20</SelectItem>
                <SelectItem value="ODI">ODI</SelectItem>
                <SelectItem value="Test">Test</SelectItem>
                <SelectItem value="T10">T10</SelectItem>
                <SelectItem value="100B">100B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right text-slate-300">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="col-span-3 bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Live">Live</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-300">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal bg-slate-900 border-slate-700 text-white hover:bg-slate-800",
                    !formData.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(new Date(formData.startDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(formData.startDate)}
                  onSelect={(date: any) => date && setFormData({ ...formData, startDate: date.toISOString() })}
                  initialFocus
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-300">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal bg-slate-900 border-slate-700 text-white hover:bg-slate-800",
                    !formData.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.endDate ? format(new Date(formData.endDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(formData.endDate)}
                  onSelect={(date: any) => date && setFormData({ ...formData, endDate: date.toISOString() })}
                  initialFocus
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="venue" className="text-right text-slate-300">
              Venue
            </Label>
            <Input
              id="venue"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="col-span-3 bg-slate-900 border-slate-700 text-white"
              placeholder="e.g. India"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teams" className="text-right text-slate-300">
              Teams
            </Label>
            <Input
              id="teams"
              type="number"
              value={formData.teams}
              onChange={(e) => setFormData({ ...formData, teams: parseInt(e.target.value) || 0 })}
              className="col-span-3 bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="matches" className="text-right text-slate-300">
              Matches
            </Label>
            <Input
              id="matches"
              type="number"
              value={formData.matches}
              onChange={(e) => setFormData({ ...formData, matches: parseInt(e.target.value) || 0 })}
              className="col-span-3 bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="logo" className="text-right text-slate-300">
              Logo (Emoji)
            </Label>
            <Input
              id="logo"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              className="col-span-3 bg-slate-900 border-slate-700 text-white"
              placeholder="e.g. 🏆"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
