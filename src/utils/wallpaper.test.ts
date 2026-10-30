import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVariationPrompts,
  generateWallpaperFilename,
  buildRemixPrompt,
  getAspectDimensions,
  ASPECT_RATIOS,
  IMAGE_SIZES,
} from './wallpaper';

test('buildVariationPrompts creates 4 distinct variations from base vibe', () => {
  const baseVibe = 'rainy cyberpunk lo-fi';
  const prompts = buildVariationPrompts(baseVibe, 4);

  assert.equal(prompts.length, 4);
  prompts.forEach((p, idx) => {
    assert.ok(p.includes(baseVibe), `Variation ${idx} should include base vibe`);
  });
  // Verify variations are not identical
  const uniqueSet = new Set(prompts);
  assert.equal(uniqueSet.size, 4);
});

test('generateWallpaperFilename produces safe filename for downloads', () => {
  const filename = generateWallpaperFilename('Rainy Cyberpunk Lo-Fi #123!!', 0, '9-16');
  assert.equal(filename, 'vibepaper-rainy-cyberpunk-lo-fi-123-var1-9-16.png');

  const emptyFallback = generateWallpaperFilename('   ', 2, '1-1');
  assert.equal(emptyFallback, 'vibepaper-wallpaper-var3-1-1.png');
});

test('buildRemixPrompt handles optional instruction properly', () => {
  const withoutInstruction = buildRemixPrompt('golden hour mountains');
  assert.ok(withoutInstruction.includes('golden hour mountains'));
  assert.ok(withoutInstruction.includes('Remix and reimagining'));

  const withInstruction = buildRemixPrompt('golden hour mountains', 'add a snowy peak and northern lights');
  assert.ok(withInstruction.includes('add a snowy peak and northern lights'));
  assert.ok(withInstruction.includes('golden hour mountains'));
});

test('getAspectDimensions correctly scales resolution', () => {
  const dim1K = getAspectDimensions('9:16', '1K');
  assert.equal(dim1K.width, 1080);
  assert.equal(dim1K.height, 1920);

  const dim4K = getAspectDimensions('9:16', '4K');
  assert.equal(dim4K.width, 2160);
  assert.equal(dim4K.height, 3840);

  const dimSquare = getAspectDimensions('1:1', '1K');
  assert.equal(dimSquare.width, 1080);
  assert.equal(dimSquare.height, 1080);
});

test('aspect ratio configurations include all 8 required aspect ratios', () => {
  const requiredRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
  for (const r of requiredRatios) {
    assert.ok(ASPECT_RATIOS[r as keyof typeof ASPECT_RATIOS], `Missing ratio: ${r}`);
  }
});

test('image size configurations include 1K, 2K, 4K', () => {
  const requiredSizes = ['1K', '2K', '4K'];
  for (const s of requiredSizes) {
    assert.ok(IMAGE_SIZES[s as keyof typeof IMAGE_SIZES], `Missing size: ${s}`);
  }
});

test('getRandomPopularAesthetic returns a non-empty aesthetic description', async () => {
  const { getRandomPopularAesthetic, POPULAR_AESTHETICS } = await import('../data/presets');
  assert.ok(POPULAR_AESTHETICS.length >= 10);
  const aesthetic = getRandomPopularAesthetic();
  assert.ok(aesthetic.length > 10);
  assert.ok(POPULAR_AESTHETICS.includes(aesthetic));

  // Should avoid current prompt if alternative exists
  const current = POPULAR_AESTHETICS[0];
  const next = getRandomPopularAesthetic(current);
  assert.notEqual(next, current);
});

