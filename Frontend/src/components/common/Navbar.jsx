import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'student':
        return '/student';
      case 'company':
        return '/company';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const getRoleLinks = () => {
    if (!user) return [];
    if (user.role === 'student') {
      return [
        { label: 'My Profile', path: '/student/profile' },
        { label: 'Browse Drives', path: '/student/drives' },
        { label: 'My Applications', path: '/student/applications' },
      ];
    }
    if (user.role === 'company') {
      return [
        { label: 'Company Profile', path: '/company/profile' },
        { label: 'Post Drive', path: '/company/drives/new' },
        { label: 'Manage Drives', path: '/company/drives' },
        { label: 'Applicants', path: '/company/applicants' },
      ];
    }
    if (user.role === 'admin') {
      return [
        { label: 'Students', path: '/admin/students' },
        { label: 'Companies', path: '/admin/companies' },
        { label: 'Drives', path: '/admin/drives' },
        { label: 'Reports', path: '/admin/reports' },
      ];
    }
    return [];
  };

  const roleLinks = getRoleLinks();

  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="navbar-brand-icon">🎓</span>
          <span className="navbar-brand-text">Placement Portal</span>
        </Link>

        {/* Desktop / Laptop Navigation Links */}
        <div className="navbar-links desktop-only">
          <Link to="/" className="nav-link">
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link to={getDashboardPath()} className="nav-link">
                Dashboard
              </Link>
              {roleLinks.slice(0, 2).map((item) => (
                <Link key={item.path} to={item.path} className="nav-link desktop-link-secondary">
                  {item.label}
                </Link>
              ))}
              <div className="navbar-user-chip">
                <span className="navbar-user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="navbar-user-name">{user?.name || user?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline navbar-logout-btn"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}>
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile / Tablet Hamburger Toggle Button */}
        <button
          className="navbar-hamburger-btn mobile-tablet-only"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile / Tablet Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer mobile-tablet-only">
          <div className="navbar-mobile-links">
            <Link to="/" className="navbar-mobile-link" onClick={closeMenu}>
              <span>🏠</span> Home
            </Link>

            {isAuthenticated ? (
              <>
                <Link to={getDashboardPath()} className="navbar-mobile-link" onClick={closeMenu}>
                  <span>📊</span> Dashboard ({user?.role?.toUpperCase()})
                </Link>
                {roleLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="navbar-mobile-link sublink"
                    onClick={closeMenu}
                  >
                    <span>•</span> {item.label}
                  </Link>
                ))}
                <div className="navbar-mobile-divider" />
                <div className="navbar-mobile-user-card">
                  <span className="navbar-user-avatar">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <div>
                    <strong>{user?.name || 'User'}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-danger navbar-mobile-logout-btn"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-mobile-link" onClick={closeMenu}>
                  <span>🔑</span> Login
                </Link>
                <Link to="/register" className="navbar-mobile-link" onClick={closeMenu}>
                  <span>📝</span> Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
