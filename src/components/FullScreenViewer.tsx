import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Flashlight,
  Camera,
  Lock,
} from 'lucide-react';
import { WallpaperVariation, AspectRatio } from '../types';
import { generateWallpaperFilename } from '../utils/wallpaper';

interface FullScreenViewerProps {
  variation: WallpaperVariation | null;
  allVariations: WallpaperVariation[];
  onClose: () => void;
  onRemix: (variation: WallpaperVariation) => void;
  onDownload: (variation: WallpaperVariation) => void;
  onNavigate: (variation: WallpaperVariation) => void;
  aspectRatio: AspectRatio;
}

export const FullScreenViewer: React.FC<FullScreenViewerProps> = ({
  variation,
  allVariations,
  onClose,
  onRemix,
  onDownload,
  onNavigate,
  aspectRatio,
}) => {
  const [showLockScreenOverlay, setShowLockScreenOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:41');
  const [currentDate, setCurrentDate] = useState('Friday, October 30');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    // Sync simulated or live clock
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      setCurrentDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation (Esc to close, arrows to cycle variations)
  useEffect(() => {
    if (!variation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [variation, allVariations]);

  if (!variation) return null;

  const currentIndex = allVariations.findIndex((v) => v.id === variation.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allVariations.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onNavigate(allVariations[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(allVariations[currentIndex + 1]);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(variation.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Wallpaper full screen viewer"
    >
      {/* Top Floating Controls Bar */}
      <div className="w-full max-w-4xl px-4 py-3 flex items-center justify-between z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-zinc-800/90 text-xs font-semibold text-zinc-200 border border-zinc-700/60">
            Variation {currentIndex + 1} of {allVariations.length}
          </span>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            {aspectRatio} • {variation.size}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Phone Lock Screen Simulation Toggle */}
          <button
            onClick={() => setShowLockScreenOverlay(!showLockScreenOverlay)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showLockScreenOverlay
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
            title="Toggle Lock Screen Clock & UI Overlay"
            aria-label="Toggle lock screen overlay"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock Screen Overlay</span>
            <span className="sm:hidden">Lock UI</span>
          </button>

          {/* Browser Fullscreen toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
            aria-label="Toggle browser fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close viewer */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
            title="Close Full Screen Viewer (Esc)"
            aria-label="Close full screen viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Wallpaper Preview Frame */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* Navigation Arrow Left */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 cursor-pointer"
            aria-label="Previous variation"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-6 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 cursor-pointer"
            aria-label="Next variation"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Wallpaper Container with 9:16 Phone Aspect Ratio Frame */}
        <div className="relative h-full max-h-[82vh] aspect-[9/16] rounded-[2.5rem] overflow-hidden border-[6px] border-zinc-900 shadow-2xl shadow-black ring-1 ring-white/10 flex flex-col justify-between select-none">
          {/* Wallpaper Image itself */}
          <img
            src={variation.url}
            alt={variation.prompt}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Realistic Phone Lock Screen HUD Overlay */}
          {showLockScreenOverlay && (
            <div className="relative z-20 w-full h-full flex flex-col justify-between p-6 pointer-events-none">
              {/* Dynamic Island / Notch */}
              <div className="w-24 h-5 bg-black rounded-full mx-auto -mt-3 mb-2 flex items-center justify-end px-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
              </div>

              {/* Lock Icon, Date and Large Clock */}
              <div className="flex flex-col items-center text-center mt-4 space-y-1">
                <div className="flex items-center gap-1 text-white/80 text-[11px] font-medium tracking-wide">
                  <Lock className="w-3 h-3" />
                  <span>Swipe up to open</span>
                </div>
                <div className="text-white/90 text-sm font-semibold tracking-wide drop-shadow-md">
                  {currentDate}
                </div>
                <div className="text-white text-6xl sm:text-7xl font-extrabold tracking-tighter drop-shadow-lg font-mono">
                  {currentTime}
                </div>
              </div>

              {/* Bottom Phone Action Buttons & Home Bar */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/90 shadow-lg">
                    <Flashlight className="w-5 h-5" />
                  </div>
                  <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/90 shadow-lg">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>

                {/* Home Indicator Bar */}
                <div className="w-32 h-1 bg-white/70 rounded-full mx-auto" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Footer with Download and Remix */}
      <div className="w-full max-w-xl px-4 py-3 z-30 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Prompt summary */}
        <div className="flex items-center gap-2 max-w-full sm:max-w-xs text-xs text-zinc-400">
          <p className="line-clamp-1 italic truncate">{variation.prompt}</p>
          <button
            onClick={handleCopyPrompt}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors flex-shrink-0"
            title="Copy prompt"
            aria-label="Copy prompt text"
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* The Two Main Action Buttons: Remix and Download */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* REMIX Button */}
          <button
            onClick={() => onRemix(variation)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer"
            aria-label="Remix this wallpaper"
          >
            <Wand2 className="w-4 h-4 text-purple-200" />
            <span>Remix Wallpaper</span>
          </button>

          {/* DOWNLOAD Button */}
          <button
            onClick={() => {
              onDownload(variation);
              setDownloadSuccess(true);
              setTimeout(() => setDownloadSuccess(false), 2000);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all cursor-pointer"
            aria-label="Download high resolution wallpaper"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved to Photos</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download HD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
