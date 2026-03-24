/**
 * Gate Template D: Open Permit — AssemblyTemplate registration.
 *
 * No restrictions — anyone can request a jump permit.
 * Useful for logging gate usage or as a placeholder extension.
 */

import type { ChipSelection } from '../chip-types';
import type { AssemblyTemplate } from '../types';
import { chipsForTemplate } from './chips';
import { generateGateFiles } from './gate_code_generator';
import { OPEN_PERMIT_PRESETS } from './presets';

function defaultSelection(): ChipSelection {
  return {
    enabledChips: ['C1'],
    chipConfigs: {},
  };
}

function parseConfig(raw?: Record<string, unknown>): {
  moduleName: string;
  selection: ChipSelection;
} {
  if (!raw) {
    return {
      moduleName: 'smart_gate_extension',
      selection: defaultSelection(),
    };
  }

  const moduleName =
    typeof raw.moduleName === 'string' && raw.moduleName
      ? raw.moduleName
      : 'smart_gate_extension';

  const chipConfigs = (
    raw.chipConfigs && typeof raw.chipConfigs === 'object'
      ? raw.chipConfigs
      : {}
  ) as Record<string, Record<string, unknown>>;

  return {
    moduleName,
    selection: {
      enabledChips: ['C1'],
      chipConfigs,
    },
  };
}

export const gateOpenPermit: AssemblyTemplate = {
  id: 'gate_open_permit',
  label: 'Open Permit Gate',
  assemblyType: 'gate',
  description: 'Anyone can request a permit — no access restrictions.',
  detail:
    'Deploy a gate extension that issues jump permits to anyone who requests one. ' +
    'Useful for tracking gate usage via on-chain events, or as a placeholder before adding rules later.',

  chipConfig: {
    chips: chipsForTemplate('open_permit'),
    presets: OPEN_PERMIT_PRESETS,
    categories: [{ key: 'config', label: 'Configuration', icon: '⚙️' }],
    defaultModuleName: 'smart_gate_extension',
  },

  files: (rawConfig?: Record<string, unknown>) => {
    const { moduleName, selection } = parseConfig(rawConfig);
    return generateGateFiles({
      templateTag: 'open_permit',
      moduleName,
      selection,
    });
  },
};
