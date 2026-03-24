/**
 * Gate chip definitions — shared across all Gate templates.
 *
 * Categories:
 *   access  (A1–A3): Tribe-based access control       → Tribe Permit, Multi-Rule
 *   payment (P1–P3): Token payment logic               → Toll Gate, Multi-Rule
 *   revenue (R1–R2): Revenue handling                  → Toll Gate, Multi-Rule
 *   item    (I1–I3): Item/bounty validation            → Bounty Gate
 *   config  (C1):    Permit expiry                     → All templates
 *
 * Each chip's `codeSnippet` produces Move code injected into the main
 * function body by the gate code generator.
 */

import type { Chip } from '../chip-types';

// ---------------------------------------------------------------------------
// Access Chips (A1–A3) — tribe-based access control
// ---------------------------------------------------------------------------

const A1_SINGLE_TRIBE: Chip = {
  id: 'A1',
  category: 'access',
  selectionMode: 'radio',
  radioGroup: 'access_mode',
  label: 'Single Tribe',
  description: 'Only characters belonging to the configured tribe may pass.',
  defaultEnabled: true,
  codeSnippet: () => `
    // [A1] Single Tribe Check
    assert!(extension_config.has_rule<TribeConfigKey>(TribeConfigKey {}), ENoTribeConfig);
    let tribe_cfg = extension_config.borrow_rule<TribeConfigKey, TribeConfig>(TribeConfigKey {});
    assert!(character.tribe() == tribe_cfg.tribe, ENotAllowedTribe);`,
};

const A2_MULTI_TRIBE: Chip = {
  id: 'A2',
  category: 'access',
  selectionMode: 'radio',
  radioGroup: 'access_mode',
  label: 'Multi-Tribe Whitelist',
  description: 'Allow characters from any of the listed ally tribes.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'allowedTribes',
      label: 'Allowed Tribe IDs (comma-separated)',
      type: 'string' as const,
      defaultValue: '100,200,300',
      placeholder: 'e.g. 100,200,300',
    },
  ],
  codeSnippet: (params) => {
    const raw = String(params?.allowedTribes ?? '100,200,300');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    return `
    // [A2] Multi-Tribe Whitelist
    {
        let allowed_tribes: vector<u32> = vector[${ids.join(', ')}];
        let char_tribe = character.tribe();
        let mut allowed = false;
        let mut i = 0u64;
        while (i < allowed_tribes.length()) {
            if (char_tribe == allowed_tribes[i]) { allowed = true; };
            i = i + 1;
        };
        assert!(allowed, ENotAllowedTribe);
    };`;
  },
};

const A3_TRIBE_BLACKLIST: Chip = {
  id: 'A3',
  category: 'access',
  selectionMode: 'radio',
  radioGroup: 'access_mode',
  label: 'Tribe Blacklist',
  description: 'Block characters from the listed tribes; everyone else may pass.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'blockedTribes',
      label: 'Blocked Tribe IDs (comma-separated)',
      type: 'string' as const,
      defaultValue: '500,600',
      placeholder: 'e.g. 500,600',
    },
  ],
  codeSnippet: (params) => {
    const raw = String(params?.blockedTribes ?? '500,600');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    return `
    // [A3] Tribe Blacklist
    {
        let blocked_tribes: vector<u32> = vector[${ids.join(', ')}];
        let char_tribe = character.tribe();
        let mut j = 0u64;
        while (j < blocked_tribes.length()) {
            assert!(char_tribe != blocked_tribes[j], EBlockedTribe);
            j = j + 1;
        };
    };`;
  },
};

// ---------------------------------------------------------------------------
// Payment Chips (P1–P3) — token payment logic
// ---------------------------------------------------------------------------

const P1_FIXED_PRICE: Chip = {
  id: 'P1',
  category: 'payment',
  selectionMode: 'checkbox',
  label: 'Fixed Price',
  description: 'Require a fixed SUI payment to pass through the gate.',
  defaultEnabled: true,
  codeSnippet: () => `
    // [P1] Fixed Price
    assert!(extension_config.has_rule<TollConfigKey>(TollConfigKey {}), ENoTollConfig);
    let toll_cfg = extension_config.borrow_rule<TollConfigKey, TollConfig>(TollConfigKey {});
    let required_price = toll_cfg.price;`,
};

