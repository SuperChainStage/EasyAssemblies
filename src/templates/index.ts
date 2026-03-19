import { AssemblyTemplate } from './types';
import { smartGateTribePermit } from './gate/smart_gate_tribe_permit';

export const TEMPLATES: Record<string, AssemblyTemplate> = {
  [smartGateTribePermit.id]: smartGateTribePermit,
};

export function getTemplate(id: string): AssemblyTemplate | undefined {
  return TEMPLATES[id];
}
