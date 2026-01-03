import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PlayerService } from '../../services/player.service';
import type { Player } from '../../types/player';
import { calculatePlayerProgress } from '../../utils/playerProgress';

export function PlayersView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('All');
  const [itemsPerPage, setItemsPerPage] = useState("20");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const navigate = useNavigate();

  const alphabet = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load players from API
  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: parseInt(itemsPerPage),
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await PlayerService.getAllPlayers(params);
      
      if (response.data?.result) {
        setPlayers(response.data.result);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      console.error('Failed to load players:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Filter by letter (client-side)
  const filteredPlayers = players.filter(player => {
    const matchesLetter = selectedLetter === 'All' || player.name.startsWith(selectedLetter);
    return matchesLetter;
  });

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Use shared progress calculation function

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Players</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-950"
            />
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => navigate('/players/new')}
          >
            <Plus className="size-4" />
            Add New Player
          </Button>
        </div>
      </div>

      {/* Filter & Pagination Control Bar */}
      <div className="flex flex-col space-y-4 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        {/* A-Z Filter */}
        <div className="flex flex-wrap gap-1 border-b border-slate-100 dark:border-slate-800 pb-4">
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`
                                px-2 py-1 text-xs font-medium rounded-md transition-colors
                                ${selectedLetter === letter
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}
                            `}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Pagination Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Items per page:</span>
            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
            <span className="text-sm text-slate-500">
              Total: <span className="font-medium text-slate-900 dark:text-slate-200">{pagination.total}</span>
            </span>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
            <span className="text-sm text-slate-500">
              Page {currentPage} of {pagination.totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              disabled={currentPage === 1 || loading}
              onClick={handlePreviousPage}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              disabled={currentPage >= pagination.totalPages || loading}
              onClick={handleNextPage}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm relative">
        <div className="absolute inset-0 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 w-20">S.No</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 w-48">Progress</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Batting Style</th>
                <th className="px-6 py-4 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="size-5 animate-spin" />
                      <span>Loading players...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPlayers.length > 0 ? (
                filteredPlayers.map((player, index) => {
                  const progress = calculatePlayerProgress(player);
                  const serialNumber = (currentPage - 1) * parseInt(itemsPerPage) + index + 1;
                  
                  return (
                    <tr key={player._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500">{serialNumber.toString().padStart(2, '0')}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {player.image && (
                            <img 
                              src={player.image} 
                              alt={player.name} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          )}
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{player.name}</div>
                            {player.fullName && player.fullName !== player.name && (
                              <div className="text-xs text-slate-500">{player.fullName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          player.role === 'batsman' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          player.role === 'bowler' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          player.role === 'all-rounder' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {player.role === 'wicket-keeper' ? 'WK' : player.role}
                        </span>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="h-1.5 w-full bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                          />
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">{progress}% completed</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{player.country}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {player.battingStyle ? (
                          player.battingStyle === 'right-hand' ? 'Right-Hand' : 'Left-Hand'
                        ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                          onClick={() => navigate(`/players/${player._id}`)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No players found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
