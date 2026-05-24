import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import {
  Search,
  Plus,
  Save,
  Edit,
  User,
  Shield,
  Flag,
  Bell,
  Minus,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { SeriesTeamsService } from '../../services/series-teams.service';
import { TeamService } from '../../services/team.service';
import { PlayerService } from '../../services/player.service';
import { SeriesTeam, SquadPlayer } from '../../types/series-teams';
import { Team } from '../../types/team';
import { Player } from '../../types/player';
import { toast } from 'sonner';
import faceImage from '../../assets/player/1BJ.webp';
import fullImage from '../../assets/player/test-jersey.png';

export function SeriesTeamsTab() {
  const { seriesId, subId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeFormat, setActiveFormat] = useState<'ODI' | 'T20' | 'Test' | 'T10' | '100B'>('ODI');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // API data
  const [seriesTeams, setSeriesTeams] = useState<SeriesTeam[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [currentSquad, setCurrentSquad] = useState<SquadPlayer[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [debouncedPlayerSearchTerm, setDebouncedPlayerSearchTerm] = useState('');
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingMorePlayers, setLoadingMorePlayers] = useState(false);
  const [playersPage, setPlayersPage] = useState(1);
  const [hasMorePlayers, setHasMorePlayers] = useState(true);
  const [playersPagination, setPlayersPagination] = useState({ total: 0, totalPages: 0 });

  const [searchTermAvailable, setSearchTermAvailable] = useState('');
  const [debouncedSearchTermAvailable, setDebouncedSearchTermAvailable] = useState('');
  const [showAddTeam, setShowAddTeam] = useState(false);

  // Debounce search term for squad player search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce player search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlayerSearchTerm(playerSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [playerSearchTerm]);

  // Debounce available team search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTermAvailable(searchTermAvailable);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTermAvailable]);

  // Load series teams
  const loadSeriesTeams = useCallback(async () => {
    if (!seriesId) return;

    try {
      setLoading(true);
      const response = await SeriesTeamsService.getSeriesTeams(seriesId, activeFormat);
      setSeriesTeams(response.data.result || []);
    } catch (error: any) {
      console.error('Failed to load series teams:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [seriesId, activeFormat]);

  // Load available teams
  const loadAvailableTeams = useCallback(async () => {
    try {
      const response = await TeamService.listTeams({ page: 1, limit: 100 });
      const allTeams = response.data.result || [];

      // Filter out teams already in series for this format
      const addedTeamIds = seriesTeams.map(st => st.teamId);
      const available = allTeams.filter(team => !addedTeamIds.includes(team._id!));

      setAvailableTeams(available);
    } catch (error: any) {
      console.error('Failed to load teams:', error);
      toast.error('Failed to load available teams');
    }
  }, [seriesTeams]);

  // Load squad for selected team
  const loadSquad = useCallback(async (teamId: string) => {
    if (!seriesId) return;

    try {
      setLoading(true);
      const response = await SeriesTeamsService.getSquad(seriesId, teamId, activeFormat);
      const squadData = response.data.result;

      // Transform API response to match SquadPlayer interface
      // API returns playerId as populated object, we need to extract _id and set player
      console.log('Squad data received:', squadData);
      console.log('squadPlayers:', squadData.squadPlayers);

      const transformedSquad: SquadPlayer[] = (squadData.squadPlayers || []).map((sp: any) => {
        // playerId in API response is the populated player object
        const playerObj = sp.playerId;

        // Extract player ID - handle both object and string cases
        let playerId: string;
        let player: any = null;

        if (playerObj && typeof playerObj === 'object' && playerObj !== null && !Array.isArray(playerObj)) {
          // playerId is a populated object
          playerId = playerObj._id ? String(playerObj._id) : String(playerObj);
          player = playerObj; // Use the populated object as player
        } else if (sp.player && typeof sp.player === 'object' && sp.player !== null) {
          // player exists separately
          playerId = sp.playerId ? String(sp.playerId) : (sp.player._id ? String(sp.player._id) : '');
          player = sp.player;
        } else {
          // Fallback: playerId is a string
          playerId = String(sp.playerId || '');
          player = sp.player || null;
        }

        const transformed: SquadPlayer = {
          playerId: playerId,
          player: player,
          isCaptain: sp.isCaptain || false,
          isViceCaptain: sp.isViceCaptain || false,
          isWicketKeeper: sp.isWicketKeeper || false,
          isNotEligible: sp.isNotEligible || false,
          role: (sp.role || 'Batter') as 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper',
          jerseyNumber: sp.jerseyNumber,
        };

        console.log('Transformed squad player:', {
          original: sp,
          transformed,
          playerId,
          hasPlayer: !!player,
          playerName: player?.name,
        });
        return transformed;
      });

      console.log('Transformed squad:', transformedSquad);
      console.log('Setting currentSquad with', transformedSquad.length, 'players');
      setCurrentSquad(transformedSquad);
    } catch (error: any) {
      console.error('Failed to load squad:', error);
      console.error('Error details:', error.response?.data);
      setCurrentSquad([]);
    } finally {
      setLoading(false);
    }
  }, [seriesId, activeFormat]);

  // Initial load
  useEffect(() => {
    loadSeriesTeams();
  }, [loadSeriesTeams]);

  // Load available teams when in add mode
  useEffect(() => {
    if (showAddTeam) {
      loadAvailableTeams();
    }
  }, [showAddTeam, loadAvailableTeams]);

  // Determine selected team - handle both populated and non-populated teamId
  const getTeamId = (seriesTeam: SeriesTeam) => {
    const teamId = seriesTeam.teamId as any;
    return typeof teamId === 'string' ? teamId : teamId?._id;
  };

  const selectedTeamId = subId || (seriesTeams[0] ? getTeamId(seriesTeams[0]) : undefined);
  const selectedSeriesTeam = seriesTeams.find(st => getTeamId(st) === selectedTeamId);
  const selectedTeamData = selectedSeriesTeam ? (selectedSeriesTeam.teamId as any) : null;
  const selectedTeam = typeof selectedTeamData === 'object' ? selectedTeamData : null;

  // Load squad when team is selected
  useEffect(() => {
    if (selectedTeamId && seriesTeams.length > 0) {
      loadSquad(selectedTeamId);
    }
  }, [selectedTeamId, seriesTeams, loadSquad]);

  // Add team to series
  const handleAddTeam = async (team: Team) => {
    if (!seriesId || !team._id) return;

    try {
      setSaving(true);
      await SeriesTeamsService.addTeamToSeries(seriesId, {
        teamId: team._id,
        format: activeFormat,
        copyFromTeamRoster: true, // Copy players from team roster
      });

      toast.success(`${team.name} added to series`);
      await loadSeriesTeams();
      setShowAddTeam(false);
    } catch (error: any) {
      console.error('Failed to add team:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to add team');
    } finally {
      setSaving(false);
    }
  };

  // Remove team from series
  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (!seriesId) return;
    if (!window.confirm(`Remove ${teamName} from this series?`)) return;

    try {
      setSaving(true);
      await SeriesTeamsService.removeTeamFromSeries(seriesId, teamId, activeFormat);
      toast.success(`${teamName} removed from series`);

      // Navigate to first team if we removed the current one
      if (subId === teamId) {
        const remaining = seriesTeams.filter(st => st.teamId !== teamId);
        if (remaining.length > 0) {
          navigate(`/series/${seriesId}/teams/${remaining[0].teamId}`);
        } else {
          navigate(`/series/${seriesId}/teams`);
        }
      }

      await loadSeriesTeams();
    } catch (error: any) {
      console.error('Failed to remove team:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to remove team');
    } finally {
      setSaving(false);
    }
  };

  // Save squad changes
  const handleSaveSquad = async () => {
    if (!seriesId || !selectedTeamId) return;

    try {
      setSaving(true);

      // Transform squad data to match DTO (remove player objects, keep only playerId)
      const squadDataToSend = currentSquad.map(sp => ({
        playerId: sp.playerId,
        role: sp.role,
        isCaptain: sp.isCaptain || false,
        isViceCaptain: sp.isViceCaptain || false,
        isWicketKeeper: sp.isWicketKeeper || false,
        isNotEligible: sp.isNotEligible || false,
        jerseyNumber: sp.jerseyNumber,
      }));

      await SeriesTeamsService.updateSquad(seriesId, selectedTeamId, activeFormat, {
        squadPlayers: squadDataToSend,
      });

      toast.success('Squad saved successfully');
      setIsEditing(false);
      await loadSquad(selectedTeamId);
    } catch (error: any) {
      console.error('Failed to save squad:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to save squad');
    } finally {
      setSaving(false);
    }
  };

  // Update player in squad
  const updatePlayer = (playerId: string, updates: Partial<SquadPlayer>) => {
    setCurrentSquad(prev => prev.map(p =>
      p.playerId === playerId ? { ...p, ...updates } : p
    ));
  };

  // Toggle player status
  const togglePlayerStatus = (
    playerId: string,
    field: 'isCaptain' | 'isViceCaptain' | 'isWicketKeeper' | 'isNotEligible'
  ) => {
    setCurrentSquad(prev => prev.map(p => {
      if (p.playerId !== playerId) return p;

      const newValue = !p[field];

      // If setting Not Eligible, clear others
      if (field === 'isNotEligible' && newValue) {
        return { ...p, [field]: newValue, isCaptain: false, isViceCaptain: false, isWicketKeeper: false };
      }

      // If setting others, clear Not Eligible
      if (field !== 'isNotEligible' && newValue) {
        return { ...p, [field]: newValue, isNotEligible: false };
      }

      return { ...p, [field]: newValue };
    }));
  };

  // Handle team selection
  const handleTeamClick = (teamIdOrObj: any) => {
    const id = typeof teamIdOrObj === 'string' ? teamIdOrObj : teamIdOrObj._id;
    navigate(`/series/${seriesId}/teams/${id}`);
    setShowAddTeam(false);
  };


  // Load available players for adding to squad
  const loadAvailablePlayers = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!showPlayerSearch) return;

    try {
      if (page === 1) {
        setLoadingPlayers(true);
      } else {
        setLoadingMorePlayers(true);
      }

      const response = await PlayerService.getAllPlayers({
        search: debouncedPlayerSearchTerm,
        page: page,
        limit: 20,
        isActive: true,
      });

      const allPlayers = response.data.result || [];
      const pagination = response.data.pagination || { total: 0, totalPages: 0 };

      // Filter out players already in squad
      const squadPlayerIds = new Set(currentSquad.map(sp => sp.playerId));
      const available = allPlayers.filter(player =>
        player._id && !squadPlayerIds.has(player._id)
      );

      // Remove duplicates by using a Set of IDs
      if (append) {
        setAvailablePlayers(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newPlayers = available.filter(p => p._id && !existingIds.has(p._id));
          return [...prev, ...newPlayers];
        });
      } else {
        setAvailablePlayers(available);
      }

      setPlayersPagination(pagination);
      setHasMorePlayers(page < pagination.totalPages);
      setPlayersPage(page);
    } catch (error: any) {
      console.error('Failed to load players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoadingPlayers(false);
      setLoadingMorePlayers(false);
    }
  }, [showPlayerSearch, debouncedPlayerSearchTerm, currentSquad]);

  // Reset player search state when modal closes
  useEffect(() => {
    if (!showPlayerSearch) {
      setPlayerSearchTerm('');
      setAvailablePlayers([]);
      setPlayersPage(1);
      setHasMorePlayers(true);
      setPlayersPagination({ total: 0, totalPages: 0 });
    }
  }, [showPlayerSearch]);

  // Load players when search modal opens or debounced search term changes
  useEffect(() => {
    if (showPlayerSearch) {
      // Reset pagination when modal opens or search changes
      setPlayersPage(1);
      setHasMorePlayers(true);
      setAvailablePlayers([]);
      loadAvailablePlayers(1, false);
    }
  }, [showPlayerSearch, debouncedPlayerSearchTerm, loadAvailablePlayers]);

  // Load more players when scrolling (infinite scroll)
  const handleLoadMorePlayers = useCallback(() => {
    if (!loadingMorePlayers && hasMorePlayers && showPlayerSearch) {
      const nextPage = playersPage + 1;
      loadAvailablePlayers(nextPage, true);
    }
  }, [loadingMorePlayers, hasMorePlayers, showPlayerSearch, playersPage, loadAvailablePlayers]);

  // Add player to squad
  const handleAddPlayerToSquad = (player: Player) => {
    if (!player._id) return;

    // Check if player is already in squad
    const isAlreadyInSquad = currentSquad.some(sp => sp.playerId === player._id);
    if (isAlreadyInSquad) {
      toast.error(`${player.name} is already in the squad`);
      return;
    }

    const newSquadPlayer: SquadPlayer = {
      playerId: player._id,
      player: player,
      role: (player.role === 'batsman' ? 'Batter' :
        player.role === 'bowler' ? 'Bowler' :
          player.role === 'all-rounder' ? 'All-Rounder' :
            player.role === 'wicket-keeper' ? 'Wicket Keeper' : 'Batter') as any,
      isCaptain: false,
      isViceCaptain: false,
      isWicketKeeper: false,
      isNotEligible: false,
    };

    setCurrentSquad(prev => [...prev, newSquadPlayer]);
    // Remove player from available list immediately without reloading
    setAvailablePlayers(prev => prev.filter(p => p._id !== player._id));
    toast.success(`${player.name} added to squad`);
  };

  // Remove player from squad
  const handleRemovePlayerFromSquad = (playerId: string) => {
    setCurrentSquad(prev => prev.filter(sp => sp.playerId !== playerId));
    toast.success('Player removed from squad');
  };

  // Filter squad players by search
  const filteredPlayers = currentSquad.filter(p => {
    const playerName = p.player?.name || '';
    const playerFullName = p.player?.fullName || '';
    const searchLower = debouncedSearchTerm.toLowerCase();
    return playerName.toLowerCase().includes(searchLower) ||
      playerFullName.toLowerCase().includes(searchLower);
  });

  // Debug logging
  useEffect(() => {
    console.log('Current squad state:', currentSquad);
    console.log('Filtered players:', filteredPlayers);
    console.log('Current squad length:', currentSquad.length);
    console.log('Filtered players length:', filteredPlayers.length);
  }, [currentSquad, filteredPlayers]);

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Left Sidebar - Teams List */}
      <Card className="min-w-[250px] shrink-0 rounded-none flex flex-col dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-y-scroll">
        <div className="p-1 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">Teams ({activeFormat})</h3>
        </div>
        {loading && seriesTeams.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {seriesTeams.map(seriesTeam => {
              const teamId = getTeamId(seriesTeam);
              const teamData = (seriesTeam.teamId as any);
              const teamName = typeof teamData === 'object' ? teamData?.name : 'Unknown';
              const teamLogo = typeof teamData === 'object' ? teamData?.logo : '🏏';

              return (
                <div
                  key={seriesTeam._id}
                  onClick={() => handleTeamClick(teamId)}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedTeamId === teamId
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className='flex'>
                      <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl shadow-sm">
                        {teamLogo}
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${selectedTeamId === teamId ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                          {teamName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {seriesTeam.squadPlayers?.length || 0} Players
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-slate-400 hover:text-red-500 hover:bg-red-50 ml-auto"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleRemoveTeam(teamId, teamName);
                      }}
                      disabled={saving}
                    >
                      <Minus size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant={showAddTeam ? "default" : "outline"}
            size="sm"
            className={`w-full gap-2 h-8 ${!showAddTeam ? 'border-dashed' : ''}`}
            onClick={() => setShowAddTeam(true)}
          >
            <Plus className="size-3" />
            Add Team
          </Button>
        </div>
      </Card>

      {/* Main Content Area - Conditional Rendering */}
      {showAddTeam ? (
        /* Add Team View */
        <div className="flex-1 flex flex-col space-y-3 h-full overflow-hidden">
          <Card className="rounded-none p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAddTeam(false)} className="bg-red-500 text-white hover:bg-red-600 transition-colors">
                Cancel
              </Button>
            </div>
            <div className="pt-4 flex w-full items-center gap-2">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search teams to add..."
                  value={searchTermAvailable}
                  onChange={(e) => setSearchTermAvailable(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <Button variant="outline" className="ml-2 bg-blue-500 text-white hover:bg-blue-600">
                Save & Continue
              </Button>
            </div>
          </Card>

          <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-y-auto p-4">
            <div className="flex flex-col space-y-2">
              {availableTeams
                .filter(t => t.name.toLowerCase().includes(debouncedSearchTermAvailable.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(team => (
                  <div key={team._id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl shadow-sm">
                        {team.logo || '🏏'}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{team.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-dashed"
                      onClick={() => handleAddTeam(team)}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Add
                    </Button>
                  </div>
                ))}
              {availableTeams.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                  No more teams available to add.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Squad Management View */
        <div className="flex-1 flex flex-col space-y-3 h-full overflow-hidden">
          {/* Header Section */}
          <Card className="rounded-none p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl shadow-sm">
                  {selectedTeam.logo}
                </div> */}
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedTeam?.name} Squad</h2>
                    {/* <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{selectedTeam.shortName}</span>
                    <span>•</span>
                    <span>{selectedTeam.players.length} Players Selected</span>
                  </div> */}
                  </div>
                  {/* tabs team_type */}
                  <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                    {(['ODI', 'T20', 'Test', 'T10', '100B'] as const).map(format => (
                      <button
                        key={format}
                        onClick={() => setActiveFormat(format as 'ODI' | 'T20' | 'Test' | 'T10' | '100B')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeFormat === format
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                      >
                        {selectedTeam?.name}_{format}
                      </button>
                    ))}
                  </div>

                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-8"
                    onClick={handleSaveSquad}
                    disabled={saving || !isEditing}
                  >
                    {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                    Save Squad
                  </Button>
                </div>
              </div>

              {/* Search and edit*/}
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4 w-full">
                  <div className="relative flex-1 min-w-[250px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      placeholder="Search player..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/players/new')}
                      className="gap-2 h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="size-3" />
                      Create Player
                    </Button>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPlayerSearch(true)}
                        className="gap-2 h-8 text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Plus className="size-3" />
                        Add Player to Squad
                      </Button>
                    )}
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Edit className="size-3" />
                        Edit from recent squad
                      </button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-2 h-8">
                          <Save className="size-3" />
                          Save Squad
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 h-8">
                          <Bell className="size-3" />
                          Notify
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Players Table */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-y-auto">
            <Table className='rounded-none'>
              <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <TableRow>
                  <TableHead className="w-[40%]">Player Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Nationality</TableHead>
                  {isEditing && <TableHead className="w-20">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isEditing ? 4 : 3} className="text-center py-12 text-slate-500">
                      {isEditing ? 'No players in squad. Click "Add Player to Squad" to add players.' : 'No players found in this squad.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlayers?.map((squadPlayer) => {
                    const player = squadPlayer.player;
                    if (!player && !squadPlayer.playerId) {
                      console.warn('Squad player missing both player object and playerId:', squadPlayer);
                      return null;
                    }

                    const playerName = player?.name || player?.fullName || 'Unknown Player';
                    const playerNationality = player?.nationality || player?.country || 'Unknown';

                    return (
                      <TableRow
                        key={squadPlayer.playerId || `player-${Math.random()}`}
                        className={`group ${isEditing ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-4">
                            {/* Dual Image Setup */}
                            <div className="relative flex items-end">
                              {/* Face Image Circle */}
                              <div className="size-10 rounded-full border-2 border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-100 z-10">
                                <img src={player?.image || faceImage} alt={playerName} className="w-full h-full object-cover" />
                              </div>
                              {/* Full Body Image (Small) */}
                              <div className="w-8 h-12 -ml-4 bg-slate-100 dark:bg-slate-700 rounded-sm overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
                                <img src={fullImage} alt="" className="w-8 h-8 object-cover object-top " />
                              </div>
                            </div>

                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white">{playerName}</span>
                                <div className="flex gap-1">
                                  {squadPlayer.isCaptain && (
                                    <div className="size-5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 flex items-center justify-center text-[10px] font-bold border border-yellow-200 dark:border-yellow-700" title="Captain">C</div>
                                  )}
                                  {squadPlayer.isViceCaptain && (
                                    <div className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-200 dark:border-blue-700" title="Vice Captain">VC</div>
                                  )}
                                  {squadPlayer.isWicketKeeper && (
                                    <div className="size-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 flex items-center justify-center text-[10px] font-bold border border-purple-200 dark:border-purple-700" title="Wicket Keeper">WK</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => togglePlayerStatus(squadPlayer.playerId, 'isCaptain')}
                                className={`size-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${squadPlayer.isCaptain
                                  ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                  }`}
                                title="Captain"
                              >
                                C
                              </button>
                              <button
                                onClick={() => togglePlayerStatus(squadPlayer.playerId, 'isViceCaptain')}
                                className={`size-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${squadPlayer.isViceCaptain
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                  }`}
                                title="Vice Captain"
                              >
                                VC
                              </button>
                              <button
                                onClick={() => togglePlayerStatus(squadPlayer.playerId, 'isWicketKeeper')}
                                className={`size-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${squadPlayer.isWicketKeeper
                                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                  }`}
                                title="Wicket Keeper"
                              >
                                WK
                              </button>
                              <button
                                onClick={() => togglePlayerStatus(squadPlayer.playerId, 'isNotEligible')}
                                className={`size-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${squadPlayer.isNotEligible
                                  ? 'bg-red-100 text-red-700 border-red-300'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                  }`}
                                title="Not Eligible"
                              >
                                NE
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {squadPlayer.role === 'Batter' && <User className="size-4 text-blue-500" />}
                              {squadPlayer.role === 'Bowler' && <Shield className="size-4 text-green-500" />}
                              {squadPlayer.role === 'All-Rounder' && <User className="size-4 text-purple-500" />}
                              {squadPlayer.role === 'Wicket Keeper' && <Shield className="size-4 text-orange-500" />}
                              <span className="text-slate-700 dark:text-slate-300">{squadPlayer.role}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <Flag className="size-4 text-slate-400" />
                            {playerNationality}
                          </div>
                        </TableCell>
                        {isEditing && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e: any) => {
                                e.stopPropagation();
                                handleRemovePlayerFromSquad(squadPlayer.playerId);
                              }}
                              title="Remove from squad"
                            >
                              <Minus className="size-4" />
                            </Button>
                          </TableCell>
                        )}

                      </TableRow>
                    );
                  }).filter(Boolean)
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Player Search Modal */}
      {showPlayerSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Player to Squad</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowPlayerSearch(false);
                  setPlayerSearchTerm('');
                }}
              >
                ×
              </Button>
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search players by name..."
                  value={playerSearchTerm}
                  onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto p-4"
              onScroll={(e) => {
                const target = e.currentTarget;
                const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                // Load more when user scrolls within 100px of bottom
                if (scrollBottom < 100) {
                  handleLoadMorePlayers();
                }
              }}
            >
              {loadingPlayers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-blue-500" />
                </div>
              ) : availablePlayers.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  {playerSearchTerm ? 'No players found' : 'Search for players to add to squad'}
                </div>
              ) : (
                <div className="space-y-2">
                  {availablePlayers.map(player => (
                    <div
                      key={player._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {player.image && (
                          <img
                            src={player.image}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        )}
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{player.name}</div>
                          {player.fullName && player.fullName !== player.name && (
                            <div className="text-xs text-slate-500">{player.fullName}</div>
                          )}
                          <div className="text-xs text-slate-500">
                            {player.role} • {player.nationality || player.country || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddPlayerToSquad(player)}
                        className="gap-2"
                      >
                        <Plus className="size-4" />
                        Add
                      </Button>
                    </div>
                  ))}
                  {loadingMorePlayers && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-5 animate-spin text-blue-500" />
                      <span className="ml-2 text-sm text-slate-500">Loading more players...</span>
                    </div>
                  )}
                  {!hasMorePlayers && availablePlayers.length > 0 && (
                    <div className="text-center py-4 text-sm text-slate-500">
                      No more players to load
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
