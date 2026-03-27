import { useNavigate } from '@modern-js/runtime/router';
import { useState } from 'react';
import { GATE_TEMPLATES, SSU_TEMPLATES, TURRET_TEMPLATES, TEST_TEMPLATES } from '@/templates';
import type { AssemblyTemplate } from '@/templates/types';
import { ConfigForm } from '@/components/ConfigForm';
import { ChipSelector } from '@/components/ChipSelector';
import type { ChipSelectorResult } from '@/components/ChipSelector';
import { Navbar } from '@/components/Navbar';
import { StatusBar } from '@/components/StatusBar';
import './page.css';

const ASSEMBLY_GROUPS: {
  icon: string;
  label: string;
  accentClass: string;
  templates: AssemblyTemplate[];
}[] = [
  { icon: '🛡️', label: 'Smart Gate', accentClass: 'group--gate', templates: GATE_TEMPLATES },
  { icon: '📦', label: 'Storage Unit', accentClass: 'group--ssu', templates: SSU_TEMPLATES },
  { icon: '🔫', label: 'Turret', accentClass: 'group--turret', templates: TURRET_TEMPLATES },
  { icon: '🧪', label: 'Pipeline Test', accentClass: 'group--test', templates: TEST_TEMPLATES },
];

function TemplateCard({
  template,
  onClick,
}: {
  template: AssemblyTemplate;
  onClick: () => void;
}) {
  const hasChips = !!template.chipConfig;
  return (
    <button type="button" className="tpl-card" onClick={onClick}>
      <span className="tpl-card__label">{template.label}</span>
      <span className="tpl-card__desc">{template.description}</span>
      <span className="tpl-card__action">
        {hasChips ? 'Configure chips →' : 'Open in Playground →'}
      </span>
    </button>
  );
}

export default function IndexPage() {
  const navigate = useNavigate();
  const [configTarget, setConfigTarget] = useState<AssemblyTemplate | null>(null);
  const [chipTarget, setChipTarget] = useState<AssemblyTemplate | null>(null);

  const handleTemplateClick = (tpl: AssemblyTemplate) => {
    if (tpl.chipConfig) {
      setChipTarget(tpl);
    } else if (tpl.configFields && tpl.configFields.length > 0) {
      setConfigTarget(tpl);
    } else {
      navigate(`/playground?template=${tpl.id}`);
    }
  };

  const handleConfigSubmit = (values: Record<string, unknown>) => {
    if (!configTarget) return;
    const params = new URLSearchParams();
    params.set('template', configTarget.id);
    params.set('config', JSON.stringify(values));
    navigate(`/playground?${params.toString()}`);
    setConfigTarget(null);
  };

  const handleChipSubmit = (result: ChipSelectorResult) => {
    if (!chipTarget) return;
    const config = {
      moduleName: result.moduleName,
      enabledChips: result.selection.enabledChips,
      chipConfigs: result.selection.chipConfigs,
    };
    const params = new URLSearchParams();
    params.set('template', chipTarget.id);
    params.set('config', JSON.stringify(config));
    navigate(`/playground?${params.toString()}`);
    setChipTarget(null);
  };

  return (
    <div className="home">
      <Navbar />

      {/* Modals */}
      {configTarget?.configFields && (
        <ConfigForm
          fields={configTarget.configFields}
          templateLabel={configTarget.label}
          onSubmit={handleConfigSubmit}
          onCancel={() => setConfigTarget(null)}
        />
      )}
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

      {/* Starfield background */}
      <div className="home__stars" aria-hidden="true" />

      {/* Main content */}
      <main className="home__main">
        {/* Hero */}
        <header className="home__hero">
          <span className="home__hero-badge">EVE Frontier</span>
          <h1 className="home__hero-title">EasyAssemblies</h1>
          <p className="home__hero-sub">
            Deploy smart assemblies in clicks, not code.
          </p>
        </header>

        {/* Template Groups */}
        <div className="home__groups">
          {ASSEMBLY_GROUPS.map(group => (
            <section key={group.label} className={`home__group ${group.accentClass}`}>
              <div className="home__group-header">
                <span className="home__group-icon">{group.icon}</span>
                <span className="home__group-label">{group.label}</span>
                <span className="home__group-count">{group.templates.length}</span>
              </div>

              {group.templates.length > 0 ? (
                <div className="home__group-grid">
                  {group.templates.map(tpl => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      onClick={() => handleTemplateClick(tpl)}
                    />
                  ))}
                </div>
              ) : (
                <div className="home__group-empty">Coming soon…</div>
              )}
            </section>
          ))}
        </div>
      </main>

      <StatusBar />
    </div>
  );
}
