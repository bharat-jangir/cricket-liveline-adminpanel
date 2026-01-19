import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PointsTableService, { type PointsTableEntry as BackendEntry } from '../../services/points-table.service';
import SeriesTeamsService from '../../services/series-teams.service';
import type { SeriesTeam } from '../../types/series-teams';

// --- Type Definitions ---

type MatchFormat = 'T20' | 'ODI' | 'Test' | 'T10' | '100B';

interface PointsTableEntry {
    _id?: string;
    srNo: number;
    sid: string; // Series ID
    gid: string; // Group ID (groupName)
    tid: string; // Team ID
    teamName: string;
    teamFkey: string; // Foreign Key
    p: number; // Played
    w: number; // Won
    l: number; // Lost
    nr: number; // No Result
    draw: number;
    tm: number; // Total Matches (same as played)
    points: number;
    nrr: number; // Net Run Rate
    q: boolean; // Qualify
}

interface PointsTable {
    id: string; // format + groupName combination
    format: MatchFormat;
    groupName?: string;
    entries: PointsTableEntry[];
}

// --- Props ---

interface SeriesPointsTabProps {
    seriesName?: string;
}

// Helper function to map backend format to frontend format
const mapFormatToFrontend = (format?: string): MatchFormat => {
    if (!format) return 'ODI';
    const upper = format.toUpperCase();
    if (upper === 'T20' || upper === 'T20I') return 'T20';
    if (upper === 'ODI') return 'ODI';
    if (upper === 'TEST') return 'Test';
    if (upper === 'T10') return 'T10';
    if (upper === 'HUNDRED' || upper === '100B') return '100B';
    return 'ODI';
};

// Helper function to map frontend format to backend format
const mapFormatToBackend = (format: MatchFormat): 'test' | 'odi' | 't20' | 't20i' | 't10' | 'hundred' => {
    const upper = format.toUpperCase();
    if (upper === 'T20') return 't20';
    if (upper === 'ODI') return 'odi';
    if (upper === 'TEST') return 'test';
    if (upper === 'T10') return 't10';
    if (upper === '100B') return 'hundred';
    return 'odi';
};

// --- Component ---

