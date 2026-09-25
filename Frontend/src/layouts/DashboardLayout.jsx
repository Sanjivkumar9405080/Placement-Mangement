import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';

const DashboardLayout = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      {/* Mobile Drawer Trigger Bar */}
      <div className="mobile-sidebar-toggle-bar mobile-only">
        <button
          className="btn btn-outline mobile-menu-toggle-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Navigation Sidebar"
        >
          <span>☰</span>
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Portal Menu</span>
        </button>
        {title && <span className="mobile-page-indicator">{title}</span>}
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-main-area">
        {(title || subtitle) && (
          <header className="dashboard-header-bar desktop-header">
            {title && <h1 className="dashboard-page-title">{title}</h1>}
            {subtitle && <p className="dashboard-page-subtitle">{subtitle}</p>}
          </header>
        )}
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
