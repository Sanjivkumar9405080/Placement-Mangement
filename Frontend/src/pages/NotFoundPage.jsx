import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>🔍</div>
      <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
        404 - Page Not Found
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link to="/" className="btn btn-primary" style={{ padding: '0.65rem 1.75rem' }}>
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
