export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
export type ImageModel = 'gemini-3-pro-image-preview' | 'gemini-nano-banana-2.1';

export interface WallpaperVariation {
  id: string;
  url: string;
  prompt: string;
  variationIndex: number;
  aspectRatio: AspectRatio;
  size: ImageSize;
  createdAt: number;
  referenceImageId?: string;
}

export interface WallpaperBatch {
  id: string;
  vibePrompt: string;
  timestamp: number;
  model: ImageModel;
  aspectRatio: AspectRatio;
  size: ImageSize;
  referenceImage?: string;
  variations: WallpaperVariation[];
}

/**
 * Aspect ratio configurations with CSS aspect values, labels and descriptions.
 */
export const ASPECT_RATIOS: Record<AspectRatio, { label: string; ratio: string; desc: string; css: string }> = {
  '9:16': { label: '9:16', ratio: '9:16', desc: 'Standard Phone Wallpaper (Recommended)', css: 'aspect-[9/16]' },
  '1:1': { label: '1:1', ratio: '1:1', desc: 'Square Avatar / Smartwatch', css: 'aspect-square' },
  '2:3': { label: '2:3', ratio: '2:3', desc: 'Classic Portrait', css: 'aspect-[2/3]' },
  '3:2': { label: '3:2', ratio: '3:2', desc: 'Classic Landscape', css: 'aspect-[3/2]' },
  '3:4': { label: '3:4', ratio: '3:4', desc: 'Tall Portrait / Tablet', css: 'aspect-[3/4]' },
  '4:3': { label: '4:3', ratio: '4:3', desc: 'Standard Display', css: 'aspect-[4/3]' },
  '16:9': { label: '16:9', ratio: '16:9', desc: 'Widescreen Desktop', css: 'aspect-[16/9]' },
  '21:9': { label: '21:9', ratio: '21:9', desc: 'Ultra-wide Panoramic', css: 'aspect-[21/9]' },
};

export const IMAGE_SIZES: Record<ImageSize, { label: string; resolutionText: string; badge: string }> = {
  '1K': { label: '1K Standard', resolutionText: '1080 x 1920 (Fastest)', badge: '1K' },
  '2K': { label: '2K High Res', resolutionText: '1440 x 2560 (Retina crisp)', badge: '2K' },
  '4K': { label: '4K Ultra HD', resolutionText: '2160 x 3840 (Maximum fidelity)', badge: '4K' },
};

/**
 * Creates 4 distinct artistic variations for a wallpaper vibe.
 * Each variation targets a different cinematic/compositional mood while preserving the core aesthetic.
 */
export function buildVariationPrompts(basePrompt: string, count = 4): string[] {
  const cleanPrompt = basePrompt.trim();
  const variationsModifiers = [
    'Ultra-wide cinematic composition, deep atmospheric perspective, intricate moody highlights, edge-to-edge lock screen optimized framing, masterwork phone wallpaper, 8k wallpaper photography',
    'Intimate macro depth-of-field, subtle ambient bokeh, warm luminescence, clean negative space at the top third for phone lock screen clock, pristine phone wallpaper aesthetic',
    'Dynamic angled viewpoint, atmospheric weather particles, volumetric rays, high contrast dramatic lighting, tailored for vertical mobile display, rich color palette',
    'Minimalist ambient serenity, layered silhouettes, ethereal mist and soft gradients, perfectly balanced phone background composition, no cluttered artifacts',
  ];

  return Array.from({ length: count }, (_, i) => {
    const modifier = variationsModifiers[i % variationsModifiers.length];
    return `${cleanPrompt}. ${modifier}`;
  });
}

/**
 * Sanitizes vibe prompt to create a clean, friendly download filename.
 */
export function generateWallpaperFilename(vibe: string, index: number, ratio: string = '9-16'): string {
  const sanitized = vibe
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'wallpaper';
  return `vibepaper-${sanitized}-var${index + 1}-${ratio}.png`;
}

/**
 * Builds a remix prompt combining the original vibe with new user tweaks.
 */
export function buildRemixPrompt(originalVibe: string, remixInstruction?: string): string {
  if (!remixInstruction || !remixInstruction.trim()) {
    return `Remix and reimagining of the reference image vibe: ${originalVibe}. Create a fresh variation maintaining the exact same aesthetic, lighting mood, and color palette with novel composition.`;
  }
  return `Remix of the reference image (${originalVibe}) with user modification: ${remixInstruction.trim()}. Retain the visual coherence, textures, and style while applying the new instructions seamlessly.`;
}

/**
 * Calculates pixel dimensions for UI display and mock representations.
 */
export function getAspectDimensions(aspectRatio: AspectRatio, size: ImageSize = '1K'): { width: number; height: number } {
  const scale = size === '4K' ? 2 : size === '2K' ? 1.4 : 1;
  const baseDim: Record<AspectRatio, { w: number; h: number }> = {
    '9:16': { w: 1080, h: 1920 },
    '1:1': { w: 1080, h: 1080 },
    '2:3': { w: 1080, h: 1620 },
    '3:2': { w: 1620, h: 1080 },
    '3:4': { w: 1080, h: 1440 },
    '4:3': { w: 1440, h: 1080 },
    '16:9': { w: 1920, h: 1080 },
    '21:9': { w: 2520, h: 1080 },
  };

  const dim = baseDim[aspectRatio] || baseDim['9:16'];
  return {
    width: Math.round(dim.w * scale),
    height: Math.round(dim.h * scale),
  };
}
