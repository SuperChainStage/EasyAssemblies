/**
 * SSU Template C: Gated Locker — AssemblyTemplate registration.
 *
 * A shared warehouse with tribe and item-type access controls.
 */

import type { AssemblyTemplate } from '../types';
import type { ChipSelection } from '../chip-types';
import { generateSSUFiles } from './ssu_code_generator';
import { chipsForTemplate } from './chips';
import { GATED_LOCKER_PRESETS } from './presets';

function defaultSelection(): ChipSelection {
  const preset = GATED_LOCKER_PRESETS[0];
  return {
    enabledChips: [...preset.chips],
    chipConfigs: preset.chipConfigs ? structuredClone(preset.chipConfigs) : {},
  };
}

function parseConfig(raw?: Record<string, unknown>): {
  moduleName: string;
  selection: ChipSelection;
} {
  if (!raw) {
    return { moduleName: 'smart_storage_unit_extension', selection: defaultSelection() };
  }
  const moduleName =
    typeof raw.moduleName === 'string' && raw.moduleName
      ? raw.moduleName
      : 'smart_storage_unit_extension';
  const enabledChips = Array.isArray(raw.enabledChips)
    ? (raw.enabledChips as string[])
    : defaultSelection().enabledChips;
  const chipConfigs = (
    raw.chipConfigs && typeof raw.chipConfigs === 'object' ? raw.chipConfigs : {}
  ) as Record<string, Record<string, unknown>>;
  return { moduleName, selection: { enabledChips, chipConfigs } };
}

export const ssuGatedLocker: AssemblyTemplate = {
  id: 'ssu_gated_locker',
  label: 'Gated Locker',
  assemblyType: 'storage_unit',
  description: 'Shared warehouse with tribe and item-type access restrictions.',
  detail:
    'Deploy a gated storage locker. Only characters meeting tribe or item-type ' +
    'conditions can deposit or withdraw. Ideal for guild vaults, collection ' +
    'boxes, or embargo lockers.',

  chipConfig: {
    chips: chipsForTemplate('gated_locker'),
    presets: GATED_LOCKER_PRESETS,
    categories: [
      { key: 'access', label: 'Access Control', icon: '🔐' },
      { key: 'item', label: 'Item Restrictions', icon: '📦' },
    ],
    defaultModuleName: 'smart_storage_unit_extension',
  },

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateSSUFiles({ templateTag: 'gated_locker', moduleName, selection });
  },
};
