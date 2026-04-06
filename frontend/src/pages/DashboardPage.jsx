// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { createRoom, getMyHistory } from '../api/roomApi';
import { useToast } from '../components/common/Toast';
import Navbar from '../components/common/Navbar';
import { motion } from 'framer-motion';
import { Plus, Users, ArrowRight, Loader2, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'join'
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await getMyHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.warning('Please enter a room name');
      return;
    }
    try {
      setLoading(true);
      const { data } = await createRoom(roomName);
      toast.success('Room created successfully');
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      toast.error('Failed to create room');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) {
      toast.warning('Please enter a Room ID');
      return;
    }
    navigate(`/room/${joinRoomId.trim()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-root text-gray-200">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative h-full">
        {/* Background blobs */}
        <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] left-[20%] w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 items-start relative z-10 my-auto pt-10 pb-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-8"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                Welcome, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  {user?.username}
                </span>
              </h1>
              <p className="text-gray-400 text-lg mb-8 max-w-md">
                Create a new workspace to start collaborating, or join an existing room using an invite code.
              </p>
            </div>

            {/* History Section */}
            <div className="bg-surface-elevated/50 border border-border p-5 rounded-3xl flex-1 flex flex-col min-h-[220px]">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-accent" />
                <h3 className="text-white font-bold flex-1">Your Recent Rooms</h3>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 max-h-[160px] custom-scrollbar">
               {loadingHistory ? (
                 <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>
               ) : history.length === 0 ? (
                 <p className="text-sm text-gray-500 text-center py-4">You haven't created any rooms yet.</p>
               ) : (
                 history.map(room => (
                   <button 
                     key={room.roomId}
                     onClick={() => navigate(`/room/${room.roomId}`)}
                     className="w-full flex items-center justify-between p-3 bg-surface hover:bg-surface-elevated border border-border rounded-xl transition-all group text-left"
                   >
                     <div className="flex-1 min-w-0 pr-2">
                       <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">{room.name}</h4>
                       <p className="text-[10px] text-gray-500 uppercase font-mono mt-0.5">{room.roomId}</p>
                     </div>
                     <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                   </button>
                 ))
               )}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel p-2 rounded-3xl sticky top-24"
          >
            {/* Tabs */}
            <div className="flex p-1 mb-6 bg-surface-input rounded-2xl">
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'create' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surface-elevated'
                }`}
                onClick={() => setActiveTab('create')}
              >
                Create Room
              </button>
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'join' 
                    ? 'bg-surface-elevated border border-border text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surface-elevated'
                }`}
                onClick={() => setActiveTab('join')}
              >
                Join Room
              </button>
            </div>

            <div className="px-6 pb-6 pt-2">
              {activeTab === 'create' ? (
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Room Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      placeholder="e.g. Design Sync, Weekly Planning"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      maxLength={50}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Create New Room</>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Room ID</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-white placeholder-gray-500 font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors uppercase"
                      placeholder="Enter the 5-Character code"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-white rounded-xl font-bold transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    Join Room <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
