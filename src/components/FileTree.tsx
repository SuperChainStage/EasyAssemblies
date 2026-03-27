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
        const ext = isFile ? node.name.split('.').pop() : '';
        const icon = !isFile ? '📁' : ext === 'move' ? '⚡' : ext === 'toml' ? '⚙' : '📄';

        return (
          <div key={node.path ?? `dir-${node.name}-${depth}`}>
            <div
              style={{
                paddingLeft: 12 + depth * 14,
                paddingTop: 4,
                paddingBottom: 4,
                paddingRight: 8,
                cursor: isFile ? 'pointer' : 'default',
                backgroundColor: isSelected ? 'rgba(0, 242, 255, 0.08)' : 'transparent',
                borderLeft: isSelected ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                color: isSelected ? 'var(--accent-cyan)' : isFile ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                userSelect: 'none',
                transition: 'background-color 0.12s, color 0.12s',
              }}
              onClick={() => isFile && node.path && onSelect(node.path)}
              onMouseEnter={(e) => {
                if (isFile && !isSelected) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0, 242, 255, 0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '12px', flexShrink: 0 }}>{icon}</span>
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
