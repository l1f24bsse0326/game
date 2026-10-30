import React, { useState } from 'react';
import { X, Wand2, Sparkles, ArrowRight } from 'lucide-react';
import { WallpaperVariation } from '../types';
import { REMIX_SUGGESTIONS } from '../data/presets';

interface RemixModalProps {
  variation: WallpaperVariation | null;
  isOpen: boolean;
  onClose: () => void;
  onStartRemix: (variation: WallpaperVariation, remixInstruction: string) => void;
  isLoading: boolean;
}

export const RemixModal: React.FC<RemixModalProps> = ({
  variation,
  isOpen,
  onClose,
  onStartRemix,
  isLoading,
}) => {
  const [remixInstruction, setRemixInstruction] = useState('');

  if (!isOpen || !variation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartRemix(variation, remixInstruction);
  };

  const handlePickSuggestion = (suggestion: string) => {
    setRemixInstruction(suggestion);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remix-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl glass-panel border border-purple-500/30 p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="remix-title" className="text-sm sm:text-base font-bold text-white">
                Remix Wallpaper Batch
              </h3>
              <p className="text-[11px] text-zinc-400">
                Use this image as reference to generate 4 new variations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            aria-label="Close remix dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reference Image Preview & Details */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
          <div className="w-14 h-24 rounded-lg overflow-hidden bg-black border border-purple-500/40 flex-shrink-0 shadow-md">
            <img
              src={variation.url}
              alt="Reference source"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1 overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Reference Anchor Image
            </span>
            <p className="text-xs text-zinc-300 font-medium line-clamp-2 italic">
              "{variation.prompt}"
            </p>
            <p className="text-[11px] text-zinc-500">
              The AI will preserve the aesthetic geometry and composition while applying your new changes.
            </p>
          </div>
        </div>

        {/* Remix Instruction Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="remix-text" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              How would you like to transform this vibe?
            </label>
            <textarea
              id="remix-text"
              value={remixInstruction}
              onChange={(e) => setRemixInstruction(e.target.value)}
              placeholder="e.g., 'Make it rainier with neon kanji billboards', 'Shift color to deep sunset violet', 'Simpler minimalist dark mode'..."
              rows={3}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Quick Ideas Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-400 font-medium">Quick Remix Ideas:</span>
            <div className="flex flex-wrap gap-1.5">
              {REMIX_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handlePickSuggestion(sug)}
                  className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-750 text-[11px] text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Remix...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Generate 4 Remix Variations</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
