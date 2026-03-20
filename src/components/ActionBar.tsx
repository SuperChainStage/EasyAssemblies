import {
  DEPLOYMENT_TARGET_OPTIONS,
  type DeploymentTargetId,
} from '@/config/constants';
import {
  ConnectModal,
  useCurrentAccount,
  useSuiClientContext,
} from '@mysten/dapp-kit';
import type React from 'react';
import './ActionBar.css';

export interface ActionBarProps {
  showLogs: boolean;
  setShowLogs: React.Dispatch<React.SetStateAction<boolean>>;
  onBuild: () => Promise<void>;
  onDeploy: () => Promise<void>;
  busy: boolean;
  buildReady: boolean;
  isPublishing: boolean;
  buildOk: boolean | null;
}

export function ActionBar({
  showLogs,
  setShowLogs,
  onBuild,
  onDeploy,
  busy,
  buildReady,
  isPublishing,
  buildOk,
}: ActionBarProps) {
  const account = useCurrentAccount();
  const { network, selectNetwork } = useSuiClientContext();

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextNetwork = e.target.value as DeploymentTargetId;
    selectNetwork(nextNetwork);
    localStorage.setItem('playmove_network', nextNetwork);
  };

  return (
    <div className="playground-actions">
      <button
        type="button"
        className={`playground-btn playground-btn--toggle ${showLogs ? 'active' : ''}`}
        onClick={() => setShowLogs(!showLogs)}
        title={showLogs ? 'Hide console' : 'Show console'}
      >
        <span>&gt;_</span>
      </button>

      <div className="playground-spacer" />

      <select
        className="playground-network-select"
        value={network}
        onChange={handleNetworkChange}
        disabled={busy || isPublishing}
      >
        {DEPLOYMENT_TARGET_OPTIONS.map(target => (
          <option key={target.id} value={target.id}>
            {target.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="playground-btn playground-btn--build"
        onClick={onBuild}
        disabled={busy || !buildReady}
      >
        {busy ? '⏳ Building…' : buildReady ? '▶ Build' : '⏳ Loading…'}
      </button>

      {account ? (
        <button
          type="button"
          className="playground-btn playground-btn--deploy"
          onClick={onDeploy}
          disabled={!buildOk || isPublishing}
        >
          {isPublishing ? '⏳ Deploying…' : '🚀 Deploy'}
        </button>
      ) : (
        <ConnectModal
          trigger={
            <button
              type="button"
              className="playground-btn playground-btn--deploy"
            >
              Connect Wallet
            </button>
          }
        />
      )}
    </div>
  );
}
