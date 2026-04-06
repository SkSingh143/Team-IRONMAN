// src/pages/DashboardPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { createRoom, getRoom } from '../api/roomApi';
import { useToast } from '../components/common/Toast';
import Navbar from '../components/common/Navbar';
import '../styles/dashboard.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();

  const [roomName, setRoomName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.warning('Please enter a room name');
      return;
    }
    setCreateLoading(true);
    try {
      const { data } = await createRoom(roomName.trim());
      toast.success(`Room "${data.name}" created!`);
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create room';
      toast.error(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinId.trim()) {
      toast.warning('Please enter a Room ID');
      return;
    }
    setJoinLoading(true);
    try {
      await getRoom(joinId.trim());
      navigate(`/room/${joinId.trim()}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Room not found';
      toast.error(msg);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="dashboard-layout bg-grid">
      <Navbar />

      <main className="dashboard-content">
        {/* Hero */}
        <div className="dashboard-hero">
          <h1>
            Hey {user?.username || 'there'}, <br />
            ready to <span>collaborate</span>?
          </h1>
          <p>Create a new room or join an existing one to start drawing, coding, polling and talking together in real-time.</p>
        </div>

        {/* Action Cards */}
        <div className="dashboard-grid">
          {/* Create Room */}
          <div className="dashboard-card">
            <div className="dashboard-card-icon create">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h2>Create Room</h2>
            <p>Start a new collaborative workspace and invite your team.</p>
            <form onSubmit={handleCreateRoom}>
              <input
                className="input"
                type="text"
                placeholder="Room name (e.g. Sprint Review)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={80}
                id="create-room-input"
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createLoading}
                id="create-room-btn"
              >
                {createLoading ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Creating…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create Room
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Join Room */}
          <div className="dashboard-card">
            <div className="dashboard-card-icon join">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h2>Join Room</h2>
            <p>Enter a Room ID or paste an invite link to join a session.</p>
            <form onSubmit={handleJoinRoom}>
              <input
                className="input"
                type="text"
                placeholder="Paste Room ID (e.g. abc123xyz)"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                id="join-room-input"
              />
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={joinLoading}
                id="join-room-btn"
              >
                {joinLoading ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Joining…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Join Room
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
