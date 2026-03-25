/**
 * SSU chip definitions — shared across all Storage Unit templates.
 *
 * Categories:
 *   access  (A0–A2): Open / Tribe whitelist / Tribe blacklist
 *   pricing (V1–V4): Fixed price / Tribe discount / Free / Bulk discount
 *   revenue (R1):    Owner collect
 *   stock   (S1–S2): Single-item / Multi-item catalog
 *   item    (I0–I2): Any item / Item whitelist / Deposit only
 *   swap    (W1–W2): Fixed ratio / Multi-pair
 *   airdrop (D1–D3): Fixed airdrop / Claim once / Unlimited
 *
 * Chips whose `codeSnippet` returns '' are "structural" — their presence
 * is checked by `hasChip()` in the code generator to control struct
 * definitions, function signatures, and admin functions.
 */

import type { Chip } from '../chip-types';

// ---------------------------------------------------------------------------
// Access Chips (A0–A2) — shared across multiple SSU templates
// ---------------------------------------------------------------------------

const A0_OPEN_ACCESS: Chip = {
  id: 'A0',
  category: 'access',
  selectionMode: 'radio',
  radioGroup: 'ssu_access',
  label: 'Open Access',
  description: 'Anyone can interact — no restrictions.',
  defaultEnabled: true,
  codeSnippet: () => '',
};

const A1_TRIBE_WHITELIST: Chip = {
  id: 'A1',
  category: 'access',
  selectionMode: 'radio',
  radioGroup: 'ssu_access',
  label: 'Tribe Whitelist',
  description: 'Only characters from listed tribes may interact.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'allowedTribes',
      label: 'Allowed Tribe IDs (comma-separated)',
      type: 'string' as const,
      defaultValue: '100,200',
      placeholder: 'e.g. 100,200',
      phase: 'compile' as const,
    },
  ],
  codeSnippet: params => {
    const raw = String(params?.allowedTribes ?? '100,200');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    return `
    // [A1] Tribe Whitelist
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

const A2_TRIBE_BLACKLIST: Chip = {
  id: 'A2',
  category: 'access',
  selectionMode: 'radio',
  radioGroup: 'ssu_access',
  label: 'Tribe Blacklist',
  description: 'Block characters from listed tribes; everyone else may interact.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'blockedTribes',
      label: 'Blocked Tribe IDs (comma-separated)',
      type: 'string' as const,
      defaultValue: '500,600',
      placeholder: 'e.g. 500,600',
      phase: 'compile' as const,
    },
  ],
  codeSnippet: params => {
    const raw = String(params?.blockedTribes ?? '500,600');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    return `
    // [A2] Tribe Blacklist
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
// Pricing Chips (V1–V4) — Vending Machine
// ---------------------------------------------------------------------------

const V1_FIXED_PRICE: Chip = {
  id: 'V1',
  category: 'pricing',
  selectionMode: 'checkbox',
  label: 'Fixed Price',
  description: 'Each item has a fixed per-unit price in SUI.',
  defaultEnabled: true,
  configFields: [
    {
      key: 'pricePerUnit',
      label: 'Price per unit (MIST)',
      type: 'number' as const,
      defaultValue: 100_000_000,
      placeholder: '100000000 = 0.1 SUI',
      phase: 'post-deploy' as const,
    },
  ],
  codeSnippet: () => '', // Generator handles price reading based on S1/S2
};

const V2_TRIBE_DISCOUNT: Chip = {
  id: 'V2',
  category: 'pricing',
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
      phase: 'compile' as const,
    },
    {
      key: 'discountRate',
      label: 'Discounted price percentage (1–99)',
      type: 'number' as const,
      defaultValue: 80,
      phase: 'compile' as const,
    },
  ],
  codeSnippet: params => {
    const raw = String(params?.discountTribes ?? '100,200');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    const rate = Number(params?.discountRate ?? 80);
    return `
    // [V2] Tribe Discount
    {
        let discount_tribes: vector<u32> = vector[${ids.join(', ')}];
        let char_tribe_d = character.tribe();
        let mut d = 0u64;
        while (d < discount_tribes.length()) {
            if (char_tribe_d == discount_tribes[d]) {
                total_price = total_price * ${rate} / 100;
            };
            d = d + 1;
        };
    };`;
  },
};

