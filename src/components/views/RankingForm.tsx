import React, { useState } from 'react';
import { RankingItem } from './RankingsView';
import { axiosInstance } from '../../lib/axios';
import { API_ENDPOINTS } from '../../api/endpoints';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onAdd: (item: RankingItem) => void;
  initialData?: RankingItem | null;
  onCancelEdit?: () => void;
}

export default function RankingForm({ onAdd, initialData, onCancelEdit }: Props) {
  const [form, setForm] = useState<Partial<RankingItem>>(
    initialData || { 
      type: 'player', 
      name: '', 
      teamName: '', 
      rank: 1, 
      points: 0, 
      rating: 0, 
      format: 'test', 
      gender: 'men', 
      role: 'batting' 
    }
  );
  
  // Update form if initialData changes
  React.useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({ type: 'player', name: '', teamName: '', rank: 1, points: 0, rating: 0, format: 'test', gender: 'men', role: 'batting' });
    }
  }, [initialData]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: ['points', 'rating', 'rank'].includes(name) ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (initialData && initialData._id) {
        // Edit mode
        const res = await axiosInstance.put(API_ENDPOINTS.RANKINGS.UPDATE(initialData._id), form);
        const data = res.data;
        const updatedItem: RankingItem = data.data?.result || data.response?.data || data.data;
        onAdd(updatedItem); // Reusing onAdd to signify success (parent will refresh list)
      } else {
        // Create mode
        const res = await axiosInstance.post(API_ENDPOINTS.RANKINGS.CREATE, form);
        const data = res.data;
        const newItem: RankingItem = data.data?.result || data.response?.data || data.data;
        onAdd(newItem);
      }
      if (!initialData) {
        setForm({ type: 'player', name: '', teamName: '', rank: 1, points: 0, rating: 0, format: 'test', gender: 'men', role: 'batting' });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const [isExpanded, setIsExpanded] = useState(!!initialData);

  // If initialData changes (e.g., clicking edit on a row), automatically expand the form
  React.useEffect(() => {
    if (initialData) {
      setIsExpanded(true);
    }
  }, [initialData]);

  return (
    <div className="mb-6 border rounded bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold m-0">
          {initialData ? 'Edit Ranking' : 'Add New Ranking'}
        </h2>
        <button type="button" className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 dark:border-gray-700">
          {error && <div className="text-red-600 mb-4 bg-red-50 p-2 rounded">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select name="type" value={form.type} onChange={handleChange} className="border p-2 rounded">
              <option value="player">Player</option>
              <option value="team">Team</option>
            </select>
            
            {form.type === 'player' ? (
              <input name="name" value={form.name || ''} onChange={handleChange} placeholder="Player Name" required className="border p-2 rounded" />
            ) : (
              <input name="teamName" value={form.teamName || ''} onChange={handleChange} placeholder="Team Name" required className="border p-2 rounded" />
            )}
            
            <input name="rank" type="number" value={form.rank || ''} onChange={handleChange} placeholder="Rank" required className="border p-2 rounded" />
            <input name="rating" type="number" value={form.rating || ''} onChange={handleChange} placeholder="Rating" className="border p-2 rounded" />
            <input name="points" type="number" value={form.points || ''} onChange={handleChange} placeholder="Points" className="border p-2 rounded" />
            
            <select name="gender" value={form.gender} onChange={handleChange} className="border p-2 rounded">
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>

            <select name="format" value={form.format} onChange={handleChange} className="border p-2 rounded">
              <option value="test">Test</option>
              <option value="odi">ODI</option>
              <option value="t20">T20</option>
            </select>

            {form.type === 'player' && (
              <select name="role" value={form.role} onChange={handleChange} className="border p-2 rounded">
                <option value="batsman">Batsman</option>
                <option value="bowler">Bowler</option>
                <option value="all-rounder">All-Rounder</option>
              </select>
            )}
          </div>
          
          <div className="flex space-x-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? 'Saving...' : (initialData ? 'Update Ranking' : 'Add Ranking')}
            </button>
            {initialData && onCancelEdit && (
              <button type="button" onClick={() => { onCancelEdit(); setIsExpanded(false); }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
