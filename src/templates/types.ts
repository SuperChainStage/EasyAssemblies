import type { Chip, Preset } from './chip-types';
import type { CategoryMeta } from '@/components/ChipSelector';

/** File path mapped to file content */
export type FileMap = Record<string, string>;

/** EVE Frontier Smart Assembly Template Definition */
export interface AssemblyTemplate {
  id: string;
  label: string;
  assemblyType: 'gate' | 'storage_unit' | 'turret';
  description: string;
  detail: string;
  files: (config?: Record<string, unknown>) => FileMap | Promise<FileMap>;
  /** Simple key-value config fields (shown in ConfigForm modal). */
  configFields?: ConfigField[];
  /** Chip-based config (shown in ChipSelector modal). Takes precedence over configFields. */
  chipConfig?: ChipTemplateConfig;
}

/** Describes a template that uses the pluggable chip system. */
export interface ChipTemplateConfig {
  chips: Chip[];
  presets: Preset[];
  categories: CategoryMeta[];
  defaultModuleName: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'string' | 'number';
  defaultValue: string | number;
  placeholder?: string;
  validate?: (value: unknown) => string | null;
  /** 'compile' = baked into generated Move code; 'post-deploy' = set on-chain after deployment */
  phase?: 'compile' | 'post-deploy';
}
