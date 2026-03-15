import { useState } from 'react';
import { useMoveBuilder } from '@/hooks/useMoveBuilder';

export default function PlaygroundPage() {
  // Core state management
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedPath, setSelectedPath] = useState<string>('');

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

  // TODO: Tasks 1.4, 1.5, 1.6 will populate these areas
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
          <button
            onClick={onBuild}
            disabled={busy}
            style={{ marginRight: '8px', cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            {busy ? 'Building...' : 'Build'}
          </button>
          <button
            onClick={onDeploy}
            disabled={isPublishing || !buildOk}
            style={{ cursor: isPublishing || !buildOk ? 'not-allowed' : 'pointer' }}
          >
            {isPublishing ? 'Publishing...' : 'Deploy'}
          </button>
        </div>
        <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
          <p style={{ color: '#888', fontSize: '13px' }}>/* FileTree Placeholder */</p>
          <pre style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
            {selectedPath || 'No file selected'}
          </pre>
        </div>
      </div>

      {/* Main Column: Editor (Task 1.5) + Console (Task 1.6) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Editor Area */}
        <div style={{ flex: 1, padding: '16px', backgroundColor: '#1e1e1e' }}>
          <p style={{ color: '#888', fontSize: '13px' }}>/* CodeEditor Placeholder */</p>
        </div>

        {/* Console Area */}
        <div
          style={{
            height: '250px',
            borderTop: '1px solid #333',
            backgroundColor: '#111',
            padding: '12px',
            overflow: 'auto',
          }}
        >
          <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px 0' }}>/* Console Logger Placeholder */</p>
          {logs.map((log, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#aaa', fontFamily: 'monospace' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
