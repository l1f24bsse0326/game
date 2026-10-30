import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, X, Shuffle, Wand2, Plus, Check, SlidersHorizontal, Trash2, Tag, Bookmark } from 'lucide-react';
import { VIBE_PRESETS, STYLE_MODIFIERS, getRandomPopularAesthetic } from '../data/presets';
import { GenerationSettings } from '../types';
import {
  StyleModifierPreset,
  DEFAULT_AESTHETIC_PRESETS,
  isPresetActive,
  togglePresetModifiers,
  addCustomPreset,
  removeCustomPreset,
  loadCustomPresetsFromStorage,
} from '../utils/stylePresets';

const STORAGE_KEY = 'vibepaper_custom_aesthetic_presets';

interface VibeInputProps {
  vibe: string;
  setVibe: (v: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  settings: GenerationSettings;
  remixSource?: { url: string; prompt: string } | null;
  onCancelRemix?: () => void;
}

export const VibeInput: React.FC<VibeInputProps> = ({
  vibe,
  setVibe,
  onGenerate,
  isLoading,
  settings,
  remixSource,
  onCancelRemix,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  // Custom presets state persisted in localStorage
  const [customPresets, setCustomPresets] = useState<StyleModifierPreset[]>(() => {
    if (typeof window !== 'undefined') {
      return loadCustomPresetsFromStorage(localStorage.getItem(STORAGE_KEY));
    }
    return [];
  });

  // Modal state for saving a new vibe preset
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [customModifierInput, setCustomModifierInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync custom presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
    } catch {
      // Ignore localStorage write failures
    }
  }, [customPresets]);

  // When opening the save modal, pre-select any modifiers currently present in the prompt
  const handleOpenSaveModal = () => {
    const presentModifiers = STYLE_MODIFIERS.filter((mod) =>
      vibe.toLowerCase().includes(mod.toLowerCase())
    );
    setSelectedModifiers(presentModifiers.length > 0 ? presentModifiers : [STYLE_MODIFIERS[0], STYLE_MODIFIERS[1]]);
    setNewPresetName('');
    setCustomModifierInput('');
    setIsSaveModalOpen(true);
  };

  const handleShuffleVibe = () => {
    setIsShuffling(true);
    const randomAesthetic = getRandomPopularAesthetic(vibe);
    setVibe(randomAesthetic);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setTimeout(() => setIsShuffling(false), 350);
  };

