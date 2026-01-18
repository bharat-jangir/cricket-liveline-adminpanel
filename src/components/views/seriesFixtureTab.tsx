import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Trash2,
    Edit,
    Home,
    Bell,
    Plus,
    Save,
    X,
    Loader2
} from 'lucide-react';
import { Badge } from '../ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { MatchService } from '../../services/match.service';
import { TeamService } from '../../services/team.service';
import { venueService } from '../../services/venue.service';
import { LiveMatchService } from '../../services/live-match.service';
import { Match } from '../../types/match';
import { Team } from '../../types/team';
import { Venue } from '../../types/venue';
import { toast } from 'sonner';
import { FORMAT_CONFIG, type FormatSettings, type MatchFormat, type MatchStatus } from '../../utils/cricketUtils';


const mapFormatToBackend = (format: MatchFormat): 't20' | 'odi' | 'test' | 't10' | 'hundred' => {
    switch (format) {
        case 'T20': return 't20';
        case 'ODI': return 'odi';
        case 'Test': return 'test';
        case 'T10': return 't10';
        case 'The Hundred': return 'hundred';
        default: return 'odi';
    }
};

const mapFormatFromBackend = (format: string): MatchFormat => {
    switch (format.toLowerCase()) {
        case 't20':
        case 't20i': return 'T20';
        case 'odi': return 'ODI';
        case 'test': return 'Test';
        case 't10': return 'T10';
        case 'hundred': return 'The Hundred';
        default: return 'ODI';
    }
};

const mapStatusToBackend = (status: MatchStatus): 'scheduled' | 'live' | 'completed' | 'abandoned' | 'cancelled' => {
    switch (status) {
        case 'Scheduled': return 'scheduled';
        case 'Live': return 'live';
        case 'Completed': return 'completed';
        case 'Abandoned': return 'abandoned';
        default: return 'scheduled';
    }
};

const mapStatusFromBackend = (status: string): MatchStatus => {
    switch (status.toLowerCase()) {
        case 'scheduled': return 'Scheduled';
        case 'live': return 'Live';
        case 'completed': return 'Completed';
        case 'abandoned': return 'Abandoned';
        case 'cancelled': return 'Abandoned';
        default: return 'Scheduled';
    }
};

interface FixtureDisplay {
    _id?: string;
    matchNumber: string;
    title: string;
    format: MatchFormat;
    matchType: 'international' | 'domestic' | 'league';
    totalInnings: number;
    teamAId: string;
    teamA?: Team;
    teamBId: string;
    teamB?: Team;
    venueId?: string;
    venue?: Venue;
    matchDate: string; // YYYY-MM-DD format for input
    matchTime?: string; // datetime-local format: YYYY-MM-DDTHH:mm
    status: MatchStatus;
    isFeatured: boolean; // Using isFeatured for isHomeDisplaying
}

