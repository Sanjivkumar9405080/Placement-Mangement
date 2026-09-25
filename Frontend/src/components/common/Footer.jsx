import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="navbar-container" style={{ justifyContent: 'center' }}>
        <p>&copy; {new Date().getFullYear()} Campus Placement Management System. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
