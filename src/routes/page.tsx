import { useNavigate } from '@modern-js/runtime/router';
import { useState, useMemo, useCallback } from 'react';
import { GATE_TEMPLATES, SSU_TEMPLATES, TURRET_TEMPLATES } from '@/templates';
import type { AssemblyTemplate } from '@/templates/types';
import type { Chip } from '@/templates/chip-types';
import { ConfigForm } from '@/components/ConfigForm';
import { ChipSelector } from '@/components/ChipSelector';
import type { ChipSelectorResult } from '@/components/ChipSelector';
import { StatusBar } from '@/components/StatusBar';
import { Engine, chipColor } from '@/components/Engine';
import type { EngineChip, EngineState } from '@/components/Engine';
import logoSvg from '@/assets/logo.svg';
import './page.css';

/* ── Component Group Definitions ── */
const COMPONENT_GROUPS: {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  desc: string;
  color: string;
  templates: AssemblyTemplate[];
}[] = [
  {
    key: 'gate',
    icon: '⬡',
    title: 'SMART GATE',
    subtitle: 'Access Control',
    desc: 'Control jump gate access with tribe permits, toll fees, and bounty checks',
    color: '#45AAF2',
    templates: GATE_TEMPLATES,
  },
  {
    key: 'ssu',
    icon: '⬢',
    title: 'STORAGE UNIT',
    subtitle: 'Programmable Storage',
    desc: 'Programmable storage for vending, swap, airdrop, and gated access',
    color: '#2BCBBA',
    templates: SSU_TEMPLATES,
  },
  {
    key: 'turret',
    icon: '◎',
    title: 'TURRET',
    subtitle: 'Auto Defense',
    desc: 'Automated defense with target selection and threat response',
    color: '#FF6348',
    templates: TURRET_TEMPLATES,
  },
];

export default function IndexPage() {
  const navigate = useNavigate();

  /* Two-level card state */
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

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
  const isConfigured = !!selectedTemplate;
  const activeGroup = COMPONENT_GROUPS.find(g => g.key === selectedGroup);

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
    setSelectedGroup(null);
  }, [chipTarget]);

  const handleConfigSubmit = useCallback((values: Record<string, unknown>) => {
    if (!configTarget) return;
    setSelectedTemplate(configTarget);
    setConfigResult(values);
    setChipResult(null);
    setConfigTarget(null);
    setSelectedGroup(null);
  }, [configTarget]);

  const handleReset = useCallback(() => {
    setSelectedTemplate(null);
    setChipResult(null);
    setConfigResult(null);
    setSelectedGroup(null);
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

  return (
    <div className="home">
      {/* Modals */}
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

      {/* ── Centered Header ── */}
      <header className="home__header">
        <div className="home__brand">
          <img src={logoSvg} alt="EasyAssemblies" className="home__logo" />
          <h1 className="home__title">EasyAssemblies</h1>
        </div>
        <p className="home__tagline">Build powerful EVE Frontier Smart Assemblies like building blocks</p>
      </header>

      {/* ── Main Content ── */}
      <div className="home__body">
        {/* Left: Engine (2/3) */}
        <div className="home__engine-area">
          <Engine state={engineState} chips={engineChips} size={460} />
          <p className="home__engine-hint">
            {isConfigured
              ? `${engineChips.length || '✓'} chip${engineChips.length !== 1 ? 's' : ''} loaded`
              : 'Select a component to begin'}
          </p>
        </div>

        {/* Right: Cards (1/3) */}
        <div className="home__right">
          {!isConfigured ? (
            !selectedGroup ? (
              /* ─── Level 1: Component Selection ─── */
              <div className="home__cards">
                {COMPONENT_GROUPS.map((g, i) => (
                  <button
                    key={g.key}
                    type="button"
                    className={`glass-card glass-card--${g.key}`}
                    style={{ '--gc': g.color, animationDelay: `${i * 0.1}s` } as React.CSSProperties}
                    onClick={() => setSelectedGroup(g.key)}
                  >
                    <div className="glass-card__sheen" />
                    <span className="glass-card__icon">{g.icon}</span>
                    <div className="glass-card__text">
                      <h2 className="glass-card__title">{g.title}</h2>
                      <p className="glass-card__subtitle">{g.subtitle}</p>
                    </div>
                    <span className="glass-card__count">{g.templates.length}</span>
                    <span className="glass-card__arrow">›</span>
                  </button>
                ))}
              </div>
            ) : (
              /* ─── Level 2: Template Selection ─── */
              <div className="home__templates" style={{ '--gc': activeGroup?.color } as React.CSSProperties}>
                <button
                  type="button"
                  className="home__templates-back"
                  onClick={() => setSelectedGroup(null)}
                >
                  ← Back
                </button>
                <div className="home__templates-header">
                  <span className="home__templates-icon">{activeGroup?.icon}</span>
                  <h2 className="home__templates-title">{activeGroup?.title}</h2>
                </div>
                <p className="home__templates-desc">{activeGroup?.desc}</p>
                <div className="home__templates-list">
                  {activeGroup?.templates.map((tpl, i) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className="tpl-card"
                      style={{ animationDelay: `${i * 0.06}s` }}
                      onClick={() => handleTemplateClick(tpl)}
                    >
                      <div className="tpl-card__sheen" />
                      <span className="tpl-card__label">{tpl.label}</span>
                      <span className="tpl-card__desc">{tpl.description}</span>
                      <span className="tpl-card__cta">
                        {tpl.chipConfig ? 'Configure chips →' : 'Select →'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* ─── Capability Summary ─── */
            <div className="cap-summary">
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
