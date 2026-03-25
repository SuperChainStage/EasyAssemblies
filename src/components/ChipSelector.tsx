import { useState, useCallback, useMemo } from 'react';
import type { Chip, Preset, ChipSelection, ChipConfigField } from '@/templates/chip-types';
import { resolveConflicts, matchesPreset } from '@/templates/chip-types';
import './ChipSelector.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChipSelectorProps {
  /** Modal title — e.g. "Turret — Targeting Extension" */
  title: string;
  /** All available chips for this template. */
  chips: Chip[];
  /** Curated presets. */
  presets: Preset[];
  /** Category display config: label, icon, css class. */
  categories: CategoryMeta[];
  /** Whether to show the module-name input. */
  showModuleName?: boolean;
  defaultModuleName?: string;
  onSubmit: (result: ChipSelectorResult) => void;
  onCancel: () => void;
}

export interface CategoryMeta {
  key: string;
  label: string;
  icon: string;
}

export interface ChipSelectorResult {
  moduleName: string;
  selection: ChipSelection;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChipSelector({
  title,
  chips,
  presets,
  categories,
  showModuleName = true,
  defaultModuleName = '',
  onSubmit,
  onCancel,
}: ChipSelectorProps) {
  // ── State ──
  const [moduleName, setModuleName] = useState(defaultModuleName);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<string[]>(() =>
    presets[0]?.chips ? [...presets[0].chips] : chips.filter(c => c.defaultEnabled).map(c => c.id),
  );
  const [chipConfigs, setChipConfigs] = useState<Record<string, Record<string, unknown>>>(() =>
    presets[0]?.chipConfigs ? structuredClone(presets[0].chipConfigs) : {},
  );
  const [conflictFlash, setConflictFlash] = useState<string[]>([]);
  const [configErrors, setConfigErrors] = useState<Record<string, Record<string, string>>>({});

  // ── Derived ──
  const activePreset = useMemo(() =>
    presets.find(p => matchesPreset(enabled, p))?.id ?? null,
  [enabled, presets]);

  const chipById = useMemo(() => {
    const map = new Map<string, Chip>();
    for (const c of chips) map.set(c.id, c);
    return map;
  }, [chips]);

  const conflictingIds = useMemo(() => {
    const set = new Set<string>();
    for (const id of enabled) {
      const chip = chipById.get(id);
      if (chip?.conflictsWith) {
        for (const cid of chip.conflictsWith) {
          if (!enabled.includes(cid)) set.add(cid);
        }
      }
    }
    return set;
  }, [enabled, chipById]);

  const enabledByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of enabled) {
      const cat = chipById.get(id)?.category;
      if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [enabled, chipById]);

