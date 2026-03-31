/**
 * AuthorizePanel — post-deploy extension authorization UI.
 *
 * Auto-fills where possible:
 *   - Character ID: fetched from the wallet's PlayerProfile on-chain object.
 *   - OwnerCap ID: read from the assembly's `owner_cap_id` view function.
 *   - Assembly ID: must be provided by the user (it's a shared in-game object).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthorize } from '@/hooks/useAuthorize';
import { useWorldObjects } from '@/hooks/useWorldObjects';
import type { AssemblyComponentType } from '@/config/constants';
import './AuthorizePanel.css';

export interface AuthorizePanelProps {
  componentType: AssemblyComponentType;
  extensionPackageId: string;
  explorerBaseUrl?: string;
}

const ASSEMBLY_LABELS: Record<AssemblyComponentType, string> = {
  gate: 'Gate',
  storage_unit: 'Storage Unit',
  turret: 'Turret',
};

const ASSEMBLY_HINTS: Record<AssemblyComponentType, string> = {
  gate: 'Find your Gate ID on the EVE Frontier map or in the World API.',
  storage_unit:
    'Find your Storage Unit ID on the EVE Frontier map or in the World API.',
  turret:
    'Find your Turret ID on the EVE Frontier map or in the World API.',
};

export function AuthorizePanel({
  componentType,
  extensionPackageId,
  explorerBaseUrl = 'https://suiscan.xyz/testnet',
}: AuthorizePanelProps) {
  const [characterId, setCharacterId] = useState('');
  const [assemblyId, setAssemblyId] = useState('');
  const [ownerCapId, setOwnerCapId] = useState('');
  const [ownerCapStatus, setOwnerCapStatus] = useState<
    'idle' | 'loading' | 'success' | 'failed'
  >('idle');
  const [ownerCapError, setOwnerCapError] = useState<string>();

  const { authorizeState, authorize, resetAuthorize } = useAuthorize();
  const {
    characterId: autoCharacterId,
    characterStatus,
    characterError,
    lookupOwnerCap,
  } = useWorldObjects();

  const assemblyLabel = ASSEMBLY_LABELS[componentType];

  // ── Auto-fill Character ID ──
  const charAutoFilled = useRef(false);
  useEffect(() => {
    if (autoCharacterId && !charAutoFilled.current) {
      setCharacterId(autoCharacterId);
      charAutoFilled.current = true;
    }
  }, [autoCharacterId]);

  // ── Auto-lookup OwnerCap when Assembly ID looks valid ──
  const ownerCapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const trimmed = assemblyId.trim();
    if (!trimmed || !trimmed.startsWith('0x') || trimmed.length < 10) {
      setOwnerCapId('');
      setOwnerCapStatus('idle');
      setOwnerCapError(undefined);
      return;
    }

    // Debounce 600ms so we don't spam devInspect on every keystroke
    clearTimeout(ownerCapTimer.current);
    setOwnerCapStatus('loading');

    ownerCapTimer.current = setTimeout(async () => {
      const res = await lookupOwnerCap(trimmed, componentType);
      if (res.ownerCapId) {
        setOwnerCapId(res.ownerCapId);
        setOwnerCapStatus('success');
        setOwnerCapError(undefined);
      } else {
        setOwnerCapId('');
        setOwnerCapStatus('failed');
        setOwnerCapError(res.error);
      }
    }, 600);

    return () => clearTimeout(ownerCapTimer.current);
  }, [assemblyId, componentType, lookupOwnerCap]);

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
  }, [
    canSubmit,
    authorize,
    componentType,
    characterId,
    assemblyId,
    ownerCapId,
    extensionPackageId,
  ]);

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
          {/* ── Character ID ── */}
          <div className="authorize-field">
            <label className="authorize-label">
              Character Object ID
              {characterStatus === 'loading' && (
                <span className="authorize-badge authorize-badge--loading">
                  looking up…
                </span>
              )}
              {characterStatus === 'success' && (
                <span className="authorize-badge authorize-badge--ok">
                  auto-filled ✓
                </span>
              )}
            </label>
            <input
              className={`authorize-input ${characterStatus === 'success' ? 'authorize-input--auto' : ''}`}
              type="text"
              placeholder="0x… (auto-detected from wallet)"
              value={characterId}
              onChange={e => {
                setCharacterId(e.target.value);
                charAutoFilled.current = true; // user overrode
              }}
              disabled={authorizeState.status === 'authorizing'}
            />
            {characterStatus === 'failed' && characterError && (
              <span className="authorize-hint authorize-hint--warn">
                ⚠ {characterError}
              </span>
            )}
            <span className="authorize-hint">
              Your in-game character. Auto-detected from your connected wallet.
            </span>
          </div>

          {/* ── Assembly ID (user-provided) ── */}
          <div className="authorize-field">
            <label className="authorize-label">
              {assemblyLabel} Object ID
            </label>
            <input
              className="authorize-input"
              type="text"
              placeholder={`0x… (your ${assemblyLabel} object ID)`}
              value={assemblyId}
              onChange={e => setAssemblyId(e.target.value)}
              disabled={authorizeState.status === 'authorizing'}
            />
            <span className="authorize-hint">
              {ASSEMBLY_HINTS[componentType]}
            </span>
          </div>

          {/* ── OwnerCap ID (auto-fetched) ── */}
          <div className="authorize-field">
            <label className="authorize-label">
              OwnerCap Object ID
              {ownerCapStatus === 'loading' && (
                <span className="authorize-badge authorize-badge--loading">
                  looking up…
                </span>
              )}
              {ownerCapStatus === 'success' && (
                <span className="authorize-badge authorize-badge--ok">
                  auto-filled ✓
                </span>
              )}
            </label>
            <input
              className={`authorize-input ${ownerCapStatus === 'success' ? 'authorize-input--auto' : ''}`}
              type="text"
              placeholder={
                ownerCapStatus === 'loading'
                  ? 'Fetching from chain…'
                  : `0x… (auto-fetched when ${assemblyLabel} ID is provided)`
              }
              value={ownerCapId}
              onChange={e => setOwnerCapId(e.target.value)}
              disabled={authorizeState.status === 'authorizing'}
            />
            {ownerCapStatus === 'failed' && ownerCapError && (
              <span className="authorize-hint authorize-hint--warn">
                ⚠ {ownerCapError}
              </span>
            )}
            <span className="authorize-hint">
              Auto-fetched from the {assemblyLabel}'s on-chain data. You can
              also paste it manually.
            </span>
          </div>

          {authorizeState.status === 'failed' && (
            <div className="authorize-error">
              <span>❌ {authorizeState.error}</span>
            </div>
          )}

          <button
            type="button"
            className={`authorize-submit-btn${authorizeState.status === 'failed' ? ' authorize-submit-btn--retry' : ''}`}
            disabled={!canSubmit}
            onClick={handleAuthorize}
          >
            {authorizeState.status === 'authorizing'
              ? 'Authorizing…'
              : authorizeState.status === 'failed'
                ? `⟳ Retry Authorization`
                : `Authorize ${assemblyLabel}`}
          </button>
        </div>
      )}
    </div>
  );
}
