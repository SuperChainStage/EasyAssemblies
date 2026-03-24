/**
 * Gate Template C: Bounty Gate — AssemblyTemplate registration.
 *
 * Travelers must submit items (e.g. corpse bounties) to receive a jump permit.
 */

import type { AssemblyTemplate } from '../types';
import type { ChipSelection } from '../chip-types';
import { generateGateFiles } from './gate_code_generator';
import { chipsForTemplate } from './chips';
import { BOUNTY_GATE_PRESETS } from './presets';

function defaultSelection(): ChipSelection {
  const preset = BOUNTY_GATE_PRESETS[0];
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
    return { moduleName: 'smart_gate_extension', selection: defaultSelection() };
  }

  const moduleName = typeof raw.moduleName === 'string' && raw.moduleName
    ? raw.moduleName
    : 'smart_gate_extension';

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

export const gateBounty: AssemblyTemplate = {
  id: 'gate_bounty',
  label: 'Bounty Gate',
  assemblyType: 'gate',
  description: 'Submit items to earn passage; supports multi-item and bulk bounties.',
  detail:
    'Deploy a gate extension where travelers deposit items into the gate owner\'s ' +
    'storage unit in exchange for a jump permit. Configure accepted item types and quantities.',

  chipConfig: {
    chips: chipsForTemplate('bounty_gate'),
    presets: BOUNTY_GATE_PRESETS,
    categories: [
      { key: 'item', label: 'Item Validation', icon: '📦' },
      { key: 'config', label: 'Configuration', icon: '⚙️' },
    ],
    defaultModuleName: 'smart_gate_extension',
  },

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateGateFiles({ templateTag: 'bounty_gate', moduleName, selection });
  },
};
