import { useState } from 'react';
import { Bell, Search, Menu, User, Sun, Moon, Maximize, Minimize } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTheme } from '../contexts/ThemeContext';

interface TopBarProps {
  currentView: string;
  onMenuClick: () => void;
}

const viewTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  'live-scoring': 'Live Scoring',
  matches: 'Match Management',
  teams: 'Team Management',
  players: 'Player Management',
  tournaments: 'Tournaments',
  venues: 'Venues',
  news: 'News Management',
  videos: 'Video Management',
  analytics: 'Analytics',
  users: 'User Management',
  settings: 'Settings',
  premiums: 'Premium Management',
  series: 'Series Management',
  umpires: 'Umpire Management',
  notifications: 'Notification Center',
};

export function TopBar({ currentView, onMenuClick }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onMenuClick}
          className="lg:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <Menu className="size-5" />
        </Button>
        
        <div>
          <h2 className="text-lg text-slate-900 dark:text-white">{viewTitles[currentView] || 'Dashboard'}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 dark:text-slate-500" />
          <Input 
            placeholder="Search matches, players, teams..."
            className="pl-10 w-80 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleThemeToggle}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>

        {/* Fullscreen Toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleFullscreen}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <Bell className="size-5" />
          <Badge className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
            3
          </Badge>
        </Button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-slate-900 dark:text-white">Admin User</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Super Admin</p>
          </div>
          <div className="size-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="size-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
