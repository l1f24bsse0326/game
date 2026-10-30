import React from 'react';
import { X, Trash2, Clock, Sparkles } from 'lucide-react';
import { WallpaperBatch, WallpaperVariation } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  batches: WallpaperBatch[];
  onSelectBatch: (batch: WallpaperBatch) => void;
  onClearHistory: () => void;
  onSelectVariation: (v: WallpaperVariation) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  batches,
  onSelectBatch,
  onClearHistory,
  onSelectVariation,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-end p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-heading"
    >
      <div className="relative w-full sm:max-w-md h-[85vh] sm:h-[92vh] rounded-t-3xl sm:rounded-2xl glass-panel border border-zinc-700/80 p-5 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 id="history-heading" className="text-base font-bold text-white">
                Wallpaper History
              </h3>
              <p className="text-xs text-zinc-400">{batches.length} session batches saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close history"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Batches */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {batches.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
              <Sparkles className="w-8 h-8 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-400">No wallpapers generated yet</p>
              <p className="text-xs">Your generated 4-variation batches will appear here.</p>
            </div>
          ) : (
            batches.map((batch) => (
              <div
                key={batch.id}
                className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-zinc-200 line-clamp-1 italic">
                      "{batch.vibePrompt}"
                    </p>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(batch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {batch.aspectRatio} • {batch.size}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectBatch(batch);
                      onClose();
                    }}
                    className="px-2 py-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-medium transition-colors"
                  >
                    Restore
                  </button>
                </div>

                {/* 4 variations thumbnail strip */}
                <div className="grid grid-cols-4 gap-1.5">
                  {batch.variations.map((v, i) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        onSelectVariation(v);
                      }}
                      className="aspect-[9/16] rounded-md overflow-hidden bg-black border border-zinc-700/60 hover:border-indigo-400 transition-all relative group cursor-pointer"
                      title={`Open variation ${i + 1}`}
                      aria-label={`View variation ${i + 1} from batch`}
                    >
                      <img src={v.url} alt={`Var ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/60 text-[9px] text-zinc-300 font-mono">
                        #{i + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Clear button */}
        {batches.length > 0 && (
          <div className="pt-3 border-t border-zinc-800">
            <button
              onClick={onClearHistory}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
