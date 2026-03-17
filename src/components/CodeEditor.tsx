import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { rust } from '@codemirror/lang-rust';
import { yaml } from '@codemirror/lang-yaml';
import { EditorView } from '@codemirror/view';

export interface CodeEditorProps {
  value: string;
  path: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, path, onChange, readOnly = false }: CodeEditorProps) {
  const extensions = useMemo(() => {
    const baseExt = [EditorView.lineWrapping];
    if (path.endsWith('.toml')) return [yaml(), ...baseExt];
    if (path.endsWith('.move')) return [rust(), ...baseExt];
    return baseExt;
  }, [path]);

  const editorTheme = useMemo(
    () =>
      EditorView.theme(
        {
          '&.cm-editor': {
            backgroundColor: '#1E1E1E', 
            color: '#D4D4D4',
            height: '100%',
          },
          '.cm-scroller': { backgroundColor: 'transparent' },
          '.cm-content': {
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', monospace",
            fontSize: '13px',
            lineHeight: '1.6',
            padding: '12px 12px 12px 4px',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            borderRight: '1px solid #333333',
            color: '#858585',
            minWidth: '40px',
          },
          '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
          '.cm-activeLineGutter': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
          '.cm-selectionBackground': {
            backgroundColor: 'rgba(97, 153, 255, 0.2) !important',
          },
          '.cm-selectionMatch': {
            backgroundColor: 'rgba(97, 153, 255, 0.2)',
          },
          '.cm-cursor': { borderLeftColor: '#007acc' },
        },
        { dark: true },
      ),
    [],
  );

  return (
    <CodeMirror
      value={value}
      theme={editorTheme}
      extensions={extensions}
      onChange={onChange}
      readOnly={readOnly}
      height="100%"
      style={{
        height: '100%',
        width: '100%',
        display: 'block', // Ensures full height takeover
      }}
    />
  );
}
