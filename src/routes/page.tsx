import { useNavigate } from '@modern-js/runtime/router';
import { useState, useMemo, useCallback } from 'react';
import { GATE_TEMPLATES, SSU_TEMPLATES, TURRET_TEMPLATES } from '@/templates';
import type { AssemblyTemplate, ChipTemplateConfig } from '@/templates/types';
import type { Chip } from '@/templates/chip-types';
import { ConfigForm } from '@/components/ConfigForm';
import { ChipSelector } from '@/components/ChipSelector';
import type { ChipSelectorResult } from '@/components/ChipSelector';
import { Navbar } from '@/components/Navbar';
import { StatusBar } from '@/components/StatusBar';
import { Engine, chipColor } from '@/components/Engine';
import type { EngineChip, EngineState } from '@/components/Engine';
import './page.css';

/* ── Component Group Definitions ── */
const COMPONENT_GROUPS: {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  desc: string;
  templates: AssemblyTemplate[];
}[] = [
  {
    key: 'gate',
    icon: '⬡',
    title: 'SMART GATE',
    subtitle: '星门控制器',
    desc: 'Control jump gate access — tribe permits, toll fees, bounty checks',
    templates: GATE_TEMPLATES,
  },
  {
    key: 'ssu',
    icon: '⬢',
    title: 'STORAGE UNIT',
    subtitle: '空间存储单元',
    desc: 'Programmable storage — vending, swap, airdrop, gated access',
    templates: SSU_TEMPLATES,
  },
  {
    key: 'turret',
    icon: '◎',
    title: 'TURRET',
    subtitle: '防御炮塔系统',
    desc: 'Automated defense — target selection, threat response',
    templates: TURRET_TEMPLATES,
  },
];

/* ── Chip category → color mapping ── */
const CATEGORY_COLORS: Record<string, string> = {
  exclude: '#FF4757', access: '#26DE81', weight: '#45AAF2',
  payment: '#FFC312', revenue: '#A55EEA', item: '#FF6348',
  config: '#778CA3', pricing: '#2BCBBA', stock: '#0ABDE3',
  swap: '#FD79A8', airdrop: '#A3CB38',
};

