/**
 * Turret chip definitions — 6 exclude chips (E1–E6) + 9 weight chips (W1–W9).
 *
 * Each chip produces a Move code snippet that is injected into the
 * `get_target_priority_list` function body by the code generator.
 *
 * Exclude chips run first (setting `excluded = true`).
 * Weight chips run inside `if (!excluded) { ... }`.
 */

import type { Chip } from '../chip-types';

// ---------------------------------------------------------------------------
// Exclude Chips
// ---------------------------------------------------------------------------

const E1_FRIENDLY_FIRE: Chip = {
  id: 'E1',
  category: 'exclude',
  selectionMode: 'checkbox',
  label: 'Friendly Fire Protection',
  description: 'Do not shoot same-tribe members unless they are attacking.',
  defaultEnabled: true,
  codeSnippet: () => `
        // [E1] Friendly Fire Protection
        if (turret::character_tribe(candidate) == owner_tribe && !turret::is_aggressor(candidate)) {
            excluded = true;
        };`,
};

const E2_OWNER_PROTECTION: Chip = {
  id: 'E2',
  category: 'exclude',
  selectionMode: 'checkbox',
  label: 'Owner Protection',
  description: 'Never shoot the turret owner\'s own ship.',
  defaultEnabled: true,
  codeSnippet: () => `
        // [E2] Owner Protection
        if (turret::character_id(candidate) != 0 && turret::character_id(candidate) == owner_character_id) {
            excluded = true;
        };`,
};

const E3_CEASEFIRE: Chip = {
  id: 'E3',
  category: 'exclude',
  selectionMode: 'checkbox',
  label: 'Ceasefire Detection',
  description: 'Stop shooting targets that ceased attacking.',
  defaultEnabled: true,
  codeSnippet: () => `
        // [E3] Ceasefire Detection
        if (behaviour_to_u8(turret::behaviour_change(candidate)) == STOPPED_ATTACK) {
            excluded = true;
        };`,
};

const E4_NPC_IGNORE: Chip = {
  id: 'E4',
  category: 'exclude',
  selectionMode: 'checkbox',
  label: 'NPC Ignore',
  description: 'Ignore all NPCs, only engage player ships.',
  defaultEnabled: false,
  conflictsWith: ['E5', 'W6'],
  codeSnippet: () => `
        // [E4] NPC Ignore
        if (turret::character_id(candidate) == 0) {
            excluded = true;
        };`,
};

const E5_PLAYER_IGNORE: Chip = {
  id: 'E5',
  category: 'exclude',
  selectionMode: 'checkbox',
  label: 'Player Ignore',
  description: 'Ignore all player ships, only engage NPCs.',
  defaultEnabled: false,
  conflictsWith: ['E4'],
  codeSnippet: () => `
        // [E5] Player Ignore
        if (turret::character_id(candidate) != 0) {
            excluded = true;
        };`,
};

const E6_TRIBE_WHITELIST: Chip = {
  id: 'E6',
  category: 'exclude',
  selectionMode: 'checkbox',
  label: 'Tribe Whitelist',
  description: 'Protect ships belonging to listed ally tribes.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'protectedTribes',
      label: 'Protected Tribe IDs (comma-separated)',
      type: 'string',
      defaultValue: '100,200',
      placeholder: 'e.g. 100,200,300',
    },
  ],
  codeSnippet: (params) => {
    const raw = String(params?.protectedTribes ?? '100,200');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    return `
        // [E6] Tribe Whitelist
        {
            let protected_tribes: vector<u32> = vector[${ids.join(', ')}];
            let target_tribe = turret::character_tribe(candidate);
            let mut j = 0u64;
            while (j < protected_tribes.length()) {
                if (target_tribe == protected_tribes[j]) {
                    excluded = true;
                };
                j = j + 1;
            };
        };`;
  },
};

// ---------------------------------------------------------------------------
// Weight Chips
// ---------------------------------------------------------------------------

