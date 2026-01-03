"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Building2, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { venueService } from "../../services/venue.service";
import { Venue } from "../../types/venue";

/* -------------------------------------------------------------------------- */
/*                           FIXED FORM DIALOG                               */
/* -------------------------------------------------------------------------- */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: any;
  onSubmit: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">{children}</div>

        <DialogFooter>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                           FIXED CONFIRM DIALOG                             */
/* -------------------------------------------------------------------------- */

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  variant = "destructive",
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">{title}</DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Deleting..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                          DUMMY IMAGE UPLOAD                                */
/* -------------------------------------------------------------------------- */

function ImageUpload({
  value,
  onChange,
  label,
}: {
  value?: string;
  onChange: (file: File | null, preview: string | null) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-700 dark:text-slate-300">{label}</Label>
      <input
        type="file"
        accept="image/*"
        className="text-slate-900 dark:text-white"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          if (file) {
            const reader = new FileReader();
            reader.onload = () => onChange(file, reader.result as string);
            reader.readAsDataURL(file);
          } else {
            onChange(null, null);
          }
        }}
      />
      {value && (
        <img
          src={value}
          className="w-32 h-32 object-cover rounded border border-slate-200 dark:border-slate-600"
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MAIN VIEW                                     */
/* -------------------------------------------------------------------------- */

export function VenuesView() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingVenue, setDeletingVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVenues, setTotalVenues] = useState(0);
  const [limit] = useState(10);

  // Debounce search term
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
      setIsSearching(false);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchTerm]);

  // Load venues on mount and when debounced search/page changes
  useEffect(() => {
    loadVenues();
  }, [currentPage, debouncedSearchTerm]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const response = await venueService.getVenues({
        page: currentPage,
        limit,
        search: debouncedSearchTerm || undefined,
      });

      if (response.status && response.data) {
        setVenues(response.data.result || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalVenues(response.data.pagination.total);
        }
      }
    } catch (error: any) {
      console.error("Failed to load venues:", error);
      toast.error(error.response?.data?.userMessage || "Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  const deleteVenue = async () => {
    if (!deletingVenue) return;

    try {
      setDeleting(true);
      const response = await venueService.deleteVenue(deletingVenue._id);
      
      if (response.status) {
        toast.success(response.userMessage || "Venue deleted successfully");
        setDeleteOpen(false);
        setDeletingVenue(null);
        // Reload venues
        loadVenues();
      }
    } catch (error: any) {
      console.error("Failed to delete venue:", error);
      toast.error(error.response?.data?.userMessage || "Failed to delete venue");
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          )}
          <Input
            placeholder="Search by name or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2"
          onClick={() => navigate("/venues/add")}
        >
          <Plus className="w-4" />
          Add Venue
        </Button>
      </div>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-white text-xl">
              All Venues
            </CardTitle>
            {!loading && totalVenues > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Showing {venues.length} of {totalVenues} venues
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-100 dark:bg-slate-900">
                  <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-transparent dark:hover:bg-transparent">
                    <TableHead className="text-slate-600 dark:text-slate-300 w-[80px]">S.No</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">ID</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Venue Name</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">City</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Country</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Capacity</TableHead>
                    <TableHead className="text-right text-slate-600 dark:text-slate-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venues.length === 0 ? (
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400 py-8">
                        {searchTerm ? "No venues found matching your search" : "No venues found. Add your first venue!"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    venues.map((v, index) => (
                    <TableRow key={v._id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        {(currentPage - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {v._id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {v.image ? (
                            <img
                              src={v.image}
                              className="w-8 h-8 rounded object-cover"
                              alt={v.name}
                            />   
                          ) : (
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-600 rounded flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                            </div>
                          )}
                          <span className="text-slate-900 dark:text-white font-medium">{v.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">{v.city}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">{v.country}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {v.capacity?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                            onClick={() => navigate(`/venues/edit/${v._id}`)}
                          >
                            <Pencil className="w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                            onClick={() => {
                              setDeletingVenue(v);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          )}
          
          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-slate-200 dark:border-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-slate-200 dark:border-slate-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- Delete Dialog ---------------- */}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open);
        }}
        title="Delete Venue"
        description={`Are you sure you want to delete "${deletingVenue?.name}"? This action cannot be undone.`}
        onConfirm={deleteVenue}
        loading={deleting}
      />
    </div>
  );
}