export default function SeriesPointsTab({ seriesName = '' }: SeriesPointsTabProps) {
    const { seriesId } = useParams();

    // State for Points Table List
    const [pointsTables, setPointsTables] = useState<PointsTable[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingTableId, setEditingTableId] = useState<string | null>(null);

    // State for Add Single Group Tab
    const [groupName, setGroupName] = useState(seriesName || '');
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [availableTeams, setAvailableTeams] = useState<SeriesTeam[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [isExistingGroupMode, setIsExistingGroupMode] = useState(false);

    // State for Add Multi Group Tab
    const [multiGroupName, setMultiGroupName] = useState(seriesName || '');
    const [multiSelectedFormats, setMultiSelectedFormats] = useState<string[]>([]);
    const [multiSelectedTeamIds, setMultiSelectedTeamIds] = useState<string[]>([]);
    const [isMultiExistingGroupMode, setIsMultiExistingGroupMode] = useState(false);

    // Load points tables
    const loadPointsTables = useCallback(async () => {
        if (!seriesId) return;

        try {
            setLoading(true);
            const response = await PointsTableService.getPointsTables(seriesId, { limit: 1000 });

            if (response.status && response.data?.result) {
                const entries = (response.data.result as BackendEntry[]).filter(entry => entry !== null && entry !== undefined);

                if (entries.length === 0) {
                    setPointsTables([]);
                    return;
                }

                // Group entries by format and groupName
                const grouped: Record<string, PointsTable> = {};

                (entries as any[]).forEach((entry) => {
                    // Skip only if entry itself is null/undefined
                    if (!entry) {
                        console.warn('Skipping null entry');
                        return;
                    }

                    const format = mapFormatToFrontend(entry.matchFormat);
                    const groupKey = `${format}-${entry.groupName || 'default'}`;

                    if (!grouped[groupKey]) {
                        grouped[groupKey] = {
                            id: groupKey,
                            format,
                            groupName: entry.groupName,
                            entries: [],
                        };
                    }

                    // Extract teamId - handle both populated object, string/ObjectId, or null
                    let teamIdString: string = '';
                    if (entry.teamId) {
                        if (typeof entry.teamId === 'object' && entry.teamId !== null) {
                            teamIdString = (entry.teamId as any)._id?.toString() || (entry.teamId as any).toString();
                        } else {
                            teamIdString = String(entry.teamId);
                        }
                    } else {
                        // If teamId is null, use teamFkey as identifier or generate a placeholder
                        teamIdString = entry.teamFkey || `team-${entry._id}`;
                    }

                    // Extract seriesId - handle both populated object and string/ObjectId
                    let seriesIdString: string = seriesId || '';
                    if (entry.seriesId) {
                        if (typeof entry.seriesId === 'object' && entry.seriesId !== null) {
                            seriesIdString = (entry.seriesId as any)._id?.toString() || (entry.seriesId as any).toString();
                        } else {
                            seriesIdString = String(entry.seriesId);
                        }
                    }

                    // Get team name - use teamFkey if team is not populated
                    let teamName = 'Unknown';
                    if (entry.team) {
                        teamName = entry.team.name || entry.team.shortName || 'Unknown';
                    } else if (entry.teamFkey) {
                        // Use teamFkey as team name if team is not populated
                        teamName = entry.teamFkey;
                    }

                    const displayEntry: PointsTableEntry = {
                        _id: entry._id,
                        srNo: entry.position || 0,
                        sid: seriesIdString,
                        gid: entry.groupName || 'default',
                        tid: teamIdString,
                        teamName: teamName,
                        teamFkey: entry.teamFkey || entry.team?.code || '',
                        p: entry.played || 0,
                        w: entry.won || 0,
                        l: entry.lost || 0,
                        nr: entry.noResult || 0,
                        draw: entry.draw || 0,
                        tm: entry.played || 0, // Total matches = played
                        points: entry.points || 0,
                        nrr: entry.netRunRate || 0,
                        q: entry.qualify || false,
                    };

                    grouped[groupKey].entries.push(displayEntry);
                });

                // Sort entries by position within each group
                Object.values(grouped).forEach(table => {
                    table.entries.sort((a, b) => a.srNo - b.srNo);
                });

                setPointsTables(Object.values(grouped));
            } else {
                setPointsTables([]);
            }
        } catch (error: any) {
            console.error('Failed to load points tables:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to load points tables');
            setPointsTables([]);
        } finally {
            setLoading(false);
        }
    }, [seriesId]);

    // Load available teams from series
    const loadAvailableTeams = useCallback(async () => {
        if (!seriesId) return;

        try {
            setLoadingTeams(true);
            const response = await SeriesTeamsService.getSeriesTeams(seriesId);
            if (response.status && response.data?.result) {
                setAvailableTeams(response.data.result);
            }
        } catch (error: any) {
            console.error('Failed to load teams:', error);
            toast.error('Failed to load teams');
        } finally {
            setLoadingTeams(false);
        }
    }, [seriesId]);

    // Initial load
    useEffect(() => {
        loadPointsTables();
    }, [loadPointsTables]);

    // Load teams when in add mode
    useEffect(() => {
        if (selectedTeamIds.length === 0 || availableTeams.length === 0) {
            loadAvailableTeams();
        }
    }, [selectedTeamIds, availableTeams.length, loadAvailableTeams]);

    // Group tables by format
    const tablesByFormat = pointsTables.reduce((acc, table) => {
        if (!acc[table.format]) {
            acc[table.format] = [];
        }
        acc[table.format].push(table);
        return acc;
    }, {} as Record<MatchFormat, PointsTable[]>);

    const getFormatBadgeVariant = (format: MatchFormat) => {
        switch (format) {
            case 'Test': return 'outline';
            case 'ODI': return 'default';
            case 'T20': return 'secondary';
            case 'T10': return 'default';
            case '100B': return 'destructive';
            default: return 'default';
        }
    };

    const handleEditTable = (tableId: string) => {
        setEditingTableId(tableId);
    };

    const handleCancelEdit = () => {
        setEditingTableId(null);
        loadPointsTables(); // Reload to reset changes
    };

    const handleFieldChange = (tableId: string, entryId: string, field: keyof PointsTableEntry, value: any) => {
        setPointsTables(prev =>
            prev.map(table =>
                table.id === tableId
                    ? {
                        ...table,
                        entries: table.entries.map(entry =>
                            entry._id === entryId
                                ? { ...entry, [field]: value }
                                : entry
                        ),
                    }
                    : table
            )
        );
    };

    const handleSaveTable = async (table: PointsTable) => {
        if (!seriesId) return;

        try {
            setSaving(true);
            const entriesToUpdate = table.entries.map(entry => ({
                _id: entry._id,
                position: entry.srNo,
                played: entry.p,
                won: entry.w,
                lost: entry.l,
                noResult: entry.nr,
                draw: entry.draw,
                points: entry.points,
                netRunRate: entry.nrr,
                qualify: entry.q,
            }));

            const response = await PointsTableService.bulkUpdate(seriesId, {
                entries: entriesToUpdate,
            });

            if (response.status) {
                toast.success('Points table updated successfully');
                setEditingTableId(null);
                loadPointsTables();
            } else {
                toast.error(response.userMessage || 'Failed to update points table');
            }
        } catch (error: any) {
            console.error('Failed to save points table:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to save points table');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!seriesId || !entryId) return;

        if (!confirm('Are you sure you want to delete this entry?')) return;

        try {
            const response = await PointsTableService.deletePointsTableEntry(seriesId, entryId);
            if (response.status) {
                toast.success('Entry deleted successfully');
                loadPointsTables();
            } else {
                toast.error(response.userMessage || 'Failed to delete entry');
            }
        } catch (error: any) {
            console.error('Failed to delete entry:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to delete entry');
        }
    };

    const handleFormatChange = (format: string) => {
        setSelectedFormats(prev =>
            prev.includes(format)
                ? prev.filter(f => f !== format)
                : [...prev, format]
        );
    };

    const handleMultiFormatChange = (format: string) => {
        setMultiSelectedFormats(prev =>
            prev.includes(format)
                ? prev.filter(f => f !== format)
                : [...prev, format]
        );
    };

    const handleCreateGroup = async (isMulti: boolean = false) => {
        if (!seriesId) return;

        const name = isMulti ? multiGroupName : groupName;
        const formats = isMulti ? multiSelectedFormats : selectedFormats;
        const teamIds = isMulti ? multiSelectedTeamIds : selectedTeamIds;

        if (!name.trim()) {
            toast.error('Please enter a group name');
            return;
        }

        if (formats.length === 0) {
            toast.error('Please select at least one format');
            return;
        }

        if (teamIds.length === 0) {
            toast.error('Please select at least one team');
            return;
        }

        // Ensure teamIds are strings, not objects
        const teamIdStrings = teamIds.map((id: any) => {
            if (typeof id === 'string') {
                return id;
            }
            if (typeof id === 'object' && id !== null) {
                return (id as any)._id?.toString() || (id as any).toString();
            }
            return String(id);
        }).filter(id => id && id.length > 0);

        if (teamIdStrings.length === 0) {
            toast.error('Please select at least one valid team');
            return;
        }

        try {
            setSaving(true);
            const response = await PointsTableService.createGroup(seriesId, {
                groupName: name,
                formats: formats.map(f => mapFormatToBackend(f as MatchFormat)),
                teamIds: teamIdStrings,
            });

            if (response.status) {
                toast.success('Points table group created successfully');
                if (isMulti) {
                    setMultiGroupName('');
                    setMultiSelectedFormats([]);
                    setMultiSelectedTeamIds([]);
                } else {
                    setGroupName('');
                    setSelectedFormats([]);
                    setSelectedTeamIds([]);
                }
                loadPointsTables();
            } else {
                toast.error(response.userMessage || 'Failed to create group');
            }
        } catch (error: any) {
            console.error('Failed to create group:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to create group');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='w-full h-full flex flex-col overflow-auto points-tab-container'>
            <style>{`
                .points-tab-container button[data-state="active"] {
                    background-color: #2563eb !important;
                    color: white !important;
                }
            `}</style>
            <Tabs defaultValue='list' className='w-full'>
                <TabsList className='mb-4'>
                    <TabsTrigger value='list' className='data-[state=active]:!bg-blue-600 data-[state=active]:!text-white'>
                        Points Table List
                    </TabsTrigger>
                    <TabsTrigger value='single-group' className='data-[state=active]:!bg-blue-600 data-[state=active]:!text-white'>
                        + Add Single Group
                    </TabsTrigger>
                    <TabsTrigger value='multi-group' className='data-[state=active]:!bg-blue-600 data-[state=active]:!text-white'>
                        + Add Multi Group
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Points Table List */}
                <TabsContent value='list' className='space-y-6'>
                    {loading ? (
                        <div className='flex justify-center items-center py-8'>
                            <Loader2 className='h-6 w-6 animate-spin' />
                        </div>
                    ) : (
                        (['ODI', 'T20', 'Test', 'T10', '100B'] as MatchFormat[]).map((format) => {
                            const formatTables = tablesByFormat[format] || [];
                            if (formatTables.length === 0) return null;

                            return (
                                <div key={format} className='space-y-4'>
                                    <div className='flex items-center justify-between pb-2 border-b'>
                                        <div className='flex items-center gap-3'>
                                            <h2 className='text-xl font-semibold'>{format} Points Tables</h2>
                                            <Badge variant={getFormatBadgeVariant(format)} className='text-sm'>
                                                {formatTables.length} {formatTables.length === 1 ? 'Table' : 'Tables'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {formatTables.map((table) => (
                                        <div key={table.id} className='space-y-2'>
                                            {table.groupName && (
                                                <div className='text-sm font-medium text-muted-foreground'>
                                                    Group: {table.groupName}
                                                </div>
                                            )}
                                            <div className='flex items-center justify-end gap-2 mb-2'>
                                                {editingTableId === table.id ? (
                                                    <>
                                                        <Button variant='outline' size='sm' onClick={handleCancelEdit} disabled={saving}>
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            variant='default'
                                                            size='sm'
                                                            onClick={() => handleSaveTable(table)}
                                                            disabled={saving}
                                                        >
                                                            {saving ? (
                                                                <>
                                                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Save className='h-4 w-4 mr-2' />
                                                                    Save
                                                                </>
                                                            )}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button variant='default' size='sm' onClick={() => handleEditTable(table.id)}>
                                                        <Edit className='h-4 w-4 mr-2' /> Edit
                                                    </Button>
                                                )}
                                            </div>
                                            <div className='overflow-x-auto rounded-lg border'>
                                                <Table>
                                                    <TableHeader className="bg-slate-100 dark:bg-slate-800">
                                                        <TableRow>
                                                            <TableHead className='w-[60px]'>Sr.No</TableHead>
                                                            <TableHead>Team Name</TableHead>
                                                            <TableHead className='w-[80px] text-center'>TEAMFKEY</TableHead>
                                                            <TableHead className='w-[50px] text-center'>P</TableHead>
                                                            <TableHead className='w-[50px] text-center'>W</TableHead>
                                                            <TableHead className='w-[50px] text-center'>L</TableHead>
                                                            <TableHead className='w-[50px] text-center'>NR</TableHead>
                                                            <TableHead className='w-[50px] text-center'>Draw</TableHead>
                                                            <TableHead className='w-[50px] text-center'>TM</TableHead>
                                                            <TableHead className='w-[70px] text-center'>Points</TableHead>
                                                            <TableHead className='w-[80px] text-center'>NRR</TableHead>
                                                            <TableHead className='w-[50px] text-center'>Q</TableHead>
                                                            <TableHead className='w-[120px] text-center'>Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {table.entries.map((entry) => (
                                                            <TableRow key={entry._id || entry.tid}>
                                                                <TableCell className='text-center'>{entry.srNo}</TableCell>
                                                                <TableCell className='font-medium'>{entry.teamName}</TableCell>
                                                                <TableCell className='text-center'>{entry.teamFkey}</TableCell>
                                                                <TableCell className='text-center'>
                                                                    {editingTableId === table.id ? (
                                                                        <input
                                                                            type="number"
                                                                            value={entry.p || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                handleFieldChange(table.id, entry._id!, 'p', val);
                                                                            }}
                                                                            className='w-full text-center border rounded px-1 py-0.5'
                                                                        />
                                                                    ) : entry.p}
                                                                </TableCell>
                                                                <TableCell className='text-center text-green-600 font-medium'>
                                                                    {editingTableId === table.id ? (
                                                                        <input
                                                                            type="number"
                                                                            value={entry.w || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                handleFieldChange(table.id, entry._id!, 'w', val);
                                                                            }}
                                                                            className='w-full text-center border rounded px-1 py-0.5 text-green-600 font-medium'
                                                                        />
                                                                    ) : entry.w}
                                                                </TableCell>
                                                                <TableCell className='text-center text-red-600 font-medium'>
                                                                    {editingTableId === table.id ? (
                                                                        <input
                                                                            type="number"
                                                                            value={entry.l || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                handleFieldChange(table.id, entry._id!, 'l', val);
                                                                            }}
                                                                            className='w-full text-center border rounded px-1 py-0.5 text-red-600 font-medium'
                                                                        />
                                                                    ) : entry.l}
                                                                </TableCell>
                                                                <TableCell className='text-center'>
                                                                    {editingTableId === table.id ? (
                                                                        <input
                                                                            type="number"
                                                                            value={entry.nr || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                handleFieldChange(table.id, entry._id!, 'nr', val);
                                                                            }}
                                                                            className='w-full text-center border rounded px-1 py-0.5'
                                                                        />
                                                                    ) : entry.nr}
                                                                </TableCell>
                                                                <TableCell className='text-center'>
                                                                    {editingTableId === table.id ? (
                                                                        <input
                                                                            type="number"
                                                                            value={entry.draw || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                handleFieldChange(table.id, entry._id!, 'draw', val);
                                                                            }}
                                                                            className='w-full text-center border rounded px-1 py-0.5'
                                                                        />
                                                                    ) : entry.draw}
                                                                </TableCell>
                                                                <TableCell className='text-center'>
                                                                    {editingTableId === table.id ? (
                                                                        <input
                                                                            type="number"
                                                                            value={entry.tm || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                handleFieldChange(table.id, entry._id!, 'tm', val);
                                                                            }}
                                                                            className='w-full text-center border rounded px-1 py-0.5'
                                                                        />
                                                                    ) : entry.tm}
                                                                </TableCell>
                                                                <TableCell className='text-center font-bold'>
                                                                    {editingTableId === table.id ? (
                                                                        <input
                                                                            type="number"
                                                                            value={entry.points || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                handleFieldChange(table.id, entry._id!, 'points', val);
                                                                            }}
                                                                            className='w-full text-center border rounded px-1 py-0.5 font-bold'
                                                                        />
                                                                    ) : entry.points}
                                                                </TableCell>
                                                                <TableCell className={`text-center font-medium ${entry.nrr > 0 ? 'text-green-600' : entry.nrr < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                                                    {editingTableId === table.id ? (
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={entry.nrr || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                                                                handleFieldChange(table.id, entry._id!, 'nrr', val);
                                                                            }}
                                                                            className={`w-full text-center border rounded px-1 py-0.5 font-medium ${entry.nrr > 0 ? 'text-green-600' : entry.nrr < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}
                                                                        />
                                                                    ) : <>{entry.nrr > 0 ? '+' : ''}{entry.nrr.toFixed(2)}</>}
                                                                </TableCell>
                                                                <TableCell className='text-center'>
                                                                    {editingTableId === table.id ? (
                                                                        <div className="flex justify-center">
                                                                            <Checkbox
                                                                                checked={entry.q}
                                                                                onCheckedChange={(checked: boolean) => handleFieldChange(table.id, entry._id!, 'q', checked)}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <Badge variant={entry.q ? 'default' : 'outline'}>{entry.q ? 'Yes' : 'No'}</Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className='text-center'>
                                                                    <div className='flex gap-1 justify-center'>
                                                                        {editingTableId === table.id && (
                                                                            <Button
                                                                                variant='ghost'
                                                                                size='sm'
                                                                                onClick={() => handleDeleteEntry(entry._id!)}
                                                                                disabled={saving}
                                                                            >
                                                                                <Trash2 className='h-4 w-4 text-red-600' />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    )}
                </TabsContent>

                {/* Tab 2: Add Single Group */}
                <TabsContent value='single-group'>
                    <div className='max-w-4xl mx-auto space-y-6 p-6 border rounded-lg bg-card text-card-foreground shadow-sm'>
                        <div className='flex items-center justify-between pb-4 border-b'>
                            <h2 className='text-xl font-semibold'>Add Single Group Points Table</h2>
                        </div>

                        <div className='space-y-6'>
                            {/* Group Name Input */}
                            <div className='space-y-2'>
                                <label className='text-sm font-medium leading-none'>
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter Group Name"
                                />
                            </div>

                            {/* Format Checkboxes */}
                            <div className='space-y-3'>
                                <label className='text-sm font-medium leading-none'>Select Formats</label>
                                <div className='flex flex-wrap gap-4'>
                                    {['ODI', 'T20', 'Test', 'T10', '100B'].map((format) => (
                                        <div key={format} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`format-${format}`}
                                                checked={selectedFormats.includes(format)}
                                                onCheckedChange={() => handleFormatChange(format)}
                                            />
                                            <label
                                                htmlFor={`format-${format}`}
                                                className="text-sm font-medium leading-none cursor-pointer"
                                            >
                                                {format}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Team Selection */}
                            <div className='space-y-3'>
                                <label className='text-sm font-medium leading-none'>Select Teams</label>
                                <Select
                                    value=""
                                    onValueChange={(value) => {
                                        if (value && !selectedTeamIds.includes(value)) {
                                            setSelectedTeamIds([...selectedTeamIds, value]);
                                        }
                                    }}
                                    disabled={loadingTeams}
                                >
                                    <SelectTrigger className='bg-white dark:bg-slate-700'>
                                        <SelectValue placeholder={loadingTeams ? 'Loading teams...' : 'Select a team to add'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTeams
                                            .filter(team => {
                                                const teamIdStr = typeof team.teamId === 'string' ? team.teamId : (team.teamId._id || '');
                                                return !selectedTeamIds.includes(teamIdStr);
                                            })
                                            .map((team) => {
                                                const teamIdStr = typeof team.teamId === 'string' ? team.teamId : (team.teamId._id || '');
                                                return (
                                                    <SelectItem key={teamIdStr} value={teamIdStr}>
                                                        {team.team?.name || team.team?.shortName || 'Unknown Team'}
                                                    </SelectItem>
                                                );
                                            })}
                                    </SelectContent>
                                </Select>
                                {selectedTeamIds.length > 0 && (
                                    <div className='flex flex-wrap gap-2 mt-2'>
                                        {selectedTeamIds.map((teamId) => {
                                            const team = availableTeams.find(t => {
                                                const tIdStr = typeof t.teamId === 'string' ? t.teamId : (t.teamId._id || '');
                                                return tIdStr === teamId;
                                            });
                                            return (
                                                <Badge key={teamId} variant='secondary' className='cursor-pointer' onClick={() => {
                                                    setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
                                                }}>
                                                    {team?.team?.name || team?.team?.shortName || 'Unknown'} ×
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Save Button */}
                            <div className='pt-4'>
                                <Button
                                    className='w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white'
                                    onClick={() => handleCreateGroup(false)}
                                    disabled={saving || !groupName.trim() || selectedFormats.length === 0 || selectedTeamIds.length === 0}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Group
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 3: Add Multi Group */}
                <TabsContent value='multi-group'>
                    <div className='max-w-4xl mx-auto space-y-6 p-6 border rounded-lg bg-card text-card-foreground shadow-sm'>
                        <div className='flex items-center justify-between pb-4 border-b'>
                            <h2 className='text-xl font-semibold'>Add Multi Group Points Table</h2>
                        </div>

                        <div className='space-y-6'>
                            {/* Group Name Input */}
                            <div className='space-y-2'>
                                <label className='text-sm font-medium leading-none'>
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    value={multiGroupName}
                                    onChange={(e) => setMultiGroupName(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter Group Name"
                                />
                            </div>

                            {/* Format Checkboxes */}
                            <div className='space-y-3'>
                                <label className='text-sm font-medium leading-none'>Select Formats</label>
                                <div className='flex flex-wrap gap-4'>
                                    {['ODI', 'T20', 'Test', 'T10', '100B'].map((format) => (
                                        <div key={format} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`multi-format-${format}`}
                                                checked={multiSelectedFormats.includes(format)}
                                                onCheckedChange={() => handleMultiFormatChange(format)}
                                            />
                                            <label
                                                htmlFor={`multi-format-${format}`}
                                                className="text-sm font-medium leading-none cursor-pointer"
                                            >
                                                {format}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Team Selection */}
                            <div className='space-y-3'>
                                <label className='text-sm font-medium leading-none'>Select Teams</label>
                                <Select
                                    value=""
                                    onValueChange={(value) => {
                                        if (value && !multiSelectedTeamIds.includes(value)) {
                                            setMultiSelectedTeamIds([...multiSelectedTeamIds, value]);
                                        }
                                    }}
                                    disabled={loadingTeams}
                                >
                                    <SelectTrigger className='bg-white dark:bg-slate-700'>
                                        <SelectValue placeholder={loadingTeams ? 'Loading teams...' : 'Select a team to add'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTeams
                                            .filter(team => {
                                                const teamId = typeof team.teamId === 'string'
                                                    ? team.teamId
                                                    : (typeof team.teamId === 'object' && team.teamId !== null
                                                        ? team.teamId._id?.toString() || team.teamId.toString()
                                                        : String(team.teamId));
                                                return !multiSelectedTeamIds.includes(teamId);
                                            })
                                            .map((team) => {
                                                const teamId = typeof team.teamId === 'string'
                                                    ? team.teamId
                                                    : (typeof team.teamId === 'object' && team.teamId !== null
                                                        ? team.teamId._id?.toString() || team.teamId.toString()
                                                        : String(team.teamId));
                                                return (
                                                    <SelectItem key={teamId} value={teamId}>
                                                        {team.team?.name || team.team?.shortName || 'Unknown Team'}
                                                    </SelectItem>
                                                );
                                            })}
                                    </SelectContent>
                                </Select>
                                {multiSelectedTeamIds.length > 0 && (
                                    <div className='flex flex-wrap gap-2 mt-2'>
                                        {multiSelectedTeamIds.map((teamId) => {
                                            const team = availableTeams.find(t => {
                                                const tIdStr = typeof t.teamId === 'string' ? t.teamId : (t.teamId._id || '');
                                                return tIdStr === teamId;
                                            });
                                            return (
                                                <Badge key={teamId} variant='secondary' className='cursor-pointer' onClick={() => {
                                                    setMultiSelectedTeamIds(multiSelectedTeamIds.filter(id => id !== teamId));
                                                }}>
                                                    {team?.team?.name || team?.team?.shortName || 'Unknown'} ×
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Save Button */}
                            <div className='pt-4'>
                                <Button
                                    className='w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white'
                                    onClick={() => handleCreateGroup(true)}
                                    disabled={saving || !multiGroupName.trim() || multiSelectedFormats.length === 0 || multiSelectedTeamIds.length === 0}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Group
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
