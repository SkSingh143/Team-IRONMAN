// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { createRoom, getMyHistory } from '../api/roomApi';
import { useToast } from '../components/common/Toast';
import Navbar from '../components/common/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
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

        <div className="w-full max-w-5xl flex flex-col relative z-10 pt-10 pb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center md:text-left mb-10"
          >
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-main mb-3 tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{user?.username}</span>
            </h1>
            <p className="text-muted text-sm md:text-base max-w-lg mx-auto md:mx-0">
              Create a new workspace to start collaborating, or join an existing room instantly.
            </p>
          </motion.div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* History Section (Now taking 2 columns for broader view) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 premium-card border border-border p-6 md:p-8 rounded-[2rem] flex flex-col h-full min-h-[350px]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl text-main">Recent Rooms</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
               {loadingHistory ? (
                 <div className="col-span-full flex justify-center py-6"><Loader2 className="w-6 h-6 text-muted animate-spin" /></div>
               ) : history.length === 0 ? (
                 <p className="col-span-full text-sm text-muted text-center py-8">No recent activity detected.</p>
               ) : (
                 history.slice(0, 6).map((room, idx) => (
                   <motion.button 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ duration: 0.3, delay: idx * 0.05 }}
                     key={room.roomId}
                     onClick={() => navigate(`/room/${room.roomId}`)}
                     className="w-full flex items-center justify-between p-4 bg-surface/50 backdrop-blur-sm hover:bg-surface-elevated border border-border hover:border-border-focus rounded-2xl transition-all group text-left shadow-sm"
                   >
                     <div className="flex-1 min-w-0 pr-3">
                       <h4 className="text-sm font-semibold text-main truncate group-hover:text-primary transition-colors">{room.name}</h4>
                       <p className="text-[10px] text-muted uppercase font-mono mt-1 tracking-wider">{room.roomId}</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center group-hover:bg-primary transition-colors">
                       <ArrowRight className="w-4 h-4 text-muted group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                     </div>
                   </motion.button>
                 ))
               )}
              </div>
            </motion.div>

            {/* Actions Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1 glass-panel p-6 rounded-[2rem] flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
              
              {/* Tabs */}
              <div className="flex p-1 mb-8 bg-surface-input/50 backdrop-blur-sm rounded-[1rem] border border-border">
                <button
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all uppercase tracking-wider ${
                    activeTab === 'create' 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-muted hover:text-main'
                  }`}
                  onClick={() => setActiveTab('create')}
                >
                  Create
                </button>
                <button
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all uppercase tracking-wider ${
                    activeTab === 'join' 
                      ? 'bg-surface border border-border text-main shadow-md' 
                      : 'text-muted hover:text-main'
                  }`}
                  onClick={() => setActiveTab('join')}
                >
                  Join
                </button>
              </div>

            <div className="flex-1 flex flex-col justify-center relative z-10 w-full pb-2">
              <AnimatePresence mode="wait">
              {activeTab === 'create' ? (
                <motion.form key="create" initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:10}} transition={{duration:0.2}} onSubmit={handleCreateRoom} className="space-y-5">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-muted uppercase tracking-[0.1em] ml-1">Room Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 bg-surface text-sm border border-border rounded-2xl text-main placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                      placeholder="e.g. Design Sync"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      maxLength={50}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Initialize Workspace</>}
                  </button>
                </motion.form>
              ) : (
                <motion.form key="join" initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-10}} transition={{duration:0.2}} onSubmit={handleJoinRoom} className="space-y-5">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-muted uppercase tracking-[0.1em] ml-1">Room ID</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 bg-surface text-sm border border-border rounded-2xl text-main placeholder-muted font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase shadow-inner"
                      placeholder="Enter the 5-Character code"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-surface hover:bg-surface-elevated border border-border text-main rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm"
                  >
                    Join Session <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.form>
              )}
              </AnimatePresence>
            </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
