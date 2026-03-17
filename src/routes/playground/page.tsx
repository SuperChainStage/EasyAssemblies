import { useState, useMemo } from 'react';
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
        height: '100vh',
        width: '100%',
        backgroundColor: '#1e1e1e',
        color: '#fff',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Sidebar: Actions + FileTree (Task 1.4) */}
      <div
        style={{
          width: '270px',
          borderRight: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#252526',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #333' }}>
          <h2 style={{ fontSize: '14px', margin: '0 0 12px 0', color: '#ccc' }}>
            Assembly Forge
          </h2>
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
  );
}
