import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import {
  Plus,
  Search,
  Bell,
  CheckCircle2,
  Circle,
  Filter,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { SeriesService } from '../../services/series.service';
import { Series } from '../../types/series';
import { toast } from 'sonner';

export function SeriesView() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Filter states
  const [typeFilters, setTypeFilters] = useState({
    international: false,
    domestic: false,
    league: false,
  });
  const [yearFilter, setYearFilter] = useState('');
  const [team1Filter, setTeam1Filter] = useState('');
  const [team2Filter, setTeam2Filter] = useState('');
  const [team3Filter, setTeam3Filter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [leagueTypeFilter, setLeagueTypeFilter] = useState('');

  // API data
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50, // Show more items per page for series
    total: 0,
    totalPages: 0,
  });

  // Debounce search term
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadSeries = useCallback(async () => {
    try {
      setLoading(true);

      // Build query params
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Search by name
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      // Category filter
      const categories: string[] = [];
      if (typeFilters.international) categories.push('international');
      if (typeFilters.domestic) categories.push('domestic');
      if (typeFilters.league) categories.push('league');
      if (categories.length > 0) {
        params.category = categories.join(',');
      }

      // Year filter
      if (yearFilter) {
        params.year = parseInt(yearFilter);
      }

      // Team filters
      const teams: string[] = [];
      if (team1Filter) teams.push(team1Filter);
      if (team2Filter) teams.push(team2Filter);
      if (team3Filter) teams.push(team3Filter);
      if (teams.length > 0) {
        params.team = teams.join(',');
      }

      // Date filters
      if (startDateFilter) {
        params.startDateFrom = startDateFilter;
      }
      if (endDateFilter) {
        params.endDateTo = endDateFilter;
      }

      // League Type Filter
      if (leagueTypeFilter) {
        params.leagueType = leagueTypeFilter;
      }

      // Active tab filter (status filter)
      if (activeTab === 'active') {
        params.status = 'running,upcoming,scheduled';
      }

      const response = await SeriesService.listSeries(params);

      if (response.data?.result) {
        setAllSeries(response.data.result);
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages,
          }));
        }
      }
    } catch (error: any) {
      console.error('Failed to load series:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to load series');
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearchTerm,
    activeTab,
    typeFilters,
    yearFilter,
    team1Filter,
    team2Filter,
    team3Filter,
    startDateFilter,
    endDateFilter,
    leagueTypeFilter,
    pagination.page,
    pagination.limit
  ]);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPagination(prev => {
      if (prev.page === 1) return prev;
      return { ...prev, page: 1 };
    });
  }, [
    debouncedSearchTerm,
    typeFilters,
    yearFilter,
    team1Filter,
    team2Filter,
    team3Filter,
    startDateFilter,
    endDateFilter,
    leagueTypeFilter,
    activeTab
  ]);

  // Fetch series data
  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await SeriesService.deleteSeries(id);
      toast.success('Series deleted successfully');
      loadSeries();
    } catch (error: any) {
      console.error('Failed to delete series:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to delete series');
    }
  };

  const clearAllFilters = () => {
    setTypeFilters({ international: false, domestic: false, league: false });
    setYearFilter('');
    setTeam1Filter('');
    setTeam2Filter('');
    setTeam3Filter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setLeagueTypeFilter('');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'Finished':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400';
      case 'Upcoming':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'Scheduled':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400';
    }
  };

  // Helper function to render series row
  const renderSeriesRow = (series: Series) => (
    <TableRow
      key={series._id}
      className="border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      onClick={() => navigate(`/series/${series._id}`)}
    >
      {/* Series Name */}
      <TableCell>
        <div className="space-y-1">
          <div
            className="font-medium hover:underline cursor-pointer text-blue-600 dark:text-blue-400"
          >
            {series.name}
          </div>
          <div className="flex gap-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              {series.seriesType}
            </span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
              {series.activeFormat}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Odds/Per */}
      <TableCell
        className="text-center"
        onClick={(e) => e.stopPropagation()} // Prevent row click
      >
        <div className="flex gap-2 justify-center">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await SeriesService.updateSeries(series._id!, {
                  oddsNotification: !series.oddsNotification
                });
                // Reload series list
                loadSeries();
                toast.success(`Odds notification ${!series.oddsNotification ? 'enabled' : 'disabled'}`);
              } catch (error: any) {
                console.error('Failed to update odds notification:', error);
                toast.error('Failed to update notification');
              }
            }}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={series.oddsNotification ? "Odds Notification: Enabled" : "Odds Notification: Disabled"}
          >
            <Bell
              className={cn(
                "size-4",
                series.oddsNotification
                  ? "text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400"
                  : "text-slate-300 dark:text-slate-600"
              )}
            />
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await SeriesService.updateSeries(series._id!, {
                  perNotification: !series.perNotification
                });
                // Reload series list
                loadSeries();
                toast.success(`Per notification ${!series.perNotification ? 'enabled' : 'disabled'}`);
              } catch (error: any) {
                console.error('Failed to update per notification:', error);
                toast.error('Failed to update notification');
              }
            }}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={series.perNotification ? "Per/Percentage Notification: Enabled" : "Per/Percentage Notification: Disabled"}
          >
            <Bell
              className={cn(
                "size-4",
                series.perNotification
                  ? "text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400"
                  : "text-slate-300 dark:text-slate-600"
              )}
            />
          </button>
        </div>
      </TableCell>

      {/* Key */}
      <TableCell className="text-center">
        <span className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded">
          {series.key}
        </span>
      </TableCell>

      {/* Sq/Fix/Pt */}
      <TableCell
        className="text-center"
        onClick={(e) => e.stopPropagation()} // Prevent row click
      >
        <div className="flex gap-1 justify-center">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await SeriesService.updateSeries(series._id!, {
                  hasSquad: !series.hasSquad
                });
                loadSeries();
                toast.success(`Squad management ${!series.hasSquad ? 'enabled' : 'disabled'}`);
              } catch (error: any) {
                console.error('Failed to update squad flag:', error);
                toast.error('Failed to update feature flag');
              }
            }}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={series.hasSquad ? "Squad: Enabled" : "Squad: Disabled"}
          >
            {series.hasSquad ? (
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="size-4 text-slate-300 dark:text-slate-600" />
            )}
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await SeriesService.updateSeries(series._id!, {
                  hasFixtures: !series.hasFixtures
                });
                loadSeries();
                toast.success(`Fixtures ${!series.hasFixtures ? 'enabled' : 'disabled'}`);
              } catch (error: any) {
                console.error('Failed to update fixtures flag:', error);
                toast.error('Failed to update feature flag');
              }
            }}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={series.hasFixtures ? "Fixtures: Enabled" : "Fixtures: Disabled"}
          >
            {series.hasFixtures ? (
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="size-4 text-slate-300 dark:text-slate-600" />
            )}
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await SeriesService.updateSeries(series._id!, {
                  hasPoints: !series.hasPoints
                });
                loadSeries();
                toast.success(`Points table ${!series.hasPoints ? 'enabled' : 'disabled'}`);
              } catch (error: any) {
                console.error('Failed to update points flag:', error);
                toast.error('Failed to update feature flag');
              }
            }}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={series.hasPoints ? "Points: Enabled" : "Points: Disabled"}
          >
            {series.hasPoints ? (
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="size-4 text-slate-300 dark:text-slate-600" />
            )}
          </button>
        </div>
      </TableCell>

      {/* Start Date */}
      <TableCell className="text-center text-slate-600 dark:text-slate-400 text-sm">
        {formatDate(series.startDate as string)}
      </TableCell>

      {/* End Date */}
      <TableCell className="text-center text-slate-600 dark:text-slate-400 text-sm">
        {formatDate(series.endDate as string)}
      </TableCell>

      {/* Status */}
      <TableCell className="text-center">
        <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getStatusColor(series.status || ''))}>
          {series.status}
        </span>
      </TableCell>
    </TableRow>
  );

  // Server-side filtering is already applied, so we just use allSeries
  // But we can still separate recently opened from others (client-side grouping)
  const recentlyOpenedSeries = allSeries.filter(s => s.recentlyOpened);
  const otherSeries = allSeries.filter(s => !s.recentlyOpened);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Cricketing Series</h1>

        <div className="flex-1 max-w-md">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-blue-500 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 dark:text-slate-400" />
            )}
            <Input
              placeholder="Search series..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <Button
          onClick={() => navigate('/series/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="size-4 mr-2" />
          Add New Series
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-64 space-y-4">
          <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
              <Filter className="size-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Filters</h3>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Type</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="international"
                    checked={typeFilters.international}
                    onCheckedChange={(checked: any) => {
                      setTypeFilters(prev => ({ ...prev, international: checked as boolean }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  />
                  <Label htmlFor="international" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    International
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="domestic"
                    checked={typeFilters.domestic}
                    onCheckedChange={(checked: any) => {
                      setTypeFilters(prev => ({ ...prev, domestic: checked as boolean }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  />
                  <Label htmlFor="domestic" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    Domestic
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="league"
                    checked={typeFilters.league}
                    onCheckedChange={(checked: any) => {
                      setTypeFilters(prev => ({ ...prev, league: checked as boolean }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  />
                  <Label htmlFor="league" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    League
                  </Label>
                </div>
              </div>
            </div>

            {/* Year Filter */}
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="e.g., 2024"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            {/* Team Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Teams (Optional)</Label>
              <Input
                placeholder="Team 1"
                value={team1Filter}
                onChange={(e) => setTeam1Filter(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
              <Input
                placeholder="Team 2"
                value={team2Filter}
                onChange={(e) => setTeam2Filter(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
              <Input
                placeholder="Team 3"
                value={team3Filter}
                onChange={(e) => setTeam3Filter(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            {/* Duration Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Duration</Label>
              <Input
                type="date"
                placeholder="Start Date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            {/* League Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="leagueType" className="text-sm font-semibold text-slate-700 dark:text-slate-300">League Type</Label>
              <select
                id="leagueType"
                value={leagueTypeFilter}
                onChange={(e) => setLeagueTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
              >
                <option value="">All Types</option>
                <option value="IPL">IPL</option>
                <option value="BBL">BBL</option>
                <option value="World Cup">World Cup</option>
                <option value="Ranji">Ranji Trophy</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <Button
              onClick={clearAllFilters}
              variant="outline"
              className="w-full border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Right Content - Table */}
        <div className="flex-1 space-y-4">
          {/* Toggle Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setActiveTab('active');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 h-auto py-3",
                activeTab === 'active'
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <span className="font-semibold">Active Series</span>
              <span className={cn(
                "text-xs",
                activeTab === 'active' ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
              )}>
                Running • Upcoming • Scheduled
              </span>
            </Button>
            <Button
              onClick={() => {
                setActiveTab('all');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 h-auto py-3",
                activeTab === 'all'
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <span className="font-semibold">All Series</span>
              <span className={cn(
                "text-xs",
                activeTab === 'all' ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
              )}>
                Including Finished
              </span>
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <Table>
              <TableHeader className='bg-slate-50 text-slate-700 font-bold dark:bg-slate-800'>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="text-slate-700 dark:text-slate-300">Series Name</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-center">Odds/Per(%)</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-center">Key</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-center">Sq/Fix/Pt</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-center">Start Date</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-center">End Date</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                        <Loader2 className="size-5 animate-spin" />
                        <span>Loading series...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : allSeries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-600 dark:text-slate-400">
                      No series found
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Recently Opened Section */}
                    {recentlyOpenedSeries.length > 0 && (
                      <>
                        <TableRow className="bg-slate-100 dark:bg-slate-900">
                          <TableCell colSpan={7} className="font-semibold text-slate-700 dark:text-slate-300">
                            Recently Opened
                          </TableCell>
                        </TableRow>
                        {recentlyOpenedSeries.map(renderSeriesRow)}
                      </>
                    )}

                    {/* All/Active Series Section */}
                    {otherSeries.length > 0 && (
                      <>
                        <TableRow className="bg-slate-100 dark:bg-slate-900">
                          <TableCell colSpan={7} className="font-semibold text-slate-700 dark:text-slate-300">
                            {activeTab === 'active' ? 'Active Series' : 'All Series'}
                          </TableCell>
                        </TableRow>
                        {otherSeries.map(renderSeriesRow)}
                      </>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
