import { useSuiClientContext } from '@mysten/dapp-kit';
import { DEPLOYMENT_TARGET_CONFIGS, type DeploymentTargetId } from '@/config/constants';
import './StatusBar.css';

export interface StatusBarProps {
  buildStatus?: 'idle' | 'building' | 'success' | 'error';
  deployStatus?: 'idle' | 'deploying' | 'success' | 'error';
}

export function StatusBar({ buildStatus, deployStatus }: StatusBarProps) {
  const { network } = useSuiClientContext();
  const target = DEPLOYMENT_TARGET_CONFIGS[network as DeploymentTargetId];

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
        <span className="ev-statusbar__item">
          <span className="ev-statusbar__dot" />
          {target?.environmentLabel ?? network}
        </span>
        <span className="ev-statusbar__item ev-statusbar__item--dim">v0.1.0</span>
      </div>
    </footer>
  );
}