export function SeriesFixtureTab() {
    const { seriesId } = useParams();
    const navigate = useNavigate();

    const [fixtures, setFixtures] = useState<FixtureDisplay[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [tempFixtures, setTempFixtures] = useState<FixtureDisplay[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [teams, setTeams] = useState<Team[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [loadingVenues, setLoadingVenues] = useState(false);

    // New fixture form data
    const [newFixture, setNewFixture] = useState<Partial<FixtureDisplay>>({
        title: '',
        matchNumber: '',
        format: 'ODI',
        matchType: 'domestic',
        totalInnings: 2,
        teamAId: '',
        teamBId: '',
        venueId: '',
        matchDate: '',
        matchTime: '',
        status: 'Scheduled',
        isFeatured: false,
    });

    // Load matches for the series
    const loadMatches = useCallback(async () => {
        if (!seriesId) return;

        try {
            setLoading(true);
            console.log('Loading matches for seriesId:', seriesId);
            const response = await MatchService.getAllMatches({
                seriesId,
                limit: 100
            });

            console.log('Matches API response:', response);
            console.log('Response status (API):', response.status);
            console.log('Response data:', response.data);

            // MatchService.getAllMatches returns response.data (which is MatchListResponse)
            // So response is already the API response object with status, data, etc.
            if (response.status && response.data?.result) {
                const matches = response.data.result;
                console.log('Matches found:', matches.length);
                console.log('Sample match structure:', matches[0]);
                console.log('teamAId type:', typeof matches[0]?.teamAId, matches[0]?.teamAId);
                console.log('teamBId type:', typeof matches[0]?.teamBId, matches[0]?.teamBId);
                console.log('venueId type:', typeof matches[0]?.venueId, matches[0]?.venueId);

                if (Array.isArray(matches) && matches.length > 0) {
                    const displayFixtures: FixtureDisplay[] = matches.map((match: any) => {
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

                        // Extract team objects
                        const teamA = getTeamObject(match.teamAId, match.teamA);
                        const teamB = getTeamObject(match.teamBId, match.teamB);
                        const venue = getTeamObject(match.venueId, match.venue);

                        // Extract the ID - if it's an object, get _id, otherwise use the string
                        const teamAId = teamA?._id
                            ? (typeof teamA._id === 'object' ? teamA._id.toString() : String(teamA._id))
                            : (typeof match.teamAId === 'string' ? match.teamAId : (match.teamAId?.toString() || ''));
                        const teamBId = teamB?._id
                            ? (typeof teamB._id === 'object' ? teamB._id.toString() : String(teamB._id))
                            : (typeof match.teamBId === 'string' ? match.teamBId : (match.teamBId?.toString() || ''));
                        const venueId = venue?._id
                            ? (typeof venue._id === 'object' ? venue._id.toString() : String(venue._id))
                            : (typeof match.venueId === 'string' ? match.venueId : (match.venueId?.toString() || ''));

                        return {
                            _id: match._id,
                            matchNumber: match.matchNumber,
                            title: match.title,
                            format: mapFormatFromBackend(match.matchFormat),
                            matchType: match.matchType || 'domestic',
                            totalInnings: match.totalInnings || 2,
                            teamAId: teamAId,
                            teamA: teamA,
                            teamBId: teamBId,
                            teamB: teamB,
                            venueId: venueId,
                            venue: venue,
                            matchDate: match.matchDate ? new Date(match.matchDate).toISOString().split('T')[0] : '',
                            matchTime: match.matchTime ? (typeof match.matchTime === 'string' ? new Date(match.matchTime).toISOString().slice(0, 16) : new Date(match.matchTime).toISOString().slice(0, 16)) : '',
                            status: mapStatusFromBackend(match.status),
                            isFeatured: match.isFeatured || false,
                        };
                    });
                    console.log('Display fixtures:', displayFixtures);
                    console.log('First fixture teams:', displayFixtures[0]?.teamA, displayFixtures[0]?.teamB);
                    console.log('First fixture venue:', displayFixtures[0]?.venue);
                    setFixtures(displayFixtures);
                } else {
                    console.log('No matches found for this series. Setting empty array.');
                    setFixtures([]);
                }
            } else {
                console.log('API returned unsuccessful status or no data:', response);
                setFixtures([]);
            }
        } catch (error: any) {
            console.error('Failed to load matches:', error);
            console.error('Error details:', error.response?.data);
            const errorMessage = error.response?.data?.userMessage || error.message || 'Failed to load fixtures';
            toast.error(errorMessage);
            setFixtures([]);
        } finally {
            setLoading(false);
        }
    }, [seriesId]);

    // Load teams
    const loadTeams = useCallback(async () => {
        try {
            setLoadingTeams(true);
            const response = await TeamService.listTeams({ page: 1, limit: 100 });
            if (response.status && response.data?.result) {
                setTeams(response.data.result);
            }
        } catch (error: any) {
            console.error('Failed to load teams:', error);
            toast.error('Failed to load teams');
        } finally {
            setLoadingTeams(false);
        }
    }, []);

    // Load venues
    const loadVenues = useCallback(async () => {
        try {
            setLoadingVenues(true);
            const response = await venueService.getVenues({ page: 1, limit: 100 });
            if (response.status && response.data?.result) {
                setVenues(response.data.result);
            }
        } catch (error: any) {
            console.error('Failed to load venues:', error);
            toast.error('Failed to load venues');
        } finally {
            setLoadingVenues(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadMatches();
        loadTeams();
        loadVenues();
    }, [loadMatches, loadTeams, loadVenues]);

    const getStatusVariant = (status: MatchStatus) => {
        switch (status) {
            case 'Live': return 'destructive';
            case 'Completed': return 'default';
            case 'Scheduled': return 'secondary';
            case 'Abandoned': return 'outline';
            default: return 'default';
        }
    };

    const handleDeleteFixture = async (matchId: string) => {
        if (!confirm('Are you sure you want to delete this fixture?')) return;

        try {
            await MatchService.deleteMatch(matchId);
            toast.success('Fixture deleted successfully');
            loadMatches();
        } catch (error: any) {
            console.error('Failed to delete fixture:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to delete fixture');
        }
    };

    const handleViewFixtureDetails = (matchId: string) => {
        navigate(`/match/live/${matchId}`);
    };

    const handleEnableEdit = () => {
        setIsEditing(true);
        setTempFixtures([...fixtures]);
        setShowAddForm(false);
    };

    const handleSave = async () => {
        if (!seriesId) return;

        try {
            setSaving(true);
            const updatePromises = tempFixtures.map(async (fixture) => {
                if (!fixture._id) return;

                const payload = {
                    matchNumber: fixture.matchNumber,
                    title: fixture.title,
                    shortTitle: fixture.title.substring(0, 50),
                    slug: MatchService.generateSlug(fixture.title),
                    seriesId,
                    matchType: fixture.matchType,
                    matchFormat: mapFormatToBackend(fixture.format),
                    totalInnings: fixture.totalInnings,
                    teamAId: fixture.teamAId,
                    teamBId: fixture.teamBId,
                    venueId: fixture.venueId,
                    matchDate: new Date(fixture.matchDate),
                    matchTime: fixture.matchTime ? new Date(fixture.matchTime) : undefined,
                    status: mapStatusToBackend(fixture.status),
                    isFeatured: fixture.isFeatured,
                };

                return MatchService.updateMatch(fixture._id, payload);
            });

            await Promise.all(updatePromises);
            toast.success('Fixtures updated successfully');
            setIsEditing(false);
            setTempFixtures([]);
            loadMatches();
        } catch (error: any) {
            console.error('Failed to update fixtures:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to update fixtures');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setTempFixtures([...fixtures]);
        setIsEditing(false);
        setShowAddForm(false);
        setNewFixture({
            title: '',
            matchNumber: '',
            format: 'ODI',
            teamAId: '',
            teamBId: '',
            venueId: '',
            matchDate: '',
            matchTime: '',
            status: 'Scheduled',
            isFeatured: false,
        });
    };

    const handleAddNew = () => {
        setShowAddForm(true);
        setIsEditing(false);
    };

    const handleUpdateFixture = (matchId: string, field: keyof FixtureDisplay, value: any) => {
        setTempFixtures(prev => prev.map(f =>
            f._id === matchId ? { ...f, [field]: value } : f
        ));
    };

    const handleSaveNewFixture = async () => {
        if (!seriesId) return;

        if (!newFixture.title || !newFixture.matchDate || !newFixture.matchTime || !newFixture.teamAId || !newFixture.teamBId) {
            toast.error('Please fill all required fields including Match Time');
            return;
        }

        try {
            setSaving(true);
            const matchNumber = newFixture.matchNumber || `${fixtures.length + 1}`;
            const format = newFixture.format as MatchFormat;
            const defaults = FORMAT_CONFIG[format] || FORMAT_CONFIG['ODI'];

            const payload = {
                matchNumber,
                title: newFixture.title,
                shortTitle: newFixture.title.substring(0, 50),
                slug: MatchService.generateSlug(newFixture.title),
                seriesId,
                matchType: newFixture.matchType! as any,
                matchFormat: mapFormatToBackend(format),
                totalInnings: newFixture.totalInnings!,
                teamAId: newFixture.teamAId!,
                teamBId: newFixture.teamBId!,
                venueId: newFixture.venueId || undefined, // venueId is optional now
                matchDate: new Date(newFixture.matchDate!),
                matchTime: newFixture.matchTime ? new Date(newFixture.matchTime) : undefined,
                status: mapStatusToBackend(newFixture.status as MatchStatus),
                isFeatured: newFixture.isFeatured || false,
                ballsPerOver: defaults.ballsPerOver,
                oversPerInning: defaults.oversPerInning,
                maxBowlerLimit: defaults.maxBowlerLimit,
            };

            const response = await MatchService.createMatch(payload);

            if (response.data && response.data.result) {
                const newMatchId = response.data.result._id;

                // Initialize live match data
                try {
                    // Create initial live status WITH defaults
                    await LiveMatchService.updateLiveStatus(newMatchId!, {
                        currentInning: 1,
                        currentOver: 0,
                        currentBall: '0',
                        // Teams are NOT set automatically - user must set them manually
                        score: '0/0',
                        overs: '0.0',
                        balls: 0,
                        runRate: 0,
                        requiredRunRate: 0,
                        target: 0,
                        ballsRemaining: 0,
                        ballsPerOver: defaults.ballsPerOver,
                        oversPerInning: defaults.oversPerInning,
                        maxBowlerLimit: defaults.maxBowlerLimit,
                    });

                    console.log('Live match data initialized for match:', newMatchId);
                } catch (initError) {
                    console.error('Failed to initialize live match data:', initError);
                    toast.error('Fixture created but failed to initialize live data');
                }
            }

            toast.success('Fixture created successfully');
            setShowAddForm(false);
            setNewFixture({
                title: '',
                matchNumber: '',
                format: 'ODI',
                teamAId: '',
                teamBId: '',
                matchDate: '',
                matchTime: '',
                status: 'Scheduled',
                isFeatured: false,
            });
            loadMatches();
        } catch (error: any) {
            console.error('Failed to create fixture:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to create fixture');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='w-full h-full flex flex-col overflow-scroll'>
            <div className='w-full flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-700'>
                <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
                    Fixtures List ({fixtures.length})
                </h2>

                {!isEditing && !showAddForm ? (
                    <div className='flex gap-2'>
                        <Button
                            variant="outline"
                            className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white border-blue-600'
                            onClick={handleEnableEdit}
                        >
                            <Edit className='mr-2 h-4 w-4' />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            className='bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white border-green-600'
                            onClick={handleAddNew}
                        >
                            <Plus className='mr-2 h-4 w-4' />
                            Add New
                        </Button>
                    </div>
                ) : (
                    <div className='flex gap-2'>
                        <Button
                            variant="outline"
                            className='bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white border-green-600'
                            onClick={isEditing ? handleSave : handleSaveNewFixture}
                            disabled={saving}
                        >
                            {saving ? (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                                <Save className='mr-2 h-4 w-4' />
                            )}
                            Save
                        </Button>
                        <Button
                            variant="outline"
                            className='bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white border-red-600'
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            <X className='mr-2 h-4 w-4' />
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            {/* Add New Fixture Form */}
            {showAddForm && (
                <div className='mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50'>
                    <h3 className='text-lg font-semibold mb-4 text-slate-900 dark:text-white'>Add New Fixture</h3>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Fixture Name *</label>
                            <Input
                                value={newFixture.title}
                                onChange={(e) => setNewFixture({ ...newFixture, title: e.target.value })}
                                placeholder="e.g. 1st ODI"
                                className='bg-white dark:bg-slate-700'
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Match Number</label>
                            <Input
                                value={newFixture.matchNumber}
                                onChange={(e) => setNewFixture({ ...newFixture, matchNumber: e.target.value })}
                                placeholder="e.g. 1, 2, 3"
                                className='bg-white dark:bg-slate-700'
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Format *</label>
                            <Select
                                value={newFixture.format}
                                onValueChange={(value: MatchFormat) => setNewFixture({ ...newFixture, format: value })}
                            >
                                <SelectTrigger className='bg-white dark:bg-slate-700'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ODI">ODI</SelectItem>
                                    <SelectItem value="T20">T20</SelectItem>
                                    <SelectItem value="Test">Test</SelectItem>
                                    <SelectItem value="T10">T10</SelectItem>
                                    <SelectItem value="The Hundred">The Hundred</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Match Type *</label>
                            <Select
                                value={newFixture.matchType}
                                onValueChange={(value: any) => setNewFixture({ ...newFixture, matchType: value })}
                            >
                                <SelectTrigger className='bg-white dark:bg-slate-700'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="domestic">Domestic</SelectItem>
                                    <SelectItem value="international">International</SelectItem>
                                    <SelectItem value="league">League</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Total Innings *</label>
                            <Input
                                type="number"
                                min={2}
                                max={4}
                                value={newFixture.totalInnings}
                                onChange={(e) => setNewFixture({ ...newFixture, totalInnings: parseInt(e.target.value) || 2 })}
                                className='bg-white dark:bg-slate-700'
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Team 1 *</label>
                            <Select
                                value={newFixture.teamAId}
                                onValueChange={(value) => setNewFixture({ ...newFixture, teamAId: value })}
                                disabled={loadingTeams}
                            >
                                <SelectTrigger className='bg-white dark:bg-slate-700'>
                                    <SelectValue placeholder="Select Team 1" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map(team => (
                                        <SelectItem key={team._id} value={team._id!}>
                                            {team.logo ? <span className="mr-2">{team.logo}</span> : null}
                                            {team.shortName || team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Team 2 *</label>
                            <Select
                                value={newFixture.teamBId}
                                onValueChange={(value) => setNewFixture({ ...newFixture, teamBId: value })}
                                disabled={loadingTeams}
                            >
                                <SelectTrigger className='bg-white dark:bg-slate-700'>
                                    <SelectValue placeholder="Select Team 2" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map(team => (
                                        <SelectItem key={team._id} value={team._id!}>
                                            {team.logo ? <span className="mr-2">{team.logo}</span> : null}
                                            {team.shortName || team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Date *</label>
                            <Input
                                type="date"
                                value={newFixture.matchDate}
                                onChange={(e) => setNewFixture({ ...newFixture, matchDate: e.target.value })}
                                className='bg-white dark:bg-slate-700'
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Match Time (Timestamp) *</label>
                            <Input
                                type="datetime-local"
                                value={newFixture.matchTime || ''}
                                onChange={(e) => setNewFixture({ ...newFixture, matchTime: e.target.value })}
                                className='bg-white dark:bg-slate-700'
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block'>Status</label>
                            <Select
                                value={newFixture.status}
                                onValueChange={(value: MatchStatus) => setNewFixture({ ...newFixture, status: value })}
                            >
                                <SelectTrigger className='bg-white dark:bg-slate-700'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                                    <SelectItem value="Live">Live</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Abandoned">Abandoned</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className='flex justify-center items-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-slate-400' />
                </div>
            ) : (
                <div className='overflow-x-auto'>
                    <Table className='min-w-full'>
                        <TableHeader>
                            <TableRow>
                                <TableHead className='w-[80px] text-center'>
                                    <Home className='h-4 w-4 mx-auto' />
                                </TableHead>
                                <TableHead className='w-[80px]'>Format</TableHead>
                                <TableHead className='w-[80px]'>Match No</TableHead>
                                <TableHead>Fixture Name</TableHead>
                                <TableHead>Teams</TableHead>
                                <TableHead>Venue</TableHead>
                                <TableHead className='w-[100px]'>Date</TableHead>
                                <TableHead className='w-[100px]'>Status</TableHead>
                                <TableHead className='w-[80px] text-center'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {(isEditing ? tempFixtures : fixtures).map((fixture) => (
                                <TableRow key={fixture._id || fixture.matchNumber}>
                                    {/* Home Displaying Toggle */}
                                    <TableCell className="text-center p-2">
                                        <button
                                            onClick={() => {
                                                if (isEditing) {
                                                    handleUpdateFixture(fixture._id!, 'isFeatured', !fixture.isFeatured);
                                                } else {
                                                    // Quick toggle without edit mode
                                                    if (fixture._id) {
                                                        MatchService.updateMatch(fixture._id, { isFeatured: !fixture.isFeatured })
                                                            .then(() => {
                                                                toast.success('Updated');
                                                                loadMatches();
                                                            })
                                                            .catch((error: any) => {
                                                                toast.error('Failed to update');
                                                            });
                                                    }
                                                }
                                            }}
                                            style={{
                                                position: 'relative',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                height: '24px',
                                                width: '44px',
                                                borderRadius: '12px',
                                                backgroundColor: fixture.isFeatured ? '#2563eb' : '#d1d5db',
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s',
                                                outline: 'none',
                                            }}
                                            role="switch"
                                            aria-checked={fixture.isFeatured}
                                        >
                                            <span
                                                style={{
                                                    display: 'block',
                                                    height: '16px',
                                                    width: '16px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#ffffff',
                                                    transform: fixture.isFeatured ? 'translateX(24px)' : 'translateX(4px)',
                                                    transition: 'transform 0.2s',
                                                }}
                                            />
                                        </button>
                                    </TableCell>

                                    <TableCell>
                                        {isEditing ? (
                                            <div className='flex flex-col gap-2'>
                                                <Select
                                                    value={fixture.format}
                                                    onValueChange={(value: MatchFormat) => handleUpdateFixture(fixture._id!, 'format', value)}
                                                >
                                                    <SelectTrigger className='h-8 w-[100px] bg-white dark:bg-slate-700'>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ODI">ODI</SelectItem>
                                                        <SelectItem value="T20">T20</SelectItem>
                                                        <SelectItem value="Test">Test</SelectItem>
                                                        <SelectItem value="T10">T10</SelectItem>
                                                        <SelectItem value="The Hundred">The Hundred</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    value={fixture.matchType}
                                                    onValueChange={(value: any) => handleUpdateFixture(fixture._id!, 'matchType', value)}
                                                >
                                                    <SelectTrigger className='h-8 w-[100px] bg-white dark:bg-slate-700'>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="domestic">Domestic</SelectItem>
                                                        <SelectItem value="international">International</SelectItem>
                                                        <SelectItem value="league">League</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="number"
                                                    min={2}
                                                    max={4}
                                                    value={fixture.totalInnings}
                                                    onChange={(e) => handleUpdateFixture(fixture._id!, 'totalInnings', parseInt(e.target.value) || 2)}
                                                    className='h-8 w-[100px] bg-white dark:bg-slate-700'
                                                />
                                            </div>
                                        ) : (
                                            <div className='flex flex-col gap-1'>
                                                <Badge variant='outline'>
                                                    {fixture.format}
                                                </Badge>
                                                <span className='text-[10px] uppercase text-slate-500 font-bold'>
                                                    {fixture.matchType}
                                                </span>
                                                <span className='text-[10px] text-slate-500'>
                                                    {fixture.totalInnings} Inn
                                                </span>
                                            </div>
                                        )}
                                    </TableCell>

                                    <TableCell>{fixture.matchNumber}</TableCell>

                                    <TableCell className='font-medium'>
                                        {isEditing ? (
                                            <div className='space-y-1'>
                                                <Input
                                                    value={fixture.title}
                                                    onChange={(e) => handleUpdateFixture(fixture._id!, 'title', e.target.value)}
                                                    className='h-8 bg-white dark:bg-slate-700'
                                                />
                                                <Input
                                                    type="datetime-local"
                                                    value={fixture.matchTime || ''}
                                                    onChange={(e) => handleUpdateFixture(fixture._id!, 'matchTime', e.target.value)}
                                                    className='h-8 bg-white dark:bg-slate-700'
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                {fixture.title}
                                                {fixture.matchTime && (
                                                    <div className='text-xs text-muted-foreground'>
                                                        {new Date(fixture.matchTime).toLocaleString()}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {isEditing ? (
                                            <div className='space-y-1'>
                                                <Select
                                                    value={fixture.teamAId}
                                                    onValueChange={(value) => handleUpdateFixture(fixture._id!, 'teamAId', value)}
                                                >
                                                    <SelectTrigger className='h-8 bg-white dark:bg-slate-700'>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {teams.map(team => (
                                                            <SelectItem key={team._id} value={team._id!}>
                                                                {team.logo ? <span className="mr-2">{team.logo}</span> : null}
                                                                {team.shortName || team.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    value={fixture.teamBId}
                                                    onValueChange={(value) => handleUpdateFixture(fixture._id!, 'teamBId', value)}
                                                >
                                                    <SelectTrigger className='h-8 bg-white dark:bg-slate-700'>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {teams.map(team => (
                                                            <SelectItem key={team._id} value={team._id!}>
                                                                {team.logo ? <span className="mr-2">{team.logo}</span> : null}
                                                                {team.shortName || team.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <div className='flex items-center space-x-2'>
                                                <span>
                                                    {(() => {
                                                        const teamAObj = fixture.teamA;
                                                        const teamAFromList = teams.find(t => t._id === fixture.teamAId);
                                                        const teamAName = teamAObj?.shortName || teamAObj?.name || teamAFromList?.shortName || teamAFromList?.name || 'Team A';
                                                        const teamALogo = teamAObj?.logo || teamAFromList?.logo || '';
                                                        return (
                                                            <>
                                                                {teamALogo ? `${teamALogo} ` : ''}
                                                                {teamAName}
                                                            </>
                                                        );
                                                    })()}
                                                </span>
                                                <span className='text-xs text-muted-foreground'>vs</span>
                                                <span>
                                                    {(() => {
                                                        const teamBObj = fixture.teamB;
                                                        const teamBFromList = teams.find(t => t._id === fixture.teamBId);
                                                        const teamBName = teamBObj?.shortName || teamBObj?.name || teamBFromList?.shortName || teamBFromList?.name || 'Team B';
                                                        const teamBLogo = teamBObj?.logo || teamBFromList?.logo || '';
                                                        return (
                                                            <>
                                                                {teamBLogo ? `${teamBLogo} ` : ''}
                                                                {teamBName}
                                                            </>
                                                        );
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {fixture.venue ? `${fixture.venue.name}${fixture.venue.city ? `, ${fixture.venue.city}` : ''}` : 'TBD'}
                                    </TableCell>

                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                type="date"
                                                value={fixture.matchDate}
                                                onChange={(e) => handleUpdateFixture(fixture._id!, 'matchDate', e.target.value)}
                                                className='h-8 bg-white dark:bg-slate-700'
                                            />
                                        ) : (
                                            fixture.matchDate
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {isEditing ? (
                                            <Select
                                                value={fixture.status}
                                                onValueChange={(value: MatchStatus) => handleUpdateFixture(fixture._id!, 'status', value)}
                                            >
                                                <SelectTrigger className='h-8 bg-white dark:bg-slate-700'>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                                                    <SelectItem value="Live">Live</SelectItem>
                                                    <SelectItem value="Completed">Completed</SelectItem>
                                                    <SelectItem value="Abandoned">Abandoned</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant={getStatusVariant(fixture.status)}>
                                                {fixture.status}
                                            </Badge>
                                        )}
                                    </TableCell>

                                    <TableCell className='text-center'>
                                        {!isEditing ? (
                                            <div className='flex justify-center space-x-2'>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    onClick={() => fixture._id && handleViewFixtureDetails(fixture._id)}
                                                    className='text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                                                >
                                                    <Bell className='h-4 w-4' />
                                                </Button>

                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    onClick={() => fixture._id && handleDeleteFixture(fixture._id)}
                                                    className='text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className='text-xs text-slate-500 dark:text-slate-400'>Editing...</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {fixtures.length === 0 && !loading && (
                        <div className='text-center p-4 text-muted-foreground'>
                            No fixtures scheduled for this series yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
