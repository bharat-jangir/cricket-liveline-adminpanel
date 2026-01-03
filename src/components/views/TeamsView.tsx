import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Team } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TeamService } from '../../services/team.service';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

// Country flag emoji mapping
const countryFlags: Record<string, string> = {
  'India': '🇮🇳',
  'Australia': '🇦🇺',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Pakistan': '🇵🇰',
  'South Africa': '🇿🇦',
  'New Zealand': '🇳🇿',
  'Sri Lanka': '🇱🇰',
  'Bangladesh': '🇧🇩',
  'West Indies': '🇯🇲',
  'Afghanistan': '🇦🇫',
  'Ireland': '🇮🇪',
  'Zimbabwe': '🇿🇼',
};

export function TeamsView() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
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

  // Fetch teams
  useEffect(() => {
    loadTeams();
  }, [debouncedSearchTerm, pagination.page]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await TeamService.listTeams({
        search: debouncedSearchTerm || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.status) {
        setTeams(response.data.result);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.userMessage || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTeam) return;
    
    try {
      setLoading(true);
      const response = await TeamService.deleteTeam(deletingTeam._id!);
      
      if (response.status) {
        toast.success('Team deleted successfully');
        setDeleteOpen(false);
        setDeletingTeam(null);
        loadTeams();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.userMessage || 'Failed to delete team');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on new search
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          )}
          <Input
            placeholder="Search teams by name, code, or country..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        <Button onClick={() => navigate('/teams/new')} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="size-4 mr-2" />
          Add Team
        </Button>
      </div>

      {/* Teams Table */}
      <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-16">Sr No.</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-24">ID</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center">TEAM NAME</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-24">F KEY</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-32">SHORT NAME</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-24">FORMAT</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-32">M/W</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-32">TYPE</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-32">COUNTRY</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-32">FLAG</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-32">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={11}
                  className="text-center text-slate-600 dark:text-slate-400 py-8"
                >
                  <Loader2 className="inline-block size-6 animate-spin mr-2" />
                  Loading teams...
                </TableCell>
              </TableRow>
            ) : teams.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={11}
                  className="text-center text-slate-600 dark:text-slate-400 py-8"
                >
                  No teams found
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team, index) => (
                <TableRow
                  key={team._id}
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                >
                  {/* Sr No */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center font-medium">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </TableCell>
                  
                  {/* ID */}
                  <TableCell className="text-slate-600 dark:text-slate-400 text-center text-xs font-mono">
                    {team._id}
                  </TableCell>
                  
                  {/* Team Name with Logo */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-medium">{team.name}</span>
                    </div>
                  </TableCell>
                  
                  {/* F Key (Code) */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center font-mono text-sm">
                    {team.code}
                  </TableCell>
                  
                  {/* Short Name */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center">
                    <Badge variant="outline" className="border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-mono">
                      {team.shortName}
                    </Badge>
                  </TableCell>
                  
                  {/* Format (full text) */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center">
                    <span className="capitalize">{team.format || 'men'}</span>
                  </TableCell>
                  
                  {/* M/W (Badge) */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center">
                    <Badge 
                      variant="outline" 
                      className={
                        team.format === 'men' 
                          ? 'border-blue-500 text-blue-400' 
                          : 'border-pink-500 text-pink-400'
                      }
                    >
                      {team.format === 'men' ? 'M' : 'W'}
                    </Badge>
                  </TableCell>
                  
                  {/* Type */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center">
                    <Badge variant="outline" className="border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-400 capitalize">
                      {team.type}
                    </Badge>
                  </TableCell>
                  
                  {/* Country */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center">
                    <span className="text-sm">{team.country}</span>
                  </TableCell>
                  
                  {/* Flag */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center">
                    <div className="flex items-center justify-center">
                      {team.logo ? (
                        <img 
                          src={team.logo} 
                          alt={team.name} 
                          className="size-8 rounded object-cover bg-slate-900" 
                        />
                      ) : (
                        <div className="size-8 bg-slate-900 rounded flex items-center justify-center text-xs">
                          {team.shortName.substring(0, 2)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/teams/edit/${team._id}`)}
                        className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setDeletingTeam(team); setDeleteOpen(true); }}
                        className="border-slate-300 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} teams
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1 || loading}
              className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === pagination.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page }))}
                  disabled={loading}
                  className={
                    page === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                  }
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages || loading}
              className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Team"
        description={`Are you sure you want to delete "${deletingTeam?.name}"?`}
        onConfirm={handleDelete}
        loading={loading}
        variant="destructive"
      />
    </div>
  );
}
