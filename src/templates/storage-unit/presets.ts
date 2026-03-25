/**
 * SSU preset definitions — curated chip combinations for each SSU template.
 */

import type { Preset } from '../chip-types';

// ---------------------------------------------------------------------------
// Vending Machine presets
// ---------------------------------------------------------------------------

export const VENDING_MACHINE_PRESETS: Preset[] = [
  {
    id: 'simple_vending',
    label: 'Simple Vending',
    description: 'Single item, fixed price, anyone can buy.',
    chips: ['V1', 'R1', 'S1', 'A0'],
  },
  {
    id: 'multi_item_shop',
    label: 'Multi-Item Shop',
    description: 'Multiple item types, each with an independent price.',
    chips: ['V1', 'R1', 'S2', 'A0'],
  },
  {
    id: 'tribal_shop',
    label: 'Tribal Shop',
    description: 'Only specific tribes can purchase, with a tribe discount.',
    chips: ['V1', 'V2', 'R1', 'S2', 'A1'],
    chipConfigs: {
      V2: { discountTribes: '100,200', discountRate: 80 },
      A1: { allowedTribes: '100,200,300' },
    },
  },
  {
    id: 'bulk_wholesale',
    label: 'Bulk Wholesale',
    description: 'Multi-item catalog with bulk purchase discounts.',
    chips: ['V1', 'V4', 'R1', 'S2', 'A0'],
    chipConfigs: { V4: { bulkThreshold: 10, bulkRate: 90 } },
  },
];

// ---------------------------------------------------------------------------
// Item Swap presets
// ---------------------------------------------------------------------------

export const ITEM_SWAP_PRESETS: Preset[] = [
  {
    id: 'simple_swap',
    label: 'Simple Swap',
    description: 'Single swap pair at a fixed ratio.',
    chips: ['W1', 'A0'],
  },
  {
    id: 'multi_swap_station',
    label: 'Multi-Swap Station',
    description: 'Multiple swap pairs with independent ratios.',
    chips: ['W2', 'A0'],
  },
  {
    id: 'tribal_refinery',
    label: 'Tribal Refinery',
    description: 'Only specific tribes can swap items.',
    chips: ['W1', 'A1'],
    chipConfigs: { A1: { allowedTribes: '100,200' } },
  },
];

// ---------------------------------------------------------------------------
// Gated Locker presets
// ---------------------------------------------------------------------------

export const GATED_LOCKER_PRESETS: Preset[] = [
  {
    id: 'guild_vault',
    label: 'Guild Vault',
    description: 'Shared warehouse for tribe members only.',
    chips: ['A1', 'I0'],
    chipConfigs: { A1: { allowedTribes: '100,200' } },
  },
  {
    id: 'collection_box',
    label: 'Collection Box',
    description: 'Accept specific items only — no withdrawals (donation box).',
    chips: ['A1', 'I1', 'I2'],
    chipConfigs: {
      A1: { allowedTribes: '100,200' },
      I1: { allowedItems: '1001,1002,1003' },
    },
  },
  {
    id: 'embargo_locker',
    label: 'Embargo Locker',
    description: 'Open to all except blacklisted tribes.',
    chips: ['A2', 'I0'],
    chipConfigs: { A2: { blockedTribes: '500,600' } },
  },
];

// ---------------------------------------------------------------------------
// Airdrop Hub presets
// ---------------------------------------------------------------------------

export const AIRDROP_HUB_PRESETS: Preset[] = [
  {
    id: 'one_time_airdrop',
    label: 'One-Time Airdrop',
    description: 'Each character can claim once — open to everyone.',
    chips: ['D1', 'D2', 'A0'],
  },
  {
    id: 'tribal_airdrop',
    label: 'Tribal Airdrop',
    description: 'Only specific tribes can claim, once per character.',
    chips: ['D1', 'D2', 'A1'],
    chipConfigs: { A1: { allowedTribes: '100,200' } },
  },
  {
    id: 'unlimited_supply',
    label: 'Unlimited Supply',
    description: 'No claim limit — suitable for renewable resources.',
    chips: ['D1', 'D3', 'A0'],
  },
];
