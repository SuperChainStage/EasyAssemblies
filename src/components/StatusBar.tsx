import { useSuiClientContext } from '@mysten/dapp-kit';
import {
  DEPLOYMENT_TARGET_CONFIGS,
  DEPLOYMENT_TARGET_OPTIONS,
  type DeploymentTargetId,
} from '@/config/constants';
import './StatusBar.css';

export interface StatusBarProps {
  buildStatus?: 'idle' | 'building' | 'success' | 'error';
  deployStatus?: 'idle' | 'deploying' | 'success' | 'error';
}

export function StatusBar({ buildStatus, deployStatus }: StatusBarProps) {
  const { network, selectNetwork } = useSuiClientContext();
  const target = DEPLOYMENT_TARGET_CONFIGS[network as DeploymentTargetId];

  const handleToggle = () => {
    const ids = DEPLOYMENT_TARGET_OPTIONS.map(t => t.id);
    const idx = ids.indexOf(network as DeploymentTargetId);
    const next = ids[(idx + 1) % ids.length];
    selectNetwork(next);
    localStorage.setItem('playmove_network', next);
  };

  return (
    <footer className="ev-statusbar">
      <div className="ev-statusbar__left">
        {buildStatus && buildStatus !== 'idle' && (
          <span className={`ev-statusbar__ind ev-statusbar__ind--${buildStatus}`}>
            {buildStatus === 'building' ? '⏳ Building' : buildStatus === 'success' ? '✓ Built' : '✗ Error'}
          </span>
        )}
        {deployStatus && deployStatus !== 'idle' && (
          <span className={`ev-statusbar__ind ev-statusbar__ind--${deployStatus === 'deploying' ? 'building' : deployStatus}`}>
            {deployStatus === 'deploying' ? '⏳ Deploying' : deployStatus === 'success' ? '✓ Deployed' : '✗ Error'}
          </span>
        )}
      </div>
      <div className="ev-statusbar__right">
        <button type="button" className="ev-statusbar__net-toggle" onClick={handleToggle} title="Switch network">
          <span className="ev-statusbar__dot" />
          <span>{target?.environmentLabel ?? network}</span>
          <span className="ev-statusbar__swap">⇄</span>
        </button>
        <span className="ev-statusbar__item ev-statusbar__item--dim">v0.1.0</span>
      </div>
    </footer>
  );
}