const W1_AGGRESSOR: Chip = {
  id: 'W1',
  category: 'weight',
  selectionMode: 'checkbox',
  label: 'Aggressor Priority',
  description: 'Targets that started attacking get +10 000 weight.',
  defaultEnabled: true,
  codeSnippet: () => `
            // [W1] Aggressor Priority
            if (behaviour_to_u8(turret::behaviour_change(candidate)) == STARTED_ATTACK) {
                weight = weight + 10000;
            };`,
};

const W2_PROXIMITY: Chip = {
  id: 'W2',
  category: 'weight',
  selectionMode: 'checkbox',
  label: 'Proximity Alert',
  description: 'Hostile ships entering range get +1 000 weight.',
  defaultEnabled: true,
  codeSnippet: () => `
            // [W2] Proximity Alert
            if (behaviour_to_u8(turret::behaviour_change(candidate)) == ENTERED) {
                if (turret::character_tribe(candidate) != owner_tribe || turret::is_aggressor(candidate)) {
                    weight = weight + 1000;
                };
            };`,
};

const W3_SHIP_CLASS: Chip = {
  id: 'W3',
  category: 'weight',
  selectionMode: 'checkbox',
  label: 'Ship Class Specialization',
  description: 'Prioritize ship classes your turret is specialized against.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'turretType',
      label: 'Turret Type',
      type: 'enum',
      defaultValue: 'autocannon',
      options: [
        { label: 'Autocannon (Shuttle, Corvette)', value: 'autocannon' },
        { label: 'Plasma (Frigate, Destroyer)', value: 'plasma' },
        { label: 'Howitzer (Cruiser, Combat BC)', value: 'howitzer' },
      ],
    },
    {
      key: 'specBonus',
      label: 'Specialization bonus weight',
      type: 'number',
      defaultValue: 5000,
    },
  ],
  codeSnippet: (params) => {
    const turretType = String(params?.turretType ?? 'autocannon');
    const bonus = Number(params?.specBonus ?? 5000);
    const groupMap: Record<string, string> = {
      autocannon: '31, 237',   // Shuttle, Corvette
      plasma: '25, 420',       // Frigate, Destroyer
      howitzer: '26, 419',     // Cruiser, Combat BC
    };
    const groups = groupMap[turretType] ?? groupMap.autocannon;
    return `
            // [W3] Ship Class Specialization (${turretType})
            {
                let tgt_group = turret::group_id(candidate);
                let spec_groups: vector<u64> = vector[${groups}];
                let mut s = 0u64;
                while (s < spec_groups.length()) {
                    if (tgt_group == spec_groups[s]) {
                        weight = weight + ${bonus};
                    };
                    s = s + 1;
                };
            };`;
  },
};

const W4_WEAKEST: Chip = {
  id: 'W4',
  category: 'weight',
  selectionMode: 'checkbox',
  label: 'Weakest First',
  description: 'Prioritize low-HP targets (higher weight for lower HP).',
  defaultEnabled: false,
  configFields: [
    {
      key: 'hpMultiplier',
      label: 'Weight per 1% missing HP',
      type: 'number',
      defaultValue: 50,
    },
  ],
  codeSnippet: (params) => {
    const mul = Number(params?.hpMultiplier ?? 50);
    return `
            // [W4] Weakest First
            weight = weight + (100 - turret::hp_ratio(candidate)) * ${mul};`;
  },
};

const W5_SHIELDLESS: Chip = {
  id: 'W5',
  category: 'weight',
  selectionMode: 'checkbox',
  label: 'Shieldless Priority',
  description: 'Prioritize targets with depleted shields.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'shieldMultiplier',
      label: 'Weight per 1% missing shield',
      type: 'number',
      defaultValue: 30,
    },
  ],
  codeSnippet: (params) => {
    const mul = Number(params?.shieldMultiplier ?? 30);
    return `
            // [W5] Shieldless Priority
            weight = weight + (100 - turret::shield_ratio(candidate)) * ${mul};`;
  },
};

const W6_ANTI_NPC: Chip = {
  id: 'W6',
  category: 'weight',
  selectionMode: 'checkbox',
  label: 'Anti-NPC Focus',
  description: 'NPC targets get +3 000 weight.',
  defaultEnabled: false,
  conflictsWith: ['E4'],
  codeSnippet: () => `
            // [W6] Anti-NPC Focus
            if (turret::character_id(candidate) == 0) {
                weight = weight + 3000;
            };`,
};

