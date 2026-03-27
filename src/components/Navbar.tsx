import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit';
import './Navbar.css';

export interface NavbarProps {
  /** Optional left element (e.g. back button) */
  left?: React.ReactNode;
  /** Optional center label */
  title?: string;
  /** Optional right badge */
  badge?: string;
}

export function Navbar({ left, title, badge }: NavbarProps) {
  const account = useCurrentAccount();

  return (
    <nav className="ev-navbar">
      {/* Decorative top edge */}
      <div className="ev-navbar__edge" />

      <div className="ev-navbar__content">
        <div className="ev-navbar__left">
          {left}
          <span className="ev-navbar__brand">
            <span className="ev-navbar__brand-icon">◆</span>
            EasyAssemblies
          </span>
          {title && <span className="ev-navbar__title">{title}</span>}
          {badge && <span className="ev-navbar__badge">{badge}</span>}
        </div>

        <div className="ev-navbar__right">
          {account ? (
            <span className="ev-navbar__wallet">
              <span className="ev-navbar__wallet-dot" />
              {account.address.slice(0, 6)}…{account.address.slice(-4)}
            </span>
          ) : (
            <ConnectModal
              trigger={
                <button type="button" className="ev-navbar__connect-btn">
                  Connect Wallet
                </button>
              }
            />
          )}
        </div>
      </div>
    </nav>
  );
}