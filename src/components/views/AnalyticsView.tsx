import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  MousePointerClick,
  Clock,
  Globe,
  Smartphone
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AnalyticsView() {
  const kpiData = [
    { 
      label: 'Total Users',
      value: '2.4M',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-500'
    },
    { 
      label: 'Daily Active Users',
      value: '847K',
      change: '+8.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    { 
      label: 'Page Views',
      value: '12.8M',
      change: '+15.3%',
      trend: 'up',
      icon: Eye,
      color: 'text-purple-500'
    },
    { 
      label: 'Avg Session Time',
      value: '8m 32s',
      change: '-2.1%',
      trend: 'down',
      icon: Clock,
      color: 'text-yellow-500'
    },
  ];

  const userGrowthData = [
    { month: 'Jan', users: 1800000, activeUsers: 620000 },
    { month: 'Feb', users: 1950000, activeUsers: 680000 },
    { month: 'Mar', users: 2100000, activeUsers: 740000 },
    { month: 'Apr', users: 2200000, activeUsers: 780000 },
    { month: 'May', users: 2350000, activeUsers: 820000 },
    { month: 'Jun', users: 2400000, activeUsers: 847000 },
  ];

  const contentEngagementData = [
    { name: 'Matches', views: 4800000 },
    { name: 'News', views: 3200000 },
    { name: 'Videos', views: 2800000 },
    { name: 'Stats', views: 1900000 },
    { name: 'Photos', views: 1200000 },
  ];

  const deviceData = [
    { name: 'Mobile', value: 68, color: '#3b82f6' },
    { name: 'Desktop', value: 24, color: '#8b5cf6' },
    { name: 'Tablet', value: 8, color: '#06b6d4' },
  ];

  const topMatches = [
    { match: 'IND vs AUS - WC Final', views: 2100000, engagement: 94 },
    { match: 'MI vs CSK - IPL', views: 1800000, engagement: 88 },
    { match: 'ENG vs PAK - Test', views: 890000, engagement: 76 },
    { match: 'SA vs NZ - ODI', views: 670000, engagement: 72 },
    { match: 'BAN vs SL - T20', views: 450000, engagement: 68 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === 'up';
          
          return (
            <Card key={idx} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-lg bg-slate-900`}>
                    <Icon className={`size-5 ${kpi.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                    {kpi.change}
                  </div>
                </div>
                <h3 className="text-3xl text-white mb-1">{kpi.value}</h3>
                <p className="text-sm text-slate-400">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Total Users" />
                <Line type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={2} name="Active Users" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Engagement */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Content Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentEngagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="views" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Device Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Matches */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Top Performing Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMatches.map((match, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-slate-900 border border-slate-700">
                  <div className="text-2xl text-slate-400">#{idx + 1}</div>
                  <div className="flex-1">
                    <p className="text-white mb-1">{match.match}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {match.views.toLocaleString()} views
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="size-3" />
                        {match.engagement}% engagement
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {idx === 0 && <Badge className="bg-yellow-500">🏆 Top</Badge>}
                    {idx === 1 && <Badge className="bg-slate-600">🥈 2nd</Badge>}
                    {idx === 2 && <Badge className="bg-orange-700">🥉 3rd</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Live Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl text-white mb-1">124,567</h3>
                <p className="text-sm text-slate-400">Active now</p>
              </div>
              <div className="size-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Users className="size-6 text-green-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Live Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl text-white mb-1">3</h3>
                <p className="text-sm text-slate-400">In progress</p>
              </div>
              <div className="size-12 bg-red-500/10 rounded-full flex items-center justify-center">
                <Globe className="size-6 text-red-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Push Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl text-white mb-1">1.2M</h3>
                <p className="text-sm text-slate-400">Sent today</p>
              </div>
              <div className="size-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Smartphone className="size-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
