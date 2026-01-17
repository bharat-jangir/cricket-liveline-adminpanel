import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { venueService } from '../../services/venue.service';
import { Venue } from '../../types/venue';

interface VenueSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function VenueSelect({ value, onChange, placeholder = "Select venue" }: VenueSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const fetchVenues = useCallback(async (searchTerm: string, pageNum: number, reset = false) => {
        setLoading(true);
        try {
            const response = await venueService.getVenues({
                search: searchTerm,
                page: pageNum,
                limit: 20
            });

            if (response.status && response.data && response.data.result && Array.isArray(response.data.result)) {
                const newVenues = response.data.result;
                setVenues(prev => reset ? newVenues : [...prev, ...newVenues]);
                setHasMore(response.data.pagination && response.data.pagination.page < response.data.pagination.totalPages);
            } else {
                setVenues(prev => reset ? [] : prev);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to fetch venues:', error);
            setVenues(prev => reset ? [] : prev);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load single venue if value is set but not in list
    useEffect(() => {
        if (!value) {
            setSelectedVenue(null);
            return;
        }

        // Avoid re-fetching if we already have the correct selected venue
        if (selectedVenue && selectedVenue._id === value) return;

        const loadSelectedVenue = async () => {
            // Check if it's already in our fetched venues
            const found = venues.find(v => v._id === value);
            if (found) {
                setSelectedVenue(found);
            } else {
                // Fetch separately
                try {
                    const response = await venueService.getVenue(value);
                    if (response.status && response.data?.result) {
                        setSelectedVenue(response.data.result);
                    }
                } catch (error) {
                    console.error('Failed to fetch selected venue:', error);
                }
            }
        };
        loadSelectedVenue();
    }, [value, venues]); // Remove selectedVenue from dependencies to avoid potential loops if references change

    // Load initial venues ONLY ONCE
    const initialFetchDone = useRef(false);
    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchVenues('', 1, true);
            initialFetchDone.current = true;
        }
    }, [fetchVenues]);

    // Search debounce - only trigger if search is truthy
    useEffect(() => {
        if (!search) return;

        const timer = setTimeout(() => {
            setPage(1);
            fetchVenues(search, 1, true);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, fetchVenues]);

    // Handle scroll for pagination
    const handleScroll = useCallback(() => {
        if (!listRef.current || loading || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 5) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchVenues(search, nextPage, false);
        }
    }, [loading, hasMore, page, search, fetchVenues]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (venue: Venue) => {
        onChange(venue._id!);
        setSelectedVenue(venue);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between text-left font-normal bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 h-10"
            >
                <span className="truncate">
                    {selectedVenue ? `${selectedVenue.name} (${selectedVenue.city})` : placeholder}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
            </Button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search venues..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-8"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div
                        ref={listRef}
                        className="max-h-60 overflow-y-auto"
                        onScroll={handleScroll}
                    >
                        {venues.length === 0 && !loading ? (
                            <div className="p-2 text-sm text-slate-500 text-center">
                                No venues found
                            </div>
                        ) : (
                            venues.map((venue) => (
                                <button
                                    key={venue._id}
                                    type="button"
                                    onClick={() => handleSelect(venue)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none flex flex-col"
                                >
                                    <span className="font-medium">{venue.name}</span>
                                    <span className="text-xs text-slate-500">{venue.city}, {venue.country}</span>
                                </button>
                            ))
                        )}

                        {loading && (
                            <div className="p-2 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                <span className="ml-2 text-sm text-slate-500">Loading...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
