import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VibeInput } from './components/VibeInput';
import { VariationsGrid } from './components/VariationsGrid';
import { FullScreenViewer } from './components/FullScreenViewer';
import { RemixModal } from './components/RemixModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { VibeGame3D } from './components/VibeGame3D';
import {
  WallpaperVariation,
  WallpaperBatch,
  GenerationSettings,
  AspectRatio,
  ImageSize,
  ImageModel,
} from './types';
import { generateWallpaperFilename } from './utils/wallpaper';

const DEFAULT_VIBE = 'rainy cyberpunk lo-fi';

export default function App() {
  const [vibe, setVibe] = useState(DEFAULT_VIBE);
  const [isLoading, setIsLoading] = useState(false);
  const [variations, setVariations] = useState<WallpaperVariation[]>([]);
  const [notice, setNotice] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentView, setCurrentView] = useState<'studio' | 'game'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('studio') === '1') {
        return 'studio';
      }
    }
    return 'game';
  });

  // Modals & Drawers state
  const [selectedVariation, setSelectedVariation] = useState<WallpaperVariation | null>(null);
  const [remixTarget, setRemixTarget] = useState<WallpaperVariation | null>(null);
  const [isRemixModalOpen, setIsRemixModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Active remix anchor (when user is generating a batch based on a reference)
  const [activeRemixReference, setActiveRemixReference] = useState<{ url: string; prompt: string } | null>(null);

  // Settings
  const [settings, setSettings] = useState<GenerationSettings>({
    model: 'gemini-3-pro-image-preview',
    aspectRatio: '9:16',
    size: '1K',
  });

  // History state
  const [batches, setBatches] = useState<WallpaperBatch[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vibepaper_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBatches(parsed);
          setVariations(parsed[0].variations || []);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save history to localStorage
  const saveBatchToHistory = (newBatch: WallpaperBatch) => {
    setBatches((prev) => {
      const updated = [newBatch, ...prev.filter((b) => b.id !== newBatch.id)].slice(0, 20);
      try {
        localStorage.setItem('vibepaper_history', JSON.stringify(updated));
      } catch {
        // quota limit
      }
      return updated;
    });
  };

  // Generate initial variations on mount if empty
  useEffect(() => {
    if (variations.length === 0) {
      triggerGeneration(DEFAULT_VIBE);
    }
  }, []);

  const triggerGeneration = async (
    targetVibe: string,
    refImage?: string,
    remixInstruction?: string
  ) => {
    setIsLoading(true);
    setErrorMessage('');
    setNotice('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibe: targetVibe,
          model: settings.model,
          aspectRatio: settings.aspectRatio,
          size: settings.size,
          count: 4,
          referenceImage: refImage,
          remixInstruction,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate wallpapers');
      }

      setVariations(data.variations || []);
      if (data.notice) {
        setNotice(data.notice);
      }

      // Save to batch history
      const newBatch: WallpaperBatch = {
        id: data.batchId || `batch-${Date.now()}`,
        vibePrompt: targetVibe,
        timestamp: Date.now(),
        model: settings.model,
        aspectRatio: settings.aspectRatio,
        size: settings.size,
        referenceImage: refImage,
        variations: data.variations || [],
      };
      saveBatchToHistory(newBatch);
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err.message || 'Something went wrong while generating wallpapers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!vibe.trim()) return;
    triggerGeneration(vibe.trim(), activeRemixReference?.url);
  };

  // Open Remix modal when user taps "Remix" button
  const handleOpenRemix = (variation: WallpaperVariation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRemixTarget(variation);
    setIsRemixModalOpen(true);
  };

  // Trigger remix generation
  const handleStartRemix = (variation: WallpaperVariation, remixInstruction: string) => {
    setIsRemixModalOpen(false);
    setActiveRemixReference({ url: variation.url, prompt: variation.prompt });
    const remixVibe = remixInstruction ? `${vibe} (Remix: ${remixInstruction})` : vibe;
    setVibe(remixVibe);
    triggerGeneration(remixVibe, variation.url, remixInstruction);
  };

  // Download wallpaper image
  const handleDownload = (variation: WallpaperVariation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const filename = generateWallpaperFilename(
        vibe || 'wallpaper',
        variation.variationIndex || 0,
        settings.aspectRatio.replace(':', '-')
      );

      // If data URL, trigger direct download
      const a = document.createElement('a');
      a.href = variation.url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<GenerationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  if (currentView === 'game') {
    return (
      <VibeGame3D
        onBackToStudio={() => setCurrentView('studio')}
        onSendToStudio={(vibePrompt) => {
          setVibe(vibePrompt);
          setCurrentView('studio');
          triggerGeneration(vibePrompt);
        }}
        activeWallpaperUrl={variations[0]?.url}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Mobile-first Header */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={batches.length}
        currentView={currentView}
        onToggleView={(view) => setCurrentView(view)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 sm:py-7 flex flex-col space-y-6">
          {/* Intro Tagline */}
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Describe your vibe.{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Get 4 phone wallpapers.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Generate 9:16 lock screen ready art, test live phone clocks, download in HD, or remix any image.
            </p>
          </div>

          {/* Vibe Input Card & Style Pills */}
          <VibeInput
            vibe={vibe}
            setVibe={setVibe}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            settings={settings}
            remixSource={activeRemixReference}
            onCancelRemix={() => setActiveRemixReference(null)}
          />

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs text-center max-w-lg mx-auto">
              {errorMessage}
            </div>
          )}

          {/* 4 Variations Grid */}
          <section aria-label="Generated Wallpapers">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  4 Variations
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {settings.aspectRatio}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500">Tap any wallpaper to preview full screen</span>
            </div>

            <VariationsGrid
              variations={variations}
              isLoading={isLoading}
              aspectRatio={settings.aspectRatio}
              onSelectVariation={(v) => setSelectedVariation(v)}
              onDownload={handleDownload}
              onRemix={handleOpenRemix}
              notice={notice}
            />
          </section>
        </main>

      {/* Footer */}
      <footer className="border-t border-zinc-850 py-4 px-4 text-center text-[11px] text-zinc-500">
        <p>VibePaper Studio • Built with Gemini Image Preview • 9:16 Mobile Optimized</p>
      </footer>

      {/* Full Screen Wallpaper Viewer Modal */}
      <FullScreenViewer
        variation={selectedVariation}
        allVariations={variations}
        onClose={() => setSelectedVariation(null)}
        onRemix={(v) => {
          setSelectedVariation(null);
          handleOpenRemix(v);
        }}
        onDownload={handleDownload}
        onNavigate={(v) => setSelectedVariation(v)}
        aspectRatio={settings.aspectRatio}
      />

      {/* Remix Configuration Modal */}
      <RemixModal
        variation={remixTarget}
        isOpen={isRemixModalOpen}
        onClose={() => setIsRemixModalOpen(false)}
        onStartRemix={handleStartRemix}
        isLoading={isLoading}
      />

      {/* Settings Drawer (Aspect ratio, Resolution, Model) */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        batches={batches}
        onSelectBatch={(batch) => {
          setVariations(batch.variations);
          setVibe(batch.vibePrompt);
          setSettings((prev) => ({
            ...prev,
            aspectRatio: batch.aspectRatio,
            size: batch.size,
            model: batch.model,
          }));
        }}
        onClearHistory={() => {
          setBatches([]);
          localStorage.removeItem('vibepaper_history');
        }}
        onSelectVariation={(v) => {
          setIsHistoryOpen(false);
          setSelectedVariation(v);
        }}
      />
    </div>
  );
}
