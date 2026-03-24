/**
 * Gate Template E: Multi-Rule Gate — AssemblyTemplate registration.
 *
 * Combines access control (tribe checks) with payment rules in one gate.
 * The most flexible Gate template.
 */

import type { AssemblyTemplate } from '../types';
import type { ChipSelection } from '../chip-types';
import { generateGateFiles } from './gate_code_generator';
import { chipsForTemplate } from './chips';
import { MULTI_RULE_PRESETS } from './presets';

function defaultSelection(): ChipSelection {
  const preset = MULTI_RULE_PRESETS[0];
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

export const gateMultiRule: AssemblyTemplate = {
  id: 'gate_multi_rule',
  label: 'Multi-Rule Gate',
  assemblyType: 'gate',
  description: 'Combine tribe access control with payment rules in one gate.',
  detail:
    'Deploy an advanced gate extension that chains access checks (tribe whitelist/blacklist) ' +
    'with payment rules (toll, discounts, free passage). The most flexible Gate template.',

  chipConfig: {
    chips: chipsForTemplate('multi_rule'),
    presets: MULTI_RULE_PRESETS,
    categories: [
      { key: 'access', label: 'Access Control', icon: '🔐' },
      { key: 'payment', label: 'Payment Rules', icon: '💰' },
      { key: 'revenue', label: 'Revenue', icon: '🏦' },
      { key: 'config', label: 'Configuration', icon: '⚙️' },
    ],
    defaultModuleName: 'smart_gate_extension',
  },

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateGateFiles({ templateTag: 'multi_rule', moduleName, selection });
  },
};
