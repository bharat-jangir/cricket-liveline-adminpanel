import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Users, Plus, Edit, Trash2, Loader2, Trophy, Star } from 'lucide-react';
import { toast } from 'sonner';
import FantasyStatsService from '../../services/fantasy-stats.service';
import { MatchService } from '../../services/match.service';
import SeriesTeamsService from '../../services/series-teams.service';
import type { FantasyStats, CreateFantasyStatsDto } from '../../types/fantasy-stats';
import type { Match } from '../../types/match';
import type { SeriesTeam, SquadPlayer } from '../../types/series-teams';
import type { Player } from '../../types/player';

type PlayerRole = 'wicket-keeper' | 'batsman' | 'all-rounder' | 'bowler';

const roleMap: Record<string, PlayerRole> = {
    'wicket-keeper': 'wicket-keeper',
    'batsman': 'batsman',
    'all-rounder': 'all-rounder',
    'bowler': 'bowler',
};

const roleDisplayMap: Record<PlayerRole, string> = {
    'wicket-keeper': 'Wicket Keeper',
    'batsman': 'Batsman',
    'all-rounder': 'All Rounder',
    'bowler': 'Bowler',
};

const roleColorMap: Record<PlayerRole, string> = {
    'wicket-keeper': 'border-l-blue-500',
    'batsman': 'border-l-green-500',
    'all-rounder': 'border-l-amber-500',
    'bowler': 'border-l-red-500',
};

