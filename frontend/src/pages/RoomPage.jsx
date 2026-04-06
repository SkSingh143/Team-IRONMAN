// src/pages/RoomPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useRoomStore from '../store/roomStore';
import useUIStore from '../store/uiStore';
import { getRoom, banUser, toggleAllPermissions, toggleMemberPermission } from '../api/roomApi';
import { useToast } from '../components/common/Toast';
import { useWebSocket } from '../hooks/useWebSocket';
import Navbar from '../components/common/Navbar';
import Canvas from '../components/canvas/Canvas';
import Toolbar from '../components/canvas/Toolbar';
import CursorOverlay from '../components/canvas/CursorOverlay';
import CodePanel from '../components/code/CodePanel';
import PollPanel from '../components/poll/PollPanel';
import VoicePanel from '../components/voice/VoicePanel';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Code, BarChart2, Mic, Copy, Check, Users, ChevronRight, Menu, ShieldAlert } from 'lucide-react';

const tabs = [
  { key: 'canvas', label: 'Canvas', icon: PenTool },
  { key: 'code', label: 'Code', icon: Code },
  { key: 'poll', label: 'Polls', icon: BarChart2 },
  { key: 'voice', label: 'Voice', icon: Mic },
];

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const { setRoom, setMembers, members, roomName, polls, clearRoom, allowAllPermissions } = useRoomStore();
  const { activeTab, setTab } = useUIStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAdmin = members.find(m => m.userId === user?._id)?.role === 'admin';
  const currentMember = members.find(m => m.userId === user?._id);
  const hasPermission = isAdmin || currentMember?.canParticipate || allowAllPermissions;

  // Load room metadata on mount
  useEffect(() => {
    let cancelled = false;
    const loadRoom = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getRoom(roomId);
        if (cancelled) return;
        setRoom(data.roomId, data.name, data.allowAllPermissions);
        setMembers(data.members || []);
      } catch (err) {
        if (cancelled) return;
        const msg = err.response?.data?.error || 'Failed to load room';
        setError(msg);
        toast.error(msg, 'Room Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadRoom();
    return () => {
      cancelled = true;
      clearRoom();
    };
  }, [roomId]);

  // Connect WebSocket after room loads
  useWebSocket(loading || error ? null : roomId);

  // Copy invite link
  const handleCopyInvite = useCallback(() => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomId, toast]);

  const handleBan = async (mId) => {
    if (!window.confirm("Ban this user from the room?")) return;
    try {
      await banUser(roomId, mId);
      // Instantly remove from local state
      useRoomStore.getState().removeMember(mId);
      toast.success("User banned and removed");
    } catch(err) {
      toast.error(err.response?.data?.error || "Failed to ban user");
    }
  };

  const handleToggleMember = async (mId, currentPerm) => {
    try {
      await toggleMemberPermission(roomId, mId, !currentPerm);
    } catch(err) {
      toast.error(err.response?.data?.error || "Failed to update permission");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-root text-white gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium">Loading room…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-root text-center p-4">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Couldn't join room</h2>
        <p className="text-gray-400 mb-8 max-w-sm">{error}</p>
        <button className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const inviteLink = `${window.location.origin}/room/${roomId}`;

  return (
    <div className="flex flex-col h-screen bg-root overflow-hidden">
      <Navbar roomName={roomName} roomId={roomId} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* ---- Left Toolbar (Vertical Tabs for layout >= md) ---- */}
        <aside className="hidden md:flex flex-col items-center w-20 bg-[#0D0D0F] border-r border-[rgba(255,255,255,0.1)] py-6 gap-4 shrink-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.4)] text-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const isRestricted = !hasPermission && ['canvas', 'code', 'voice'].includes(tab.key);
            return (
              <div key={tab.key} className="relative group w-full px-3">
                <button
                  onClick={() => setTab(tab.key)}
                  title={isRestricted ? `${tab.label} — Disabled by Admin` : tab.label}
                  className={`relative w-full aspect-square flex items-center justify-center rounded-2xl transition-all ${isActive ? 'bg-primary/20 text-primary shadow-inner shadow-primary/20' : 'text-gray-400 hover:bg-[#151518] hover:text-white'}`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform ${isRestricted ? 'opacity-50' : ''}`} />
                  {tab.key === 'poll' && polls.length > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-accent rounded-full border-2 border-surface"></span>
                  )}
                  {isRestricted && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
          
          <div className="w-10 h-px bg-[rgba(255,255,255,0.1)] my-2" />
          
          <div className="w-full px-3 mt-auto relative">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Members Sidebar"
              className="w-full aspect-square flex items-center justify-center rounded-2xl text-gray-400 hover:bg-[#151518] hover:text-white transition-colors relative group"
            >
              <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="absolute bottom-2 right-2 flex w-3 h-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#0D0D0F]"></span>
              </span>
            </button>
          </div>
        </aside>

        {/* ---- Main Content Area ---- */}
        <main className="flex-1 flex flex-col min-w-0 bg-root relative overflow-hidden">
          
          {/* Mobile Top Tab Bar (Visible on <md) */}
          <div className="md:hidden flex items-center bg-[#0D0D0F] border-b border-[rgba(255,255,255,0.1)] p-2 gap-1 overflow-x-auto hide-scrollbar z-30 shrink-0 text-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setTab(tab.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-semibold transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-[#151518] hover:text-white'}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.key === 'poll' && polls.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] ml-1">{polls.length}</span>
                  )}
                </button>
              );
            })}
            <div className="flex-1" />
            <button onClick={() => setSidebarOpen(true)} className="p-2 ml-2 text-gray-400 hover:text-white shrink-0">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 relative w-full h-full bg-root overflow-hidden">
            {/* Canvas */}
            <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'canvas' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-[-1]'}`}>
              <Canvas />
              <Toolbar />
              <CursorOverlay />
            </div>
            {/* Code */}
            <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-[-1]'}`}>
              <CodePanel />
            </div>
            {/* Poll */}
            <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'poll' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-[-1]'}`}>
              <PollPanel />
            </div>
            {/* Voice */}
            <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'voice' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-[-1]'}`}>
              <VoicePanel />
            </div>
          </div>
        </main>

        {/* ---- Right Sidebar (Members & Room Info) ---- */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Mobile overlay backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-black/60 z-40"
                onClick={() => setSidebarOpen(false)}
              />
              
              <motion.aside
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed md:static inset-y-0 right-0 w-80 bg-[#131315] border-l border-[rgba(255,255,255,0.1)] flex flex-col z-50 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.3)] text-gray-200"
              >
                <div className="p-6 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg">Room Details</h3>
                  <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 border-b border-[rgba(255,255,255,0.1)]">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Invite Link</div>
                  <div className="flex items-center gap-2 bg-[#171719] border border-[rgba(255,255,255,0.1)] rounded-lg p-1.5 focus-within:border-primary transition-colors">
                    <input
                      readOnly
                      value={inviteLink}
                      onClick={(e) => e.target.select()}
                      className="flex-1 bg-transparent text-gray-300 text-xs px-2 focus:outline-none truncate"
                    />
                    <button 
                      onClick={handleCopyInvite}
                      className={`p-1.5 rounded-md transition-colors ${copied ? 'bg-primary/20 text-primary' : 'bg-[#0D0D0F] text-gray-400 hover:text-white'}`}
                      title="Copy link"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 overflow-y-auto">
                  {isAdmin && (
                    <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0D0D0F] p-4">
                      <div className="text-sm font-semibold leading-snug text-gray-200">Allow Global Participation</div>
                      <button 
                        onClick={async () => {
                          try {
                            await toggleAllPermissions(roomId, !allowAllPermissions);
                          } catch (e) { toast.error("Failed"); }
                        }}
                        className={`relative h-7 w-14 rounded-full transition-colors ${allowAllPermissions ? 'bg-primary' : 'bg-gray-600'}`}
                        title="Give permission to ALL users"
                      >
                        <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${allowAllPermissions ? 'translate-x-7' : ''}`}></span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Members</div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">{members.length}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {members.length === 0 ? (
                      <p className="text-sm text-gray-500">Connecting...</p>
                    ) : (
                      members.map((m) => {
                        const isMe = m.userId === user?._id;
                        const initials = (m.username || '??').slice(0, 2).toUpperCase();
                        return (
                          <div key={m.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0D0D0F] transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center text-white text-xs font-bold shadow-sm relative shrink-0">
                              {initials}
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#131315] rounded-full"></span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                                {m.username} {isMe && <span className="text-primary text-xs ml-1">(You)</span>}
                              </div>
                              {m.role === 'admin' ? (
                                <div className="text-[10px] uppercase font-bold tracking-wider text-accent mt-0.5">{m.role}</div>
                              ) : (
                                isAdmin && !isMe && (
                                  <div className="mt-2 flex items-center gap-3">
                                    <label className="flex cursor-pointer items-center gap-2">
                                      <input 
                                        type="checkbox" 
                                        checked={m.canParticipate || false} 
                                        onChange={() => handleToggleMember(m.userId, m.canParticipate)} 
                                        className="h-4 w-4 cursor-pointer accent-primary" 
                                      />
                                      <span className="text-xs font-medium text-gray-300">Permit</span>
                                    </label>
                                    <button 
                                      onClick={() => handleBan(m.userId)} 
                                      className="rounded px-2 py-0.5 text-xs text-red-400 transition hover:bg-red-400/20"
                                    >
                                      Ban
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
