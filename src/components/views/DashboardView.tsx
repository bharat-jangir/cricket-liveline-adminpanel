import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Activity, 
  Calendar, 
  Trophy, 
  Users, 
  TrendingUp, 
  Eye,
  Newspaper,
  Video,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export function DashboardView() {
  const stats = [
    { 
      label: 'Live Matches', 
      value: '3', 
      change: '+2', 
      trend: 'up',
      icon: Activity, 
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    { 
      label: 'Scheduled Today', 
      value: '12', 
      change: '+3',
      trend: 'up',
      icon: Calendar, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: 'Active Tournaments', 
      value: '8', 
      change: '0',
      trend: 'neutral',
      icon: Trophy, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    { 
      label: 'Total Players', 
      value: '1,247', 
      change: '+23',
      trend: 'up',
      icon: Users, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: 'Total Views Today', 
      value: '2.4M', 
      change: '+12%',
      trend: 'up',
      icon: Eye, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    { 
      label: 'Active Users', 
      value: '847K', 
      change: '+8%',
      trend: 'up',
      icon: TrendingUp, 
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10'
    },
  ];

  const liveMatches = [
    {
      id: 1,
      tournament: 'ICC World Cup 2023',
      team1: { name: 'India', shortName: 'IND', score: '287/5', overs: '45.3' },
      team2: { name: 'Australia', shortName: 'AUS', score: '0/0', overs: '0.0' },
      venue: 'Wankhede Stadium, Mumbai',
      status: 'Innings Break',
      viewers: '2.1M'
    },
    {
      id: 2,
      tournament: 'IPL 2024',
      team1: { name: 'Mumbai Indians', shortName: 'MI', score: '178/6', overs: '20.0' },
      team2: { name: 'Chennai Super Kings', shortName: 'CSK', score: '142/4', overs: '15.2' },
      venue: 'Wankhede Stadium, Mumbai',
      status: 'Live - 2nd Innings',
      viewers: '1.8M'
    },
    {
      id: 3,
      tournament: 'The Ashes',
      team1: { name: 'England', shortName: 'ENG', score: '345/7d', overs: '89.0' },
      team2: { name: 'Australia', shortName: 'AUS', score: '198/3', overs: '56.4' },
      venue: 'Lords, London',
      status: 'Day 2 - Tea Break',
      viewers: '890K'
    },
  ];

  const recentActivity = [
    { action: 'Match Created', entity: 'IND vs PAK - Asia Cup Final', time: '5 min ago', user: 'Admin' },
    { action: 'Ball Updated', entity: 'MI vs CSK - Over 15.2', time: '2 min ago', user: 'Scorer 1' },
    { action: 'News Published', entity: 'Kohli reaches 50th ODI Century', time: '15 min ago', user: 'Content Admin' },
    { action: 'Video Uploaded', entity: 'Match Highlights - IND vs AUS', time: '1 hour ago', user: 'Video Team' },
    { action: 'Player Added', entity: 'Sam Curran - England', time: '2 hours ago', user: 'Data Admin' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`size-5 ${stat.color}`} />
                  </div>
                  {stat.trend === 'up' && (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <ArrowUp className="size-3" />
                      {stat.change}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl text-white mb-1">{stat.value}</h3>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live Matches */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="size-5 text-red-500 animate-pulse" />
            Live Matches
          </CardTitle>
          <Badge variant="destructive" className="animate-pulse">
            {liveMatches.length} LIVE
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {liveMatches.map((match) => (
              <div 
                key={match.id} 
                className="p-4 rounded-lg bg-slate-900 border border-slate-700 hover:border-blue-600 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400">{match.tournament}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Eye className="size-3" />
                      {match.viewers}
                    </span>
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      {match.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">{match.team1.shortName}</span>
                    <span className="text-white">
                      {match.team1.score} <span className="text-slate-500 text-sm">({match.team1.overs})</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">{match.team2.shortName}</span>
                    <span className="text-white">
                      {match.team2.score} <span className="text-slate-500 text-sm">({match.team2.overs})</span>
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500">{match.venue}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700">
                  <div className="size-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-white mb-1">
                      <span className="text-blue-400">{activity.action}</span>
                      {' - '}
                      {activity.entity}
                    </p>
                    <p className="text-xs text-slate-500">
                      {activity.time} • by {activity.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Content Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Newspaper className="size-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">News Articles</p>
                    <p className="text-xl text-white">1,234</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">+12 today</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Video className="size-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Videos</p>
                    <p className="text-xl text-white">856</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">+8 today</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Trophy className="size-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Teams</p>
                    <p className="text-xl text-white">124</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-slate-700">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Users className="size-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Registered Users</p>
                    <p className="text-xl text-white">2.4M</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">+1.2K today</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
