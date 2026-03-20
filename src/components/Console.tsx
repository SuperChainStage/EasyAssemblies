import type { PostDeployConfigState } from '@/hooks/useMoveBuilder';
import type React from 'react';
import { useEffect, useRef } from 'react';
import './Console.css';

// ANSI sequence mapped to CSS colors
type AnsiColorMap = Record<number, string>;
// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape parsing needs to match ESC-prefixed color codes.
const ANSI_REGEX = /\u001b\[[0-9;]*m/g;
const ANSI_COLORS: AnsiColorMap = {
  30: '#e2e8f0',
  31: '#f87171',
  32: '#4ade80',
  33: '#fbbf24',
  34: '#60a5fa',
  35: '#c084fc',
  36: '#2dd4bf',
  37: '#cbd5f5',
  90: '#94a3b8',
  91: '#fca5a5',
  92: '#86efac',
  93: '#fde047',
  94: '#93c5fd',
  95: '#e9d5ff',
  96: '#5eead4',
  97: '#f8fafc',
};

/** Parse ANSI sequence and return react nodes */
function renderAnsi(text: string, colorMap: AnsiColorMap): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let currentColor: string | null = null;
  let isBold = false;
  let lastIndex = 0;
  let key = 0;

  const flush = (chunk: string) => {
    if (!chunk) return;
    const style: React.CSSProperties = {};
    if (currentColor) style.color = currentColor;
    if (isBold) style.fontWeight = 600;

    chunk.split('\n').forEach((part, i, arr) => {
      if (part) {
        nodes.push(
          <span key={`a-${key++}`} style={style}>
            {part}
          </span>,
        );
      }
      if (i < arr.length - 1) nodes.push(<br key={`b-${key++}`} />);
    });
  };

  for (const m of text.matchAll(ANSI_REGEX)) {
    const idx = m.index ?? 0;
    flush(text.slice(lastIndex, idx));
    const codes = (m[0].slice(2, -1) || '0').split(';').map(Number);
    for (const c of codes) {
      if (c === 0) {
        currentColor = null;
        isBold = false;
      } else if (c === 1) isBold = true;
      else if (c === 22) isBold = false;
      else if (c === 39) currentColor = null;
      else if (colorMap[c]) currentColor = colorMap[c];
    }
    lastIndex = idx + m[0].length;
  }
  flush(text.slice(lastIndex));
  return nodes;
}

export interface ConsoleProps {
  logs: string[];
  isOpen: boolean;
  onToggle: () => void;
  packageId?: string;
  txDigest?: string;
  postDeployConfig?: PostDeployConfigState;
  onRetryPostDeployConfig?: () => Promise<void>;
  onRefreshPostDeployConfig?: () => Promise<void>;
  explorerBaseUrl?: string; // Optional URL config for looking up entities on Sui Explorer
}

function formatConfigStatus(status: PostDeployConfigState['status']): string {
  switch (status) {
    case 'ready':
      return 'Pending';
    case 'applying':
      return 'Applying';
    case 'failed':
      return 'Needs Retry';
    case 'applied':
      return 'Applied';
    case 'verifying':
      return 'Verifying';
    case 'verified':
      return 'Verified';
    default:
      return 'Idle';
  }
}

