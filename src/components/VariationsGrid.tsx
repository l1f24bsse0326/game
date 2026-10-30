import React from 'react';
import { Maximize2, Download, Wand2, Eye, Sparkles } from 'lucide-react';
import { WallpaperVariation, AspectRatio } from '../types';
import { ASPECT_RATIOS } from '../utils/wallpaper';

interface VariationsGridProps {
  variations: WallpaperVariation[];
  isLoading: boolean;
  aspectRatio: AspectRatio;
  onSelectVariation: (variation: WallpaperVariation) => void;
  onDownload: (variation: WallpaperVariation, e: React.MouseEvent) => void;
  onRemix: (variation: WallpaperVariation, e: React.MouseEvent) => void;
  notice?: string;
}

export const VariationsGrid: React.FC<VariationsGridProps> = ({
  variations,
  isLoading,
  aspectRatio,
  onSelectVariation,
  onDownload,
  onRemix,
  notice,
}) => {
  const ratioConfig = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['9:16'];
  const aspectClass = ratioConfig.css;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {notice && (
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Grid of 4 variations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className={`relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 ${aspectClass} shadow-xl flex flex-col justify-between p-4`}
              >
                {/* Shimmer sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />

                <div className="flex items-center justify-between z-10">
                  <div className="h-5 w-16 bg-zinc-800/80 rounded-full" />
                  <div className="h-5 w-5 bg-zinc-800/80 rounded-full" />
                </div>

                <div className="space-y-2 z-10 text-center">
                  <div className="w-8 h-8 rounded-full bg-zinc-800/90 mx-auto flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] font-medium text-zinc-400">Rendering #{i + 1}...</p>
                  <div className="h-1.5 w-3/4 mx-auto bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500/60 rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="z-10 text-[10px] text-zinc-500 text-center">9:16 Lock Screen Fit</div>
              </div>
            ))
          : variations.map((variation, index) => (
              <div
                key={variation.id}
                onClick={() => onSelectVariation(variation)}
                className={`group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 hover:border-indigo-500/60 ${aspectClass} shadow-xl transition-all duration-300 hover:shadow-indigo-500/20 hover:-translate-y-1 cursor-pointer flex flex-col justify-between`}
              >
                {/* Background Wallpaper Image */}
                <img
                  src={variation.url}
                  alt={`Wallpaper Variation ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Subtle top & bottom shadow gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                {/* Top Badge: Variation number & Aspect */}
                <div className="relative z-10 p-3 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-zinc-200 border border-white/10">
                    Variation {index + 1}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-black/50 text-[10px] font-medium text-zinc-400">
                    {ratioConfig.ratio}
                  </span>
                </div>

                {/* Center Hover Tap Indicator */}
                <div className="relative z-10 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-xs font-medium text-white border border-white/20">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tap to view full screen</span>
                </div>

                {/* Bottom Quick Actions Bar */}
                <div className="relative z-10 p-2.5 flex items-center justify-between gap-1.5 bg-black/40 backdrop-blur-md border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVariation(variation);
                    }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="View Full Screen"
                    aria-label={`View Variation ${index + 1} Full Screen`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => onRemix(variation, e)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-[11px] font-medium transition-colors cursor-pointer"
                      title="Remix with this image"
                      aria-label={`Remix Variation ${index + 1}`}
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Remix</span>
                    </button>

                    <button
                      onClick={(e) => onDownload(variation, e)}
                      className="p-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors cursor-pointer"
                      title="Download wallpaper"
                      aria-label={`Download Variation ${index + 1}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};
