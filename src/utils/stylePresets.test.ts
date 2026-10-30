import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPresetActive,
  togglePresetModifiers,
  addCustomPreset,
  removeCustomPreset,
  loadCustomPresetsFromStorage,
  DEFAULT_AESTHETIC_PRESETS,
} from './stylePresets';

describe('stylePresets pure logic tests', () => {
  const minimalMods = ['Minimalist Negative Space', 'OLED Pure Black'];

  test('isPresetActive detects when all modifiers are present', () => {
    const prompt = 'Cyberpunk city, Minimalist Negative Space, OLED Pure Black';
    assert.equal(isPresetActive(prompt, minimalMods), true);

    const partialPrompt = 'Cyberpunk city, Minimalist Negative Space';
    assert.equal(isPresetActive(partialPrompt, minimalMods), false);

    assert.equal(isPresetActive('', minimalMods), false);
  });

  test('togglePresetModifiers toggles modifiers on when inactive', () => {
    const initialPrompt = 'Rainy cyberpunk alley';
    const toggledOn = togglePresetModifiers(initialPrompt, minimalMods);
    assert.ok(toggledOn.includes('minimalist negative space'));
    assert.ok(toggledOn.includes('oled pure black'));
    assert.ok(toggledOn.startsWith('Rainy cyberpunk alley,'));
  });

  test('togglePresetModifiers handles empty prompt correctly', () => {
    const emptyPrompt = '';
    const toggledOn = togglePresetModifiers(emptyPrompt, minimalMods);
    assert.equal(toggledOn, 'Minimalist Negative Space, OLED Pure Black');
  });

  test('togglePresetModifiers toggles modifiers off when already active', () => {
    const activePrompt = 'Rainy cyberpunk alley, minimalist negative space, oled pure black';
    const toggledOff = togglePresetModifiers(activePrompt, minimalMods);
    assert.equal(toggledOff, 'Rainy cyberpunk alley');
    assert.ok(!toggledOff.includes('minimalist negative space'));
    assert.ok(!toggledOff.includes('oled pure black'));
  });

  test('togglePresetModifiers removes modifiers in the middle without broken punctuation', () => {
    const prompt = 'Dark castle, minimalist negative space, oled pure black, glowing moon';
    const toggledOff = togglePresetModifiers(prompt, minimalMods);
    assert.equal(toggledOff, 'Dark castle, glowing moon');
  });

  test('addCustomPreset adds a new preset with isCustom flag', () => {
    const presets = [...DEFAULT_AESTHETIC_PRESETS];
    const newPreset = {
      id: 'custom-1',
      name: 'Synthwave Dream',
      modifiers: ['Neon Glow', 'Dreamscape Gradients'],
    };
    const updated = addCustomPreset(presets, newPreset);
    assert.equal(updated.length, presets.length + 1);
    const added = updated.find((p) => p.id === 'custom-1');
    assert.ok(added);
    assert.equal(added.isCustom, true);
    assert.equal(added.name, 'Synthwave Dream');
  });

  test('removeCustomPreset removes only the specified preset', () => {
    const presets = [
      ...DEFAULT_AESTHETIC_PRESETS,
      { id: 'custom-1', name: 'Synthwave Dream', modifiers: ['Neon Glow'], isCustom: true },
    ];
    const updated = removeCustomPreset(presets, 'custom-1');
    assert.equal(updated.length, DEFAULT_AESTHETIC_PRESETS.length);
    assert.equal(updated.some((p) => p.id === 'custom-1'), false);
  });

  test('loadCustomPresetsFromStorage handles valid, empty, and corrupt data', () => {
    assert.deepEqual(loadCustomPresetsFromStorage(null), []);
    assert.deepEqual(loadCustomPresetsFromStorage('not json'), []);
    assert.deepEqual(loadCustomPresetsFromStorage('{"foo": "bar"}'), []);

    const validJson = JSON.stringify([
      { id: 'custom-1', name: 'My Preset', modifiers: ['Neon Glow'] },
    ]);
    const loaded = loadCustomPresetsFromStorage(validJson);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].name, 'My Preset');
  });
});
