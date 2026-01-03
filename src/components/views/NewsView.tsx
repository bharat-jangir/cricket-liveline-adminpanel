import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Calendar } from 'lucide-react';

export function NewsView() {
  const [searchTerm, setSearchTerm] = useState('');

  const news = [
    {
      id: 1,
      title: 'Virat Kohli Reaches 50th ODI Century in World Cup Final',
      excerpt: 'Indian captain Virat Kohli achieved a historic milestone by scoring his 50th ODI century...',
      status: 'Published',
      author: 'John Doe',
      publishedAt: '2025-12-01T14:30:00',
      views: 2100000,
      category: 'Match Report',
      isFeatured: true,
      isBreaking: false,
    },
    {
      id: 2,
      title: 'Mumbai Indians Sign Australian All-rounder for IPL 2024',
      excerpt: 'In a major acquisition, Mumbai Indians have signed Australian all-rounder...',
      status: 'Published',
      author: 'Jane Smith',
      publishedAt: '2025-12-01T10:15:00',
      views: 845000,
      category: 'Transfer News',
      isFeatured: false,
      isBreaking: true,
    },
    {
      id: 3,
      title: 'Rain Disrupts Day 2 of England vs Australia Test Match',
      excerpt: 'Persistent rain has forced early stumps on day 2 of the first Ashes test...',
      status: 'Published',
      author: 'Mike Johnson',
      publishedAt: '2025-12-01T08:45:00',
      views: 456000,
      category: 'Match Update',
      isFeatured: false,
      isBreaking: false,
    },
    {
      id: 4,
      title: 'ICC Announces New T20 World Cup Schedule',
      excerpt: 'The International Cricket Council has released the schedule for the upcoming...',
      status: 'Draft',
      author: 'Sarah Williams',
      publishedAt: null,
      views: 0,
      category: 'ICC News',
      isFeatured: false,
      isBreaking: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="size-4 mr-2" />
          Create Article
        </Button>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {news.map((article) => (
          <Card key={article.id} className="bg-slate-800 border-slate-700 hover:border-blue-600 transition-all">
            <CardContent className="p-6">
              <div className="flex gap-6">
                {/* Thumbnail */}
                <div className="size-32 bg-slate-900 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-600">
                  📰
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg text-white">{article.title}</h3>
                        {article.isBreaking && (
                          <Badge variant="destructive" className="animate-pulse">
                            BREAKING
                          </Badge>
                        )}
                        {article.isFeatured && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{article.excerpt}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {article.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'Not published'}
                        </span>
                        {article.status === 'Published' && (
                          <span className="flex items-center gap-1">
                            <Eye className="size-3" />
                            {article.views.toLocaleString()} views
                          </span>
                        )}
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          {article.category}
                        </Badge>
                        <span>by {article.author}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={article.status === 'Published' ? 'secondary' : 'outline'}
                        className={
                          article.status === 'Published' 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'border-yellow-500 text-yellow-400'
                        }
                      >
                        {article.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-slate-700 text-white hover:bg-slate-700"
                  >
                    <Eye className="size-4" />
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