const W7_TRIBE_ENEMY: Chip = {
  id: 'W7',
  category: 'weight',
  selectionMode: 'checkbox',
  label: 'Tribe Enemy Boost',
  description: 'Extra weight for ships from designated enemy tribes.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'enemyTribes',
      label: 'Enemy Tribe IDs (comma-separated)',
      type: 'string',
      defaultValue: '500,600',
      placeholder: 'e.g. 500,600',
    },
    {
      key: 'enemyBoost',
      label: 'Enemy weight boost',
      type: 'number',
      defaultValue: 8000,
    },
  ],
  codeSnippet: (params) => {
    const raw = String(params?.enemyTribes ?? '500,600');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    const boost = Number(params?.enemyBoost ?? 8000);
    return `
            // [W7] Tribe Enemy Boost
            {
                let enemy_tribes: vector<u32> = vector[${ids.join(', ')}];
                let tgt_tribe = turret::character_tribe(candidate);
                let mut k = 0u64;
                while (k < enemy_tribes.length()) {
                    if (tgt_tribe == enemy_tribes[k]) {
                        weight = weight + ${boost};
                    };
                    k = k + 1;
                };
            };`;
  },
};

const W8_BIG_FIRST: Chip = {
  id: 'W8',
  category: 'weight',
  selectionMode: 'checkbox',
  label: 'Size Priority (Big First)',
  description: 'Prioritize large ships — Combat BC > Cruiser > ... > Shuttle.',
  defaultEnabled: false,
  conflictsWith: ['W9'],
  codeSnippet: () => `
            // [W8] Size Priority — Big First
            {
                let g = turret::group_id(candidate);
                if (g == 419) { weight = weight + 6000; }       // Combat BC
                else if (g == 26) { weight = weight + 5000; }   // Cruiser
                else if (g == 420) { weight = weight + 4000; }  // Destroyer
                else if (g == 25) { weight = weight + 3000; }   // Frigate
                else if (g == 237) { weight = weight + 2000; }  // Corvette
                else if (g == 31) { weight = weight + 1000; };  // Shuttle
            };`,
};

const W9_SMALL_FIRST: Chip = {
  id: 'W9',
  category: 'weight',
  selectionMode: 'checkbox',
  label: 'Size Priority (Small First)',
  description: 'Prioritize small ships — Shuttle > Corvette > ... > Combat BC.',
  defaultEnabled: false,
  conflictsWith: ['W8'],
  codeSnippet: () => `
            // [W9] Size Priority — Small First
            {
                let g = turret::group_id(candidate);
                if (g == 31) { weight = weight + 6000; }       // Shuttle
                else if (g == 237) { weight = weight + 5000; }  // Corvette
                else if (g == 25) { weight = weight + 4000; }   // Frigate
                else if (g == 420) { weight = weight + 3000; }  // Destroyer
                else if (g == 26) { weight = weight + 2000; }   // Cruiser
                else if (g == 419) { weight = weight + 1000; };  // Combat BC
            };`,
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const TURRET_CHIPS: Chip[] = [
  E1_FRIENDLY_FIRE,
  E2_OWNER_PROTECTION,
  E3_CEASEFIRE,
  E4_NPC_IGNORE,
  E5_PLAYER_IGNORE,
  E6_TRIBE_WHITELIST,
  W1_AGGRESSOR,
  W2_PROXIMITY,
  W3_SHIP_CLASS,
  W4_WEAKEST,
  W5_SHIELDLESS,
  W6_ANTI_NPC,
  W7_TRIBE_ENEMY,
  W8_BIG_FIRST,
  W9_SMALL_FIRST,
];

export const TURRET_EXCLUDE_CHIPS = TURRET_CHIPS.filter(c => c.category === 'exclude');
export const TURRET_WEIGHT_CHIPS = TURRET_CHIPS.filter(c => c.category === 'weight');
