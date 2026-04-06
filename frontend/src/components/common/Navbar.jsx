import { Outlet, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useRoomStore from '../../store/roomStore';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Home, Copy, Check, Users, Coins, DoorOpen, Trash2, Save } from 'lucide-react';
import { useState } from 'react';
import { useToast } from './Toast';
import { logout as apiLogout } from '../../api/authApi';
import { deleteRoom } from '../../api/roomApi';

export default function Navbar({ roomName, roomId }) {
  const { user, clearAuth } = useAuthStore();
  const { members } = useRoomStore();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [copied, setCopied] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = members?.find(m => m.userId === user?._id)?.role === 'admin';

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

  const handleExitClicked = () => {
    if (isAdmin) {
      setShowExitModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  const handleAdminExit = async (save) => {
    if (!save) {
      setIsDeleting(true);
      try {
        await deleteRoom(roomId);
        toast.success("Room deleted and history cleared.");
      } catch(err) {
        toast.error("Failed to delete room");
      } finally {
        setIsDeleting(false);
      }
    }
    setShowExitModal(false);
    navigate('/dashboard');
  };

  return (
    <>
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
          {/* Tokens link — always visible */}
          <Link 
            to="/pricing" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-amber-400 text-sm font-bold transition-all hover:-translate-y-0.5 group"
          >
            <Coins className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Tokens</span>
          </Link>

          {roomId && (
            <button 
              onClick={handleExitClicked} 
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-bold mr-1"
            >
              <DoorOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Room</span>
            </button>
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

      {/* Admin Exit Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowExitModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-elevated border border-border rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-2">End Session</h3>
              <p className="text-gray-400 text-sm mb-8">
                You are the admin of this room. Do you want to save the current canvas and history, or permanently delete it?
              </p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handleAdminExit(true)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  Save Room & Exit
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={() => handleAdminExit(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-surface hover:bg-red-500/10 text-red-400 border border-border hover:border-red-500/30 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Permanently & Exit'}
                </button>
              </div>
              <button 
                onClick={() => setShowExitModal(false)}
                className="mt-6 text-sm font-semibold text-gray-500 hover:text-white transition-colors block text-center w-full uppercase tracking-wider"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
