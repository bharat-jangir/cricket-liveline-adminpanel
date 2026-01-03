import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  ChevronLeft,
  Users,
  Calendar,
  Trophy,
  MapPin,
  Sparkles
} from 'lucide-react';
import { SeriesTeamsTab } from './SeriesTeamsTab';
import { Card } from '../ui/card';
import { SeriesFixtureTab } from './seriesFixtureTab';
import SeriesPointsTab from './seriesPointsTab';
import SeriesVenuesTab from './SeriesVenuesTab';
import SeriesInfoTab from './SeriesInfoTab';
import SeriesFantasyTab from './SeriesFantasyTab';

export function SeriesDetailView() {
  const { seriesId, tab } = useParams();
  const navigate = useNavigate();

  const activeTab = tab || 'teams';

  const handleTabChange = (value: string) => {
    navigate(`/series/${seriesId}/${value}`);
  };

  // Series name would typically be fetched based on ID
  const seriesName = "Indian Premier League 2024";

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex-1 flex flex-col overflow-hidden series-tabs-container"
    >
      <style>{`
        .series-tabs-container button[data-state="active"] {
          background-color: #2563eb !important;
          color: white !important;
        }
      `}</style>
      {/* HEADER ROW */}
      <div className="flex items-end justify-between pb-2 border-b border-slate-200 dark:border-slate-700">

        {/* LEFT SIDE: Back + Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/series')}
            className="hover:bg-slate-200 dark:hover:bg-slate-800 size-8"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Series</span>
              <span>/</span>
              <span>{seriesId}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {seriesName}
            </h1>
          </div>
        </div>

        {/* RIGHT SIDE: TABS LIST (must be inside <Tabs>) */}
        <TabsList className="bg-transparent border-none p-0 flex gap-2">
          {['teams', 'fixtures', 'points', 'venues', 'fantasy', 'info'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="px-4 py-2 rounded-lg text-slate-500 dark:text-slate-400 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white hover:text-blue-600 dark:hover:text-blue-400 data-[state=active]:hover:!text-white transition-colors"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

      </div>

      {/* TAB CONTENT */}
      <TabsContent value="teams" className="flex-1 overflow-hidden">
        <SeriesTeamsTab />
      </TabsContent>

      <TabsContent value="fixtures">
        <SeriesFixtureTab />
      </TabsContent>

      <TabsContent value="points" className="flex-1 overflow-hidden">
        <SeriesPointsTab seriesName={seriesName} />
      </TabsContent>

      <TabsContent value="venues">
        <SeriesVenuesTab />
      </TabsContent>

      <TabsContent value="info">
        <SeriesInfoTab />
      </TabsContent>

      <TabsContent value="fantasy">
        <SeriesFantasyTab />
      </TabsContent>
    </Tabs>


  );
}