  // ── Handlers ──
  const toggleChip = useCallback((id: string) => {
    setEnabled(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      const toDisable = resolveConflicts(id, chips, prev);
      if (toDisable.length > 0) {
        setConflictFlash(toDisable);
        setTimeout(() => setConflictFlash([]), 600);
      }
      return [...prev.filter(x => !toDisable.includes(x)), id];
    });
  }, [chips]);

  const applyPreset = useCallback((preset: Preset) => {
    setEnabled([...preset.chips]);
    setChipConfigs(preset.chipConfigs ? structuredClone(preset.chipConfigs) : {});
  }, []);

  const setCustom = useCallback(() => {
    setEnabled(chips.filter(c => c.defaultEnabled).map(c => c.id));
    setChipConfigs({});
  }, [chips]);

  const updateChipConfig = useCallback((chipId: string, key: string, value: unknown) => {
    setChipConfigs(prev => ({
      ...prev,
      [chipId]: { ...prev[chipId], [key]: value },
    }));
  }, []);

  const validateModuleName = useCallback((v: string) => {
    if (!v) return 'Required.';
    if (!/^[a-z_][a-z0-9_]*$/.test(v)) return 'Lowercase letters, digits, underscores only.';
    if (v.length > 64) return 'Max 64 characters.';
    return null;
  }, []);

  const handleModuleChange = useCallback((v: string) => {
    setModuleName(v);
    setModuleError(validateModuleName(v));
  }, [validateModuleName]);

  const handleSubmit = useCallback(() => {
    const err = validateModuleName(moduleName);
    if (err) { setModuleError(err); return; }

    // Validate compile-time config fields
    const nextConfigErrors: Record<string, Record<string, string>> = {};
    let hasConfigError = false;
    for (const chipId of enabled) {
      const chip = chipById.get(chipId);
      if (!chip?.configFields) continue;
      const compileFields = chip.configFields.filter(
        (f: ChipConfigField) => f.phase === 'compile' || !f.phase,
      );
      if (compileFields.length === 0) continue;
      const cfg = chipConfigs[chipId] ?? {};
      for (const f of compileFields) {
        const val = cfg[f.key] ?? f.defaultValue;
        const strVal = String(val ?? '').trim();
        if (!strVal) {
          if (!nextConfigErrors[chipId]) nextConfigErrors[chipId] = {};
          nextConfigErrors[chipId][f.key] = 'Required';
          hasConfigError = true;
        }
      }
    }
    setConfigErrors(nextConfigErrors);
    if (hasConfigError) return;

    onSubmit({
      moduleName,
      selection: { enabledChips: enabled, chipConfigs },
    });
  }, [moduleName, enabled, chipConfigs, chipById, onSubmit, validateModuleName]);

  // ── Render helpers ──
  const renderChipConfig = (chip: Chip) => {
    if (!chip.configFields || !enabled.includes(chip.id)) return null;
    const cfg = chipConfigs[chip.id] ?? {};
    const errs = configErrors[chip.id] ?? {};
    return (
      <div className={`chip-config-panel ${enabled.includes(chip.id) ? 'open' : ''}`}>
        {chip.configFields.map((f: ChipConfigField) => (
          <div key={f.key} className="chip-config-field">
            <label className="chip-config-field-label">{f.label}</label>
            {f.type === 'enum' && f.options ? (
              <select
                className="chip-config-field-select"
                value={String(cfg[f.key] ?? f.defaultValue)}
                onChange={e => updateChipConfig(chip.id, f.key, e.target.value)}
                onClick={e => e.stopPropagation()}
              >
                {f.options.map(o => (
                  <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={`chip-config-field-input ${errs[f.key] ? 'has-error' : ''}`}
                type={f.type === 'number' ? 'number' : 'text'}
                value={String(cfg[f.key] ?? f.defaultValue)}
                placeholder={f.placeholder}
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  const val = f.type === 'number' ? Number(e.target.value) : e.target.value;
                  updateChipConfig(chip.id, f.key, val);
                  if (errs[f.key]) {
                    setConfigErrors(prev => {
                      const next = { ...prev };
                      if (next[chip.id]) {
                        const { [f.key]: _, ...rest } = next[chip.id];
                        next[chip.id] = rest;
                      }
                      return next;
                    });
                  }
                }}
              />
            )}
            {errs[f.key] && <span className="chip-config-field-error">⚠ {errs[f.key]}</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderChipCard = (chip: Chip) => {
    const isEnabled = enabled.includes(chip.id);
    const isConflict = conflictingIds.has(chip.id);
    const isFlashing = conflictFlash.includes(chip.id);
    const cat = chip.category;

    return (
      <div
        key={chip.id}
        className={[
          'chip-card',
          isEnabled ? 'enabled' : '',
          cat,
          isConflict ? 'conflict' : '',
          isFlashing ? 'flash' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => !isConflict && toggleChip(chip.id)}
      >
        <div className="chip-card-main">
          <div className="chip-card-toggle">
            <span className="chip-card-toggle-check">&#10003;</span>
          </div>
          <div className="chip-card-info">
            <div className="chip-card-name">
              <span className={`chip-card-id ${cat}`}>{chip.id}</span>
              <span className="chip-card-label">{chip.label}</span>
            </div>
            <div className="chip-card-desc">{chip.description}</div>
          </div>
          {isConflict && (
            <span className="chip-card-conflict">conflict</span>
          )}
        </div>
        {renderChipConfig(chip)}
      </div>
    );
  };

  return (
    <div className="chip-overlay" onClick={onCancel}>
      <div className="chip-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="chip-header">
          <div className="chip-header-title">{title}</div>
          <div className="chip-header-sub">
            Select chips to compose your targeting strategy, or pick a preset.
          </div>
        </div>

        {/* Module name */}
        {showModuleName && (
          <div className="chip-module-row">
            <span className="chip-module-label">Package</span>
            <input
              className={`chip-module-input ${moduleError ? 'has-error' : ''}`}
              type="text"
              value={moduleName}
              placeholder="e.g. my_turret_extension"
              onChange={e => handleModuleChange(e.target.value)}
            />
            {moduleError && <span className="chip-module-error">{moduleError}</span>}
          </div>
        )}

        {/* Preset ribbon */}
        <div className="chip-presets">
          <span className="chip-preset-label">Presets</span>
          <button
            type="button"
            className={`chip-preset-btn custom ${activePreset === null ? 'active' : ''}`}
            onClick={setCustom}
          >
            Custom
          </button>
          {presets.map(p => (
            <button
              key={p.id}
              type="button"
              className={`chip-preset-btn ${activePreset === p.id ? 'active' : ''}`}
              onClick={() => applyPreset(p)}
              title={p.description}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Body: chip categories */}
        <div className="chip-body">
          {categories.map(cat => {
            const catChips = chips.filter(c => c.category === cat.key);
            if (catChips.length === 0) return null;
            const count = catChips.filter(c => enabled.includes(c.id)).length;
            return (
              <div key={cat.key} className="chip-category">
                <div className="chip-category-header">
                  <span className="chip-category-icon">{cat.icon}</span>
                  <span className={`chip-category-label ${cat.key}`}>{cat.label}</span>
                  <span className="chip-category-count">{count}/{catChips.length}</span>
                </div>
                <div className="chip-grid">
                  {catChips.map(renderChipCard)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="chip-footer">
          <div className="chip-footer-summary">
            {categories
              .filter(cat => (enabledByCategory[cat.key] ?? 0) > 0)
              .map((cat, i) => (
                <span key={cat.key}>
                  {i > 0 && ' + '}
                  <span>{enabledByCategory[cat.key]}</span> {cat.label.toLowerCase()}
                </span>
              ))}
            {' = '}
            <span>{enabled.length}</span> chips
          </div>
          <div className="chip-footer-actions">
            <button type="button" className="chip-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="chip-btn-submit" onClick={handleSubmit}>
              Generate &amp; Open Playground
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
