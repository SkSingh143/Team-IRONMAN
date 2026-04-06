import { Outlet, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Home, Copy, Check, Users } from 'lucide-react';
import { useState } from 'react';
import { useToast } from './Toast';
import { logout as apiLogout } from '../../api/authApi';

export default function Navbar({ roomName, roomId }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout error', err);
    }
    clearAuth();
    navigate('/login');
  };

  const handleCopy = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('Room link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <nav className="h-16 flex items-center justify-between px-6 bg-surface border-b border-border shrink-0 z-40 relative shadow-sm">
      <div className="flex items-center gap-4">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 text-white font-bold text-lg hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #6C63FF)" strokeWidth="2.5" className="w-6 h-6">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="hidden sm:inline">LiveCollab</span>
        </Link>

        {roomId && (
          <>
            <div className="w-px h-8 bg-border mx-2" />
            <div className="flex items-center gap-4">
              <span className="font-semibold text-white tracking-wide truncate max-w-[120px] sm:max-w-xs">{roomName || 'Untitled Room'}</span>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-elevated hover:bg-surface-elevated/80 border border-border rounded-lg text-xs font-semibold text-gray-300 transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{roomId}</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        {roomId && (
          <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-semibold mr-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        )}
        <div className="flex items-center gap-4 pl-6 border-l border-border">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold text-white leading-none">{user?.username}</span>
            <span className="text-xs text-gray-500">{user?.email}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.username?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-1"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
