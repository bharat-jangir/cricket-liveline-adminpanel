import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Trash2, Search, Plus, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import SeriesVenuesService from '../../services/series-venues.service';
import { venueService } from '../../services/venue.service';
import type { SeriesVenue } from '../../types/series-venues';
import type { Venue } from '../../types/venue';

export default function SeriesVenuesTab() {
    const { seriesId } = useParams();

    // State
    const [seriesVenues, setSeriesVenues] = useState<SeriesVenue[]>([]);
    const [availableVenues, setAvailableVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingVenues, setLoadingVenues] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedVenueId, setSelectedVenueId] = useState<string>('');
    const [venueSearchTerm, setVenueSearchTerm] = useState('');
    const [debouncedVenueSearchTerm, setDebouncedVenueSearchTerm] = useState('');

    // Debounce search term for series venues
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Debounce search term for available venues
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedVenueSearchTerm(venueSearchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [venueSearchTerm]);

    // Load series venues
    const loadSeriesVenues = useCallback(async () => {
        if (!seriesId) return;

        try {
            setLoading(true);
            const response = await SeriesVenuesService.getSeriesVenues(seriesId, {
                search: debouncedSearchTerm || undefined,
            });

            if (response.status && response.data?.result) {
                setSeriesVenues(response.data.result);
            } else {
                setSeriesVenues([]);
            }
        } catch (error: any) {
            console.error('Failed to load series venues:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to load venues');
            setSeriesVenues([]);
        } finally {
            setLoading(false);
        }
    }, [seriesId, debouncedSearchTerm]);

    // Load available venues (for adding)
    const loadAvailableVenues = useCallback(async () => {
        try {
            setLoadingVenues(true);
            const response = await venueService.getVenues({
                page: 1,
                limit: 100,
                search: debouncedVenueSearchTerm || undefined,
            });

            if (response.status && response.data?.result) {
                const allVenues = response.data.result;
                // Filter out venues already in series
                const addedVenueIds = seriesVenues.map(sv => {
                    // venueId can be string or populated Venue object
                    if (typeof sv.venueId === 'object' && sv.venueId !== null && '_id' in sv.venueId) {
                        return (sv.venueId as Venue)._id?.toString() || '';
                    }
                    return sv.venueId?.toString() || '';
                });
                
                const available = allVenues.filter(venue => {
                    const venueId = venue._id?.toString() || '';
                    return !addedVenueIds.includes(venueId);
                });
                
                setAvailableVenues(available);
            }
        } catch (error: any) {
            console.error('Failed to load available venues:', error);
            toast.error('Failed to load available venues');
        } finally {
            setLoadingVenues(false);
        }
    }, [seriesVenues, debouncedVenueSearchTerm]);

    // Initial load
    useEffect(() => {
        loadSeriesVenues();
    }, [loadSeriesVenues]);

    // Load available venues when dialog opens or search term changes
    useEffect(() => {
        if (showAddDialog) {
            loadAvailableVenues();
        }
    }, [showAddDialog, loadAvailableVenues]);

    // Handle add venue
    const handleAddVenue = async () => {
        if (!seriesId || !selectedVenueId) {
            toast.error('Please select a venue');
            return;
        }

        try {
            setLoading(true);
            const response = await SeriesVenuesService.addVenueToSeries(seriesId, {
                venueId: selectedVenueId,
            });

            if (response.status) {
                toast.success('Venue added to series successfully');
                setSelectedVenueId('');
                setShowAddDialog(false);
                loadSeriesVenues();
            } else {
                toast.error(response.userMessage || 'Failed to add venue');
            }
        } catch (error: any) {
            console.error('Failed to add venue:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to add venue');
        } finally {
            setLoading(false);
        }
    };

    // Handle remove venue
    const handleRemoveVenue = async (venueId: string) => {
        if (!seriesId) return;

        if (!window.confirm('Are you sure you want to remove this venue from the series?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await SeriesVenuesService.removeVenueFromSeries(seriesId, venueId);

            if (response.status) {
                toast.success('Venue removed from series successfully');
                loadSeriesVenues();
            } else {
                toast.error(response.userMessage || 'Failed to remove venue');
            }
        } catch (error: any) {
            console.error('Failed to remove venue:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to remove venue');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get venue object from seriesVenue
    const getVenueFromSeriesVenue = (sv: SeriesVenue): Venue | null => {
        // venueId can be either a string (ID) or a populated Venue object
        if (typeof sv.venueId === 'object' && sv.venueId !== null && '_id' in sv.venueId) {
            return sv.venueId as Venue;
        }
        return null;
    };

    // Filter venues for display
    const filteredSeriesVenues = seriesVenues.filter((sv) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const venue = getVenueFromSeriesVenue(sv);
        if (venue) {
            return (
                venue.name?.toLowerCase().includes(searchLower) ||
                venue.city?.toLowerCase().includes(searchLower) ||
                venue.country?.toLowerCase().includes(searchLower) ||
                venue.state?.toLowerCase().includes(searchLower)
            );
        }
        return false;
    });

    return (
        <div className="space-y-6 pt-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Series Venues</h2>
                    <Badge variant="secondary">
                        {seriesVenues.length} {seriesVenues.length === 1 ? 'Venue' : 'Venues'}
                    </Badge>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Venue
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add Venue to Series</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {/* Venue Search */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Search Venues</label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by name, city, or country..."
                                        className="pl-8"
                                        value={venueSearchTerm}
                                        onChange={(e) => setVenueSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Venue Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Venue</label>
                                <Select
                                    value={selectedVenueId}
                                    onValueChange={setSelectedVenueId}
                                    disabled={loadingVenues}
                                >
                                    <SelectTrigger className="bg-white dark:bg-slate-700">
                                        <SelectValue placeholder={loadingVenues ? 'Loading venues...' : 'Select a venue'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingVenues ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : availableVenues.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                {venueSearchTerm ? 'No venues found matching your search' : 'No available venues'}
                                            </div>
                                        ) : (
                                            availableVenues.map((venue) => (
                                                <SelectItem key={venue._id} value={venue._id!}>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span>{venue.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({venue.city}, {venue.country})
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddDialog(false);
                                        setSelectedVenueId('');
                                        setVenueSearchTerm('');
                                    }}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddVenue}
                                    disabled={loading || !selectedVenueId}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Venue
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search Bar */}
            <div className="flex justify-start">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search venues by name, city, or country..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Venues Table */}
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center w-[80px]">Sr.No</TableHead>
                                <TableHead className="text-left">Name</TableHead>
                                <TableHead className="text-left">City</TableHead>
                                <TableHead className="text-left">State</TableHead>
                                <TableHead className="text-left">Country</TableHead>
                                <TableHead className="text-center">Capacity</TableHead>
                                <TableHead className="text-center w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSeriesVenues.length > 0 ? (
                                filteredSeriesVenues.map((seriesVenue, index) => {
                                    const venue = getVenueFromSeriesVenue(seriesVenue);
                                    // Extract venueId - can be string or object
                                    const venueId = typeof seriesVenue.venueId === 'object' && seriesVenue.venueId !== null
                                        ? (seriesVenue.venueId as Venue)._id?.toString() || ''
                                        : seriesVenue.venueId?.toString() || '';

                                    if (!venue && !venueId) {
                                        return null;
                                    }

                                    return (
                                        <TableRow key={seriesVenue._id || venueId}>
                                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                            <TableCell className="text-left font-medium">
                                                {venue?.name || 'Unknown Venue'}
                                            </TableCell>
                                            <TableCell className="text-left">{venue?.city || '-'}</TableCell>
                                            <TableCell className="text-left">{venue?.state || '-'}</TableCell>
                                            <TableCell className="text-left">{venue?.country || '-'}</TableCell>
                                            <TableCell className="text-center">
                                                {venue?.capacity ? venue.capacity.toLocaleString() : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveVenue(venueId)}
                                                    disabled={loading}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        {searchTerm ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-muted-foreground">No venues found matching your search.</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSearchTerm('')}
                                                >
                                                    Clear Search
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-muted-foreground">No venues added to this series yet.</p>
                                                <Button
                                                    onClick={() => setShowAddDialog(true)}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add First Venue
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
