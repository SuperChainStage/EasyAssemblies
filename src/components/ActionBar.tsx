import React from 'react';
import { ConnectModal, useCurrentAccount, useSuiClientContext } from '@mysten/dapp-kit';
import './ActionBar.css';

export interface ActionBarProps {
  showLogs: boolean;
  setShowLogs: React.Dispatch<React.SetStateAction<boolean>>;
  onBuild: () => Promise<void>;
  onDeploy: () => Promise<void>;
  busy: boolean;
  isPublishing: boolean;
  buildOk: boolean | null;
}

export function ActionBar({
  showLogs,
  setShowLogs,
  onBuild,
  onDeploy,
  busy,
  isPublishing,
  buildOk,
}: ActionBarProps) {
  const account = useCurrentAccount();
  const { network, selectNetwork } = useSuiClientContext();

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextNetwork = e.target.value;
    selectNetwork(nextNetwork);
    localStorage.setItem('playmove_network', nextNetwork);
  };

  return (
    <div className="playground-actions">
      <button
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
        <option value="devnet">Devnet</option>
        <option value="testnet">Testnet</option>
        <option value="mainnet">Mainnet</option>
      </select>

      <button
        className="playground-btn playground-btn--build"
        onClick={onBuild}
        disabled={busy}
      >
        {busy ? '⏳ Building…' : '▶ Build'}
      </button>

      {account ? (
        <button
          className="playground-btn playground-btn--deploy"
          onClick={onDeploy}
          disabled={!buildOk || isPublishing}
        >
          {isPublishing ? '⏳ Deploying…' : '🚀 Deploy'}
        </button>
      ) : (
        <ConnectModal
          trigger={
            <button className="playground-btn playground-btn--deploy">
              Connect Wallet
            </button>
          }
        />
      )}
    </div>
  );
}
