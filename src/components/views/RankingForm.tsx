import React, { useState } from 'react';
import { RankingItem } from './RankingsView';
import { axiosInstance } from '../../lib/axios';
import { API_ENDPOINTS } from '../../api/endpoints';

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

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded bg-white dark:bg-gray-800">
      <h2 className="text-xl font-semibold mb-3">{initialData ? 'Edit Ranking' : 'Add New Ranking'}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
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
      <div className="flex space-x-2 mt-4">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Saving…' : (initialData ? 'Update Ranking' : 'Add Ranking')}
        </button>
        {initialData && onCancelEdit && (
          <button type="button" onClick={onCancelEdit} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
