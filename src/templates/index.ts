import type { AssemblyTemplate } from './types';
import { gateTribePermit } from './gate/smart_gate_tribe_permit';
import { gateToll } from './gate/smart_gate_toll';
import { gateBounty } from './gate/smart_gate_bounty';
import { gateOpenPermit } from './gate/smart_gate_open_permit';
import { gateMultiRule } from './gate/smart_gate_multi_rule';
import { turretTargeting } from './turret/turret_targeting';
import { helloWorldTest } from './test/hello_world';
import { ssuOpenStorage } from './storage-unit/ssu_open_storage';
import { ssuGatedLocker } from './storage-unit/ssu_gated_locker';
import { ssuVendingMachine } from './storage-unit/ssu_vending_machine';
import { ssuItemSwap } from './storage-unit/ssu_item_swap';
import { ssuAirdropHub } from './storage-unit/ssu_airdrop_hub';

// --- Template Groups by Assembly Type ---
export const GATE_TEMPLATES: AssemblyTemplate[] = [
  gateTribePermit,
  gateToll,
  gateBounty,
  gateOpenPermit,
  gateMultiRule,
];
export const SSU_TEMPLATES: AssemblyTemplate[] = [
  ssuVendingMachine,
  ssuItemSwap,
  ssuGatedLocker,
  ssuAirdropHub,
  ssuOpenStorage,
];
export const TURRET_TEMPLATES: AssemblyTemplate[] = [turretTargeting];
export const TEST_TEMPLATES: AssemblyTemplate[] = [helloWorldTest];

export const ALL_TEMPLATES: AssemblyTemplate[] = [
  ...GATE_TEMPLATES,
  ...SSU_TEMPLATES,
  ...TURRET_TEMPLATES,
  ...TEST_TEMPLATES,
];

export function getTemplate(id: string): AssemblyTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}