const V3_FREE_FOR_TRIBE: Chip = {
  id: 'V3',
  category: 'pricing',
  selectionMode: 'checkbox',
  label: 'Free for Tribe',
  description: 'Members of specified tribes get items for free.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'freeTribes',
      label: 'Free Tribe IDs (comma-separated)',
      type: 'string' as const,
      defaultValue: '100',
      placeholder: 'e.g. 100',
      phase: 'compile' as const,
    },
  ],
  codeSnippet: params => {
    const raw = String(params?.freeTribes ?? '100');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    return `
    // [V3] Free for Tribe
    {
        let free_tribes: vector<u32> = vector[${ids.join(', ')}];
        let char_tribe_f = character.tribe();
        let mut f = 0u64;
        while (f < free_tribes.length()) {
            if (char_tribe_f == free_tribes[f]) {
                total_price = 0;
            };
            f = f + 1;
        };
    };`;
  },
};

const V4_BULK_DISCOUNT: Chip = {
  id: 'V4',
  category: 'pricing',
  selectionMode: 'checkbox',
  label: 'Bulk Discount',
  description: 'Discount applied when buying above a quantity threshold.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'bulkThreshold',
      label: 'Minimum quantity for discount',
      type: 'number' as const,
      defaultValue: 10,
      phase: 'compile' as const,
    },
    {
      key: 'bulkRate',
      label: 'Discounted price percentage (1–99)',
      type: 'number' as const,
      defaultValue: 90,
      phase: 'compile' as const,
    },
  ],
  codeSnippet: params => {
    const threshold = Number(params?.bulkThreshold ?? 10);
    const rate = Number(params?.bulkRate ?? 90);
    return `
    // [V4] Bulk Discount
    if (quantity >= ${threshold}) {
        total_price = total_price * ${rate} / 100;
    };`;
  },
};

// ---------------------------------------------------------------------------
// Revenue Chips (R1) — Vending Machine
// ---------------------------------------------------------------------------

const R1_OWNER_COLLECT: Chip = {
  id: 'R1',
  category: 'revenue',
  selectionMode: 'checkbox',
  label: 'Owner Collect',
  description: 'Transfer payment directly to the SSU owner.',
  defaultEnabled: true,
  configFields: [
    {
      key: 'ownerAddress',
      label: 'Owner address',
      type: 'string' as const,
      defaultValue: '',
      placeholder: 'Leave blank to use deployer wallet',
      phase: 'post-deploy' as const,
    },
  ],
  codeSnippet: () => '', // Generator handles revenue logic
};

// ---------------------------------------------------------------------------
// Stock Chips (S1–S2) — Vending Machine
// ---------------------------------------------------------------------------

const S1_SINGLE_ITEM: Chip = {
  id: 'S1',
  category: 'stock',
  selectionMode: 'radio',
  radioGroup: 'stock_mode',
  label: 'Single Item Type',
  description: 'Vending machine sells one item type at a single price.',
  defaultEnabled: true,
  codeSnippet: () => '',
};

const S2_MULTI_ITEM: Chip = {
  id: 'S2',
  category: 'stock',
  selectionMode: 'radio',
  radioGroup: 'stock_mode',
  label: 'Multi-Item Catalog',
  description: 'Vending machine sells multiple item types with independent pricing.',
  defaultEnabled: false,
  codeSnippet: () => '',
};

// ---------------------------------------------------------------------------
// Item Restriction Chips (I0–I2) — Gated Locker
// ---------------------------------------------------------------------------

const I0_ANY_ITEM: Chip = {
  id: 'I0',
  category: 'item',
  selectionMode: 'radio',
  radioGroup: 'item_mode',
  label: 'Any Item',
  description: 'No item type restrictions.',
  defaultEnabled: true,
  codeSnippet: () => '',
};

const I1_ITEM_WHITELIST: Chip = {
  id: 'I1',
  category: 'item',
  selectionMode: 'radio',
  radioGroup: 'item_mode',
  label: 'Item Whitelist',
  description: 'Only allow specific item types to be stored.',
  defaultEnabled: false,
  configFields: [
    {
      key: 'allowedItems',
      label: 'Allowed Item Type IDs (comma-separated)',
      type: 'string' as const,
      defaultValue: '1001,1002,1003',
      placeholder: 'e.g. 1001,1002',
      phase: 'compile' as const,
    },
  ],
  codeSnippet: params => {
    const raw = String(params?.allowedItems ?? '1001,1002,1003');
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    return `
    // [I1] Item Whitelist
    {
        let allowed_items: vector<u64> = vector[${ids.join(', ')}];
        let mut item_allowed = false;
        let mut k = 0u64;
        while (k < allowed_items.length()) {
            if (item_type_id == allowed_items[k]) { item_allowed = true; };
            k = k + 1;
        };
        assert!(item_allowed, EItemTypeNotAllowed);
    };`;
  },
};

const I2_DEPOSIT_ONLY: Chip = {
  id: 'I2',
  category: 'item',
  selectionMode: 'checkbox',
  label: 'Deposit Only',
  description: 'Only deposits are allowed — withdrawals are blocked.',
  defaultEnabled: false,
  codeSnippet: () => '', // Generator injects abort into withdraw function
};

