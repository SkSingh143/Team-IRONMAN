import { useEffect, useRef } from 'react';
import useRoomStore from '../../store/roomStore';
import { useVoice } from '../../hooks/useVoice';
import { useToast } from '../common/Toast';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';

function AudioElement({ stream, isMuted }) {
  const audioRef = useRef(null);
  useEffect(() => {
    if (audioRef.current && stream) audioRef.current.srcObject = stream;
  }, [stream]);
  return <audio ref={audioRef} autoPlay muted={isMuted} className="hidden" />;
}

export default function VoicePanel() {
  const { roomId } = useRoomStore();
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

  const handleConnect = async () => {
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
          {isConnected && (
            <button 
              onClick={toggleMute}
              className={`p-2.5 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-surface-elevated text-gray-300 hover:bg-surface-elevated/80'}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={handleConnect}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${isConnected ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'}`}
          >
            {isConnected ? <><PhoneOff className="w-4 h-4"/> Disconnect</> : <><PhoneCall className="w-4 h-4"/> Join Voice</>}
          </button>
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
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {participants.map((p, idx) => {
              const initials = (p.username || '??').slice(0, 2).toUpperCase();
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  key={idx} 
                  className={`aspect-square rounded-3xl bg-surface border flex flex-col items-center justify-center p-4 relative transition-all ${p.isSpeaking ? 'border-primary shadow-[0_0_20px_rgba(108,99,255,0.3)]' : 'border-border'}`}
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
                  
                  <div className="text-sm font-medium text-gray-200 text-center truncate w-full">
                    {p.username} {idx === 0 && <span className="text-gray-500">(You)</span>}
                  </div>

                  {p.isMuted && (
                    <div className="absolute top-3 right-3 p-1.5 bg-red-500/20 text-red-500 rounded-full">
                      <MicOff className="w-3.5 h-3.5" />
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
