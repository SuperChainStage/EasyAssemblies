import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import { getTemplate } from '@/templates';
import { useMoveBuilder } from '@/hooks/useMoveBuilder';
import { FileTree, buildFileTree } from '@/components/FileTree';
import { CodeEditor } from '@/components/CodeEditor';
import { Console } from '@/components/Console';
import { ActionBar } from '@/components/ActionBar';

export default function PlaygroundPage() {
  // Core state management
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [showLogs, setShowLogs] = useState<boolean>(true);
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  useEffect(() => {
    if (!templateId) return;
    let didCancel = false;
    const fetchTemplate = async () => {
      const tpl = getTemplate(templateId);
      if (tpl) {
        const fileMap = await tpl.files();
        if (didCancel) return;
        setFiles(fileMap);
        const firstMove = Object.keys(fileMap).find((f) => f.endsWith('.move'));
        setSelectedPath(firstMove ?? Object.keys(fileMap)[0] ?? '');
      }
    };
    fetchTemplate();
    return () => { didCancel = true; };
  }, [templateId]);

  // Compiler & Deployment Hook
  const {
    busy,
    logs,
    buildOk,
    compiled,
    packageId,
    txDigest,
    isPublishing,
    onBuild,
    onDeploy,
  } = useMoveBuilder(files);

  // Build file tree from flat paths
  const fileTree = useMemo(() => buildFileTree(Object.keys(files)), [files]);

  // Handle editor changes
  const handleEditorChange = (value: string) => {
    if (selectedPath) {
      setFiles((prev) => ({
        ...prev,
        [selectedPath]: value,
      }));
    }
  };

  // TODO: Tasks 1.6 will populate console
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        backgroundColor: '#1E1E1E',
        color: '#fff',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Navbar */}
      <div style={{ height: '48px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: '#252526', flexShrink: 0 }}>
        <h1 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#ccc' }}>Assembly Forge</h1>
        {templateId ? (
          <span style={{ marginLeft: '16px', fontSize: '12px', color: '#888', backgroundColor: '#111', padding: '4px 8px', borderRadius: '4px', border: '1px solid #333' }}>
            Template: {getTemplate(templateId)?.label ?? templateId}
          </span>
        ) : (
          <span style={{ marginLeft: '16px', fontSize: '12px', color: '#888' }}>
            No template selected
          </span>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        {/* Sidebar: FileTree */}
        <div
          style={{
            width: '240px',
            borderRight: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#252526',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #333', color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Explorer
          </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <FileTree
            tree={fileTree}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
          />
        </div>
      </div>

      {/* Main Column: Editor (Task 1.5) + Console (Task 1.6) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Editor Area */}
        <div style={{ flex: 1, backgroundColor: '#1E1E1E', overflow: 'hidden' }}>
          {selectedPath ? (
            <CodeEditor
              value={files[selectedPath] ?? ''}
              path={selectedPath}
              onChange={handleEditorChange}
              readOnly={busy || isPublishing}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: '14px' }}>
              Select a file to edit
            </div>
          )}
        </div>

        <Console
          isOpen={showLogs}
          onToggle={() => setShowLogs(!showLogs)}
          logs={logs}
          packageId={packageId}
          txDigest={txDigest}
        />

        <ActionBar
          showLogs={showLogs}
          setShowLogs={setShowLogs}
          onBuild={onBuild}
          onDeploy={onDeploy}
          busy={busy}
          isPublishing={isPublishing}
          buildOk={buildOk}
        />
      </div>
    </div>
    </div>
  );
}