  const handleSelectPreset = (presetVibe: string) => {
    setVibe(presetVibe);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleToggleAestheticMode = (preset: StyleModifierPreset) => {
    const updated = togglePresetModifiers(vibe, preset.modifiers);
    setVibe(updated);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAddModifier = (modifier: string) => {
    const clean = vibe.trim();
    if (!clean) {
      setVibe(modifier);
    } else if (!clean.toLowerCase().includes(modifier.toLowerCase())) {
      setVibe(`${clean}, ${modifier.toLowerCase()}`);
    }
  };

  const handleToggleModifierInModal = (mod: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleAddCustomModifierToModal = () => {
    const trimmed = customModifierInput.trim();
    if (trimmed && !selectedModifiers.includes(trimmed)) {
      setSelectedModifiers((prev) => [...prev, trimmed]);
      setCustomModifierInput('');
    }
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || selectedModifiers.length === 0) return;

    const newPreset: StyleModifierPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      icon: '✨',
      modifiers: selectedModifiers,
      isCustom: true,
    };

    setCustomPresets((prev) => addCustomPreset(prev, newPreset));

    // Also activate this newly saved preset in the vibe prompt
    const updatedVibe = togglePresetModifiers(vibe, newPreset.modifiers, true);
    setVibe(updatedVibe);

    setIsSaveModalOpen(false);
    setSaveSuccessMsg(`Saved preset "${newPreset.name}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleDeleteCustomPreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCustomPresets((prev) => removeCustomPreset(prev, id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (vibe.trim() && !isLoading) {
        onGenerate();
      }
    }
  };

  // Combined presets: default built-ins + user saved presets
  const allPresets = [...DEFAULT_AESTHETIC_PRESETS, ...customPresets];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3.5">
      {/* Active Remix Banner if user is remixing an image */}
      {remixSource && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-16 rounded-md overflow-hidden bg-black border border-purple-400/50 flex-shrink-0">
              <img src={remixSource.url} alt="Remix reference" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
                  Remixing Reference Wallpaper
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80 line-clamp-1 max-w-[240px] sm:max-w-md">
                Generating 4 new variations inspired by this visual composition
              </p>
            </div>
          </div>
          {onCancelRemix && (
            <button
              onClick={onCancelRemix}
              className="p-1.5 rounded-lg hover:bg-purple-800/40 text-purple-300 transition-colors cursor-pointer"
              title="Clear remix reference"
              aria-label="Cancel remix reference"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative rounded-2xl glass-panel p-3 border border-zinc-700/60 shadow-xl focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        <div className="flex items-start gap-2">
          <textarea
            ref={inputRef}
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              remixSource
                ? 'Describe what you want to change or keep from the reference (e.g., make it rainier, switch to golden hour, add neon signs)...'
                : 'Describe your current desired vibe (e.g., "rainy cyberpunk lo-fi", "emerald pine mist", "abstract obsidian gold")...'
            }
            rows={2}
            className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
            disabled={isLoading}
          />
          {vibe && (
            <button
              onClick={() => setVibe('')}
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Clear vibe description"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom bar of the input card */}
        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-zinc-400 bg-zinc-900/90 px-2 py-1 rounded-md border border-zinc-800">
              {settings.aspectRatio} • {settings.size}
            </span>
            {saveSuccessMsg && (
              <span className="text-[11px] text-emerald-400 font-medium animate-fade-in flex items-center gap-1">
                <Check className="w-3 h-3" /> {saveSuccessMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Shuffle Vibe Button */}
            <button
              type="button"
              onClick={handleShuffleVibe}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-750 text-zinc-200 hover:text-white text-xs sm:text-sm font-semibold border border-zinc-700/80 transition-all active:scale-[0.98] cursor-pointer shadow-sm hover:border-indigo-500/50"
              title="Insert a random popular aesthetic description"
              aria-label="Shuffle Vibe"
            >
              <Shuffle className={`w-3.5 h-3.5 text-indigo-400 transition-transform ${isShuffling ? 'rotate-180 duration-300' : ''}`} />
              <span>Shuffle Vibe</span>
            </button>

            {/* Generate Button */}
            <button
              type="button"
              onClick={onGenerate}
              disabled={!vibe.trim() || isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-lg ${
                !vibe.trim() || isLoading
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/30'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-95 shadow-indigo-500/25 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Crafting 4 Wallpapers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate 4 Variations</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Aesthetic Modes & Vibe Presets Section */}
      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-2.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-zinc-200">Aesthetic Modes</span>
            <span className="text-[10px] text-zinc-500 hidden sm:inline">(Toggle modifier bundles)</span>
          </div>

          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 transition-all cursor-pointer"
            title="Create and save a custom Vibe Preset with your chosen stylistic modifiers"
          >
            <Plus className="w-3 h-3" />
            <span>Save Preset</span>
          </button>
        </div>

        {/* Toggleable aesthetic modes row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
          {allPresets.map((preset) => {
            const active = isPresetActive(vibe, preset.modifiers);
            return (
              <div key={preset.id} className="relative group flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleAestheticMode(preset)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer select-none ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-500/30 font-semibold'
                      : 'bg-zinc-850/80 hover:bg-zinc-750 border-zinc-700/60 hover:border-zinc-600 text-zinc-300'
                  }`}
                  title={`Includes: ${preset.modifiers.join(', ')}`}
                >
                  <span className="text-xs">{preset.icon || '✨'}</span>
                  <span>{preset.name}</span>
                  {active && (
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] ml-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                  {preset.isCustom && (
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                      User
                    </span>
                  )}
                </button>

                {/* Delete button for user custom presets */}
                {preset.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCustomPreset(e, preset.id)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white border border-zinc-600 flex items-center justify-center text-[10px] shadow transition-colors cursor-pointer"
                    title={`Delete custom preset "${preset.name}"`}
                    aria-label={`Delete custom preset ${preset.name}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Inspiration Vibe Prompts (Horizontal scrolling row) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium px-1">
          <span>Inspiration Themes</span>
          <span className="text-[10px] text-zinc-500">Tap to set base vibe</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {VIBE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.vibe)}
              disabled={isLoading}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                vibe === preset.vibe
                  ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                  : 'bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Style Modifiers */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
        <span className="text-[10px] uppercase font-bold text-zinc-500 flex-shrink-0 mr-1">Tweak:</span>
        {STYLE_MODIFIERS.map((mod) => (
          <button
            key={mod}
            onClick={() => handleAddModifier(mod)}
            disabled={isLoading}
            className={`flex-shrink-0 px-2 py-1 rounded-md text-[11px] border transition-colors cursor-pointer ${
              vibe.toLowerCase().includes(mod.toLowerCase())
                ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-200'
                : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800/70'
            }`}
          >
            + {mod}
          </button>
        ))}
      </div>

      {/* Modal: Save Vibe Preset */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700/80 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Save Vibe Preset</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Bundle your favorite stylistic modifiers together into a custom preset that you can toggle on and off anytime.
            </p>

            <form onSubmit={handleSavePreset} className="space-y-4">
              {/* Preset Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Preset Mode Name
                </label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Cyber Dream, Dark Film, Pastel Ethereal"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              {/* Select Modifiers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-300">
                    Select Stylistic Modifiers
                  </label>
                  <span className="text-[11px] text-indigo-400 font-semibold">
                    {selectedModifiers.length} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                  {STYLE_MODIFIERS.map((mod) => {
                    const isSelected = selectedModifiers.includes(mod);
                    return (
                      <button
                        type="button"
                        key={mod}
                        onClick={() => handleToggleModifierInModal(mod)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3 text-indigo-400" /> : <Tag className="w-3 h-3 text-zinc-600" />}
                        <span>{mod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add optional custom modifier */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Or add a custom modifier tag
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customModifierInput}
                    onChange={(e) => setCustomModifierInput(e.target.value)}
                    placeholder="e.g. 8k Unreal Engine 5 render"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomModifierToModal();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomModifierToModal}
                    disabled={!customModifierInput.trim()}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-medium text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPresetName.trim() || selectedModifiers.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer transition-all"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save & Apply Preset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
