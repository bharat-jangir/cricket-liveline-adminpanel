import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { umpireService } from '../../services/umpire.service';
import { Umpire } from '../../types/umpire';

export function UmpiresView() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUmpire, setDeletingUmpire] = useState<Umpire | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [umpires, setUmpires] = useState<Umpire[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounce search
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load umpires
  useEffect(() => {
    loadUmpires();
  }, [currentPage, debouncedSearchTerm]);

  const loadUmpires = async () => {
    try {
      setLoading(true);
      const response = await umpireService.getUmpires({
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: 10,
      });

      if (response.status && response.data) {
        setUmpires(response.data.result || []);
        setTotal(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Failed to load umpires:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to load umpires');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUmpire) return;

    try {
      setDeleting(true);
      const response = await umpireService.deleteUmpire(deletingUmpire._id);

      if (response.status) {
        toast.success(response.userMessage || 'Umpire deleted successfully');
        setDeleteOpen(false);
        loadUmpires();
      }
    } catch (error: any) {
      console.error('Failed to delete umpire:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to delete umpire');
    } finally {
      setDeleting(false);
    }
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
            placeholder="Search umpires..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            disabled={loading}
          />
        </div>
        <Button onClick={() => navigate('/umpires/new')} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="size-4 mr-2" />
          Add Umpire
        </Button>
      </div>

      {/* Umpires Table */}
      <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-24">SR NO.</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-32">ID</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center">UMPIRE NAME</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 text-center w-32">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={4}
                  className="text-center text-slate-600 dark:text-slate-400 py-12"
                >
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                </TableCell>
              </TableRow>
            ) : umpires.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={4}
                  className="text-center text-slate-600 dark:text-slate-400 py-8"
                >
                  No umpires found
                </TableCell>
              </TableRow>
            ) : (
              umpires.map((umpire, index) => (
                <TableRow
                  key={umpire._id}
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                >
                  {/* Sr No */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center font-medium">
                    {(currentPage - 1) * 10 + index + 1}
                  </TableCell>
                  
                  {/* ID */}
                  <TableCell className="text-slate-600 dark:text-slate-400 text-center text-xs font-mono">
                    {umpire._id}
                  </TableCell>
                  
                  {/* Umpire Name */}
                  <TableCell className="text-slate-900 dark:text-slate-200 text-center">
                    <span className="font-medium">{umpire.name}</span>
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/umpires/edit/${umpire._id}`)}
                        className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setDeletingUmpire(umpire); setDeleteOpen(true); }}
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
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, total)} of {total} umpires
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-slate-300 dark:border-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-300 dark:border-slate-700"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Umpire"
        description={`Are you sure you want to delete "${deletingUmpire?.name}"?`}
        onConfirm={handleDelete}
        loading={deleting}
        variant="destructive"
      />
    </div>
  );
}
