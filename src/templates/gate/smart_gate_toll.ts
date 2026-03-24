/**
 * Gate Template B: Toll Gate — AssemblyTemplate registration.
 *
 * Travelers must pay SUI tokens to receive a jump permit.
 */

import type { AssemblyTemplate } from '../types';
import type { ChipSelection } from '../chip-types';
import { generateGateFiles } from './gate_code_generator';
import { chipsForTemplate } from './chips';
import { TOLL_GATE_PRESETS } from './presets';

function defaultSelection(): ChipSelection {
  const preset = TOLL_GATE_PRESETS[0];
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

export const gateToll: AssemblyTemplate = {
  id: 'gate_toll',
  label: 'Toll Gate',
  assemblyType: 'gate',
  description: 'Charge SUI tokens for passage; supports discounts and free tribes.',
  detail:
    'Deploy a gate extension that requires travelers to pay a configurable SUI fee. ' +
    'Optionally grant discounts or free passage to allied tribes.',

  chipConfig: {
    chips: chipsForTemplate('toll_gate'),
    presets: TOLL_GATE_PRESETS,
    categories: [
      { key: 'payment', label: 'Payment Rules', icon: '💰' },
      { key: 'revenue', label: 'Revenue Handling', icon: '🏦' },
      { key: 'config', label: 'Configuration', icon: '⚙️' },
    ],
    defaultModuleName: 'smart_gate_extension',
  },

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateGateFiles({ templateTag: 'toll_gate', moduleName, selection });
  },
};
