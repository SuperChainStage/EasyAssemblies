/**
 * Turret preset definitions — curated chip combinations.
 *
 * Each preset auto-fills the chip selector. Users can further tweak
 * the selection after picking a preset (it then becomes "Custom").
 */

import type { Preset } from '../chip-types';

export const TURRET_PRESETS: Preset[] = [
  {
    id: 'default_plus',
    label: 'Default Plus',
    description: 'Matches world-contract defaults — a safe starting point.',
    chips: ['E1', 'E2', 'E3', 'W1', 'W2'],
  },
  {
    id: 'tribal_defender',
    label: 'Tribal Defender',
    description: 'Protect allies, focus fire on enemy tribes.',
    chips: ['E1', 'E2', 'E3', 'E6', 'W1', 'W2', 'W7'],
    chipConfigs: {
      E6: { protectedTribes: '100,200' },
      W7: { enemyTribes: '500,600', enemyBoost: 8000 },
    },
  },
  {
    id: 'anti_ship',
    label: 'Anti-Ship Specialist',
    description: 'Prioritize ship classes your turret is specialized against.',
    chips: ['E1', 'E2', 'E3', 'W1', 'W2', 'W3'],
    chipConfigs: {
      W3: { turretType: 'autocannon', specBonus: 5000 },
    },
  },
  {
    id: 'damage_finisher',
    label: 'Damage Finisher',
    description: 'Focus fire on wounded targets to maximize kills.',
    chips: ['E1', 'E2', 'E3', 'W1', 'W2', 'W4', 'W5'],
    chipConfigs: {
      W4: { hpMultiplier: 50 },
      W5: { shieldMultiplier: 30 },
    },
  },
  {
    id: 'npc_hunter',
    label: 'NPC Hunter',
    description: 'Ignore players, engage only NPCs.',
    chips: ['E2', 'E3', 'E5', 'W1', 'W6'],
  },
  {
    id: 'pacifist',
    label: 'Pacifist',
    description: 'Only retaliate — shoot targets that attack you first.',
    chips: ['E1', 'E2', 'E3', 'W1'],
  },
];
