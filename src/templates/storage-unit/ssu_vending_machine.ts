/**
 * SSU Template A: Vending Machine — AssemblyTemplate registration.
 *
 * Players pay SUI tokens to purchase items from the SSU's main inventory.
 */

import type { AssemblyTemplate } from '../types';
import type { ChipSelection } from '../chip-types';
import { generateSSUFiles } from './ssu_code_generator';
import { chipsForTemplate } from './chips';
import { VENDING_MACHINE_PRESETS } from './presets';

function defaultSelection(): ChipSelection {
  const preset = VENDING_MACHINE_PRESETS[0];
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

export const ssuVendingMachine: AssemblyTemplate = {
  id: 'ssu_vending_machine',
  label: 'Vending Machine',
  assemblyType: 'storage_unit',
  description: 'Pay SUI to purchase items — classic coin-operated dispenser.',
  detail:
    'Deploy a vending machine. The SSU owner stocks items and sets prices; ' +
    'players pay SUI to receive items. Supports single or multi-item catalogs, ' +
    'tribe discounts, and bulk pricing.',

  chipConfig: {
    chips: chipsForTemplate('vending_machine'),
    presets: VENDING_MACHINE_PRESETS,
    categories: [
      { key: 'pricing', label: 'Pricing', icon: '💰' },
      { key: 'revenue', label: 'Revenue', icon: '💎' },
      { key: 'stock', label: 'Stock Mode', icon: '📋' },
      { key: 'access', label: 'Access Control', icon: '🔐' },
    ],
    defaultModuleName: 'smart_storage_unit_extension',
  },

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateSSUFiles({ templateTag: 'vending_machine', moduleName, selection });
  },
};
