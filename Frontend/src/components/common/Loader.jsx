import React from 'react';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      gap: '1rem',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid var(--border-color, #e2e8f0)',
        borderTop: '4px solid var(--primary-color, #2563eb)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.95rem' }}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
