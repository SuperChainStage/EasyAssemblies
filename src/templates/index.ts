import type { AssemblyTemplate } from './types';
import { smartGateTribePermit } from './gate/smart_gate_tribe_permit';

// --- Template Groups by Assembly Type ---
export const GATE_TEMPLATES: AssemblyTemplate[] = [smartGateTribePermit];
export const SSU_TEMPLATES: AssemblyTemplate[] = [];     // Phase 5 fill-in
export const TURRET_TEMPLATES: AssemblyTemplate[] = [];  // Phase 5 fill-in

export const ALL_TEMPLATES: AssemblyTemplate[] = [
  ...GATE_TEMPLATES,
  ...SSU_TEMPLATES,
  ...TURRET_TEMPLATES,
];

export function getTemplate(id: string): AssemblyTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}
