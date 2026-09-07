import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ADMIN_PAGES } from './pageRegistry';
import './AdminLayout.css';

function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pagesOpen,    setPagesOpen]    = useState(true);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const isOnPages = pathname.startsWith('/admin/pages');

  return (
    <div className="adm-root">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* Brand */}
        <div className="adm-brand">
          <div className="adm-brand-mark">वि</div>
          <div className="adm-brand-text">
            <div className="adm-brand-name">VK Admin</div>
            <div className="adm-brand-sub">CMS Dashboard</div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="adm-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="adm-nav-icon">◈</span>
            Dashboard
          </NavLink>

          {/* Page Builder */}
          <NavLink
            to="/admin/builder"
            className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="adm-nav-icon">⊞</span>
            Page Builder
          </NavLink>

          {/* Navigation */}
          <NavLink
            to="/admin/navigation"
            className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="adm-nav-icon">≡</span>
            Navigation
          </NavLink>

          {/* Customizer */}
          <NavLink
            to="/admin/customizer"
            className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="adm-nav-icon">✦</span>
            Customizer
          </NavLink>

          {/* Users — visible only to super_admin */}
          {user?.role === 'super_admin' && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="adm-nav-icon">◉</span>
              Users
            </NavLink>
          )}

          {/* Pages section */}
          <div className="adm-nav-group">
            <button
              className={`adm-nav-group-trigger${isOnPages ? ' active' : ''}`}
              onClick={() => setPagesOpen(o => !o)}
            >
              <span className="adm-nav-icon">⊞</span>
              Pages
              <span className={`adm-chevron${pagesOpen ? ' open' : ''}`}>›</span>
            </button>

            {pagesOpen && (
              <ul className="adm-page-list">
                {ADMIN_PAGES.map(page => (
                  <li key={page.id}>
                    {page.status === 'active' ? (
                      <NavLink
                        to={page.adminPath}
                        className={({ isActive }) => `adm-page-item${isActive ? ' active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="adm-page-dot active" />
                        {page.label}
                      </NavLink>
                    ) : (
                      <span className="adm-page-item disabled">
                        <span className="adm-page-dot" />
                        {page.label}
                        <span className="adm-soon">soon</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        {/* Footer links */}
        <div className="adm-sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer" className="adm-footer-link">
            <span>↗</span> View Site
          </a>
          <button className="adm-footer-link" onClick={handleLogout}>
            <span>→</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="adm-main">

        {/* Topbar */}
        <header className="adm-topbar">
          <button
            className="adm-hamburger"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
          >
            <span /><span /><span />
          </button>

          <div className="adm-breadcrumb">
            <span className="adm-breadcrumb-home">Admin</span>
            {pathname !== '/admin/dashboard' && (
              <>
                <span className="adm-breadcrumb-sep">›</span>
                <span className="adm-breadcrumb-current">
                  {pathname.includes('customizer')  ? 'Customizer'
                    : pathname.includes('builder')    ? 'Page Builder'
                    : pathname.includes('navigation') ? 'Navigation'
                    : pathname.includes('users')      ? 'Users'
                    : ADMIN_PAGES.find(p => pathname.startsWith(p.adminPath))?.label
                    || (pathname.includes('dashboard') ? 'Dashboard' : 'Pages')}
                </span>
              </>
            )}
          </div>

          <div className="adm-topbar-right">
            <div className="adm-user-chip">
              <div className="adm-user-avatar">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="adm-user-name">{user?.username || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="adm-page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
