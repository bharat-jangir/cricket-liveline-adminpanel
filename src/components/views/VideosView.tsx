import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Play, Clock } from 'lucide-react';

export function VideosView() {
  const [searchTerm, setSearchTerm] = useState('');

  const videos = [
    {
      id: 1,
      title: 'IND vs AUS World Cup Final - Full Match Highlights',
      type: 'Highlight',
      duration: '15:32',
      views: 3200000,
      status: 'Published',
      publishedAt: '2025-12-01T18:00:00',
      thumbnail: '🎬',
    },
    {
      id: 2,
      title: 'Virat Kohli 50th Century - All Boundaries',
      type: 'Analysis',
      duration: '08:45',
      views: 1800000,
      status: 'Published',
      publishedAt: '2025-12-01T16:30:00',
      thumbnail: '🎥',
    },
    {
      id: 3,
      title: 'Top 10 Catches of IPL 2024',
      type: 'Top 10',
      duration: '12:18',
      views: 950000,
      status: 'Published',
      publishedAt: '2025-12-01T14:00:00',
      thumbnail: '📹',
    },
    {
      id: 4,
      title: 'Expert Analysis: India vs Pakistan Rivalry',
      type: 'Expert Opinion',
      duration: '22:15',
      views: 0,
      status: 'Processing',
      publishedAt: null,
      thumbnail: '🎞️',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="size-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Videos Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="bg-slate-800 border-slate-700 hover:border-blue-600 transition-all group">
            <CardContent className="p-0">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-900 rounded-t-lg flex items-center justify-center text-6xl group-hover:bg-slate-800 transition-colors">
                {video.thumbnail}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="lg" className="rounded-full size-16 bg-blue-600 hover:bg-blue-700">
                    <Play className="size-6" />
                  </Button>
                </div>
                <Badge className="absolute top-3 right-3 bg-black/80">
                  <Clock className="size-3 mr-1" />
                  {video.duration}
                </Badge>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white text-sm line-clamp-2 flex-1">{video.title}</h3>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                    {video.type}
                  </Badge>
                  <Badge 
                    variant={video.status === 'Published' ? 'secondary' : 'outline'}
                    className={
                      video.status === 'Published' 
                        ? 'bg-green-500/10 text-green-500 text-xs' 
                        : 'border-yellow-500 text-yellow-400 text-xs'
                    }
                  >
                    {video.status}
                  </Badge>
                </div>

                {video.status === 'Published' && (
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="size-3" />
                      {video.views.toLocaleString()}
                    </span>
                    <span>
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-slate-700 text-white hover:bg-slate-700"
                  >
                    <Eye className="size-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-slate-700 text-white hover:bg-slate-700"
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-slate-700 text-red-400 hover:bg-slate-700"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
