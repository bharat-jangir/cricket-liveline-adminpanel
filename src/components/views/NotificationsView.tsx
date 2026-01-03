import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Bell, Activity, Calendar, CheckCircle } from 'lucide-react';

interface Match {
  id: number;
  matchName: string;
  seriesName: string;
  key: string;
  date: string;
  status: 'Live' | 'Upcoming' | 'Finished';
}

export default function NotificationsView() {
  const navigate = useNavigate();
  const [matches] = useState<Match[]>([
    {
      id: 1,
      matchName: 'Mumbai Indians vs Chennai Super Kings',
      seriesName: 'IPL 2024',
      key: 'MI-CSK-IPL24-M15',
      date: '2025-12-01',
      status: 'Live'
    },
    {
      id: 3,
      matchName: 'England vs Pakistan',
      seriesName: 'The Ashes 2025',
      key: 'ENG-PAK-ASH25-M2',
      date: '2025-12-02',
      status: 'Upcoming'
    },
    {
      id: 4,
      matchName: 'New Zealand vs South Africa',
      seriesName: 'Test Series 2025',
      key: 'NZ-SA-TEST25-M1',
      date: '2025-12-03',
      status: 'Upcoming'
    },
    {
      id: 5,
      matchName: 'India vs Pakistan',
      seriesName: 'Asia Cup 2023',
      key: 'IND-PAK-AC23-F',
      date: '2025-11-30',
      status: 'Finished'
    },
    {
      id: 6,
      matchName: 'Australia vs England',
      seriesName: 'T20 World Cup 2023',
      key: 'AUS-ENG-T20WC23-SF1',
      date: '2025-11-29',
      status: 'Finished'
    },
  ]);

  const getFilteredMatches = (filter: 'all' | 'live' | 'upcoming' | 'finished') => {
    if (filter === 'all') return matches;
    if (filter === 'live') return matches.filter(m => m.status === 'Live');
    if (filter === 'upcoming') return matches.filter(m => m.status === 'Upcoming');
    if (filter === 'finished') return matches.filter(m => m.status === 'Finished');
    return matches;
  };

  const handleMatchClick = (match: Match) => {
    navigate(`/notifications/match/${match.id}`, { state: { matchName: match.matchName } });
  };

  const renderMatchTable = (data: Match[]) => (
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[250px]">Match Name</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[200px]">Series Name</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[180px]">Key</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[150px]">Date</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="border-slate-200 dark:border-slate-700">
              <TableCell colSpan={5} className="text-center text-slate-500 dark:text-slate-400 py-8">
                No matches found
              </TableCell>
            </TableRow>
          ) : (
            data.map((match) => (
              <TableRow 
                key={match.id} 
                className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                onClick={() => handleMatchClick(match)}
              >
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-white">{match.matchName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-slate-700 dark:text-slate-300">{match.seriesName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-slate-600 dark:text-slate-400 font-mono text-sm">{match.key}</div>
                </TableCell>
                <TableCell>
                  <div className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {new Date(match.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={match.status === 'Live' ? 'destructive' : match.status === 'Finished' ? 'secondary' : 'outline'}
                    className={
                      match.status === 'Live' 
                        ? 'animate-pulse bg-red-600' 
                        : match.status === 'Finished' 
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
                        : 'border-blue-500 text-blue-600 dark:text-blue-400'
                    }
                  >
                    {match.status === 'Live' && <Activity className="size-3 mr-1" />}
                    {match.status === 'Upcoming' && <Calendar className="size-3 mr-1" />}
                    {match.status === 'Finished' && <CheckCircle className="size-3 mr-1" />}
                    {match.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const liveCount = matches.filter(m => m.status === 'Live').length;
  const upcomingCount = matches.filter(m => m.status === 'Upcoming').length;
  const finishedCount = matches.filter(m => m.status === 'Finished').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Bell className="size-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white text-2xl">Notification Center</CardTitle>
              <p className="text-slate-600 dark:text-slate-400">Manage match notifications and alerts</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            All ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="live" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Activity className="size-4 mr-2" />
            Live ({liveCount})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Calendar className="size-4 mr-2" />
            Upcoming ({upcomingCount})
          </TabsTrigger>
          <TabsTrigger value="finished" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <CheckCircle className="size-4 mr-2" />
            Finished ({finishedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderMatchTable(getFilteredMatches('all'))}
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          {renderMatchTable(getFilteredMatches('live'))}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {renderMatchTable(getFilteredMatches('upcoming'))}
        </TabsContent>

        <TabsContent value="finished" className="mt-6">
          {renderMatchTable(getFilteredMatches('finished'))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
