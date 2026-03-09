import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sword, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show navbar if in gameplay view
  if (location.pathname.startsWith('/play/')) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = user?.user_metadata?.display_name || (user?.email ? user.email.split('@')[0] : 'Summoner');

  return (
    <nav className="global-navbar">
      <div className="nav-left">
        <Link to="/" className="brand-link">
          <div className="brand-logo">
            <Sword size={20} color="#0ac8b9" />
          </div>
          <span className="brand-text">Hextech Trivia</span>
        </Link>
      </div>

      <div className="nav-center">
        <Link to={user ? "/maker" : "/login"} className={`nav-link ${location.pathname === '/maker' || location.pathname === '/' && user ? 'active' : ''}`}>
          Dashboard
        </Link>
        <Link to="/lobby" className={`nav-link ${location.pathname === '/lobby' ? 'active' : ''}`}>
          Vault
        </Link>
        <Link to={user ? "/settings" : "/login"} className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
          <Settings size={14} style={{ marginRight: '6px' }} />
          Settings
        </Link>
      </div>

      <div className="nav-right">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/settings" className="user-profile-widget" style={{ textDecoration: 'none' }} title="Go to Settings">
              <div className="user-info">
                <span className="summoner-name">{displayName}</span>
                <span className="summoner-rank">Grandmaster</span>
              </div>
              <div className="user-avatar outline-circle">
                <User size={18} />
              </div>
            </Link>
            <button onClick={handleLogout} className="icon-btn danger" title="Log Out" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="user-profile-widget">
            <Link to="/login" className="user-info" style={{textDecoration: 'none', color: 'inherit'}}>
              <span className="summoner-name">Guest</span>
              <span className="summoner-rank">Unranked</span>
            </Link>
            <div className="user-avatar outline-circle">
              <User size={18} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
