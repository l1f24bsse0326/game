import { AspectRatio, ImageSize, ImageModel, WallpaperVariation, WallpaperBatch } from './utils/wallpaper';
import { StyleModifierPreset } from './utils/stylePresets';

export type { AspectRatio, ImageSize, ImageModel, WallpaperVariation, WallpaperBatch, StyleModifierPreset };

export interface VibePreset {
  id: string;
  name: string;
  vibe: string;
  category: 'cyberpunk' | 'lofi' | 'nature' | 'abstract' | 'anime' | 'minimal';
  icon: string;
  color: string;
}

export interface GenerationSettings {
  model: ImageModel;
  aspectRatio: AspectRatio;
  size: ImageSize;
}
