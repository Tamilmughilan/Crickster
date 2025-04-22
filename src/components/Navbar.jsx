import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Navbar.css';

// Inline logo component for testing
function InlineCricketLogo() {
  return (
    <div style={{ width: '48px', height: '48px' }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#4ade80" strokeWidth="2" />
        
        {/* Cricket stumps */}
        <g>
          <line x1="45" y1="30" x2="45" y2="70" stroke="#f8fafc" strokeWidth="2" />
          <line x1="50" y1="30" x2="50" y2="70" stroke="#f8fafc" strokeWidth="2" />
          <line x1="55" y1="30" x2="55" y2="70" stroke="#f8fafc" strokeWidth="2" />
          <line x1="40" y1="30" x2="60" y2="30" stroke="#f8fafc" strokeWidth="2" />
          <line x1="40" y1="70" x2="60" y2="70" stroke="#f8fafc" strokeWidth="2" />
        </g>
        
        {/* Cricket bat */}
        <g>
          <path d="M65 50 L75 35 L80 38 L70 55 Z" fill="#ca8a04" />
          <rect x="68" y="54" width="3" height="18" fill="#854d0e" />
        </g>
        
        {/* Cricket ball */}
        <circle cx="30" cy="50" r="7" fill="#ef4444" />
        <path d="M28 46 Q30 50 28 54" stroke="#f8fafc" strokeWidth="0.75" fill="none" />
        <path d="M32 46 Q30 50 32 54" stroke="#f8fafc" strokeWidth="0.75" fill="none" />
      </svg>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <InlineCricketLogo /> {/* Using inline version for testing */}
        </div>
        <div className="nav-buttons">
          <Link to="/" className="nav-btn">Home</Link>
          <Link to="/teams" className="nav-btn">Team stats</Link>
          <Link to="/news" className="nav-btn">News</Link>
          <Link to="/stats" className="nav-btn">Player Stats</Link>
          <Link to="/stadium-vr" className="nav-btn">Stadium VR</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;