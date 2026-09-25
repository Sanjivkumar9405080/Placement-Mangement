import React from 'react';

const StatCard = ({ title, value, icon, color = 'var(--primary-color)', subtitle }) => {
  return (
    <div
      className="card stat-card"
      style={{
        borderLeft: `4px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        padding: '1.5rem',
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: '2rem',
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </p>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.2rem 0', color: 'var(--text-main)' }}>
          {value}
        </h3>
        {subtitle && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
