/**
 * SSU Template E: Open Storage — AssemblyTemplate registration.
 *
 * The simplest SSU extension — an unrestricted shared warehouse.
 * No chips; just a module name configuration.
 */

import type { AssemblyTemplate } from '../types';
import { generateSSUFiles } from './ssu_code_generator';

export const ssuOpenStorage: AssemblyTemplate = {
  id: 'ssu_open_storage',
  label: 'Open Storage',
  assemblyType: 'storage_unit',
  description: 'Unrestricted shared warehouse — anyone can deposit and withdraw.',
  detail:
    'Deploy the simplest SSU extension. Items flow freely through the open ' +
    'inventory with no access restrictions. Useful as a placeholder, ' +
    'community warehouse, or testing scaffold.',

  configFields: [
    {
      key: 'moduleName',
      label: 'Package Name',
      type: 'string' as const,
      defaultValue: 'smart_storage_unit_extension',
      placeholder: 'my_storage_extension',
      validate: (v: unknown) =>
        /^[a-z_][a-z0-9_]*$/.test(String(v))
          ? null
          : 'Only lowercase letters, digits, and underscores',
      phase: 'compile' as const,
    },
  ],

  files: (rawConfig?: Record<string, unknown>) => {
    const moduleName =
      typeof rawConfig?.moduleName === 'string' && rawConfig.moduleName
        ? rawConfig.moduleName
        : 'smart_storage_unit_extension';
    return generateSSUFiles({
      templateTag: 'open_storage',
      moduleName,
      selection: { enabledChips: [], chipConfigs: {} },
    });
  },
};
