// src/components/common/Navbar.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logout } from '../../api/authApi';
import { useToast } from './Toast';
import '../../styles/navbar.css';

export default function Navbar({ roomName, roomId }) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Even if server fails, clear local state
    }
    clearAuth();
    toast.info('You have been logged out');
    navigate('/login');
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/dashboard" className="navbar-brand">
        <div className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="navbar-title">LiveCollab</span>
      </Link>

      {/* Room info (if in a room) */}
      {roomName && (
        <div className="navbar-room-info">
          <span className="navbar-room-dot" />
          <span className="navbar-room-name">{roomName}</span>
          {roomId && <span className="navbar-room-id">#{roomId}</span>}
        </div>
      )}

      {/* Desktop right section */}
      <div className={`navbar-right ${mobileOpen ? 'mobile-visible' : ''}`}>
        <div className="navbar-user">
          <div className="navbar-avatar">{initials}</div>
          <span className="navbar-username">{user?.username || 'User'}</span>
        </div>
        <button
          className="navbar-logout"
          onClick={handleLogout}
          id="logout-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="navbar-hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>
    </nav>
  );
}
