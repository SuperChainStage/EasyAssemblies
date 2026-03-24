/**
 * Universal chip architecture types.
 *
 * These types power the "pluggable chip" system across all assembly types
 * (Turret, Gate, SSU). A Chip is a code snippet that gets injected into
 * a Move function body at compile time. Presets are curated chip combinations.
 */

// ---------------------------------------------------------------------------
// Chip config field — parameters that a chip exposes to the user
// ---------------------------------------------------------------------------

export interface ChipConfigField {
  key: string;
  label: string;
  type: 'number' | 'number[]' | 'string' | 'enum';
  defaultValue: unknown;
  placeholder?: string;
  options?: { label: string; value: unknown }[];
  phase?: 'compile' | 'post-deploy';
}

// ---------------------------------------------------------------------------
// Chip — a pluggable code snippet
// ---------------------------------------------------------------------------

export interface Chip {
  id: string;
  category: string;
  selectionMode: 'checkbox' | 'radio';
  /** Chips sharing a radioGroup are mutually exclusive (radio mode). */
  radioGroup?: string;
  label: string;
  description: string;
  /** Generate the Move code snippet for this chip. */
  codeSnippet: (params?: Record<string, unknown>) => string;
  /** IDs of chips that conflict with this one (both directions implied). */
  conflictsWith?: string[];
  /** Extra parameters the user must configure when this chip is enabled. */
  configFields?: ChipConfigField[];
  /** Whether this chip is enabled by default in "Custom" mode. */
  defaultEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Preset — a curated combination of chips
// ---------------------------------------------------------------------------

export interface Preset {
  id: string;
  label: string;
  description: string;
  /** Chip IDs to enable. */
  chips: string[];
  /** Default parameter overrides keyed by chipId then configField key. */
  chipConfigs?: Record<string, Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// ChipSelection — runtime state of the chip selector UI
// ---------------------------------------------------------------------------

export interface ChipSelection {
  enabledChips: string[];
  chipConfigs: Record<string, Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve conflicts: if `adding` conflicts with any currently enabled chip, return the IDs to disable. */
export function resolveConflicts(
  adding: string,
  chips: Chip[],
  currentlyEnabled: string[],
): string[] {
  const chip = chips.find(c => c.id === adding);
  if (!chip) return [];

  const toDisable: string[] = [];

  // Explicit conflicts
  if (chip.conflictsWith) {
    for (const cid of chip.conflictsWith) {
      if (currentlyEnabled.includes(cid)) toDisable.push(cid);
    }
  }

  // Radio group exclusion
  if (chip.selectionMode === 'radio' && chip.radioGroup) {
    for (const other of chips) {
      if (
        other.id !== adding &&
        other.radioGroup === chip.radioGroup &&
        currentlyEnabled.includes(other.id)
      ) {
        toDisable.push(other.id);
      }
    }
  }

  return toDisable;
}

/** Check whether a chip selection matches a preset exactly. */
export function matchesPreset(selection: string[], preset: Preset): boolean {
  if (selection.length !== preset.chips.length) return false;
  const sorted = [...selection].sort();
  const presetSorted = [...preset.chips].sort();
  return sorted.every((id, i) => id === presetSorted[i]);
}