export default function IndexPage() {
  const navigate = useNavigate();

  /* Modal targets */
  const [configTarget, setConfigTarget] = useState<AssemblyTemplate | null>(null);
  const [chipTarget, setChipTarget] = useState<AssemblyTemplate | null>(null);

  /* Post-selection state */
  const [selectedTemplate, setSelectedTemplate] = useState<AssemblyTemplate | null>(null);
  const [chipResult, setChipResult] = useState<ChipSelectorResult | null>(null);
  const [configResult, setConfigResult] = useState<Record<string, unknown> | null>(null);

  /* Engine state */
  const engineChips: EngineChip[] = useMemo(() => {
    if (!chipResult || !selectedTemplate?.chipConfig) return [];
    const chipMap = new Map<string, Chip>(selectedTemplate.chipConfig.chips.map(c => [c.id, c]));
    return chipResult.selection.enabledChips
      .map(id => {
        const chip = chipMap.get(id);
        if (!chip) return null;
        return { id: chip.id, category: chip.category, label: chip.label, color: chipColor(chip.category) };
      })
      .filter(Boolean) as EngineChip[];
  }, [chipResult, selectedTemplate]);

  const engineState: EngineState = engineChips.length > 0 || configResult ? 'armed' : 'idle';

  /* Handlers */
  const handleTemplateClick = useCallback((tpl: AssemblyTemplate) => {
    if (tpl.chipConfig) {
      setChipTarget(tpl);
    } else if (tpl.configFields && tpl.configFields.length > 0) {
      setConfigTarget(tpl);
    } else {
      navigate(`/forge?template=${tpl.id}`);
    }
  }, [navigate]);

  const handleChipSubmit = useCallback((result: ChipSelectorResult) => {
    if (!chipTarget) return;
    setSelectedTemplate(chipTarget);
    setChipResult(result);
    setConfigResult(null);
    setChipTarget(null);
  }, [chipTarget]);

  const handleConfigSubmit = useCallback((values: Record<string, unknown>) => {
    if (!configTarget) return;
    setSelectedTemplate(configTarget);
    setConfigResult(values);
    setChipResult(null);
    setConfigTarget(null);
  }, [configTarget]);

  const handleReset = useCallback(() => {
    setSelectedTemplate(null);
    setChipResult(null);
    setConfigResult(null);
  }, []);

  const handleForge = useCallback(() => {
    if (!selectedTemplate) return;
    const config = chipResult
      ? { moduleName: chipResult.moduleName, enabledChips: chipResult.selection.enabledChips, chipConfigs: chipResult.selection.chipConfigs }
      : configResult;
    const params = new URLSearchParams();
    params.set('template', selectedTemplate.id);
    if (config) params.set('config', JSON.stringify(config));
    navigate(`/forge?${params.toString()}`);
  }, [selectedTemplate, chipResult, configResult, navigate]);

  const isConfigured = !!selectedTemplate;

  return (
    <div className="home">
      <Navbar stage="config" />

      {/* Chip selector modal */}
      {chipTarget?.chipConfig && (
        <ChipSelector
          title={chipTarget.label}
          chips={chipTarget.chipConfig.chips}
          presets={chipTarget.chipConfig.presets}
          categories={chipTarget.chipConfig.categories}
          defaultModuleName={chipTarget.chipConfig.defaultModuleName}
          onSubmit={handleChipSubmit}
          onCancel={() => setChipTarget(null)}
        />
      )}
      {configTarget?.configFields && (
        <ConfigForm
          fields={configTarget.configFields}
          templateLabel={configTarget.label}
          onSubmit={handleConfigSubmit}
          onCancel={() => setConfigTarget(null)}
        />
      )}

      <div className="home__body">
        {/* ── Left: Engine ── */}
        <div className="home__engine-area">
          <Engine state={engineState} chips={engineChips} size={380} />
          <p className="home__engine-hint">
            {isConfigured ? `${engineChips.length || '✓'} chip${engineChips.length !== 1 ? 's' : ''} loaded` : 'Select a component to begin'}
          </p>
        </div>

        {/* ── Right: Cards or Summary ── */}
        <div className="home__right">
          {!isConfigured ? (
            /* Component selection cards */
            <div className="home__cards">
              {COMPONENT_GROUPS.map((g, i) => (
                <div
                  key={g.key}
                  className={`comp-card comp-card--${g.key}`}
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  {/* Sheen overlay */}
                  <div className="comp-card__sheen" />

                  <div className="comp-card__header">
                    <span className="comp-card__icon">{g.icon}</span>
                    <div>
                      <h2 className="comp-card__title">{g.title}</h2>
                      <p className="comp-card__subtitle">{g.subtitle}</p>
                    </div>
                    <span className="comp-card__count">{g.templates.length}</span>
                  </div>

                  <p className="comp-card__desc">{g.desc}</p>

                  <div className="comp-card__templates">
                    {g.templates.map(tpl => (
                      <button
                        key={tpl.id}
                        type="button"
                        className="comp-card__tpl-btn"
                        onClick={() => handleTemplateClick(tpl)}
                      >
                        <span>{tpl.label}</span>
                        <span className="comp-card__tpl-arrow">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Capability summary */
            <div className="cap-summary" style={{ animation: 'fade-in-up 0.5s var(--ease-out-expo) both' }}>
              <div className="cap-summary__sheen" />
              <h3 className="cap-summary__title">ENGINE CONFIGURATION</h3>
              <div className="cap-summary__divider" />

              <div className="cap-summary__rows">
                <div className="cap-summary__row">
                  <span className="cap-summary__label">Component</span>
                  <span className="cap-summary__value">{selectedTemplate?.assemblyType}</span>
                </div>
                <div className="cap-summary__row">
                  <span className="cap-summary__label">Template</span>
                  <span className="cap-summary__value">{selectedTemplate?.label}</span>
                </div>
                {chipResult && (
                  <div className="cap-summary__row">
                    <span className="cap-summary__label">Module</span>
                    <span className="cap-summary__value cap-summary__value--mono">{chipResult.moduleName}</span>
                  </div>
                )}
              </div>

              {/* Active chips */}
              {engineChips.length > 0 && (
                <>
                  <div className="cap-summary__section-label">Active Chips</div>
                  <div className="cap-summary__chips">
                    {engineChips.map(c => (
                      <span
                        key={c.id}
                        className="cap-summary__chip"
                        style={{ '--cc': c.color } as React.CSSProperties}
                      >
                        <span className="cap-summary__chip-dot" />
                        {c.id} — {c.label}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div className="cap-summary__actions">
                <button type="button" className="cap-summary__btn cap-summary__btn--back" onClick={handleReset}>
                  ← Back
                </button>
                <button type="button" className="cap-summary__btn cap-summary__btn--forge" onClick={handleForge}>
                  Forge Engine ▶
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
