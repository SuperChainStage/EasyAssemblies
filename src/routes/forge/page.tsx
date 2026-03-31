import { useNavigate, useSearchParams } from '@modern-js/runtime/router';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { getTemplate } from '@/templates';
import type { ConfigField, ChipTemplateConfig } from '@/templates/types';
import type { Chip } from '@/templates/chip-types';
import { useMoveBuilder } from '@/hooks/useMoveBuilder';
import { Engine, chipColor } from '@/components/Engine';
import type { EngineChip, EngineState } from '@/components/Engine';
import { StatusBar } from '@/components/StatusBar';
import { FileTree, buildFileTree } from '@/components/FileTree';
import { CodeEditor } from '@/components/CodeEditor';
import { Console } from '@/components/Console';
import { useNetworkVariable } from '@/config/dapp-kit';
import './page.css';

/* ── Resize clamp constants ── */
const SIDEBAR_MIN = 140;
const SIDEBAR_MAX = 380;
const CONSOLE_MIN = 60;
const CONSOLE_MAX = 400;

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

  /* Save compiled data but do NOT auto-navigate */
  useEffect(() => {
    if (buildOk === true && compiled) {
      sessionStorage.setItem('forge_compiled', JSON.stringify(compiled));
      sessionStorage.setItem('forge_template', templateId ?? '');
      sessionStorage.setItem('forge_config', searchParams.get('config') ?? '');
    }
  }, [buildOk, compiled, templateId, searchParams]);

  const handleDeploy = useCallback(() => {
    navigate(`/deploy?template=${templateId}`);
  }, [navigate, templateId]);

  /* ── Drag-resize sidebar ── */
  const [sidebarW, setSidebarW] = useState(200);
  const [consoleH, setConsoleH] = useState(140);
  const dragRef = useRef<{ kind: 'sidebar' | 'console'; start: number; startVal: number } | null>(null);

  const onDragStart = useCallback((kind: 'sidebar' | 'console', e: React.MouseEvent) => {
    e.preventDefault();
    const start = kind === 'sidebar' ? e.clientX : e.clientY;
    const startVal = kind === 'sidebar' ? sidebarW : consoleH;
    dragRef.current = { kind, start, startVal };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      if (dragRef.current.kind === 'sidebar') {
        const delta = ev.clientX - dragRef.current.start;
        setSidebarW(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, dragRef.current.startVal + delta)));
      } else {
        const delta = dragRef.current.start - ev.clientY;
        setConsoleH(Math.min(CONSOLE_MAX, Math.max(CONSOLE_MIN, dragRef.current.startVal + delta)));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [sidebarW, consoleH]);

  /* Chip label list */
  const chipSummaryText = engineChips.map(c => c.id).join(', ') || (activeConfig ? 'Custom config' : '—');

  return (
    <div className="forge">
      {/* ── Custom Header (no Navbar) ── */}
      <header className="forge__header">
        <button type="button" className="forge__back" onClick={() => navigate(-1 as unknown as string)}>
          ← Back
        </button>
      </header>

      <div className="forge__body">
        {/* Central area — Engine OR iOS Code Window */}
        <div className="forge__center">
          {!codeOpen ? (
            /* ── Engine View ── */
            <div className="forge__engine-col">
              <h2 className="forge__page-title">ASSEMBLY FORGE</h2>
              <p className="forge__page-desc">Compile and forge your Smart Assembly engine</p>

              <Engine state={engineState} chips={engineChips} size={300} />

              <div className="forge__chip-list">
                <span className="forge__chip-list-label">Chips:</span>
                <span className="forge__chip-list-value">{chipSummaryText}</span>
              </div>

              <div className="forge__status-text">
                {busy ? 'Compiling modules…' :
                 buildOk === true ? 'Forge complete ✓' :
                 buildOk === false ? 'Compilation failed' :
                 `${engineChips.length} chip${engineChips.length !== 1 ? 's' : ''} loaded — ready to forge`}
              </div>

              <div className="forge__actions">
                {buildOk === true ? (
                  <button type="button" className="forge__btn forge__btn--forge" onClick={handleDeploy}>
                    Continue to Deploy ▶
                  </button>
                ) : (
                  <button
                    type="button"
                    className="forge__btn forge__btn--forge"
                    disabled={!buildReady || busy}
                    onClick={handleForge}
                  >
                    {busy ? '⏳ Forging…' : '⚒ Forge Engine'}
                  </button>
                )}
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
                <aside className="forge__ios-sidebar" style={{ width: sidebarW }}>
                  <div className="forge__ios-sidebar-header">EXPLORER</div>
                  <div className="forge__ios-sidebar-tree">
                    <FileTree tree={fileTree} selectedPath={selectedPath} onSelect={setSelectedPath} />
                  </div>
                </aside>

                {/* Drag handle — sidebar ↔ editor */}
                <div
                  className="forge__resize-handle forge__resize-handle--v"
                  onMouseDown={e => onDragStart('sidebar', e)}
                />

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

                  {/* Drag handle — editor ↔ console */}
                  <div
                    className="forge__resize-handle forge__resize-handle--h"
                    onMouseDown={e => onDragStart('console', e)}
                  />

                  <div style={{ height: consoleH, flexShrink: 0 }}>
                    <Console
                      isOpen={showLogs}
                      onToggle={() => setShowLogs(!showLogs)}
                      logs={logs}
                      explorerBaseUrl={explorerBaseUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="forge__ios-bottombar">
                <button type="button" className="forge__btn forge__btn--back" onClick={() => setCodeOpen(false)}>
                  ← Engine View
                </button>

                {/* Center info */}
                <div className="forge__ios-bottombar-info">
                  {template?.chipConfig && activeConfig && (
                    <ForgeChipSummary chipConfig={template.chipConfig} values={activeConfig} />
                  )}
                  {template?.configFields && activeConfig && !template?.chipConfig && (
                    <ForgeConfigSummary fields={template.configFields} values={activeConfig} />
                  )}
                </div>

                {buildOk === true ? (
                  <button type="button" className="forge__btn forge__btn--forge" onClick={handleDeploy}>
                    Deploy ▶
                  </button>
                ) : (
                  <button
                    type="button"
                    className="forge__btn forge__btn--forge"
                    disabled={!buildReady || busy}
                    onClick={handleForge}
                  >
                    {busy ? '⏳ Forging…' : '⚒ Forge'}
                  </button>
                )}
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
    <div className="forge__bottombar-chips">
      <span className="forge__bottombar-chips-label">{moduleName}</span>
      <span className="forge__bottombar-chips-sep">·</span>
      {enabledIds.slice(0, 4).map(id => {
        const chip = chipMap.get(id);
        if (!chip) return null;
        const c = chipColor(chip.category);
        return (
          <span key={id} className="forge__bottombar-tag" style={{ color: c }} title={chip.label}>
            {id}
          </span>
        );
      })}
      {enabledIds.length > 4 && <span className="forge__bottombar-tag">+{enabledIds.length - 4}</span>}
    </div>
  );
}

function ForgeConfigSummary({ fields, values }: { fields: ConfigField[]; values: Record<string, unknown> }) {
  return (
    <div className="forge__bottombar-chips">
      {fields.slice(0, 3).map(f => (
        <span key={f.key} className="forge__bottombar-tag" title={f.label}>
          {f.label}: {String(values[f.key] ?? f.defaultValue ?? '—')}
        </span>
      ))}
    </div>
  );
}