export function Console({
  logs,
  isOpen,
  onToggle,
  packageId,
  txDigest,
  postDeployConfig,
  onRetryPostDeployConfig,
  onRefreshPostDeployConfig,
  explorerBaseUrl = 'https://suiscan.xyz/testnet',
}: ConsoleProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const lastLog = logs[logs.length - 1];
  const canRetryConfig =
    postDeployConfig !== undefined &&
    (postDeployConfig.status === 'failed' ||
      postDeployConfig.status === 'ready');
  const canRefreshConfig =
    postDeployConfig?.packageId !== undefined &&
    postDeployConfig.extensionConfigId !== undefined &&
    postDeployConfig.requestedConfig !== undefined &&
    postDeployConfig.status !== 'applying' &&
    postDeployConfig.status !== 'verifying';

  // Auto-scroll logic
  useEffect(() => {
    if (isOpen && lastLog !== undefined) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, lastLog]);

  return (
    <div
      className={`playground-console ${isOpen ? 'playground-console--open' : ''}`}
    >
      <div className="playground-console-header">
        <span>Terminal Console</span>
        <button
          type="button"
          className="playground-console-header-btn"
          onClick={onToggle}
        >
          &times;
        </button>
      </div>

      <div className="playground-console-body">
        {logs.map(line => (
          <div key={line} className="playground-console-line">
            {renderAnsi(line, ANSI_COLORS)}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {(packageId ||
        txDigest ||
        (postDeployConfig !== undefined &&
          postDeployConfig.status !== 'idle')) && (
        <div className="playground-deploy-info">
          {packageId && (
            <div className="playground-deploy-row">
              <span className="playground-deploy-label">Package ID</span>
              <code className="playground-deploy-value">{packageId}</code>
              <a
                href={`${explorerBaseUrl}/object/${packageId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="playground-deploy-link"
              >
                View ↗
              </a>
            </div>
          )}
          {txDigest && (
            <div className="playground-deploy-row">
              <span className="playground-deploy-label">Digest</span>
              <code className="playground-deploy-value">{txDigest}</code>
              <a
                href={`${explorerBaseUrl}/tx/${txDigest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="playground-deploy-link"
              >
                View ↗
              </a>
            </div>
          )}
          {postDeployConfig && postDeployConfig.status !== 'idle' && (
            <>
              <div className="playground-deploy-row">
                <span className="playground-deploy-label">Config</span>
                <code className="playground-deploy-value">
                  {formatConfigStatus(postDeployConfig.status)}
                </code>
              </div>
              {postDeployConfig.extensionConfigId && (
                <div className="playground-deploy-row">
                  <span className="playground-deploy-label">ExtConfig</span>
                  <code className="playground-deploy-value">
                    {postDeployConfig.extensionConfigId}
                  </code>
                  <a
                    href={`${explorerBaseUrl}/object/${postDeployConfig.extensionConfigId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="playground-deploy-link"
                  >
                    View ↗
                  </a>
                </div>
              )}
              {postDeployConfig.adminCapId && (
                <div className="playground-deploy-row">
                  <span className="playground-deploy-label">AdminCap</span>
                  <code className="playground-deploy-value">
                    {postDeployConfig.adminCapId}
                  </code>
                  <a
                    href={`${explorerBaseUrl}/object/${postDeployConfig.adminCapId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="playground-deploy-link"
                  >
                    View ↗
                  </a>
                </div>
              )}
              {postDeployConfig.configTxDigest && (
                <div className="playground-deploy-row">
                  <span className="playground-deploy-label">Config Tx</span>
                  <code className="playground-deploy-value">
                    {postDeployConfig.configTxDigest}
                  </code>
                  <a
                    href={`${explorerBaseUrl}/tx/${postDeployConfig.configTxDigest}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="playground-deploy-link"
                  >
                    View ↗
                  </a>
                </div>
              )}
              {postDeployConfig.verification && (
                <>
                  <div className="playground-deploy-row">
                    <span className="playground-deploy-label">Tribe</span>
                    <code className="playground-deploy-value">
                      {postDeployConfig.verification.tribeId ?? '-'}
                    </code>
                  </div>
                  <div className="playground-deploy-row">
                    <span className="playground-deploy-label">Permit Ms</span>
                    <code className="playground-deploy-value">
                      {postDeployConfig.verification.expiryDurationMs ?? '-'}
                    </code>
                  </div>
                  <div className="playground-deploy-row">
                    <span className="playground-deploy-label">Bounty</span>
                    <code className="playground-deploy-value">
                      {postDeployConfig.verification.hasBountyConfig
                        ? (postDeployConfig.verification.bountyTypeId ?? '-')
                        : 'disabled'}
                    </code>
                  </div>
                  <div className="playground-deploy-row">
                    <span className="playground-deploy-label">Bounty Ms</span>
                    <code className="playground-deploy-value">
                      {postDeployConfig.verification.hasBountyConfig
                        ? (postDeployConfig.verification.bountyExpiryMs ?? '-')
                        : 'disabled'}
                    </code>
                  </div>
                </>
              )}
              {postDeployConfig.error && (
                <div className="playground-deploy-row">
                  <span className="playground-deploy-label">Config Err</span>
                  <code className="playground-deploy-value">
                    {postDeployConfig.error}
                  </code>
                </div>
              )}
              {(canRetryConfig || canRefreshConfig) && (
                <div className="playground-deploy-actions">
                  {canRetryConfig && onRetryPostDeployConfig && (
                    <button
                      type="button"
                      className="playground-console-action"
                      onClick={() => {
                        void onRetryPostDeployConfig();
                      }}
                    >
                      {postDeployConfig.status === 'failed'
                        ? 'Retry Config'
                        : 'Apply Config'}
                    </button>
                  )}
                  {canRefreshConfig && onRefreshPostDeployConfig && (
                    <button
                      type="button"
                      className="playground-console-action playground-console-action--secondary"
                      onClick={() => {
                        void onRefreshPostDeployConfig();
                      }}
                    >
                      Refresh Readback
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
