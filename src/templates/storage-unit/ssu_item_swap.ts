/**
 * SSU Template B: Item Swap — AssemblyTemplate registration.
 *
 * Players submit items of one type and receive items of another type
 * based on a configured swap ratio.
 */

import type { AssemblyTemplate } from '../types';
import type { ChipSelection } from '../chip-types';
import { generateSSUFiles } from './ssu_code_generator';
import { chipsForTemplate } from './chips';
import { ITEM_SWAP_PRESETS } from './presets';

function defaultSelection(): ChipSelection {
  const preset = ITEM_SWAP_PRESETS[0];
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

export const ssuItemSwap: AssemblyTemplate = {
  id: 'ssu_item_swap',
  label: 'Item Swap',
  assemblyType: 'storage_unit',
  description: 'Trade items at a fixed ratio — resource refinery, recycling, upgrades.',
  detail:
    'Deploy an item swap station. Players submit items of one type and receive ' +
    'items of another type at a configured ratio. Supports single-pair or ' +
    'multi-pair swap rules.',

  chipConfig: {
    chips: chipsForTemplate('item_swap'),
    presets: ITEM_SWAP_PRESETS,
    categories: [
      { key: 'swap', label: 'Swap Rules', icon: '🔄' },
      { key: 'access', label: 'Access Control', icon: '🔐' },
    ],
    defaultModuleName: 'smart_storage_unit_extension',
  },

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateSSUFiles({ templateTag: 'item_swap', moduleName, selection });
  },
};
