import {
  DEPLOYMENT_TARGET_OPTIONS,
  type DeploymentTargetId,
} from '@/config/constants';
import { useSuiClientContext } from '@mysten/dapp-kit';
import './Navbar.css';

export interface NavbarProps {
  left?: React.ReactNode;
  title?: string;
  badge?: string;
  stage?: 'config' | 'forge' | 'deploy';
}

export function Navbar({ left, title, badge, stage }: NavbarProps) {
  const { network, selectNetwork } = useSuiClientContext();

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as DeploymentTargetId;
    selectNetwork(next);
    localStorage.setItem('playmove_network', next);
  };

  return (
    <nav className="ev-navbar">
      <div className="ev-navbar__edge" />

      <div className="ev-navbar__content">
        <div className="ev-navbar__left">
          {left}
          <span className="ev-navbar__brand">
            <span className="ev-navbar__brand-icon">⬡</span>
            EasyAssemblies
          </span>
          {title && <span className="ev-navbar__title">{title}</span>}
          {badge && <span className="ev-navbar__badge">{badge}</span>}
        </div>

        {/* Stage indicator */}
        {stage && (
          <div className="ev-navbar__stages">
            <span className={`ev-navbar__stage-dot ${stage === 'config' ? 'active' : ''}`}>CONFIG</span>
            <span className="ev-navbar__stage-line" />
            <span className={`ev-navbar__stage-dot ${stage === 'forge' ? 'active' : ''}`}>FORGE</span>
            <span className="ev-navbar__stage-line" />
            <span className={`ev-navbar__stage-dot ${stage === 'deploy' ? 'active' : ''}`}>DEPLOY</span>
          </div>
        )}

        <div className="ev-navbar__right">
          <select
            className="ev-navbar__network"
            value={network}
            onChange={handleNetworkChange}
          >
            {DEPLOYMENT_TARGET_OPTIONS.map(t => (
              <option key={t.id} value={t.id}>{t.environmentLabel}</option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}