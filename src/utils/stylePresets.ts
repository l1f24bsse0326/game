/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StyleModifierPreset {
  id: string;
  name: string;
  icon?: string;
  modifiers: string[];
  isCustom?: boolean;
}

export const DEFAULT_AESTHETIC_PRESETS: StyleModifierPreset[] = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    icon: '⚪',
    modifiers: ['Minimalist Negative Space', 'OLED Pure Black'],
  },
  {
    id: 'detailed',
    name: 'Detailed',
    icon: '🔍',
    modifiers: ['Cinematic Lighting', 'Atmospheric Weather Particles', 'Analog 35mm Grain'],
  },
  {
    id: 'surreal',
    name: 'Surreal',
    icon: '✨',
    modifiers: ['Dreamscape Gradients', 'Iridescent Glow', 'Moody Shadows'],
  },
  {
    id: 'neon-noir',
    name: 'Neon Noir',
    icon: '⚡',
    modifiers: ['Neon Glow', 'Raindrops & Mist', 'Moody Shadows'],
  },
];

/**
 * Checks whether all (or at least one if non-empty) modifiers in the preset are currently present in the prompt.
 * By default, checks if ALL modifiers are in the prompt (case-insensitive).
 */
export function isPresetActive(prompt: string, modifiers: string[], requireAll = true): boolean {
  if (!prompt || modifiers.length === 0) return false;
  const lower = prompt.toLowerCase();
  if (requireAll) {
    return modifiers.every((mod) => lower.includes(mod.toLowerCase()));
  }
  return modifiers.some((mod) => lower.includes(mod.toLowerCase()));
}

/**
 * Toggles a preset's stylistic modifiers in the prompt.
 * If targetState is provided, forces that state (true = add modifiers, false = remove modifiers).
 * If targetState is omitted, toggles based on whether isPresetActive is true.
 */
export function togglePresetModifiers(
  prompt: string,
  modifiers: string[],
  forceState?: boolean
): string {
  const currentlyActive = isPresetActive(prompt, modifiers, true);
  const shouldActivate = forceState !== undefined ? forceState : !currentlyActive;

  let currentText = prompt.trim();

  if (shouldActivate) {
    // Add missing modifiers
    const toAdd = modifiers.filter(
      (mod) => !currentText.toLowerCase().includes(mod.toLowerCase())
    );
    if (toAdd.length === 0) return currentText;
    if (!currentText) {
      return toAdd.join(', ');
    }
    return `${currentText}, ${toAdd.map((m) => m.toLowerCase()).join(', ')}`;
  } else {
    // Remove modifiers
    let updated = currentText;
    for (const mod of modifiers) {
      // Create regex matching the modifier, optionally with leading/trailing commas or spaces
      const escaped = mod.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Match ", modifier" or "modifier," or just "modifier"
      const regex = new RegExp(`(,\\s*)?${escaped}(\\s*,)?`, 'gi');
      updated = updated.replace(regex, (match, prefix, suffix) => {
        if (prefix && suffix) return ', ';
        return '';
      });
    }

    // Clean up residual dangling commas and double spaces
    return updated
      .replace(/^[\s,]+|[\s,]+$/g, '')
      .replace(/,\s*,+/g, ', ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/,\s*$/g, '')
      .trim();
  }
}

/**
 * Saves a new custom preset into the list, avoiding duplicate IDs.
 */
export function addCustomPreset(
  existingPresets: StyleModifierPreset[],
  newPreset: StyleModifierPreset
): StyleModifierPreset[] {
  const filtered = existingPresets.filter((p) => p.id !== newPreset.id);
  return [...filtered, { ...newPreset, isCustom: true }];
}

/**
 * Deletes a custom preset by ID.
 */
export function removeCustomPreset(
  existingPresets: StyleModifierPreset[],
  id: string
): StyleModifierPreset[] {
  return existingPresets.filter((p) => p.id !== id);
}

/**
 * Safely parses custom presets from localStorage JSON.
 */
export function loadCustomPresetsFromStorage(rawJson: string | null): StyleModifierPreset[] {
  if (!rawJson) return [];
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.name === 'string' &&
          Array.isArray(item.modifiers)
      );
    }
  } catch {
    // Return empty on parse failure
  }
  return [];
}
