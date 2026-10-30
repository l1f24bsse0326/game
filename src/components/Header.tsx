import React from 'react';
import { SlidersHorizontal, History, Smartphone, Gamepad2, Sparkles } from 'lucide-react';
import { GenerationSettings } from '../types';

interface HeaderProps {
  settings: GenerationSettings;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  currentView: 'studio' | 'game';
  onToggleView: (view: 'studio' | 'game') => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onOpenHistory,
  historyCount,
  currentView,
  onToggleView,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-zinc-800/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">VibePaper</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentView === 'game' ? 'Arcade' : 'Studio'}
              </span>
            </div>
          </div>
        </div>

        {/* Studio / Game Toggle Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => onToggleView('studio')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'studio'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Wallpaper Studio Mode"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => onToggleView('game')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'game'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                : 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white'
            }`}
            aria-label="Play 3D Game"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>3D Game</span>
          </button>
        </div>

        {/* Settings & History Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Config Badges Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors text-xs font-medium cursor-pointer"
            aria-label="Open Wallpaper Settings"
            title="Configure aspect ratio, resolution and model"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline text-zinc-300">Format:</span>
            <span className="font-semibold text-indigo-300">{settings.aspectRatio}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 text-[11px]">{settings.size}</span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="relative p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer"
            aria-label={`Open Generation History (${historyCount} saved)`}
            title="Saved wallpapers history"
          >
            <History className="w-4 h-4 text-zinc-300" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-zinc-950">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