// ---------------------------------------------------------------------------
// Swap Chips (W1–W2) — Item Swap
// ---------------------------------------------------------------------------

const W1_FIXED_RATIO: Chip = {
  id: 'W1',
  category: 'swap',
  selectionMode: 'radio',
  radioGroup: 'swap_mode',
  label: 'Fixed Ratio Swap',
  description: 'Exchange items at a fixed ratio (e.g. 3 ore → 1 metal).',
  defaultEnabled: true,
  configFields: [
    {
      key: 'inputTypeId',
      label: 'Input Item Type ID',
      type: 'number' as const,
      defaultValue: 1001,
      phase: 'post-deploy' as const,
    },
    {
      key: 'outputTypeId',
      label: 'Output Item Type ID',
      type: 'number' as const,
      defaultValue: 2001,
      phase: 'post-deploy' as const,
    },
    {
      key: 'ratioNum',
      label: 'Output ratio numerator',
      type: 'number' as const,
      defaultValue: 1,
      phase: 'post-deploy' as const,
    },
    {
      key: 'ratioDen',
      label: 'Output ratio denominator',
      type: 'number' as const,
      defaultValue: 3,
      phase: 'post-deploy' as const,
    },
  ],
  codeSnippet: () => '', // Generator handles swap logic structurally
};

const W2_MULTI_PAIR: Chip = {
  id: 'W2',
  category: 'swap',
  selectionMode: 'radio',
  radioGroup: 'swap_mode',
  label: 'Multi-Pair Swap',
  description: 'Support multiple swap pairs with independent ratios.',
  defaultEnabled: false,
  codeSnippet: () => '', // Generator handles swap logic structurally
};

// ---------------------------------------------------------------------------
// Airdrop Chips (D1–D3) — Airdrop Hub
// ---------------------------------------------------------------------------

const D1_FIXED_AIRDROP: Chip = {
  id: 'D1',
  category: 'airdrop',
  selectionMode: 'checkbox',
  label: 'Fixed Airdrop',
  description: 'Each claimant receives a fixed quantity of one item type.',
  defaultEnabled: true,
  configFields: [
    {
      key: 'itemTypeId',
      label: 'Airdrop Item Type ID',
      type: 'number' as const,
      defaultValue: 1001,
      phase: 'post-deploy' as const,
    },
    {
      key: 'quantity',
      label: 'Quantity per claim',
      type: 'number' as const,
      defaultValue: 1,
      phase: 'post-deploy' as const,
    },
  ],
  codeSnippet: () => '', // Generator handles airdrop logic
};

const D2_CLAIM_ONCE: Chip = {
  id: 'D2',
  category: 'airdrop',
  selectionMode: 'radio',
  radioGroup: 'claim_mode',
  label: 'Claim Once',
  description: 'Each character can claim the airdrop only once.',
  defaultEnabled: true,
  codeSnippet: () => '', // Generator handles claim tracking
};

const D3_UNLIMITED: Chip = {
  id: 'D3',
  category: 'airdrop',
  selectionMode: 'radio',
  radioGroup: 'claim_mode',
  label: 'Unlimited Claims',
  description: 'Characters can claim the airdrop multiple times.',
  defaultEnabled: false,
  codeSnippet: () => '',
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const SSU_CHIPS: Chip[] = [
  A0_OPEN_ACCESS, A1_TRIBE_WHITELIST, A2_TRIBE_BLACKLIST,
  V1_FIXED_PRICE, V2_TRIBE_DISCOUNT, V3_FREE_FOR_TRIBE, V4_BULK_DISCOUNT,
  R1_OWNER_COLLECT,
  S1_SINGLE_ITEM, S2_MULTI_ITEM,
  I0_ANY_ITEM, I1_ITEM_WHITELIST, I2_DEPOSIT_ONLY,
  W1_FIXED_RATIO, W2_MULTI_PAIR,
  D1_FIXED_AIRDROP, D2_CLAIM_ONCE, D3_UNLIMITED,
];

/** Filter chips available for a specific SSU template. */
export function chipsForTemplate(templateTag: string): Chip[] {
  const chipSets: Record<string, string[]> = {
    vending_machine: ['V1', 'V2', 'V3', 'V4', 'R1', 'S1', 'S2', 'A0', 'A1'],
    item_swap: ['W1', 'W2', 'A0', 'A1'],
    gated_locker: ['A1', 'A2', 'I0', 'I1', 'I2'],
    airdrop_hub: ['D1', 'D2', 'D3', 'A0', 'A1'],
    open_storage: [],
  };
  const allowed = new Set(chipSets[templateTag] ?? []);
  return SSU_CHIPS.filter(c => allowed.has(c.id));
}
