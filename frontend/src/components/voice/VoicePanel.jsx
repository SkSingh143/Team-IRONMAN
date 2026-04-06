// src/components/voice/VoicePanel.jsx
import { useEffect, useRef } from 'react';
import useRoomStore from '../../store/roomStore';
import { useVoice } from '../../hooks/useVoice';
import { useToast } from '../common/Toast';
import '../../styles/voice.css';

// Component to render remote audio streams
function AudioElement({ stream, isMuted }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay muted={isMuted} style={{ display: 'none' }} />;
}

export default function VoicePanel() {
  const { roomId } = useRoomStore();
  const toast = useToast();
  
  const {
    isConnected,
    isMuted,
    status,
    participants,
    myUserId,
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
      } else {
        toast.success('Connected to voice');
      }
    }
  };

  return (
    <div className="voice-panel">
      {/* Hidden audio tags for remote participants */}
      {participants.map((p, idx) => (
        // Only render audio tag if it's a remote participant with a valid stream
        (p.stream && p.username !== undefined && idx !== 0) ? (
          <AudioElement key={idx} stream={p.stream} isMuted={false} /> // don't mute remote streams locally unless we add that feature
        ) : null
      ))}

      {/* Header */}
      <div className="voice-header">
        <div className="voice-header-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
          </svg>
          Voice Channel
          <span className={`voice-status ${status}`}>
            {status === 'connecting' ? 'Connecting…' : status === 'connected' ? 'Connected' : ''}
          </span>
        </div>

        <div className="voice-controls">
          {isConnected && (
            <button 
              className={`voice-mute-btn ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                  <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}

          <button 
            className={`voice-connect-btn ${isConnected ? 'connected' : ''}`}
            onClick={handleConnect}
          >
            {isConnected ? 'Disconnect' : 'Connect Auto'}
          </button>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="voice-grid">
        {!isConnected && participants.length === 0 ? (
          <div className="voice-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
            </svg>
            <p>Join the voice channel to talk with your team</p>
            <button className="btn btn-primary" onClick={handleConnect}>
              Join Voice
            </button>
          </div>
        ) : (
          participants.map((p, idx) => {
            const initials = (p.username || '??').slice(0, 2).toUpperCase();
            return (
              <div key={idx} className={`voice-card ${p.isSpeaking ? 'is-speaking' : ''}`}>
                <div className="voice-card-avatar">
                  {initials}
                </div>
                <div className="voice-card-name">
                  {p.username} {idx === 0 ? '(You)' : ''}
                </div>
                {p.isMuted && (
                  <div className="voice-card-mute-icon" title="Muted">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                      <path d="M17 16.95A7 7 0 015 12v-1" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
