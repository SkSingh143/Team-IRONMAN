// src/pages/RoomPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useRoomStore from '../store/roomStore';
import useUIStore from '../store/uiStore';
import { getRoom } from '../api/roomApi';
import { useToast } from '../components/common/Toast';
import { useWebSocket } from '../hooks/useWebSocket';
import Navbar from '../components/common/Navbar';
import Canvas from '../components/canvas/Canvas';
import Toolbar from '../components/canvas/Toolbar';
import CursorOverlay from '../components/canvas/CursorOverlay';
import CodePanel from '../components/code/CodePanel';
import PollPanel from '../components/poll/PollPanel';
import '../styles/room.css';

// Tab icons
const TabIcons = {
  canvas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  poll: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  voice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
};

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const { setRoom, setMembers, members, roomName, clearRoom } = useRoomStore();
  const { activeTab, setTab } = useUIStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load room metadata on mount
  useEffect(() => {
    let cancelled = false;
    const loadRoom = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await getRoom(roomId);
        if (cancelled) return;
        setRoom(data.roomId, data.name);
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
  const handleCopyInvite = useCallback(async () => {
    const link = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomId, toast]);

  // Loading state
  if (loading) {
    return (
      <div className="room-loading">
        <div className="spinner" />
        <span>Loading room…</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="room-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <h2>Couldn't join room</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const inviteLink = `${window.location.origin}/room/${roomId}`;
  const tabs = [
    { key: 'canvas', label: 'Canvas', icon: TabIcons.canvas },
    { key: 'code', label: 'Code', icon: TabIcons.code },
    { key: 'poll', label: 'Polls', icon: TabIcons.poll },
    { key: 'voice', label: 'Voice', icon: TabIcons.voice },
  ];

  return (
    <div className="room-layout">
      <Navbar roomName={roomName} roomId={roomId} />

      <div className="room-workspace">
        {/* ---- Left Toolbar (tabs) ---- */}
        <aside className="room-toolbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`toolbar-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setTab(tab.key)}
              title={tab.label}
              id={`toolbar-${tab.key}`}
            >
              {tab.icon}
            </button>
          ))}
          <div className="toolbar-divider" />
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle members"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </button>
        </aside>

        {/* ---- Main Content ---- */}
        <div className="room-main">
          {/* Tab Bar */}
          <div className="room-tab-bar">
            <div className="room-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`room-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setTab(tab.key)}
                  id={`tab-${tab.key}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="room-tab-actions">
              <div className="members-count">
                <span className="dot" />
                {members.length} online
              </div>
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Toggle members"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </button>
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="room-content">
            {activeTab === 'canvas' && (
              <>
                <Canvas />
                <Toolbar />
                <CursorOverlay />
              </>
            )}
            {activeTab === 'code' && <CodePanel />}
            {activeTab === 'poll' && <PollPanel />}
            {activeTab === 'voice' && (
              <div className="room-content-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                </svg>
                <h3>Voice Chat</h3>
                <p>Talk to your team via WebRTC audio. Coming in Phase 5.</p>
              </div>
            )}
          </div>
        </div>

        {/* ---- Right Sidebar ---- */}
        <aside className={`room-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-section">
            <div className="sidebar-title">Room</div>
            <div className="room-info-name">{roomName || 'Untitled Room'}</div>
            <div className="room-info-id">ID: {roomId}</div>
            <div className="invite-row">
              <input
                className="invite-input"
                value={inviteLink}
                readOnly
                onClick={(e) => e.target.select()}
                id="invite-link-input"
              />
              <button
                className={`invite-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyInvite}
                title="Copy invite link"
                id="copy-invite-btn"
              >
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Members ({members.length})</div>
            <div className="member-list">
              {members.length === 0 ? (
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', padding: 'var(--space-2) 0' }}>
                  Connecting…
                </div>
              ) : (
                members.map((m) => {
                  const isMe = m.userId === user?._id;
                  const initials = (m.username || '??').slice(0, 2).toUpperCase();
                  return (
                    <div key={m.userId} className="member-item">
                      <div className={`member-avatar ${m.role === 'admin' ? 'admin' : 'member-role'}`}>
                        {initials}
                      </div>
                      <div className="member-info">
                        <div className="member-name">
                          {m.username}
                          {isMe && <span className="member-you"> (you)</span>}
                        </div>
                        <div className={`member-role-badge ${m.role === 'admin' ? 'admin' : 'member-role'}`}>
                          {m.role}
                        </div>
                      </div>
                      <div className="member-status-dot" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
