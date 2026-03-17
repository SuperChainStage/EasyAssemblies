import React from 'react';

/* ── Types ─────────────────────────────────────────────── */

export type FileTreeNode = {
  name: string;
  path?: string;         // defined only on leaf files
  children?: FileTreeNode[];
};

/* ── Build flat-path list into a tree ───────────────────── */

export function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const fullPath of paths) {
    const parts = fullPath.split('/');
    let nodes = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      let node = nodes.find((n) => n.name === name);
      if (!node) {
        node = { name, ...(isFile ? { path: fullPath } : { children: [] }) };
        nodes.push(node);
      }
      if (!isFile) nodes = node.children!;
    }
  }

  // Sort: folders before files, then alphabetically
  const sortTree = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      const aFile = Boolean(a.path);
      const bFile = Boolean(b.path);
      if (aFile !== bFile) return aFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => n.children && sortTree(n.children));
  };
  sortTree(root);
  return root;
}

/* ── Recursive FileTree component ──────────────────────── */

export function FileTree({
  tree,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  tree: FileTreeNode[];
  selectedPath: string;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  return (
    <>
      {tree.map((node) => {
        const isFile = Boolean(node.path);
        const isSelected = node.path === selectedPath;

        return (
          <div key={node.path ?? `dir-${node.name}-${depth}`}>
            <div
              style={{
                paddingLeft: 12 + depth * 14,
                paddingTop: 4,
                paddingBottom: 4,
                paddingRight: 8,
                cursor: isFile ? 'pointer' : 'default',
                backgroundColor: isSelected ? 'rgba(99,102,241,0.2)' : 'transparent',
                borderLeft: isSelected ? '2px solid #6366f1' : '2px solid transparent',
                color: isSelected ? '#c7d2fe' : isFile ? '#d1d5db' : '#9ca3af',
                fontSize: '13px',
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                userSelect: 'none',
                transition: 'background-color 0.1s',
              }}
              onClick={() => isFile && node.path && onSelect(node.path)}
            >
              <span style={{ fontSize: '12px' }}>{isFile ? '📄' : '📁'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {node.name}
              </span>
            </div>
            {node.children && (
              <FileTree
                tree={node.children}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
