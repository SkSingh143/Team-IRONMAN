import { useEffect, useRef } from 'react';
import useRoomStore from '../../store/roomStore';
import useAuthStore from '../../store/authStore';
import { useVoice } from '../../hooks/useVoice';
import { useToast } from '../common/Toast';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneCall, PhoneOff, ShieldAlert } from 'lucide-react';

function AudioElement({ stream, isMuted }) {
  const audioRef = useRef(null);
  useEffect(() => {
    if (audioRef.current && stream) audioRef.current.srcObject = stream;
  }, [stream]);
  return <audio ref={audioRef} autoPlay muted={isMuted} className="hidden" />;
}

export default function VoicePanel() {
  const { roomId, members, allowAllPermissions } = useRoomStore();
  const user = useAuthStore(s => s.user);
  const toast = useToast();
  
  const {
    isConnected,
    isMuted,
    status,
    participants,
    startVoice,
    stopVoice,
    toggleMute
  } = useVoice(roomId);

  // Check if current user has permission
  const currentMember = members.find(m => m.userId === user?._id);
  const isAdmin = currentMember?.role === 'admin';
  const hasPermission = isAdmin || currentMember?.canParticipate || allowAllPermissions;

  const handleConnect = async () => {
    if (!hasPermission) {
      toast.error('Voice is disabled by admin. Request permission to join.');
      return;
    }
    if (isConnected) {
      stopVoice();
      toast.info('Disconnected from voice');
    } else {
      const success = await startVoice();
      if (!success) {
        toast.error('Could not access microphone', 'Permission Denied');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-root overflow-hidden">
      {/* Audio tags */}
      {participants.map((p, idx) => (
        (p.stream && p.username !== undefined && idx !== 0) ? <AudioElement key={idx} stream={p.stream} isMuted={false} /> : null
      ))}

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-2 text-white font-semibold flex-wrap">
          <Mic className="w-5 h-5 text-primary" />
          Voice Channel
          {status === 'connecting' && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold ml-2 animate-pulse">Connecting...</span>}
          {status === 'connected' && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold ml-2">Connected</span>}
        </div>

        <div className="flex items-center gap-3">
          {isConnected && hasPermission && (
            <button 
              onClick={toggleMute}
              className={`p-2.5 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-surface-elevated text-gray-300 hover:bg-surface-elevated/80'}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Join/Disconnect button with permission awareness */}
          <div className="relative group">
            <button 
              onClick={handleConnect}
              disabled={!hasPermission && !isConnected}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
                !hasPermission && !isConnected
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                  : isConnected 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                    : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'
              }`}
            >
              {!hasPermission && !isConnected ? (
                <><ShieldAlert className="w-4 h-4" /> Disabled</>
              ) : isConnected ? (
                <><PhoneOff className="w-4 h-4"/> Disconnect</>
              ) : (
                <><PhoneCall className="w-4 h-4"/> Join Voice</>
              )}
            </button>
            {/* Tooltip on hover when disabled */}
            {!hasPermission && !isConnected && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-border shadow-lg z-50">
                <ShieldAlert className="w-3 h-3 inline mr-1 text-amber-400" />
                Disabled by Admin
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-r border-b border-border rotate-45 -mt-1"></div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!isConnected && participants.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-gray-500 max-w-xs mx-auto">
            <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
              <Mic className="w-8 h-8 text-gray-400" />
            </div>
            <p>Join the voice channel to securely talk with your team using WebRTC.</p>
            {!hasPermission && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Voice is currently disabled by the admin.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {participants.map((p, idx) => {
              const displayName = p.username || 'Unknown';
              const initials = displayName.slice(0, 2).toUpperCase();
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  key={idx} 
                  className={`rounded-3xl bg-surface border flex flex-col items-center justify-center p-5 relative transition-all ${p.isSpeaking ? 'border-primary shadow-[0_0_20px_rgba(108,99,255,0.3)]' : 'border-border'}`}
                  style={{ minHeight: '180px' }}
                >
                  {/* Avatar with pulse */}
                  <div className="relative mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold z-10 relative ${idx === 0 ? 'bg-gradient-to-br from-primary to-accent' : 'bg-surface-elevated border-2 border-border'}`}>
                      {initials}
                    </div>
                    {p.isSpeaking && (
                      <div className="absolute -inset-2 rounded-full border-2 border-primary animate-pulse-ring pointer-events-none z-0" />
                    )}
                  </div>
                  
                  {/* Name -- clearly visible */}
                  <div className="text-sm font-semibold text-white text-center w-full px-2 leading-tight" title={displayName}>
                    <span className="block truncate">{displayName}</span>
                    {idx === 0 && <span className="text-xs text-primary font-medium mt-0.5 block">(You)</span>}
                  </div>

                  {/* Muted indicator */}
                  {p.isMuted && (
                    <div className="absolute top-3 right-3 p-1.5 bg-red-500/20 text-red-500 rounded-full">
                      <MicOff className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Speaking indicator label */}
                  {p.isSpeaking && (
                    <div className="mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      Speaking
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
