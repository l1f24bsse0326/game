import { VibePreset } from '../types';

export const VIBE_PRESETS: VibePreset[] = [
  {
    id: 'cyberpunk-rain',
    name: 'Rainy Cyberpunk',
    vibe: 'rainy cyberpunk lo-fi neon Tokyo alley with reflective wet asphalt and glowing billboards',
    category: 'cyberpunk',
    icon: '🌧️',
    color: 'from-cyan-500 to-fuchsia-600',
  },
  {
    id: 'lofi-sunset',
    name: 'Lo-Fi Sunset Window',
    vibe: 'cozy lo-fi bedroom window overlooking anime city skyline at warm purple sunset with hanging plants',
    category: 'lofi',
    icon: '☕',
    color: 'from-amber-400 to-rose-500',
  },
  {
    id: 'obsidian-gold',
    name: 'Liquid Obsidian Gold',
    vibe: 'abstract flowing obsidian liquid marble with veined molten gold luxury texture, dark OLED background',
    category: 'abstract',
    icon: '✨',
    color: 'from-yellow-400 to-neutral-900',
  },
  {
    id: 'emerald-mist',
    name: 'Emerald Pine Mist',
    vibe: 'minimalist misty coniferous emerald forest mountain range with morning ethereal fog and soft light',
    category: 'nature',
    icon: '🌲',
    color: 'from-emerald-400 to-teal-800',
  },
  {
    id: 'deep-nebula',
    name: 'Celestial Nebula',
    vibe: 'deep space cosmic nebula with iridescent stardust ribbons and glowing crescent celestial planet',
    category: 'abstract',
    icon: '🌌',
    color: 'from-purple-500 to-blue-600',
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Cloudscape',
    vibe: 'dreamy pastel cotton candy clouds at golden hour with soft ethereal dreamscape gradients',
    category: 'anime',
    icon: '☁️',
    color: 'from-pink-300 to-indigo-400',
  },
  {
    id: 'minimal-geometry',
    name: 'Dark Neo-Brutalist',
    vibe: 'ultra-minimal dark architectural archways and sculptural shadows with subtle orange neon slit light',
    category: 'minimal',
    icon: '🏛️',
    color: 'from-orange-500 to-stone-900',
  },
  {
    id: 'vintage-film',
    name: '35mm Golden Hour',
    vibe: '35mm vintage grain film photography of quiet seaside dunes under nostalgic hazy golden sunlight',
    category: 'nature',
    icon: '🎞️',
    color: 'from-yellow-500 to-orange-700',
  },
];

export const STYLE_MODIFIERS = [
  'Raindrops & Mist',
  'Neon Glow',
  'Moody Shadows',
  'Analog 35mm Grain',
  'OLED Pure Black',
  'Warm Bokeh',
  'Cinematic Lighting',
  'Minimalist Negative Space',
  'Atmospheric Weather Particles',
  'Dreamscape Gradients',
  'Iridescent Glow',
];

export const REMIX_SUGGESTIONS = [
  'Add heavy rain and neon puddle reflections',
  'Shift color scheme to deep purple and amber sunset',
  'Convert into dark mode minimalist silhouette',
  'Add glowing celestial moon and mist',
  'Winter snowy atmosphere with frosted highlights',
  'Intensify vivid cyber neon glow and fog',
];

export const POPULAR_AESTHETICS = [
  'rainy cyberpunk lo-fi neon Tokyo alley with reflective wet asphalt and glowing billboards',
  'cozy lo-fi bedroom window overlooking anime city skyline at warm purple sunset with hanging plants',
  'abstract flowing obsidian liquid marble with veined molten gold luxury texture, dark OLED background',
  'minimalist misty coniferous emerald forest mountain range with morning ethereal fog and soft light',
  'deep space cosmic nebula with iridescent stardust ribbons and glowing crescent celestial planet',
  'dreamy pastel cotton candy clouds at golden hour with soft ethereal dreamscape gradients',
  'ultra-minimal dark architectural archways and sculptural shadows with subtle orange neon slit light',
  '35mm vintage grain film photography of quiet seaside dunes under nostalgic hazy golden sunlight',
  'vaporwave sunset grid with wireframe neon sun, magenta horizon and palm silhouettes',
  'iridescent fluid chrome hologram waves melting over deep violet space void',
  'Japanese zen moss garden in rain with glowing stone lantern and red maple leaves on dark water',
  'aurora borealis emerald green and violet curtains dancing over frozen arctic glacial fjord',
  'warm coffee shop nook with rainy street view, gentle bokeh lights, and nostalgic vintage book pile',
  'cyberpunk futuristic holographic koi fish swimming through neon rain mist above skyscrapers',
  'brutalist concrete monolith surrounded by blooming cherry blossoms under moody overcast sky',
];

/**
 * Returns a random popular aesthetic description, avoiding immediate duplicate of current prompt.
 */
export function getRandomPopularAesthetic(currentPrompt = ''): string {
  const filtered = POPULAR_AESTHETICS.filter((a) => a.toLowerCase() !== currentPrompt.trim().toLowerCase());
  const pool = filtered.length > 0 ? filtered : POPULAR_AESTHETICS;
  return pool[Math.floor(Math.random() * pool.length)];
}