const P2_TRIBE_DISCOUNT: Chip = {
  id: 'P2',
  category: 'payment',
  selectionMode: 'checkbox',
  label: 'Tribe Discount',
  description: 'Members of specified tribes pay a discounted price.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'discountTribes',
      label: 'Discount Tribe IDs (comma-separated)',
      type: 'string' as const,
      defaultValue: '100,200',
      placeholder: 'e.g. 100,200',
    },
    {
      key: 'discountPct',
      label: 'Discount percentage (0-99)',
      type: 'number' as const,
      defaultValue: 50,
    },
  ],
  codeSnippet: (params) => {
    const raw = String(params?.discountTribes ?? '100,200');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    const pct = Number(params?.discountPct ?? 50);
    return `
    // [P2] Tribe Discount
    {
        let discount_tribes: vector<u32> = vector[${ids.join(', ')}];
        let char_tribe_d = character.tribe();
        let mut d = 0u64;
        while (d < discount_tribes.length()) {
            if (char_tribe_d == discount_tribes[d]) {
                required_price = required_price * ${100 - pct} / 100;
            };
            d = d + 1;
        };
    };`;
  },
};

const P3_FREE_FOR_TRIBE: Chip = {
  id: 'P3',
  category: 'payment',
  selectionMode: 'checkbox',
  label: 'Free for Tribe',
  description: 'Members of specified tribes pass for free.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'freeTribes',
      label: 'Free Tribe IDs (comma-separated)',
      type: 'string' as const,
      defaultValue: '100',
      placeholder: 'e.g. 100',
    },
  ],
  codeSnippet: (params) => {
    const raw = String(params?.freeTribes ?? '100');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    return `
    // [P3] Free for Tribe
    {
        let free_tribes: vector<u32> = vector[${ids.join(', ')}];
        let char_tribe_f = character.tribe();
        let mut f = 0u64;
        while (f < free_tribes.length()) {
            if (char_tribe_f == free_tribes[f]) {
                required_price = 0;
            };
            f = f + 1;
        };
    };`;
  },
};

// ---------------------------------------------------------------------------
// Revenue Chips (R1–R2) — how collected fees are handled
// ---------------------------------------------------------------------------

const R1_OWNER_COLLECT: Chip = {
  id: 'R1',
  category: 'revenue',
  selectionMode: 'radio',
  radioGroup: 'revenue_mode',
  label: 'Owner Collect',
  description: 'Transfer the payment directly to the gate owner.',
  defaultEnabled: true,
  codeSnippet: () => `
    // [R1] Owner Collect
    if (required_price > 0) {
        assert!(coin::value(&payment) >= required_price, EInsufficientPayment);
        if (coin::value(&payment) > required_price) {
            let change = payment.split(coin::value(&payment) - required_price, ctx);
            transfer::public_transfer(change, ctx.sender());
        };
        transfer::public_transfer(payment, toll_cfg.owner_address);
    } else {
        transfer::public_transfer(payment, ctx.sender());
    };`,
};

const R2_POOL_ACCUMULATE: Chip = {
  id: 'R2',
  category: 'revenue',
  selectionMode: 'radio',
  radioGroup: 'revenue_mode',
  label: 'Pool Accumulate',
  description: 'Accumulate fees in a contract balance pool (owner can withdraw later).',
  defaultEnabled: false,
  codeSnippet: () => `
    // [R2] Pool Accumulate
    if (required_price > 0) {
        assert!(coin::value(&payment) >= required_price, EInsufficientPayment);
        if (coin::value(&payment) > required_price) {
            let change = payment.split(coin::value(&payment) - required_price, ctx);
            transfer::public_transfer(change, ctx.sender());
        };
        let toll_cfg_mut = extension_config.borrow_rule_mut<TollConfigKey, TollConfig>(admin_cap_placeholder, TollConfigKey {});
        balance::join(&mut toll_cfg_mut.pool, coin::into_balance(payment));
    } else {
        transfer::public_transfer(payment, ctx.sender());
    };`,
};

// ---------------------------------------------------------------------------
// Item Chips (I1–I3) — bounty / item validation
// ---------------------------------------------------------------------------

