import { useNavigate, useSearchParams } from '@modern-js/runtime/router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { getTemplate } from '@/templates';
import type { ConfigField, ChipTemplateConfig } from '@/templates/types';
import type { Chip } from '@/templates/chip-types';
import { useMoveBuilder } from '@/hooks/useMoveBuilder';
import { Engine, chipColor } from '@/components/Engine';
import type { EngineChip, EngineState } from '@/components/Engine';
import { Navbar } from '@/components/Navbar';
import { StatusBar } from '@/components/StatusBar';
import { FileTree, buildFileTree } from '@/components/FileTree';
import { CodeEditor } from '@/components/CodeEditor';
import { Console } from '@/components/Console';
import { useNetworkVariable } from '@/config/dapp-kit';
import './page.css';

export default function ForgePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const explorerBaseUrl = useNetworkVariable('explorerBaseUrl');

  const template = templateId ? getTemplate(templateId) : undefined;
  const activeConfig = useMemo<Record<string, unknown> | undefined>(() => {
    try {
      const raw = searchParams.get('config');
      if (raw) return JSON.parse(raw) as Record<string, unknown>;
    } catch { /* */ }
    return undefined;
  }, [searchParams]);

  useEffect(() => {
    if (!templateId || !getTemplate(templateId)) navigate('/', { replace: true });
  }, [templateId, navigate]);

  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedPath, setSelectedPath] = useState('');

  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    const load = async () => {
      const tpl = getTemplate(templateId);
      if (!tpl) return;
      const raw = searchParams.get('config');
      const cfg = raw ? (JSON.parse(raw) as Record<string, unknown>) : undefined;
      const fm = await tpl.files(cfg);
      if (cancelled) return;
      setFiles(fm);
      const first = Object.keys(fm).find(f => f.endsWith('.move'));
      setSelectedPath(first ?? Object.keys(fm)[0] ?? '');
    };
    load();
    return () => { cancelled = true; };
  }, [templateId, searchParams]);

  const {
    busy, logs, buildOk, compiled, packageId, txDigest,
    isPublishing, postDeployConfig,
    onBuild, onDeploy, onRetryPostDeployConfig, onRefreshPostDeployConfig,
  } = useMoveBuilder(files, { templateId, config: activeConfig });

  const buildReady = useMemo(
    () => typeof files['Move.toml'] === 'string' && Object.keys(files).some(p => p !== 'Move.toml' && p.endsWith('.move')),
    [files],
  );

  /* Expert / iOS code window */
  const [codeOpen, setCodeOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const fileTree = useMemo(() => buildFileTree(Object.keys(files)), [files]);

  const handleEditorChange = useCallback((value: string) => {
    if (selectedPath) setFiles(prev => ({ ...prev, [selectedPath]: value }));
  }, [selectedPath]);

  /* Engine chips */
  const engineChips: EngineChip[] = useMemo(() => {
    if (!activeConfig || !template?.chipConfig) return [];
    const enabledIds = (activeConfig.enabledChips ?? []) as string[];
    const chipMap = new Map<string, Chip>(template.chipConfig.chips.map(c => [c.id, c]));
    return enabledIds.map(id => {
      const chip = chipMap.get(id);
      return chip ? { id: chip.id, category: chip.category, label: chip.label, color: chipColor(chip.category) } : null;
    }).filter(Boolean) as EngineChip[];
  }, [activeConfig, template]);

  const engineState: EngineState = useMemo(() => {
    if (busy) return 'forging';
    if (buildOk === false) return 'error';
    if (buildOk === true) return 'done';
    return 'armed';
  }, [busy, buildOk]);

  const handleForge = useCallback(async () => {
    await onBuild();
  }, [onBuild]);

  useEffect(() => {
    if (buildOk === true && compiled) {
      sessionStorage.setItem('forge_compiled', JSON.stringify(compiled));
      sessionStorage.setItem('forge_template', templateId ?? '');
      sessionStorage.setItem('forge_config', searchParams.get('config') ?? '');
      const t = setTimeout(() => navigate(`/deploy?template=${templateId}`), 1200);
      return () => clearTimeout(t);
    }
  }, [buildOk, compiled, templateId, searchParams, navigate]);

  return (
    <div className="forge">
      <Navbar
        left={
          <button type="button" className="ev-navbar__back-btn" onClick={() => navigate(-1 as unknown as string)}>
            ← Back
          </button>
        }
        title="Assembly Forge"
        badge={template?.label}
      />

      <div className="forge__body">
        {/* Central area — Engine OR iOS Code Window */}
        <div className="forge__center">
          {!codeOpen ? (
            /* ── Engine View ── */
            <div className="forge__engine-col">
              <Engine state={engineState} chips={engineChips} size={320} />

              <div className="forge__status-text">
                {busy ? 'Compiling modules…' :
                 buildOk === true ? 'Forge complete — deploying…' :
                 buildOk === false ? 'Compilation failed' :
                 `${engineChips.length} chip${engineChips.length !== 1 ? 's' : ''} loaded — ready to forge`}
              </div>

              <div className="forge__actions">
                <button type="button" className="forge__btn forge__btn--back" onClick={() => navigate(-1 as unknown as string)}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="forge__btn forge__btn--forge"
                  disabled={!buildReady || busy || buildOk === true}
                  onClick={handleForge}
                >
                  {busy ? '⏳ Forging…' : buildOk === true ? '✓ Done' : '⚒ Forge Engine'}
                </button>
              </div>

              <button
                type="button"
                className="forge__expert-toggle"
                onClick={() => setCodeOpen(true)}
              >
                ▸ Expert Mode — View Source Code
              </button>
            </div>
          ) : (
            /* ── iOS-style Code Window (replaces engine) ── */
            <div className="forge__ios-window">
              {/* Title Bar */}
              <div className="forge__ios-titlebar">
                <div className="forge__ios-dots">
                  <span className="forge__ios-dot forge__ios-dot--red" onClick={() => setCodeOpen(false)} />
                  <span className="forge__ios-dot forge__ios-dot--yellow" />
                  <span className="forge__ios-dot forge__ios-dot--green" />
                </div>
                <span className="forge__ios-filename">
                  {selectedPath || 'No file selected'}
                </span>
                <button
                  type="button"
                  className="forge__ios-close"
                  onClick={() => setCodeOpen(false)}
                  title="Close code editor"
                >
                  ✕
                </button>
              </div>

              {/* Window Body */}
              <div className="forge__ios-body">
                <aside className="forge__ios-sidebar">
                  <div className="forge__ios-sidebar-header">EXPLORER</div>
                  <div className="forge__ios-sidebar-tree">
                    <FileTree tree={fileTree} selectedPath={selectedPath} onSelect={setSelectedPath} />
                  </div>

                  {template?.chipConfig && activeConfig && (
                    <ForgeChipSummary chipConfig={template.chipConfig} values={activeConfig} />
                  )}
                  {template?.configFields && activeConfig && !template?.chipConfig && (
                    <ForgeConfigSummary fields={template.configFields} values={activeConfig} />
                  )}
                </aside>

                <div className="forge__ios-code-area">
                  <div className="forge__ios-editor">
                    {selectedPath ? (
                      <CodeEditor
                        value={files[selectedPath] ?? ''}
                        path={selectedPath}
                        onChange={handleEditorChange}
                        readOnly={busy || isPublishing}
                      />
                    ) : (
                      <div className="forge__ios-editor-placeholder">Select a file to edit</div>
                    )}
                  </div>
                  <Console
                    isOpen={showLogs}
                    onToggle={() => setShowLogs(!showLogs)}
                    logs={logs}
                    explorerBaseUrl={explorerBaseUrl}
                  />
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="forge__ios-bottombar">
                <button type="button" className="forge__btn forge__btn--back" onClick={() => setCodeOpen(false)}>
                  ← Engine View
                </button>
                <button
                  type="button"
                  className="forge__btn forge__btn--forge"
                  disabled={!buildReady || busy || buildOk === true}
                  onClick={handleForge}
                >
                  {busy ? '⏳ Forging…' : buildOk === true ? '✓ Done' : '⚒ Forge Engine'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <StatusBar
        buildStatus={busy ? 'building' : buildOk === true ? 'success' : buildOk === false ? 'error' : 'idle'}
      />
    </div>
  );
}

/* ── Inline helper components ── */
function ForgeChipSummary({ chipConfig, values }: { chipConfig: ChipTemplateConfig; values: Record<string, unknown> }) {
  const enabledIds = (values.enabledChips ?? []) as string[];
  const moduleName = typeof values.moduleName === 'string' ? values.moduleName : chipConfig.defaultModuleName;
  const chipMap = new Map<string, Chip>(chipConfig.chips.map(c => [c.id, c]));

  return (
    <div className="forge__chip-summary">
      <div className="forge__chip-summary-head">
        <span className="forge__chip-summary-label">Chips</span>
        <span className="forge__chip-summary-module">{moduleName}</span>
      </div>
      <div className="forge__chip-tags">
        {enabledIds.map(id => {
          const chip = chipMap.get(id);
          if (!chip) return null;
          const c = chipColor(chip.category);
          return (
            <span key={id} className="forge__chip-tag" style={{ color: c, borderColor: `${c}40`, background: `${c}10` }} title={chip.label}>
              {id}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ForgeConfigSummary({ fields, values }: { fields: ConfigField[]; values: Record<string, unknown> }) {
  return (
    <div className="forge__chip-summary">
      <div className="forge__chip-summary-head">
        <span className="forge__chip-summary-label">Config</span>
      </div>
      {fields.map(f => (
        <div key={f.key} className="forge__config-row">
          <span>{f.label}</span>
          <span>{String(values[f.key] ?? f.defaultValue ?? '—')}</span>
        </div>
      ))}
    </div>
  );
}
