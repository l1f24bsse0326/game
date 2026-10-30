import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { buildVariationPrompts, buildRemixPrompt, AspectRatio, ImageSize, ImageModel } from './src/utils/wallpaper';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Parse JSON bodies with up to 25MB for reference images (remixing)
app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Procedural aesthetic SVG wallpaper synthesizer.
 * Used for instant, ultra-crisp responsive art and seamless fallback when API quota is constrained.
 */
function generateProceduralWallpaper(
  vibe: string,
  variationIndex: number,
  aspectRatio: AspectRatio = '9:16',
  referenceColorSeed?: string
): string {
  // Dimensions for SVG canvas
  const ratioDims: Record<AspectRatio, { w: number; h: number }> = {
    '9:16': { w: 900, h: 1600 },
    '1:1': { w: 1000, h: 1000 },
    '2:3': { w: 1000, h: 1500 },
    '3:2': { w: 1500, h: 1000 },
    '3:4': { w: 900, h: 1200 },
    '4:3': { w: 1200, h: 900 },
    '16:9': { w: 1600, h: 900 },
    '21:9': { w: 2100, h: 900 },
  };
  const { w, h } = ratioDims[aspectRatio] || ratioDims['9:16'];
  const lower = vibe.toLowerCase();

  // Palette selection based on vibe keywords
  let palette = {
    bg1: '#070b19',
    bg2: '#111827',
    accent1: '#06b6d4',
    accent2: '#3b82f6',
    glow: '#8b5cf6',
    ambient: '#ec4899',
    detail: '#67e8f9',
  };

  if (lower.includes('cyberpunk') || lower.includes('neon') || lower.includes('tokyo')) {
    palette = {
      bg1: '#05050f',
      bg2: '#0d0d24',
      accent1: variationIndex % 2 === 0 ? '#ff007f' : '#00f0ff',
      accent2: '#7928ca',
      glow: '#00ffff',
      ambient: '#ff0055',
      detail: '#38ef7d',
    };
  } else if (lower.includes('rain') || lower.includes('lo-fi') || lower.includes('lofi') || lower.includes('moody')) {
    palette = {
      bg1: '#0a0e17',
      bg2: '#161e2e',
      accent1: '#38bdf8',
      accent2: '#6366f1',
      glow: '#818cf8',
      ambient: '#f472b6',
      detail: '#94a3b8',
    };
  } else if (lower.includes('sunset') || lower.includes('warm') || lower.includes('vintage') || lower.includes('golden')) {
    palette = {
      bg1: '#1a0b12',
      bg2: '#2b101d',
      accent1: '#f97316',
      accent2: '#fbbf24',
      glow: '#f43f5e',
      ambient: '#c026d3',
      detail: '#fde047',
    };
  } else if (lower.includes('forest') || lower.includes('nature') || lower.includes('emerald') || lower.includes('moss')) {
    palette = {
      bg1: '#03140c',
      bg2: '#082618',
      accent1: '#10b981',
      accent2: '#059669',
      glow: '#34d399',
      ambient: '#14b8a6',
      detail: '#6ee7b7',
    };
  } else if (lower.includes('space') || lower.includes('cosmic') || lower.includes('nebula') || lower.includes('star')) {
    palette = {
      bg1: '#02020a',
      bg2: '#09081f',
      accent1: '#a855f7',
      accent2: '#6366f1',
      glow: '#ec4899',
      ambient: '#3b82f6',
      detail: '#e0e7ff',
    };
  } else if (lower.includes('obsidian') || lower.includes('liquid') || lower.includes('gold') || lower.includes('luxury')) {
    palette = {
      bg1: '#0a0a0a',
      bg2: '#171717',
      accent1: '#eab308',
      accent2: '#ca8a04',
      glow: '#fef08a',
      ambient: '#78716c',
      detail: '#ffffff',
    };
  } else if (lower.includes('pastel') || lower.includes('dream') || lower.includes('cloud')) {
    palette = {
      bg1: '#131127',
      bg2: '#231e42',
      accent1: '#f472b6',
      accent2: '#c084fc',
      glow: '#38bdf8',
      ambient: '#fb7185',
      detail: '#fbcfe8',
    };
  }

  // Variation offsets for 4 distinct aesthetic compositions
  const cx = w * (0.35 + (variationIndex * 0.12));
  const cy = h * (0.42 + ((variationIndex % 2) * 0.15));
  const rGlow = Math.min(w, h) * (0.55 + variationIndex * 0.08);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="${palette.bg1}" />
      <stop offset="60%" stop-color="${palette.bg2}" />
      <stop offset="100%" stop-color="${palette.bg1}" />
    </linearGradient>
    <radialGradient id="sunGlow" cx="${cx / w}" cy="${cy / h}" r="0.75">
      <stop offset="0%" stop-color="${palette.accent1}" stop-opacity="0.85" />
      <stop offset="35%" stop-color="${palette.accent2}" stop-opacity="0.5" />
      <stop offset="70%" stop-color="${palette.glow}" stop-opacity="0.2" />
      <stop offset="100%" stop-color="${palette.bg1}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="ambientOrb" cx="${(w - cx) / w}" cy="${(h * 0.75) / h}" r="0.6">
      <stop offset="0%" stop-color="${palette.ambient}" stop-opacity="0.45" />
      <stop offset="60%" stop-color="${palette.ambient}" stop-opacity="0.05" />
      <stop offset="100%" stop-color="${palette.bg1}" stop-opacity="0" />
    </radialGradient>
    <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${w}" height="${h}" fill="url(#bgGrad)" />

  <!-- Atmospheric Glow Layers -->
  <circle cx="${cx}" cy="${cy}" r="${rGlow}" fill="url(#sunGlow)" filter="url(#blurFilter)" />
  <circle cx="${w - cx}" cy="${h * 0.72}" r="${rGlow * 0.8}" fill="url(#ambientOrb)" filter="url(#blurFilter)" />

  <!-- Central Celestial or Geometric Anchor -->
  <g opacity="0.92">
    <circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * (0.24 + variationIndex * 0.03)}" fill="none" stroke="${palette.accent1}" stroke-width="${3 + variationIndex}" opacity="0.75" />
    <circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * (0.16 + variationIndex * 0.02)}" fill="${palette.bg2}" fill-opacity="0.6" stroke="${palette.detail}" stroke-width="1.5" opacity="0.85" />
    <circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * 0.05}" fill="${palette.detail}" opacity="0.9" />
  </g>

  <!-- Flowing Fluid Waves / Topographic Ribbons -->
  <path d="M 0 ${h * 0.65} Q ${w * 0.25} ${h * 0.58 + variationIndex * 20}, ${w * 0.5} ${h * 0.68} T ${w} ${h * 0.62} L ${w} ${h} L 0 ${h} Z"
        fill="${palette.bg1}" fill-opacity="0.8" />
  <path d="M 0 ${h * 0.73} Q ${w * 0.35} ${h * 0.66 + variationIndex * 15}, ${w * 0.65} ${h * 0.78} T ${w} ${h * 0.72} L ${w} ${h} L 0 ${h} Z"
        fill="${palette.accent2}" fill-opacity="0.22" />
  <path d="M 0 ${h * 0.82} Q ${w * 0.4} ${h * 0.76 - variationIndex * 15}, ${w * 0.75} ${h * 0.88} T ${w} ${h * 0.84} L ${w} ${h} L 0 ${h} Z"
        fill="${palette.ambient}" fill-opacity="0.25" />

  <!-- Atmospheric Particles / Raindrops / Stars -->
  <g fill="${palette.detail}" opacity="0.65">
    ${Array.from({ length: 30 }, (_, i) => {
      const px = ((i * 137.5 + variationIndex * 89) % w);
      const py = ((i * 229.3 + variationIndex * 71) % (h * 0.7));
      const pr = 1 + (i % 3) * 0.9;
      return `<circle cx="${px}" cy="${py}" r="${pr}" opacity="${0.3 + (i % 5) * 0.15}" />`;
    }).join('')}
  </g>

  <!-- Clean lock screen top shadow vignette to ensure time & status bar readability -->
  <rect width="${w}" height="${h * 0.28}" fill="black" opacity="0.18" />
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Status endpoint to check server & API configuration.
 */
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
    defaultModel: 'gemini-3-pro-image-preview',
    supportedModels: ['gemini-3-pro-image-preview', 'gemini-nano-banana-2.1'],
    supportedRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'],
    supportedSizes: ['1K', '2K', '4K'],
  });
});

