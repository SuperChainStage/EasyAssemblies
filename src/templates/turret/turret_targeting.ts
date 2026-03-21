/**
 * Turret Targeting Extension — AssemblyTemplate registration.
 *
 * Unlike Gate (which has multiple templates), Turret has ONE template
 * with rich chip combinations. The chip selection is passed through
 * the config object from the UI → URL → Playground.
 */

import type { AssemblyTemplate } from '../types';
import type { ChipSelection } from '../chip-types';
import { generateTurretFiles } from './turret_code_generator';
import { TURRET_PRESETS } from './presets';
import { TURRET_CHIPS } from './chips';

/** Default chip selection — matches "Default Plus" preset. */
function defaultSelection(): ChipSelection {
  const preset = TURRET_PRESETS[0]; // Default Plus
  return {
    enabledChips: [...preset.chips],
    chipConfigs: preset.chipConfigs ? { ...preset.chipConfigs } : {},
  };
}

/**
 * Parse the raw config from the URL into a ChipSelection + moduleName.
 * The config object is shaped as:
 *   { moduleName?: string, enabledChips?: string[], chipConfigs?: {...}, preset?: string }
 */
function parseConfig(raw?: Record<string, unknown>): {
  moduleName: string;
  selection: ChipSelection;
} {
  if (!raw) {
    return { moduleName: 'smart_turret_extension', selection: defaultSelection() };
  }

  const moduleName = typeof raw.moduleName === 'string' && raw.moduleName
    ? raw.moduleName
    : 'smart_turret_extension';

  // If a preset ID is provided and no explicit chip list, use the preset
  if (typeof raw.preset === 'string' && !raw.enabledChips) {
    const preset = TURRET_PRESETS.find(p => p.id === raw.preset);
    if (preset) {
      return {
        moduleName,
        selection: {
          enabledChips: [...preset.chips],
          chipConfigs: { ...preset.chipConfigs },
        },
      };
    }
  }

  // Explicit chip selection
  const enabledChips = Array.isArray(raw.enabledChips)
    ? (raw.enabledChips as string[])
    : defaultSelection().enabledChips;

  const chipConfigs = (
    raw.chipConfigs && typeof raw.chipConfigs === 'object'
      ? raw.chipConfigs
      : {}
  ) as Record<string, Record<string, unknown>>;

  return { moduleName, selection: { enabledChips, chipConfigs } };
}

export const turretTargeting: AssemblyTemplate = {
  id: 'turret_targeting',
  label: 'Turret — Targeting Extension',
  assemblyType: 'turret',
  description: 'Customize turret targeting priorities with pluggable chips.',
  detail:
    'Deploy a turret extension that replaces the default targeting logic. ' +
    'Choose from 15 chips (exclude + weight) to compose your ideal ' +
    'targeting strategy, or pick a preset and tweak from there.',

  configFields: [
    {
      key: 'moduleName',
      label: 'Package Name',
      type: 'string',
      defaultValue: 'smart_turret_extension',
      placeholder: 'e.g. my_turret',
      phase: 'compile',
      validate: (v) => {
        if (typeof v !== 'string' || !/^[a-z_][a-z0-9_]*$/.test(v))
          return 'Only lowercase letters, digits, and underscores.';
        if (v.length > 64) return 'Max 64 characters.';
        return null;
      },
    },
    {
      key: 'preset',
      label: 'Targeting Preset',
      type: 'string',
      defaultValue: 'default_plus',
      placeholder: TURRET_PRESETS.map(p => p.id).join(' | '),
      phase: 'compile',
      validate: (v) => {
        const validIds = TURRET_PRESETS.map(p => p.id);
        if (typeof v !== 'string' || !validIds.includes(v))
          return `Choose: ${validIds.join(', ')}`;
        return null;
      },
    },
  ],

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateTurretFiles({ moduleName, selection });
  },
};

// Re-export for convenience
export { TURRET_CHIPS } from './chips';
export { TURRET_PRESETS } from './presets';
