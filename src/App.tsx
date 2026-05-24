import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import { TopBar } from './components/TopBar';
import RankingsView from './components/views/RankingsView';
import { MatchesView } from './components/views/MatchesView';
import { TournamentsView } from './components/views/TournamentsView';
import { VenuesView } from './components/views/VenuesView';
import { VenueFormView } from './components/views/VenueFormView';
import { PremiumsView } from './components/views/PremiumsView';
import { SeriesView } from './components/views/SeriesView';
import { SeriesCreateView } from './components/views/SeriesCreateView';
import { SeriesDetailView } from './components/views/SeriesDetailView';
import { TeamsView } from './components/views/TeamsView';
import { TeamFormView } from './components/views/TeamFormView';
import { PlayersView } from './components/views/PlayersView';
import { PlayerDetailView } from './components/views/PlayerDetailView';
import { UmpiresView } from './components/views/UmpiresView';
import { UmpireFormView } from './components/views/UmpireFormView';
import NotificationsView from './components/views/NotificationsView';
import NotificationDetailView from './components/views/NotificationDetailView';
import { LiveMatchView } from './components/views/LiveMatchView';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Helper to determine current view based on path
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.startsWith('/matches') || path.startsWith('/match')) return 'matches';
    if (path.startsWith('/tournaments')) return 'tournaments';
    if (path.startsWith('/venues')) return 'venues';
    if (path.startsWith('/premiums')) return 'premiums';
    if (path.startsWith('/series')) return 'series';
    if (path.startsWith('/teams')) return 'teams';
    if (path.startsWith('/players')) return 'players';
    if (path.startsWith('/umpires')) return 'umpires';
    if (path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/rankings')) return 'rankings';
    return 'matches';
  };

  // Check if we're on a full screen page (match pages)
  const isFullScreenPage = location.pathname.startsWith('/match/');

  const currentView = getCurrentView();

  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors />
      {isFullScreenPage ? (
        // Full screen layout for match pages
        <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          <Routes>
            <Route path="/match/live/:id" element={<LiveMatchView />} />
          </Routes>
        </div>
      ) : (
        // Normal layout with sidebar and topbar
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          <Sidebar
            currentView={currentView}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar
              currentView={currentView}
              onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-6 transition-colors">
              <Routes>
                <Route path="/" element={<Navigate to="/matches" replace />} />
                <Route path="/matches" element={<MatchesView />} />
                <Route path="/rankings" element={<RankingsView />} />
                <Route path="/tournaments" element={<TournamentsView />} />
                <Route path="/venues" element={<VenuesView />} />
                <Route path="/venues/add" element={<VenueFormView />} />
                <Route path="/venues/edit/:id" element={<VenueFormView />} />
                <Route path="/premiums" element={<PremiumsView />} />
                <Route path="/series" element={<SeriesView />} />
                <Route path="/series/new" element={<SeriesCreateView />} />
                <Route path="/series/:seriesId" element={<SeriesDetailView />} />
                <Route path="/series/:seriesId/:tab" element={<SeriesDetailView />} />
                <Route path="/series/:seriesId/:tab/:subId" element={<SeriesDetailView />} />
                <Route path="/teams" element={<TeamsView />} />
                <Route path="/teams/new" element={<TeamFormView />} />
                <Route path="/teams/edit/:id" element={<TeamFormView />} />
                <Route path="/players" element={<PlayersView />} />
                <Route path="/players/new" element={<PlayerDetailView />} />
                <Route path="/players/:playerId" element={<PlayerDetailView />} />
                <Route path="/umpires" element={<UmpiresView />} />
                <Route path="/umpires/new" element={<UmpireFormView />} />
                <Route path="/umpires/edit/:id" element={<UmpireFormView />} />
                <Route path="/notifications" element={<NotificationsView />} />
                <Route path="/notifications/match/:matchId" element={<NotificationDetailView />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}