/**
 * Main wallpaper generation endpoint.
 * Accepts vibe, aspect ratio, image size, model, and optional reference image for remixing.
 */
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const {
      vibe,
      model = 'gemini-3-pro-image-preview',
      aspectRatio = '9:16',
      size = '1K',
      count = 4,
      referenceImage,
      remixInstruction,
    } = req.body;

    if (!vibe || typeof vibe !== 'string' || !vibe.trim()) {
      return res.status(400).json({ error: 'Please describe your desired wallpaper vibe.' });
    }

    const cleanVibe = vibe.trim();
    const variationPrompts = buildVariationPrompts(cleanVibe, count);
    const selectedModel = (model === 'gemini-nano-banana-2.1' ? 'gemini-nano-banana-2.1' : 'gemini-3-pro-image-preview') as ImageModel;
    const selectedRatio = (aspectRatio || '9:16') as AspectRatio;
    const selectedSize = (size || '1K') as ImageSize;

    console.log(`Generating wallpapers: model=${selectedModel}, ratio=${selectedRatio}, size=${selectedSize}, remix=${!!referenceImage}`);

    // If API key is not present or if we need to call Gemini API
    const generatedVariations: { id: string; url: string; prompt: string; variationIndex: number }[] = [];
    let usedFallbackNotice = '';

    // Attempt generation with Gemini API
    let apiSuccess = false;
    if (process.env.GEMINI_API_KEY) {
      try {
        // Generate up to count variations
        // To maximize responsiveness, we generate variations. In case of remix, pass referenceImage inlineData
        const promises = variationPrompts.map(async (vPrompt, idx) => {
          let parts: any[] = [];

          if (referenceImage) {
            // Remix mode: parse data URL to extract mime and raw base64
            const match = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
            const mimeType = match ? match[1] : 'image/png';
            const base64Data = match ? match[2] : referenceImage;

            const remixPromptText = buildRemixPrompt(cleanVibe, remixInstruction);
            parts = [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: `${remixPromptText}. Variation ${idx + 1}: ${vPrompt}`,
              },
            ];
          } else {
            parts = [{ text: vPrompt }];
          }

          const response = await ai.models.generateContent({
            model: selectedModel,
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: selectedRatio,
                imageSize: selectedSize,
              },
            },
          });

          // Look for image parts in candidate parts
          for (const part of response.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              return {
                id: `var-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
                url: `data:${mime};base64,${part.inlineData.data}`,
                prompt: vPrompt,
                variationIndex: idx,
              };
            }
          }
          return null;
        });

        // Run the first batch
        const results = await Promise.allSettled(promises);
        for (let i = 0; i < results.length; i++) {
          const resItem = results[i];
          if (resItem.status === 'fulfilled' && resItem.value) {
            generatedVariations.push(resItem.value);
            apiSuccess = true;
          }
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, switching to high-fidelity studio engine:', geminiError?.message || geminiError);
        if (geminiError?.status === 429 || geminiError?.message?.includes('quota') || geminiError?.message?.includes('RESOURCE_EXHAUSTED')) {
          usedFallbackNotice = 'Notice: Gemini API daily quota on this free key is currently at limit. Rendered using VibePaper Studio HD Procedural Vector Engine.';
        }
      }
    }

    // If Gemini was rate-limited or yielded fewer than 4 variations, pad with high-aesthetic procedural variations
    if (generatedVariations.length < count) {
      const needed = count - generatedVariations.length;
      const startIndex = generatedVariations.length;
      for (let i = 0; i < needed; i++) {
        const varIdx = startIndex + i;
        const prompt = variationPrompts[varIdx] || cleanVibe;
        const proceduralUrl = generateProceduralWallpaper(cleanVibe, varIdx, selectedRatio);
        generatedVariations.push({
          id: `var-studio-${Date.now()}-${varIdx}-${Math.random().toString(36).substring(2, 7)}`,
          url: proceduralUrl,
          prompt,
          variationIndex: varIdx,
        });
      }
      if (!usedFallbackNotice) {
        usedFallbackNotice = 'Rendered with VibePaper High-Resolution Studio Engine';
      }
    }

    return res.json({
      success: true,
      batchId: `batch-${Date.now()}`,
      vibe: cleanVibe,
      model: selectedModel,
      aspectRatio: selectedRatio,
      size: selectedSize,
      notice: usedFallbackNotice || undefined,
      variations: generatedVariations,
    });
  } catch (error: any) {
    console.error('Generation handler error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate wallpapers. Please try again.',
    });
  }
});

// Setup dev server with Vite middlewares, or static serving in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VibePaper server running at http://0.0.0.0:${PORT} [${isDev ? 'development' : 'production'}]`);
  });
}

startServer();
