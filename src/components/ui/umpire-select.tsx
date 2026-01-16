import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface Umpire {
  _id: string;
  name: string;
}

interface UmpireSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function UmpireSelect({ value, onChange, placeholder = "Select umpire" }: UmpireSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [umpires, setUmpires] = useState<Umpire[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUmpire, setSelectedUmpire] = useState<Umpire | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchUmpires = useCallback(async (searchTerm: string, pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5001/umpires?search=${encodeURIComponent(searchTerm)}&page=${pageNum}&limit=20`
      );
      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      if (data.status && data.data && data.data.result && Array.isArray(data.data.result)) {
        const newUmpires = data.data.result;
        setUmpires(prev => reset ? newUmpires : [...prev, ...newUmpires]);
        setHasMore(data.data.pagination && data.data.pagination.page < data.data.pagination.totalPages);
      } else {
        console.error('Invalid API response structure:', data);
        setUmpires(prev => reset ? [] : prev);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch umpires:', error);
      setUmpires(prev => reset ? [] : prev);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial umpires
  useEffect(() => {
    fetchUmpires('', 1, true);
  }, [fetchUmpires]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUmpires(search, 1, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchUmpires]);

  // Find selected umpire name
  useEffect(() => {
    if (value && umpires.length > 0) {
      const found = umpires.find(u => u._id === value);
      setSelectedUmpire(found || null);
    } else {
      setSelectedUmpire(null);
    }
  }, [value, umpires]);

  // Handle scroll for pagination
  const handleScroll = useCallback(() => {
    if (!listRef.current || loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUmpires(search, nextPage, false);
    }
  }, [loading, hasMore, page, search, fetchUmpires]);

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

  const handleSelect = (umpire: Umpire) => {
    onChange(umpire._id);
    setSelectedUmpire(umpire);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-left font-normal"
      >
        <span className="truncate">
          {selectedUmpire ? selectedUmpire.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg">
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search umpires..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
          
          <div 
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            onScroll={handleScroll}
          >
            {umpires.length === 0 && !loading ? (
              <div className="p-2 text-sm text-slate-500 text-center">
                No umpires found
              </div>
            ) : (
              umpires.map((umpire) => (
                <button
                  key={umpire._id}
                  type="button"
                  onClick={() => handleSelect(umpire)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none"
                >
                  {umpire.name}
                </button>
              ))
            )}
            
            {loading && (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-slate-500">Loading...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}