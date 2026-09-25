import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
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

  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
        Placement Management System
      </h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto 2.5rem' }}>
        A centralized, transparent campus recruitment portal connecting graduating students,
        visiting corporate recruiters, and the college Training & Placement cell.
      </p>

      {isAuthenticated ? (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to={getDashboardPath()} className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '0.75rem 1.75rem' }}>
            Go to {user.role.toUpperCase()} Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '0.75rem 1.75rem' }}>
            Login to Account
          </Link>
          <Link to="/register" className="btn btn-outline" style={{ fontSize: '1.05rem', padding: '0.75rem 1.75rem' }}>
            Register as Candidate / Company
          </Link>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginTop: '4rem',
        textAlign: 'left'
      }}>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>👨‍🎓 For Students</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Maintain your academic profile, view upcoming campus placement drives matching your criteria, and apply in 1-click.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>🏢 For Companies</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Post job drives with specific eligibility criteria, review candidate profiles, and manage applicant hiring stages.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>🏛️ For Placement Cell</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Real-time analytics on placement percentages, recruiter verification, drive oversight, and automated report generation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