const I1_SINGLE_ITEM: Chip = {
  id: 'I1',
  category: 'item',
  selectionMode: 'radio',
  radioGroup: 'item_mode',
  label: 'Single Item Type',
  description: 'Accept only one specific item type as bounty.',
  defaultEnabled: true,
  codeSnippet: () => `
    // [I1] Single Item Type
    assert!(extension_config.has_rule<BountyConfigKey>(BountyConfigKey {}), ENoBountyConfig);
    let bounty_cfg = extension_config.borrow_rule<BountyConfigKey, BountyConfig>(BountyConfigKey {});
    assert!(corpse.type_id() == bounty_cfg.bounty_type_id, EItemTypeMismatch);`,
};

const I2_MULTI_ITEM: Chip = {
  id: 'I2',
  category: 'item',
  selectionMode: 'radio',
  radioGroup: 'item_mode',
  label: 'Multi-Item Accept',
  description: 'Accept any of several item types as bounty.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'acceptedTypes',
      label: 'Accepted Item Type IDs (comma-separated)',
      type: 'string' as const,
      defaultValue: '1001,1002,1003',
      placeholder: 'e.g. 1001,1002,1003',
    },
  ],
  codeSnippet: (params) => {
    const raw = String(params?.acceptedTypes ?? '1001,1002,1003');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    return `
    // [I2] Multi-Item Accept
    {
        let accepted_types: vector<u64> = vector[${ids.join(', ')}];
        let submitted_type = corpse.type_id();
        let mut accepted = false;
        let mut m = 0u64;
        while (m < accepted_types.length()) {
            if (submitted_type == accepted_types[m]) { accepted = true; };
            m = m + 1;
        };
        assert!(accepted, EItemTypeNotAccepted);
    };`;
  },
};

const I3_MIN_QUANTITY: Chip = {
  id: 'I3',
  category: 'item',
  selectionMode: 'checkbox',
  label: 'Minimum Quantity',
  description: 'Require a minimum number of items to be submitted.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'minQuantity',
      label: 'Minimum quantity',
      type: 'number' as const,
      defaultValue: 5,
    },
  ],
  codeSnippet: (params) => {
    const qty = Number(params?.minQuantity ?? 5);
    return `
    // [I3] Minimum Quantity
    assert!(quantity >= ${qty}, EInsufficientQuantity);`;
  },
};

// ---------------------------------------------------------------------------
// Config Chips (C1) — permit expiry
// ---------------------------------------------------------------------------

const C1_FIXED_EXPIRY: Chip = {
  id: 'C1',
  category: 'config',
  selectionMode: 'checkbox',
  label: 'Fixed Expiry',
  description: 'Issue permits with a fixed expiry duration.',
  defaultEnabled: true,
  codeSnippet: () => '',  // Expiry logic is baked into the skeleton, C1 is always present
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const GATE_CHIPS: Chip[] = [
  A1_SINGLE_TRIBE,
  A2_MULTI_TRIBE,
  A3_TRIBE_BLACKLIST,
  P1_FIXED_PRICE,
  P2_TRIBE_DISCOUNT,
  P3_FREE_FOR_TRIBE,
  R1_OWNER_COLLECT,
  R2_POOL_ACCUMULATE,
  I1_SINGLE_ITEM,
  I2_MULTI_ITEM,
  I3_MIN_QUANTITY,
  C1_FIXED_EXPIRY,
];

/** Filter chips available for a specific gate template. */
export function chipsForTemplate(templateTag: string): Chip[] {
  const chipSets: Record<string, string[]> = {
    tribe_permit: ['A1', 'A2', 'A3', 'C1'],
    toll_gate:    ['P1', 'P2', 'P3', 'R1', 'R2', 'C1'],
    bounty_gate:  ['I1', 'I2', 'I3', 'C1'],
    open_permit:  ['C1'],
    multi_rule:   ['A1', 'A2', 'A3', 'P1', 'P2', 'P3', 'R1', 'R2', 'C1'],
  };
  const allowed = new Set(chipSets[templateTag] ?? []);
  return GATE_CHIPS.filter(c => allowed.has(c.id));
}
