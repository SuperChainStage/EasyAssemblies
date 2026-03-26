/**
 * AuthorizePanel — post-deploy extension authorization UI.
 *
 * Displays after deployment succeeds. Lets the user input their
 * Character / Assembly / OwnerCap IDs and execute authorization.
 */

import { useCallback, useState } from 'react';
import { useAuthorize } from '@/hooks/useAuthorize';
import type { AssemblyComponentType } from '@/config/constants';
import './AuthorizePanel.css';

export interface AuthorizePanelProps {
  componentType: AssemblyComponentType;
  extensionPackageId: string;
  explorerBaseUrl?: string;
}

export function AuthorizePanel({
  componentType,
  extensionPackageId,
  explorerBaseUrl = 'https://suiscan.xyz/testnet',
}: AuthorizePanelProps) {
  const [characterId, setCharacterId] = useState('');
  const [assemblyId, setAssemblyId] = useState('');
  const [ownerCapId, setOwnerCapId] = useState('');

  const { authorizeState, authorize, resetAuthorize } = useAuthorize();

  const assemblyLabel =
    componentType === 'gate'
      ? 'Gate'
      : componentType === 'storage_unit'
        ? 'Storage Unit'
        : 'Turret';

  const canSubmit =
    characterId.trim().length > 0 &&
    assemblyId.trim().length > 0 &&
    ownerCapId.trim().length > 0 &&
    authorizeState.status !== 'authorizing';

  const handleAuthorize = useCallback(async () => {
    if (!canSubmit) return;
    await authorize({
      componentType,
      characterId: characterId.trim(),
      assemblyId: assemblyId.trim(),
      ownerCapId: ownerCapId.trim(),
      extensionPackageId,
    });
  }, [canSubmit, authorize, componentType, characterId, assemblyId, ownerCapId, extensionPackageId]);

  return (
    <div className="authorize-panel">
      <div className="authorize-header">
        <span className="authorize-title">🔐 Authorize Extension</span>
        <span className="authorize-desc">
          Grant your {assemblyLabel} permission to use this extension.
        </span>
      </div>

      {authorizeState.status === 'success' ? (
        <div className="authorize-success">
          <span>✅ Authorization successful!</span>
          {authorizeState.txDigest && (
            <a
              href={`${explorerBaseUrl}/tx/${authorizeState.txDigest}`}
              target="_blank"
              rel="noopener noreferrer"
              className="authorize-link"
            >
              View tx ↗
            </a>
          )}
          <button
            type="button"
            className="authorize-reset-btn"
            onClick={resetAuthorize}
          >
            Authorize Another
          </button>
        </div>
      ) : (
        <div className="authorize-form">
          <div className="authorize-field">
            <label className="authorize-label">Character Object ID</label>
            <input
              className="authorize-input"
              type="text"
              placeholder="0x..."
              value={characterId}
              onChange={e => setCharacterId(e.target.value)}
              disabled={authorizeState.status === 'authorizing'}
            />
          </div>
          <div className="authorize-field">
            <label className="authorize-label">{assemblyLabel} Object ID</label>
            <input
              className="authorize-input"
              type="text"
              placeholder="0x..."
              value={assemblyId}
              onChange={e => setAssemblyId(e.target.value)}
              disabled={authorizeState.status === 'authorizing'}
            />
          </div>
          <div className="authorize-field">
            <label className="authorize-label">OwnerCap Object ID</label>
            <input
              className="authorize-input"
              type="text"
              placeholder="0x..."
              value={ownerCapId}
              onChange={e => setOwnerCapId(e.target.value)}
              disabled={authorizeState.status === 'authorizing'}
            />
          </div>

          {authorizeState.status === 'failed' && (
            <div className="authorize-error">
              ❌ {authorizeState.error}
            </div>
          )}

          <button
            type="button"
            className="authorize-submit-btn"
            disabled={!canSubmit}
            onClick={handleAuthorize}
          >
            {authorizeState.status === 'authorizing'
              ? 'Authorizing…'
              : `Authorize ${assemblyLabel}`}
          </button>
        </div>
      )}
    </div>
  );
}