export default function SeriesFantasyTab() {
    const { seriesId } = useParams();

    // State
    const [selectedMatchId, setSelectedMatchId] = useState<string>('');
    const [matches, setMatches] = useState<Match[]>([]);
    const [fantasyStats, setFantasyStats] = useState<FantasyStats[]>([]);
    const [seriesTeams, setSeriesTeams] = useState<SeriesTeam[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingStat, setEditingStat] = useState<FantasyStats | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateFantasyStatsDto>({
        matchId: '',
        playerId: '',
        teamId: '',
        role: 'batsman',
        points: 0,
        credits: 0,
        isCaptain: false,
        isViceCaptain: false,
        runs: 0,
        wickets: 0,
        catches: 0,
        stumpings: 0,
        fours: 0,
        sixes: 0,
        maidens: 0,
        economy: 0,
        isManOfTheMatch: false,
        isPlaying: true,
    });

    // Load matches for the series
    const loadMatches = useCallback(async () => {
        if (!seriesId) return;

        try {
            setLoadingMatches(true);
            const response = await MatchService.getAllMatches({ seriesId });
            if (response.status && response.data?.result) {
                setMatches(response.data.result);
                // Auto-select first match if available
                if (response.data.result.length > 0 && !selectedMatchId) {
                    setSelectedMatchId(response.data.result[0]._id!);
                }
            }
        } catch (error: any) {
            console.error('Failed to load matches:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to load matches');
        } finally {
            setLoadingMatches(false);
        }
    }, [seriesId, selectedMatchId]);

    // Load series teams
    const loadSeriesTeams = useCallback(async () => {
        if (!seriesId) return;

        try {
            const response = await SeriesTeamsService.getSeriesTeams(seriesId);
            if (response.status && response.data?.result) {
                setSeriesTeams(response.data.result);
            }
        } catch (error: any) {
            console.error('Failed to load series teams:', error);
            toast.error('Failed to load teams');
        }
    }, [seriesId]);

    // Load fantasy stats
    const loadFantasyStats = useCallback(async () => {
        if (!seriesId || !selectedMatchId) return;

        try {
            setLoading(true);
            const response = await FantasyStatsService.getFantasyStats(seriesId, {
                matchId: selectedMatchId,
                limit: 1000,
            });
            if (response.status && response.data?.result) {
                setFantasyStats(response.data.result);
            } else {
                setFantasyStats([]);
            }
        } catch (error: any) {
            console.error('Failed to load fantasy stats:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to load fantasy stats');
            setFantasyStats([]);
        } finally {
            setLoading(false);
        }
    }, [seriesId, selectedMatchId]);

    // Initial load
    useEffect(() => {
        loadMatches();
        loadSeriesTeams();
    }, [loadMatches, loadSeriesTeams]);

    // Load fantasy stats when match changes
    useEffect(() => {
        if (selectedMatchId) {
            loadFantasyStats();
        }
    }, [selectedMatchId, loadFantasyStats]);

    // Get all players from series squads
    const getAllPlayers = (): (SquadPlayer & { teamId: string; team?: any })[] => {
        const allPlayers: (SquadPlayer & { teamId: string; team?: any })[] = [];
        seriesTeams.forEach(team => {
            if (team.squadPlayers && Array.isArray(team.squadPlayers) && team.squadPlayers.length > 0) {
                team.squadPlayers.forEach(player => {
                    // Handle playerId - backend populates it as a Player object, not just an ID
                    let playerIdStr = '';
                    let playerObj: Player | undefined = undefined;
                    
                    if (typeof player.playerId === 'string') {
                        // playerId is a string ID
                        playerIdStr = player.playerId;
                    } else if (player.playerId && typeof player.playerId === 'object') {
                        // playerId is a populated Player object (from backend populate)
                        playerObj = player.playerId as any as Player;
                        playerIdStr = (player.playerId as any)?._id?.toString() || '';
                    }
                    
                    // Also check if player.player exists (some APIs might use this field)
                    if (!playerObj && player.player && typeof player.player === 'object') {
                        playerObj = player.player;
                        if (!playerIdStr && (playerObj as any)?._id) {
                            playerIdStr = (playerObj as any)._id.toString();
                        }
                    }
                    
                    if (!playerIdStr) {
                        console.warn('Skipping player without valid ID:', player);
                        return;
                    }
                    
                    const teamIdStr = typeof team.teamId === 'string' 
                        ? team.teamId 
                        : (team.teamId as any)?._id?.toString() || '';
                    
                    allPlayers.push({
                        ...player,
                        playerId: playerIdStr, // Always store as string for consistency
                        player: playerObj, // Store the populated player object for display
                        teamId: teamIdStr,
                        team: typeof team.team === 'object' && team.team !== null ? team.team : undefined,
                    });
                });
            }
        });
        console.log('All players from squads:', allPlayers.length);
        if (allPlayers.length > 0) {
            console.log('Sample player:', {
                playerId: allPlayers[0].playerId,
                playerName: allPlayers[0].player?.name,
                hasPlayer: !!allPlayers[0].player
            });
        }
        return allPlayers;
    };

    // Get players by role for selected match
    const getPlayersByRole = (role: PlayerRole): FantasyStats[] => {
        return fantasyStats.filter(stat => stat.role === role);
    };

    // Get available players (not yet added to fantasy stats)
    const getAvailablePlayers = (): (SquadPlayer & { teamId: string; team?: any })[] => {
        const allPlayers = getAllPlayers();
        const addedPlayerIds = fantasyStats.map(stat => {
            const playerId = typeof stat.playerId === 'object' && stat.playerId !== null
                ? (stat.playerId as Player)._id
                : stat.playerId;
            return playerId?.toString() || '';
        }).filter(id => id); // Remove empty strings
        
        console.log('Added player IDs:', addedPlayerIds);
        console.log('All players count:', allPlayers.length);
        
        const available = allPlayers.filter(player => {
            // playerId should now always be a string from getAllPlayers
            const playerId = typeof player.playerId === 'string' 
                ? player.playerId 
                : String(player.playerId || '');
            
            const isAvailable = playerId && !addedPlayerIds.includes(playerId);
            if (!isAvailable && playerId) {
                const playerName = player.player?.name || 'Unknown';
                console.log('Player already added:', playerId, playerName);
            }
            return isAvailable;
        });
        
        console.log('Available players count:', available.length);
        return available;
    };

    // Handle add/edit
    const handleOpenDialog = (stat?: FantasyStats) => {
        if (stat) {
            setEditingStat(stat);
            const playerId = typeof stat.playerId === 'object' && stat.playerId !== null
                ? (stat.playerId as Player)._id
                : stat.playerId;
            const teamId = typeof stat.teamId === 'object' && stat.teamId !== null
                ? (stat.teamId as any)._id
                : stat.teamId;
            setFormData({
                matchId: selectedMatchId,
                playerId: playerId?.toString() || '',
                teamId: teamId?.toString() || '',
                role: stat.role,
                points: stat.points,
                credits: stat.credits,
                isCaptain: stat.isCaptain,
                isViceCaptain: stat.isViceCaptain,
                runs: stat.runs || 0,
                wickets: stat.wickets || 0,
                catches: stat.catches || 0,
                stumpings: stat.stumpings || 0,
                fours: stat.fours || 0,
                sixes: stat.sixes || 0,
                maidens: stat.maidens || 0,
                economy: stat.economy || 0,
                isManOfTheMatch: stat.isManOfTheMatch || false,
                isPlaying: stat.isPlaying !== undefined ? stat.isPlaying : true,
            });
        } else {
            setEditingStat(null);
            setFormData({
                matchId: selectedMatchId,
                playerId: '',
                teamId: '',
                role: 'batsman',
                points: 0,
                credits: 0,
                isCaptain: false,
                isViceCaptain: false,
                runs: 0,
                wickets: 0,
                catches: 0,
                stumpings: 0,
                fours: 0,
                sixes: 0,
                maidens: 0,
                economy: 0,
                isManOfTheMatch: false,
                isPlaying: true,
            });
        }
        setShowAddDialog(true);
    };

    // Handle save
    const handleSave = async () => {
        if (!seriesId || !formData.playerId || !formData.matchId) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setSaving(true);
            if (editingStat) {
                await FantasyStatsService.updateFantasyStats(seriesId, editingStat._id, formData);
                toast.success('Fantasy stats updated successfully');
            } else {
                await FantasyStatsService.createFantasyStats(seriesId, formData);
                toast.success('Fantasy stats added successfully');
            }
            setShowAddDialog(false);
            loadFantasyStats();
        } catch (error: any) {
            console.error('Failed to save fantasy stats:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to save fantasy stats');
        } finally {
            setSaving(false);
        }
    };

    // Handle delete
    const handleDelete = async (stat: FantasyStats) => {
        if (!seriesId) return;
        if (!window.confirm('Are you sure you want to delete this fantasy stat?')) {
            return;
        }

        try {
            setLoading(true);
            await FantasyStatsService.deleteFantasyStats(seriesId, stat._id);
            toast.success('Fantasy stats deleted successfully');
            loadFantasyStats();
        } catch (error: any) {
            console.error('Failed to delete fantasy stats:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to delete fantasy stats');
        } finally {
            setLoading(false);
        }
    };

    // Get player name from stat
    const getPlayerName = (stat: FantasyStats): string => {
        if (!stat) return 'Unknown Player';
        
        const player = typeof stat.playerId === 'object' && stat.playerId !== null
            ? stat.playerId as Player
            : null;
        
        if (player) {
            return typeof player.name === 'string' 
                ? player.name 
                : (typeof player.fullName === 'string' ? player.fullName : 'Unknown Player');
        }
        
        // If playerId is a string, try to find player from all players
        const playerIdStr = typeof stat.playerId === 'string' ? stat.playerId : (stat.playerId as any)?.toString() || '';
        if (playerIdStr) {
            const allPlayersList = getAllPlayers();
            const foundPlayer = allPlayersList.find(p => {
                const pId = typeof p.playerId === 'string' ? p.playerId : (p.playerId as any)?.toString() || '';
                return pId === playerIdStr;
            });
            if (foundPlayer?.player) {
                return typeof foundPlayer.player.name === 'string'
                    ? foundPlayer.player.name
                    : (typeof foundPlayer.player.fullName === 'string' ? foundPlayer.player.fullName : 'Unknown Player');
            }
        }
        
        return 'Unknown Player';
    };

    // Get team name from stat
    const getTeamName = (stat: FantasyStats): string => {
        if (!stat) return 'Unknown Team';
        
        const team = typeof stat.teamId === 'object' && stat.teamId !== null
            ? stat.teamId as any
            : null;
        
        if (team) {
            return (typeof team.name === 'string' ? team.name : '') ||
                   (typeof team.shortName === 'string' ? team.shortName : '') ||
                   'Unknown Team';
        }
        
        // If teamId is a string, try to find team from seriesTeams
        const teamIdStr = typeof stat.teamId === 'string' ? stat.teamId : (stat.teamId as any)?.toString() || '';
        if (teamIdStr) {
            const seriesTeam = seriesTeams.find(t => {
                const tId = typeof t.teamId === 'string' ? t.teamId : (t.teamId as any)?._id?.toString() || '';
                return tId === teamIdStr;
            });
            if (seriesTeam) {
                const teamObj = typeof seriesTeam.team === 'object' && seriesTeam.team !== null
                    ? seriesTeam.team as any
                    : null;
                if (teamObj) {
                    return (typeof teamObj.name === 'string' ? teamObj.name : '') ||
                           (typeof teamObj.shortName === 'string' ? teamObj.shortName : '') ||
                           'Unknown Team';
                }
            }
        }
        
        return 'Unknown Team';
    };

    const selectedMatch = matches.find(m => m._id === selectedMatchId);

    return (
        <div className="space-y-6 pt-4">
            {/* Top Bar - Match Selection */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="text-sm font-medium whitespace-nowrap">Select Match:</label>
                    <Select
                        value={selectedMatchId ? String(selectedMatchId) : undefined}
                        onValueChange={(value) => setSelectedMatchId(String(value))}
                        disabled={loadingMatches}
                    >
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder={loadingMatches ? 'Loading matches...' : 'Select a match'} />
                        </SelectTrigger>
                        <SelectContent>
                            {matches.map((match) => {
                                const matchId = typeof match._id === 'string' ? match._id : (match._id as any)?.toString() || '';
                                const matchTitle = (typeof match.title === 'string' ? match.title : '') ||
                                    (typeof match.matchNumber === 'string' ? match.matchNumber : '') ||
                                    'Match';
                                // Ensure value and display text are always strings
                                return (
                                    <SelectItem key={String(matchId)} value={String(matchId)}>
                                        {String(matchTitle)}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    {selectedMatch && (
                        <Badge variant="secondary">
                            {new Date(selectedMatch.matchDate).toLocaleDateString()}
                        </Badge>
                    )}
                </div>
                {selectedMatchId && (
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => handleOpenDialog()}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Fantasy Stats
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingStat ? 'Edit Fantasy Stats' : 'Add Fantasy Stats'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {/* Player Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Player *</label>
                                    <Select
                                        value={formData.playerId ? String(formData.playerId) : undefined}
                                        onValueChange={(value) => {
                                            // Get all players (including already added ones for editing)
                                            const allPlayersList = getAllPlayers();
                                            const player = allPlayersList.find(p => {
                                                const pId = typeof p.playerId === 'string' ? p.playerId : String(p.playerId || '');
                                                return pId === String(value);
                                            });
                                            if (player) {
                                                // Map SquadPlayer role to fantasy role
                                                const squadRole = player.role || 'Batter';
                                                let fantasyRole: PlayerRole = 'batsman';
                                                if (squadRole === 'Wicket Keeper') fantasyRole = 'wicket-keeper';
                                                else if (squadRole === 'Batter') fantasyRole = 'batsman';
                                                else if (squadRole === 'All-Rounder') fantasyRole = 'all-rounder';
                                                else if (squadRole === 'Bowler') fantasyRole = 'bowler';
                                                
                                                setFormData({
                                                    ...formData,
                                                    playerId: String(value),
                                                    teamId: typeof player.teamId === 'string' ? player.teamId : (player.teamId as any)?.toString() || '',
                                                    role: fantasyRole,
                                                });
                                            }
                                        }}
                                        disabled={editingStat !== null}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={editingStat ? "Player (cannot change)" : "Select player"} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {(() => {
                                                // For editing, show all players. For adding, show only available
                                                const playersToShow = editingStat ? getAllPlayers() : getAvailablePlayers();
                                                
                                                if (playersToShow.length === 0) {
                                                    return (
                                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                                            {getAllPlayers().length === 0 
                                                                ? 'No players in squads. Add players to teams first.' 
                                                                : 'No available players. All players from squads have been added.'}
                                                        </div>
                                                    );
                                                }
                                                
                                                return playersToShow.map((player) => {
                                                    // playerId should now always be a string from getAllPlayers
                                                    const playerIdStr = typeof player.playerId === 'string' 
                                                        ? player.playerId 
                                                        : String(player.playerId || '');
                                                    
                                                    if (!playerIdStr) {
                                                        console.warn('Player without ID:', player);
                                                        return null;
                                                    }
                                                    
                                                    // Get player name from populated player object - ensure it's a string
                                                    let playerName = '';
                                                    if (player.player && typeof player.player === 'object' && player.player !== null) {
                                                        const p = player.player as any;
                                                        playerName = (typeof p.name === 'string' ? p.name : '') ||
                                                            (typeof p.fullName === 'string' ? p.fullName : '');
                                                    }
                                                    
                                                    // If player name is still empty, use playerId as fallback
                                                    if (!playerName || playerName.trim() === '') {
                                                        playerName = `Player ${playerIdStr.substring(0, 8)}`;
                                                    }
                                                    
                                                    // Get team name - check if team is populated in player object first, then from seriesTeams
                                                    let teamName = 'Unknown';
                                                    if (player.team && typeof player.team === 'object') {
                                                        teamName = (typeof player.team.name === 'string' ? player.team.name : '') ||
                                                            (typeof player.team.shortName === 'string' ? player.team.shortName : '') ||
                                                            'Unknown';
                                                    } else {
                                                        // Find team from seriesTeams
                                                        const teamIdStr = typeof player.teamId === 'string' ? player.teamId : (player.teamId as any)?.toString() || '';
                                                        const seriesTeam = seriesTeams.find(t => {
                                                            const tId = typeof t.teamId === 'string' ? t.teamId : (t.teamId as any)?._id?.toString() || '';
                                                            return tId === teamIdStr;
                                                        });
                                                        if (seriesTeam && seriesTeam.team) {
                                                            const team = typeof seriesTeam.team === 'object' && seriesTeam.team !== null
                                                                ? seriesTeam.team as any
                                                                : null;
                                                            if (team) {
                                                                teamName = (typeof team.name === 'string' ? team.name : '') ||
                                                                    (typeof team.shortName === 'string' ? team.shortName : '') ||
                                                                    'Unknown';
                                                            }
                                                        }
                                                    }
                                                    
                                                    // Ensure all values are strings
                                                    const displayText = `${playerName} (${teamName})`;
                                                    
                                                    return (
                                                        <SelectItem key={playerIdStr} value={String(playerIdStr)}>
                                                            {displayText}
                                                        </SelectItem>
                                                    );
                                                }).filter(Boolean);
                                            })()}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role *</label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => setFormData({ ...formData, role: value as PlayerRole })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(roleDisplayMap).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Points and Credits */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Points</label>
                                        <Input
                                            type="number"
                                            value={formData.points || 0}
                                            onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Credits</label>
                                        <Input
                                            type="number"
                                            value={formData.credits || 0}
                                            onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                {/* Performance Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Runs</label>
                                        <Input
                                            type="number"
                                            value={formData.runs || 0}
                                            onChange={(e) => setFormData({ ...formData, runs: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Wickets</label>
                                        <Input
                                            type="number"
                                            value={formData.wickets || 0}
                                            onChange={(e) => setFormData({ ...formData, wickets: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Catches</label>
                                        <Input
                                            type="number"
                                            value={formData.catches || 0}
                                            onChange={(e) => setFormData({ ...formData, catches: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Fours</label>
                                        <Input
                                            type="number"
                                            value={formData.fours || 0}
                                            onChange={(e) => setFormData({ ...formData, fours: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Sixes</label>
                                        <Input
                                            type="number"
                                            value={formData.sixes || 0}
                                            onChange={(e) => setFormData({ ...formData, sixes: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Economy</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.economy || 0}
                                            onChange={(e) => setFormData({ ...formData, economy: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                {/* Flags */}
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isCaptain || false}
                                            onChange={(e) => setFormData({ ...formData, isCaptain: e.target.checked })}
                                        />
                                        <span className="text-sm">Captain</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isViceCaptain || false}
                                            onChange={(e) => setFormData({ ...formData, isViceCaptain: e.target.checked })}
                                        />
                                        <span className="text-sm">Vice Captain</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isManOfTheMatch || false}
                                            onChange={(e) => setFormData({ ...formData, isManOfTheMatch: e.target.checked })}
                                        />
                                        <span className="text-sm">Man of the Match</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPlaying !== false}
                                            onChange={(e) => setFormData({ ...formData, isPlaying: e.target.checked })}
                                        />
                                        <span className="text-sm">Playing</span>
                                    </label>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAddDialog(false)}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Fantasy Stats by Role */}
            {!selectedMatchId ? (
                <div className="text-center py-12 text-muted-foreground">
                    Please select a match to view fantasy stats
                </div>
            ) : loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(['wicket-keeper', 'batsman', 'all-rounder', 'bowler'] as PlayerRole[]).map((role) => {
                        const stats = getPlayersByRole(role);
                        return (
                            <Card key={role} className={`min-h-[400px] ${roleColorMap[role]}`}>
                                <CardHeader className="pb-2 border-b mb-2">
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className={`h-5 w-5 ${roleColorMap[role].replace('border-l-', 'text-')}`} />
                                            {roleDisplayMap[role]}
                                        </div>
                                        <Badge variant="secondary">{stats.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {stats.length === 0 ? (
                                        <div className="text-sm text-muted-foreground text-center py-4">
                                            No players added
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {stats.map((stat) => (
                                                <div
                                                    key={stat._id}
                                                    className="text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                                                >
                                                    <div className="flex items-start justify-between mb-1">
                                                        <div className="flex-1">
                                                            <div className="font-medium">{getPlayerName(stat)}</div>
                                                            <div className="text-xs text-muted-foreground">{getTeamName(stat)}</div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {stat.isCaptain && (
                                                                <Badge variant="default" className="text-xs">
                                                                    <Trophy className="h-3 w-3 mr-1" />
                                                                    C
                                                                </Badge>
                                                            )}
                                                            {stat.isViceCaptain && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    VC
                                                                </Badge>
                                                            )}
                                                            {stat.isManOfTheMatch && (
                                                                <Badge variant="default" className="text-xs bg-yellow-600">
                                                                    <Star className="h-3 w-3 mr-1" />
                                                                    MOTM
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                                                        <div>Points: <span className="font-semibold">{stat.points}</span></div>
                                                        <div>Credits: <span className="font-semibold">{stat.credits}</span></div>
                                                        {stat.runs !== undefined && stat.runs > 0 && (
                                                            <div>Runs: {stat.runs}</div>
                                                        )}
                                                        {stat.wickets !== undefined && stat.wickets > 0 && (
                                                            <div>Wickets: {stat.wickets}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 mt-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-xs"
                                                            onClick={() => handleOpenDialog(stat)}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                                            onClick={() => handleDelete(stat)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
