import { ActionBar } from '@/components/ActionBar';
import { AuthorizePanel } from '@/components/AuthorizePanel';
import { CodeEditor } from '@/components/CodeEditor';
import { Console } from '@/components/Console';
import { FileTree, buildFileTree } from '@/components/FileTree';
import { Navbar } from '@/components/Navbar';
import { StatusBar } from '@/components/StatusBar';
import { useNetworkVariable } from '@/config/dapp-kit';
import { useMoveBuilder } from '@/hooks/useMoveBuilder';
import { getTemplate } from '@/templates';
import type { ConfigField, ChipTemplateConfig } from '@/templates/types';
import type { Chip } from '@/templates/chip-types';
import { useNavigate, useSearchParams } from '@modern-js/runtime/router';
import { useEffect, useMemo, useState } from 'react';
import './page.css';

export default function PlaygroundPage() {
  // Core state management
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [showLogs, setShowLogs] = useState<boolean>(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const templateId = searchParams.get('template');
  const explorerBaseUrl = useNetworkVariable('explorerBaseUrl');

  const template = templateId ? getTemplate(templateId) : undefined;

  const activeConfig = useMemo<Record<string, unknown> | undefined>(() => {
    try {
      const raw = searchParams.get('config');
      if (raw) return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      /* use defaults */
    }
    return undefined;
  }, [searchParams]);

  // Redirect to home if no template or template not found
  useEffect(() => {
    if (!templateId || !getTemplate(templateId)) {
      navigate('/', { replace: true });
    }
  }, [templateId, navigate]);

  useEffect(() => {
    if (!templateId) return;
    let didCancel = false;
    const fetchTemplate = async () => {
      const tpl = getTemplate(templateId);
      if (tpl) {
        let config: Record<string, unknown> | undefined;
        try {
          const raw = searchParams.get('config');
          if (raw) config = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          /* use defaults */
        }
        const fileMap = await tpl.files(config);
        if (didCancel) return;
        setFiles(fileMap);
        const firstMove = Object.keys(fileMap).find(f => f.endsWith('.move'));
        setSelectedPath(firstMove ?? Object.keys(fileMap)[0] ?? '');
      }
    };
    fetchTemplate();
    return () => {
      didCancel = true;
    };
  }, [templateId, searchParams]);

  // Compiler & Deployment Hook
  const {
    busy,
    logs,
    buildOk,
    compiled,
    packageId,
    txDigest,
    isPublishing,
    postDeployConfig,
    onBuild,
    onDeploy,
    onRetryPostDeployConfig,
    onRefreshPostDeployConfig,
  } = useMoveBuilder(files, {
    templateId,
    config: activeConfig,
  });

  const buildReady = useMemo(() => {
    return (
      typeof files['Move.toml'] === 'string' &&
      Object.keys(files).some(
        path => path !== 'Move.toml' && path.endsWith('.move'),
      )
    );
  }, [files]);

  // Build file tree from flat paths
  const fileTree = useMemo(() => buildFileTree(Object.keys(files)), [files]);

  // Handle editor changes
  const handleEditorChange = (value: string) => {
    if (selectedPath) {
      setFiles(prev => ({
        ...prev,
        [selectedPath]: value,
      }));
    }
  };

  // TODO: Tasks 1.6 will populate console
  return (
    <div className="pg">
      {/* Navbar */}
      <Navbar
        left={
          <button
            type="button"
            className="ev-navbar__back-btn"
            onClick={() => navigate('/')}
            title="Back to templates"
          >
            ← Back
          </button>
        }
        title="Assembly Forge"
        badge={template?.label}
      />

      <div className="pg__body">
        {/* Sidebar */}
        <aside className="pg__sidebar">
          <div className="pg__sidebar-header">Explorer</div>
          <div className="pg__sidebar-tree">
            <FileTree
              tree={fileTree}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          </div>

          {template?.chipConfig && activeConfig ? (
            <ChipSummary
              chipConfig={template.chipConfig}
              values={activeConfig}
            />
          ) : template?.configFields && activeConfig ? (
            <ConfigSummary
              fields={template.configFields}
              values={activeConfig}
            />
          ) : null}
        </aside>

        {/* Main column */}
        <div className="pg__main">
          <div className="pg__editor">
            {selectedPath ? (
              <CodeEditor
                value={files[selectedPath] ?? ''}
                path={selectedPath}
                onChange={handleEditorChange}
                readOnly={busy || isPublishing}
              />
            ) : (
              <div className="pg__editor-placeholder">
                {buildReady ? 'Select a file to edit' : 'Loading template…'}
              </div>
            )}
          </div>

          <Console
            isOpen={showLogs}
            onToggle={() => setShowLogs(!showLogs)}
            logs={logs}
            packageId={packageId}
            txDigest={txDigest}
            postDeployConfig={postDeployConfig}
            onRetryPostDeployConfig={onRetryPostDeployConfig}
            onRefreshPostDeployConfig={onRefreshPostDeployConfig}
            explorerBaseUrl={explorerBaseUrl}
          />

          {packageId && template && (
            <AuthorizePanel
              componentType={template.assemblyType}
              extensionPackageId={packageId}
              explorerBaseUrl={explorerBaseUrl}
            />
          )}

          <ActionBar
            showLogs={showLogs}
            setShowLogs={setShowLogs}
            onBuild={onBuild}
            onDeploy={onDeploy}
            busy={busy}
            buildReady={buildReady}
            isPublishing={isPublishing}
            buildOk={buildOk}
          />
        </div>
      </div>

      <StatusBar
        buildStatus={busy ? 'building' : buildOk === true ? 'success' : buildOk === false ? 'error' : 'idle'}
        deployStatus={isPublishing ? 'deploying' : packageId ? 'success' : 'idle'}
      />
    </div>
  );
}

function ConfigSummary({
  fields,
  values,
}: {
  fields: ConfigField[];
  values: Record<string, unknown>;
}) {
  const compileFields = fields.filter(f => f.phase === 'compile');
  const postDeployFields = fields.filter(f => f.phase === 'post-deploy');
  const ungroupedFields = fields.filter(f => !f.phase);

  const renderRow = (f: ConfigField) => {
    const val = values[f.key] ?? f.defaultValue;
    const isDefault =
      val === f.defaultValue || String(val) === String(f.defaultValue);
    return (
      <div
        key={f.key}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          padding: '3px 0',
        }}
      >
        <span style={{ fontSize: '11px', color: '#8b949e', flexShrink: 0 }}>
          {f.label}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: isDefault ? '#6b7280' : '#e6edf3',
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={String(val)}
        >
          {String(val)}
        </span>
      </div>
    );
  };

  const renderSection = (
    label: string,
    color: string,
    items: ConfigField[],
  ) => {
    if (items.length === 0) return null;
    return (
      <div
        key={label}
        style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color,
          }}
        >
          {label}
        </span>
        {items.map(renderRow)}
      </div>
    );
  };

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-dim)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontFamily: 'var(--font-display)',
        }}
      >
        Config
      </span>
      {renderSection('Compile-time', '#6366f1', compileFields)}
      {renderSection('Post-deploy', '#8b949e', postDeployFields)}
      {ungroupedFields.length > 0 && ungroupedFields.map(renderRow)}
    </div>
  );
}

