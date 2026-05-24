import {
  LayoutDashboard,
  MapPin,
  Layers,
  Users,
  Bell,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

// Import Flaticons
import StarIcon from '../assets/flaticons/star.png';
import MatchIcon from '../assets/flaticons/cricket-match-stumps.png';
import PlayerIcon from '../assets/flaticons/cricket-halmet-player.png';
import UmpireIcon from '../assets/flaticons/umpire.png';
import SeriesIcon from '../assets/flaticons/series-connect-people.png';

interface SidebarProps {
  currentView: string;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ currentView, collapsed, setCollapsed }: SidebarProps) {
  const navigate = useNavigate();

  const navSections = [
    {
      title: 'Main',
      items: [
        { id: 'premiums', label: 'Premiums', icon: StarIcon, path: '/premiums', isImage: true },
        { id: 'matches', label: 'Matches', icon: MatchIcon, path: '/matches', isImage: true },
        { id: 'players', label: 'Players', icon: PlayerIcon, path: '/players', isImage: true },
        { id: 'series', label: 'Series', icon: SeriesIcon, path: '/series', isImage: true },
        { id: 'teams', label: 'Teams', icon: Users, path: '/teams', isImage: false },
        { id: 'rankings', label: 'Rankings', icon: BarChart2, path: '/rankings', isImage: false },
        { id: 'umpires', label: 'Umpires', icon: UmpireIcon, path: '/umpires', isImage: true },
        { id: 'venues', label: 'Venues', icon: MapPin, path: '/venues', isImage: false },
        { id: 'notifications', label: 'Notification Center', icon: Bell, path: '/notifications', isImage: false },
      ]
    }
  ];

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 relative z-20",
        collapsed ? "w-20" : "w-60"
      )}
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center h-16">
        {!collapsed && (
          <div className="flex items-center gap-2 font-bold text-xl text-blue-500">
            <LayoutDashboard className="size-6" />
            <span>CricAdmin</span>
          </div>
        )}
        {collapsed && (
          <div className="text-blue-500">
            <LayoutDashboard className="size-6" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!collapsed && (
              <div className="px-4 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            <div className="space-y-1 px-2">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 group",
                      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                      currentView === item.id
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.isImage ? (
                      <img
                        src={item.icon as string}
                        alt={item.label}
                        className={cn(
                          "size-5 transition-all object-contain",
                          currentView === item.id
                            ? "brightness-0 invert"
                            : "opacity-70 group-hover:opacity-100 dark:brightness-0 dark:invert dark:opacity-90 dark:group-hover:opacity-100"
                        )}
                      />
                    ) : (
                      // @ts-ignore
                      <IconComponent
                        className={cn(
                          "size-5 transition-colors",
                          currentView === item.id ? "text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                        )}
                      />
                    )}

                    {!collapsed && <span>{item.label}</span>}

                    {/* Active indicator for collapsed mode */}
                    {collapsed && currentView === item.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800">
        <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
          <button
            onClick={() => navigate('/settings')}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-all",
              collapsed ? "w-12 h-12 justify-center p-0" : "flex-1 px-3 py-2.5",
              currentView === 'settings'
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="size-5" />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-all",
              collapsed ? "w-12 h-12 p-0" : "p-2.5"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

    </div>
  );
}
