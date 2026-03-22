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
  const preset = TURRET_PRESETS[0];
  return {
    enabledChips: [...preset.chips],
    chipConfigs: preset.chipConfigs ? { ...preset.chipConfigs } : {},
  };
}

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

  chipConfig: {
    chips: TURRET_CHIPS,
    presets: TURRET_PRESETS,
    categories: [
      { key: 'exclude', label: 'Exclude Chips', icon: '🛡' },
      { key: 'weight', label: 'Weight Chips', icon: '⚡' },
    ],
    defaultModuleName: 'smart_turret_extension',
  },

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateTurretFiles({ moduleName, selection });
  },
};

export { TURRET_CHIPS } from './chips';
export { TURRET_PRESETS } from './presets';
