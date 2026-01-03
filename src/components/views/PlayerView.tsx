import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Plus, UserCircle, Edit, Trash2, Filter } from 'lucide-react';
import { PlayerService } from '../../services/player.service';
import { Player, QueryPlayersDto } from '../../types/player';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Table } from '../ui/Table';
import { Select } from '../ui/Select';
import { PlayerFormModal } from './PlayerFormModal';
import { cn } from '../../lib/utils';

export function PlayerView() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState<QueryPlayersDto>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setFilters(prev => ({ ...prev, page: 1 })); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await PlayerService.getAllPlayers({ ...filters, search: debouncedSearchTerm });
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
  }, [filters, debouncedSearchTerm]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      await PlayerService.deletePlayer(id);
      toast.success('Player deleted successfully');
      loadPlayers();
    } catch (error: any) {
      console.error('Failed to delete player:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to delete player');
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPlayer(null);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    loadPlayers();
    setIsFormModalOpen(false);
    setEditingPlayer(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: keyof QueryPlayersDto, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'batsman':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'bowler':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'all-rounder':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'wicket-keeper':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Players</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage cricket players
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Player
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Country Filter */}
          <Input
            type="text"
            placeholder="Country"
            value={filters.country || ''}
            onChange={(e) => handleFilterChange('country', e.target.value || undefined)}
          />

          {/* Role Filter */}
          <Select
            value={filters.role || ''}
            onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
          >
            <option value="">All Roles</option>
            <option value="batsman">Batsman</option>
            <option value="bowler">Bowler</option>
            <option value="all-rounder">All-Rounder</option>
            <option value="wicket-keeper">Wicket Keeper</option>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
            onChange={(e) => {
              if (e.target.value === '') {
                handleFilterChange('isActive', undefined);
              } else {
                handleFilterChange('isActive', e.target.value === 'active');
              }
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <UserCircle className="w-12 h-12 mb-3 opacity-50" />
            <p>No players found</p>
          </div>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Country</th>
                  <th>Role</th>
                  <th>Batting Style</th>
                  <th>Jersey #</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {player.image ? (
                          <img
                            src={player.image}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {player.name}
                          </div>
                          {player.fullName && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {player.fullName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{player.country}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn('px-2 py-1 text-xs rounded-full', getRoleBadgeColor(player.role))}>
                        {player.role}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {player.battingStyle || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {player.jerseyNumber || '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          player.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                        )}
                      >
                        {player.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEdit(player)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(player._id!)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} players
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                  disabled={pagination.page === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Player Form Modal */}
      {isFormModalOpen && (
        <PlayerFormModal
          player={editingPlayer}
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingPlayer(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

