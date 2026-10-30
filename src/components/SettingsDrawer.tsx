import React from 'react';
import { X, Check, SlidersHorizontal, Ratio, Cpu, Sparkles } from 'lucide-react';
import { GenerationSettings, AspectRatio, ImageSize, ImageModel } from '../types';
import { ASPECT_RATIOS, IMAGE_SIZES } from '../utils/wallpaper';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GenerationSettings;
  onUpdateSettings: (newSettings: Partial<GenerationSettings>) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const ratios = Object.keys(ASPECT_RATIOS) as AspectRatio[];
  const sizes = Object.keys(IMAGE_SIZES) as ImageSize[];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
    >
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl glass-panel border border-zinc-700/80 p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 id="settings-heading" className="text-base font-bold text-white">
                Studio Generation Settings
              </h3>
              <p className="text-xs text-zinc-400">Configure aspect ratio, resolution and AI model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Aspect Ratio Selection (All 8 supported ratios) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Ratio className="w-3.5 h-3.5 text-indigo-400" />
              <span>Aspect Ratio</span>
            </label>
            <span className="text-[11px] text-indigo-400 font-semibold">
              Current: {settings.aspectRatio}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ratios.map((ratio) => {
              const info = ASPECT_RATIOS[ratio];
              const isSelected = settings.aspectRatio === ratio;
              const isPhone = ratio === '9:16';

              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => onUpdateSettings({ aspectRatio: ratio })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-400 ring-1 ring-indigo-400/50 shadow-md shadow-indigo-500/10'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-white">{info.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
                    {isPhone ? '⭐ Phone (Default)' : info.desc.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Image Size / Resolution (1K, 2K, 4K) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Image Resolution</span>
            </label>
            <span className="text-[11px] text-purple-400 font-semibold">{settings.size}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {sizes.map((sz) => {
              const info = IMAGE_SIZES[sz];
              const isSelected = settings.size === sz;

              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onUpdateSettings({ size: sz })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-400 ring-1 ring-purple-400/50 shadow-md shadow-purple-500/10'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="text-sm font-extrabold text-white">{info.badge}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{info.label.split(' ')[1]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Model Selection (gemini-3-pro-image-preview vs gemini-nano-banana-2.1) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Model Selection</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ model: 'gemini-3-pro-image-preview' })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                settings.model === 'gemini-3-pro-image-preview'
                  ? 'bg-indigo-600/30 border-indigo-400 ring-1 ring-indigo-400/50'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">gemini-3-pro-image-preview</span>
                {settings.model === 'gemini-3-pro-image-preview' && (
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Studio-quality phone wallpapers with enhanced atmospheric fidelity (Recommended)
              </p>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ model: 'gemini-nano-banana-2.1' })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                settings.model === 'gemini-nano-banana-2.1'
                  ? 'bg-indigo-600/30 border-indigo-400 ring-1 ring-indigo-400/50'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">gemini-nano-banana-2.1</span>
                {settings.model === 'gemini-nano-banana-2.1' && (
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                High-speed generation with responsive variation synthesis
              </p>
            </button>
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
