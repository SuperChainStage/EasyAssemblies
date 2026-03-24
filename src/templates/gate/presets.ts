/**
 * Gate preset definitions — curated chip combinations for each Gate template.
 */

import type { Preset } from '../chip-types';

// ---------------------------------------------------------------------------
// Tribe Permit presets
// ---------------------------------------------------------------------------

export const TRIBE_PERMIT_PRESETS: Preset[] = [
  {
    id: 'single_tribe',
    label: 'Single Tribe',
    description: 'Only one tribe may pass through.',
    chips: ['A1', 'C1'],
  },
  {
    id: 'alliance',
    label: 'Alliance',
    description: 'Multiple allied tribes may pass through.',
    chips: ['A2', 'C1'],
    chipConfigs: { A2: { allowedTribes: '100,200,300' } },
  },
  {
    id: 'embargo',
    label: 'Embargo',
    description: 'Block specific tribes; everyone else passes.',
    chips: ['A3', 'C1'],
    chipConfigs: { A3: { blockedTribes: '500,600' } },
  },
];

// ---------------------------------------------------------------------------
// Toll Gate presets
// ---------------------------------------------------------------------------

export const TOLL_GATE_PRESETS: Preset[] = [
  {
    id: 'simple_toll',
    label: 'Simple Toll',
    description: 'Fixed price, fees go to the gate owner.',
    chips: ['P1', 'R1', 'C1'],
  },
  {
    id: 'alliance_discount',
    label: 'Alliance Discount',
    description: 'Allied tribes get a discounted fare.',
    chips: ['P1', 'P2', 'R1', 'C1'],
    chipConfigs: { P2: { discountTribes: '100,200', discountPct: 50 } },
  },
  {
    id: 'friendly_gate',
    label: 'Friendly Gate',
    description: 'Allied tribes pass free; others pay.',
    chips: ['P1', 'P3', 'R1', 'C1'],
    chipConfigs: { P3: { freeTribes: '100' } },
  },
  {
    id: 'treasury_toll',
    label: 'Treasury Toll',
    description: 'Fees accumulate in a contract pool for DAO-style withdrawal.',
    chips: ['P1', 'R2', 'C1'],
  },
];

// ---------------------------------------------------------------------------
// Bounty Gate presets
// ---------------------------------------------------------------------------

export const BOUNTY_GATE_PRESETS: Preset[] = [
  {
    id: 'simple_bounty',
    label: 'Simple Bounty',
    description: 'Submit a single item type to gain passage.',
    chips: ['I1', 'C1'],
  },
  {
    id: 'multi_bounty',
    label: 'Multi-Bounty',
    description: 'Accept any of several item types.',
    chips: ['I2', 'C1'],
    chipConfigs: { I2: { acceptedTypes: '1001,1002,1003' } },
  },
  {
    id: 'bulk_bounty',
    label: 'Bulk Bounty',
    description: 'Require a minimum quantity of items.',
    chips: ['I1', 'I3', 'C1'],
    chipConfigs: { I3: { minQuantity: 5 } },
  },
];

// ---------------------------------------------------------------------------
// Open Permit presets
// ---------------------------------------------------------------------------

export const OPEN_PERMIT_PRESETS: Preset[] = [
  {
    id: 'open_default',
    label: 'Open Gate',
    description: 'Anyone can request a permit — no restrictions.',
    chips: ['C1'],
  },
];

// ---------------------------------------------------------------------------
// Multi-Rule Gate presets
// ---------------------------------------------------------------------------

export const MULTI_RULE_PRESETS: Preset[] = [
  {
    id: 'tribe_toll',
    label: 'Tribe + Toll',
    description: 'Only the configured tribe may pass, and they must pay.',
    chips: ['A1', 'P1', 'R1', 'C1'],
  },
  {
    id: 'vip_gate',
    label: 'VIP Gate',
    description: 'Whitelisted tribes pass free; everyone else pays.',
    chips: ['A2', 'P1', 'P3', 'R1', 'C1'],
    chipConfigs: {
      A2: { allowedTribes: '100,200,300' },
      P3: { freeTribes: '100,200,300' },
    },
  },
  {
    id: 'embargo_toll',
    label: 'Embargo + Toll',
    description: 'Blacklisted tribes are blocked; everyone else pays.',
    chips: ['A3', 'P1', 'R1', 'C1'],
    chipConfigs: { A3: { blockedTribes: '500,600' } },
  },
];
