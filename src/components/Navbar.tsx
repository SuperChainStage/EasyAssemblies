import logoSvg from '@/assets/logo.svg';
import './Navbar.css';

export interface NavbarProps {
  left?: React.ReactNode;
  title?: string;
  badge?: string;
}

export function Navbar({ left, title, badge }: NavbarProps) {
  return (
    <nav className="ev-navbar">
      <div className="ev-navbar__edge" />
      <div className="ev-navbar__content">
        <div className="ev-navbar__left">
          {left}
          <span className="ev-navbar__brand">
            <img src={logoSvg} alt="" className="ev-navbar__logo" />
            EasyAssemblies
          </span>
          {title && <span className="ev-navbar__title">{title}</span>}
          {badge && <span className="ev-navbar__badge">{badge}</span>}
        </div>
      </div>
    </nav>
  );
}