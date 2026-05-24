import React, { useEffect, useState } from 'react';
import ScraperPreviewModal from './ScraperPreviewModal';
import RankingForm from './RankingForm';
import { axiosInstance } from '../../lib/axios';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface RankingItem {
  _id?: string;
  type: 'player' | 'team';
  name?: string;
  teamName?: string;
  country?: string;
  teamCode?: string;
  rank: number;
  rating?: number;
  points?: number;
  format: string;
  gender: string;
  role?: string;
  source?: string;
}

export default function RankingsView() {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<RankingItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingItem, setEditingItem] = useState<RankingItem | null>(null);

  // Pagination & Search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    type: 'player',
    gender: 'men',
    format: 'test',
    role: 'batting'
  });

  const loadRankings = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.RANKINGS.LIST, {
        params: { page, limit, search, ...filters }
      });
      const responseData = res.data;
      
      // The gateway wraps responses. The actual paginated object is often inside responseData.data.result
      if (responseData.data && responseData.data.result && Array.isArray(responseData.data.result.result)) {
        setRankings(responseData.data.result.result);
        setTotalPages(responseData.data.result.totalPages || 1);
      } else if (responseData.data && Array.isArray(responseData.data.result)) {
        setRankings(responseData.data.result);
        setTotalPages(responseData.data.totalPages || 1);
      } else {
        const list = Array.isArray(responseData.data) ? responseData.data : (Array.isArray(responseData.result) ? responseData.result : []);
        setRankings(list);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset page when filters change
    loadRankings();
  }, [filters.type, filters.gender, filters.format, filters.role, limit]);

  useEffect(() => {
    loadRankings();
  }, [page]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset page on new search
      loadRankings();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);


  if (loading) return <div className="p-4 text-center">Loading rankings…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  // Add/Update handler
  const handleAdd = (item: RankingItem) => {
    setEditingItem(null);
    loadRankings();
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this ranking?')) {
      try {
        await axiosInstance.delete(API_ENDPOINTS.RANKINGS.DELETE(id));
        loadRankings();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  const fetchPreview = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.RANKINGS.PREVIEW, { params: filters });
      const data = res.data?.data?.result || [];
      setPreviewData(data);
      setShowPreview(true);
    } catch (err) {
      console.error('Preview fetch error', err);
    }
  };

  const acceptPreview = async () => {
    try {
      await axiosInstance.post(API_ENDPOINTS.RANKINGS.REFRESH, filters);
      setShowPreview(false);
      await loadRankings();
    } catch (err) {
      console.error('Refresh error', err);
    }
  };

  return (
    <div className="p-4 relative">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2 mb-4 border-b border-gray-200 dark:border-gray-800 -mx-4 px-4 pt-4 -mt-4">
        <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Rankings</h1>
        <div className="flex items-center space-x-2">
          <input 
            type="text" 
            placeholder="Search by name or team..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border p-2 rounded dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center space-x-4 mb-4 bg-gray-50 p-4 rounded dark:bg-gray-800">
        <select 
          value={filters.type} 
          onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
          className="border p-2 rounded"
        >
          <option value="player">Player Rankings</option>
          <option value="team">Team Rankings</option>
        </select>

        <select 
          value={filters.gender} 
          onChange={e => setFilters(p => ({ ...p, gender: e.target.value }))}
          className="border p-2 rounded"
        >
          <option value="men">Men</option>
          <option value="women">Women</option>
        </select>

        <select 
          value={filters.format} 
          onChange={e => setFilters(p => ({ ...p, format: e.target.value }))}
          className="border p-2 rounded"
        >
          <option value="test">Test</option>
          <option value="odi">ODI</option>
          <option value="t20">T20</option>
        </select>

        {filters.type === 'player' && (
          <select 
            value={filters.role} 
            onChange={e => setFilters(p => ({ ...p, role: e.target.value }))}
            className="border p-2 rounded"
          >
            <option value="batting">Batsman</option>
            <option value="bowling">Bowler</option>
            <option value="all-rounder">All-Rounder</option>
          </select>
        )}

        <button onClick={fetchPreview} className="px-4 py-2 bg-indigo-600 text-white rounded hover:scale-105 transition">
          Fetch from Scraper
        </button>
      </div>

        {/* Form for adding/editing rankings */}
        <RankingForm onAdd={handleAdd} initialData={editingItem} onCancelEdit={() => setEditingItem(null)} />
      </div>

      <ScraperPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        previewData={previewData}
        onAccept={acceptPreview}
      />

      {rankings.length === 0 ? (
        <p>No ranking data available.</p>
      ) : (
        <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">Name / Team</th>
              <th className="px-4 py-2 text-left">Country</th>
              <th className="px-4 py-2 text-left">Rating / Points</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Source</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                <td className="px-4 py-2 font-bold">{r.rank}</td>
                <td className="px-4 py-2">{r.type === 'player' ? r.name : r.teamName}</td>
                <td className="px-4 py-2">{r.country || r.teamCode || '-'}</td>
                <td className="px-4 py-2">{r.type === 'player' ? r.rating : r.points}</td>
                <td className="px-4 py-2">{r.gender} {r.format} {r.role ? `(${r.role})` : ''}</td>
                <td className="px-4 py-2">{r.source ?? 'manual'}</td>
                <td className="px-4 py-2 flex space-x-2">
                  <button onClick={() => setEditingItem(r)} className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleDelete(r._id)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Page {page} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            disabled={page >= totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
