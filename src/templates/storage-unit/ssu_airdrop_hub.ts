/**
 * SSU Template D: Airdrop Hub — AssemblyTemplate registration.
 *
 * SSU owner stocks items; players claim a fixed quantity per visit.
 * Supports optional claim-once guard and tribe restrictions.
 */

import type { AssemblyTemplate } from '../types';
import type { ChipSelection } from '../chip-types';
import { generateSSUFiles } from './ssu_code_generator';
import { chipsForTemplate } from './chips';
import { AIRDROP_HUB_PRESETS } from './presets';

function defaultSelection(): ChipSelection {
  const preset = AIRDROP_HUB_PRESETS[0];
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

export const ssuAirdropHub: AssemblyTemplate = {
  id: 'ssu_airdrop_hub',
  label: 'Airdrop Hub',
  assemblyType: 'storage_unit',
  description: 'Claim airdrops — starter packs, event rewards, resource distribution.',
  detail:
    'Deploy an airdrop distribution center. The SSU owner stocks items and ' +
    'players claim a fixed quantity. Supports one-time claims, unlimited ' +
    'supply, and tribe restrictions.',

  chipConfig: {
    chips: chipsForTemplate('airdrop_hub'),
    presets: AIRDROP_HUB_PRESETS,
    categories: [
      { key: 'airdrop', label: 'Airdrop Config', icon: '🎁' },
      { key: 'access', label: 'Access Control', icon: '🔐' },
    ],
    defaultModuleName: 'smart_storage_unit_extension',
  },

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateSSUFiles({ templateTag: 'airdrop_hub', moduleName, selection });
  },
};