function ChipSummary({
  chipConfig,
  values,
}: {
  chipConfig: ChipTemplateConfig;
  values: Record<string, unknown>;
}) {
  const enabledIds: string[] = Array.isArray(values.enabledChips)
    ? (values.enabledChips as string[])
    : [];
  const moduleName = typeof values.moduleName === 'string' ? values.moduleName : chipConfig.defaultModuleName;
  const chipMap = new Map<string, Chip>(chipConfig.chips.map(c => [c.id, c]));

  const categoryColors: Record<string, string> = {
    exclude: '#f87171',
    weight: '#60a5fa',
    access: '#34d399',
    payment: '#fbbf24',
    revenue: '#c084fc',
    item: '#fb923c',
    config: '#94a3b8',
    pricing: '#2dd4bf',
    stock: '#38bdf8',
    swap: '#f472b6',
    airdrop: '#a3e635',
  };

  return (
    <div
      style={{
        borderTop: '1px solid #333',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0,
        overflow: 'auto',
      }}
    >
      <span
        style={{
          fontSize: '12px',
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Chips
      </span>

      {/* Module name */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#6b7280' }}>Package</span>
        <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#a5b4fc' }}>
          {moduleName}
        </span>
      </div>

      {/* Chip tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {enabledIds.map(id => {
          const chip = chipMap.get(id);
          if (!chip) return null;
          const color = categoryColors[chip.category] ?? '#8b949e';
          return (
            <span
              key={id}
              title={chip.label}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                padding: '2px 6px',
                borderRadius: '4px',
                color,
                background: `${color}18`,
                border: `1px solid ${color}30`,
                lineHeight: '1.2',
              }}
            >
              {id}
            </span>
          );
        })}
        {enabledIds.length === 0 && (
          <span style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic' }}>
            No chips selected
          </span>
        )}
      </div>
    </div>
  );
}
