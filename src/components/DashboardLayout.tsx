import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
  user: object | null;
  onLogout: () => void;
};

export function DashboardLayout({ children, user, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // sidebarRef kept for potential future use
  const sidebarRef = useRef<HTMLElement>(null);

  const u = user as Record<string, string> | null;
  const displayName = u?.fName
    ? `${u.fName} ${u.lName || ''}`.trim()
    : u?.email || 'User';
  const initials = u?.fName
    ? `${u.fName[0]}${u.lName?.[0] || ''}`.toUpperCase()
    : (u?.email?.[0]?.toUpperCase() || 'U');

  const isActive = (path: string) => location.pathname === path;

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="dash-layout">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        ref={sidebarRef}
        className={`dash-sidebar${sidebarOpen ? ' dash-sidebar--open' : ''}`}
      >
        {/* Brand */}
        <div className="dash-brand">
          <div className="dash-brand-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="white" />
              <rect x="13" y="2" width="9" height="9" rx="2" fill="white" opacity="0.6" />
              <rect x="2" y="13" width="9" height="9" rx="2" fill="white" opacity="0.6" />
              <rect x="13" y="13" width="9" height="9" rx="2" fill="white" opacity="0.3" />
            </svg>
          </div>
          <span className="dash-brand-name">LiveKit Studio</span>
        </div>

        {/* Nav */}
        <nav className="dash-nav">
          <button
            className={`dash-nav-item${isActive('/home') ? ' dash-nav-item--active' : ''}`}
            onClick={() => navTo('/home')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </button>

          <button
            className={`dash-nav-item${isActive('/recordings') ? ' dash-nav-item--active' : ''}`}
            onClick={() => navTo('/recordings')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span>Recordings</span>
          </button>

          <button
            className={`dash-nav-item${isActive('/payment') ? ' dash-nav-item--active' : ''}`}
            onClick={() => navTo('/payment')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span>Payment</span>
          </button>
        </nav>

        {/* Bottom user info */}
        <div className="dash-sidebar-user">
          <div className="dash-sidebar-avatar">{initials}</div>
          <div className="dash-sidebar-user-info">
            <span className="dash-sidebar-user-name">{displayName}</span>
            {u?.email && <span className="dash-sidebar-user-email">{u.email}</span>}
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <div className="dash-topbar">
        {/* Hamburger — mobile only */}
        <button
          className="dash-hamburger"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        {/* User dropdown — right side */}
        <div className="dash-user-badge" ref={menuRef}>
          <button
            className="dash-avatar-btn"
            onClick={() => setMenuOpen((o) => !o)}
            title={displayName}
          >
            <span className="dash-user-avatar">{initials}</span>
            <span className="dash-user-badge-name">{displayName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {menuOpen && (
            <div className="dash-dropdown">
              <div className="dash-dropdown-header">
                <span className="dash-dropdown-name">{displayName}</span>
                {u?.email && <span className="dash-dropdown-email">{u.email}</span>}
              </div>
              <div className="dash-dropdown-divider" />
              <button
                className="dash-dropdown-item dash-dropdown-item--danger"
                onClick={() => { setMenuOpen(false); onLogout(); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="dash-content">
        {children}
      </main>
    </div>
  );
}
