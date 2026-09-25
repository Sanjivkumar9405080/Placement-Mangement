import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const handleItemClick = () => {
    onClose();
  };

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin', icon: '📊', exact: true },
        { header: 'Students' },
        { label: 'All Students', path: '/admin/students', icon: '🎓', exact: true },
        { label: 'Search Student', path: '/admin/students?focusSearch=true', icon: '🔍', isSubItem: true },
        { header: 'Companies' },
        { label: 'All Companies', path: '/admin/companies', icon: '🏢', exact: true },
        { label: 'Pending Approvals', path: '/admin/companies?filter=pending', icon: '🟡', isSubItem: true },
        { header: 'Placement Drives' },
        { label: 'All Drives', path: '/admin/drives', icon: '📁', exact: true },
        { label: 'Pending Approval', path: '/admin/drives?approval=pending', icon: '🟡', isSubItem: true },
        { label: 'Approved', path: '/admin/drives?approval=approved', icon: '🟢', isSubItem: true },
        { label: 'Rejected', path: '/admin/drives?approval=rejected', icon: '🔴', isSubItem: true },
        { header: 'Applications' },
        { label: 'All Applications', path: '/admin/applications', icon: '📄', exact: true },
        { label: 'Removed Applications', path: '/admin/applications?status=Removed', icon: '🚫', isSubItem: true },
        { header: 'Analytics' },
        { label: 'Placement Reports', path: '/admin/reports', icon: '📈' },
      ];
    }

    if (user?.role === 'company') {
      return [
        { label: 'Dashboard', path: '/company', icon: '📊', exact: true },
        { label: 'Company Profile', path: '/company/profile', icon: '🏢' },
        { header: 'Placement Drives' },
        { label: 'All Drives', path: '/company/drives', icon: '📁', exact: true },
        { label: 'Create Drive', path: '/company/drives/new', icon: '➕' },
        { label: 'Pending Approval', path: '/company/drives?approval=pending', icon: '🟡' },
        { header: 'Applicants' },
        { label: 'All Applicants', path: '/company/applicants', icon: '👥', exact: true },
        { label: 'Shortlisted', path: '/company/applicants?status=Shortlisted', icon: '⭐', isSubItem: true },
        { label: 'Interview', path: '/company/applicants?status=Interview', icon: '🎙️', isSubItem: true },
        { label: 'Selected', path: '/company/applicants?status=Selected', icon: '🏆', isSubItem: true },
      ];
    }

    // Default to student
    return [
      { label: 'Dashboard', path: '/student', icon: '📊', exact: true },
      { label: 'My Profile', path: '/student/profile', icon: '👤' },
      { label: 'Browse Drives', path: '/student/drives', icon: '🏢' },
      { label: 'My Applications', path: '/student/applications', icon: '📄' },
    ];
  };

  const navItems = getNavItems();
  const roleLabel =
    user?.role === 'admin'
      ? 'TPO / Admin'
      : user?.role === 'company'
      ? 'Recruiter Portal'
      : 'Student Portal';

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop mobile-only"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`portal-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'User'}</span>
            <span className="sidebar-user-role">{roleLabel}</span>
          </div>
          {/* Close button inside mobile drawer */}
          <button
            onClick={onClose}
            className="sidebar-close-btn mobile-only"
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.header) {
              return (
                <div
                  key={`header-${idx}`}
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    padding: '0.75rem 1rem 0.25rem 1rem',
                  }}
                >
                  {item.header}
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={handleItemClick}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link active' : 'sidebar-link'
                }
                style={item.isSubItem ? { paddingLeft: '2.1rem', fontSize: '0.84rem' } : {}}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-text">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
