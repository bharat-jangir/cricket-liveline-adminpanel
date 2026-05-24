import React from 'react';

interface RankingItem {
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

interface ScraperPreviewModalProps {
  open: boolean;
  onClose: () => void;
  previewData: RankingItem[];
  onAccept: () => void;
}

export default function ScraperPreviewModal({ open, onClose, previewData, onAccept }: ScraperPreviewModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Scraper Preview</h2>
        {previewData.length === 0 ? (
          <p>No data fetched from scraper.</p>
        ) : (
          <table className="min-w-full border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left">Rank</th>
                <th className="px-4 py-2 text-left">Name / Team</th>
                <th className="px-4 py-2 text-left">Country</th>
                <th className="px-4 py-2 text-left">Rating / Points</th>
                <th className="px-4 py-2 text-left">Category</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                  <td className="px-4 py-2 font-bold">{r.rank}</td>
                  <td className="px-4 py-2">{r.type === 'player' ? r.name : r.teamName}</td>
                  <td className="px-4 py-2">{r.country || r.teamCode || '-'}</td>
                  <td className="px-4 py-2">{r.type === 'player' ? r.rating : r.points}</td>
                  <td className="px-4 py-2">{r.gender} {r.format} {r.role ? `(${r.role})` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex justify-end space-x-4 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:scale-105 transition"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:scale-105 transition"
          >
            Accept & Seed
          </button>
        </div>
      </div>
    </div>
  );
}
