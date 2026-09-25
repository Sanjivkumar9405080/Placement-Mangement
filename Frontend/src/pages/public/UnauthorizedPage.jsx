import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const UnauthorizedPage = () => {
  const { user, isAuthenticated } = useAuth();

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

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: 'var(--danger-color)' }}>
        403 - Access Forbidden
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
        You do not have the required permissions or role to view this page.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {isAuthenticated ? (
          <Link to={getDashboardPath()} className="btn btn-primary">
            Return to Your Dashboard
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Login with Authorized Account
          </Link>
        )}
        <Link to="/" className="btn btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
