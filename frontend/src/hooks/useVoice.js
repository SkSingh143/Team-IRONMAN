// src/hooks/useVoice.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { wsManager } from '../utils/wsManager';
import useAuthStore from '../store/authStore';
import useRoomStore from '../store/roomStore';

export function useVoice(roomId) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('disconnected'); // connecting, connected, disconnected
  const [participants, setParticipants] = useState(new Map()); // Map userId -> { stream, isSpeaking, isMuted, username }
  
  const localStream = useRef(null);
  const peerConnections = useRef(new Map()); // Map userId -> RTCPeerConnection
  const myUserId = useAuthStore(s => s.user?._id);
  const myUsername = useAuthStore(s => s.user?.username);

  // Configuration for WebRTC
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  // Helper to update participant state
  const updateParticipant = useCallback((userId, data) => {
    setParticipants(prev => {
      const next = new Map(prev);
      const existing = next.get(userId) || {};
      
      // Clean undefined values from data so they don't overwrite existing
      const cleanData = {};
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined) cleanData[k] = v;
      });
      
      next.set(userId, { ...existing, ...cleanData, userId });
      return next;
    });
  }, []);

  const removeParticipant = useCallback((userId) => {
    setParticipants(prev => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
    
    // Close peer connection
    const pc = peerConnections.current.get(userId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(userId);
    }
  }, []);

  // Initialize local audio stream
  const startLocalStream = async () => {
    if (localStream.current) return true;
    try {
      setStatus('connecting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      setIsMuted(false);
      
      // Add self to participants for UI
      updateParticipant(myUserId, { 
        stream, 
        isSpeaking: false, 
        isMuted: false, 
        username: myUsername 
      });
      
      // Monitor self speaking
      setupAudioLevelMonitoring(myUserId, stream);
      
      setIsConnected(true);
      setStatus('connected');
      
      // Announce we joined voice
      wsManager.send('voice_join', { username: myUsername }, roomId);
      
      return true;
    } catch (err) {
      console.error('Failed to get audio stream', err);
      setStatus('disconnected');
      return false;
    }
  };

  // Stop local audio
  const stopLocalStream = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    
    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    setParticipants(new Map());
    setIsConnected(false);
    setIsMuted(false);
    setStatus('disconnected');
    
    if (wsManager.isConnected) {
      wsManager.send('voice_leave', {}, roomId);
    }
  }, [roomId]);

  // Handle Mute
  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        updateParticipant(myUserId, { isMuted: !audioTrack.enabled });
        wsManager.send('voice_mute_toggle', { isMuted: !audioTrack.enabled }, roomId);
      }
    }
  };

  // WebRTC Signaling Handlers
  useEffect(() => {
    if (!roomId) return;

    // Someone joined voice -> initiate offer
    const handleJoin = async (payload) => {
      const peerId = payload.senderId;
      if (peerId === myUserId || !localStream.current) return;
      
      try {
        updateParticipant(peerId, { username: payload.username, isMuted: !!payload.isMuted });
        const pc = createPeerConnection(peerId, payload.username);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsManager.send('webrtc_offer', { 
          targetUserId: peerId, 
          sdp: pc.localDescription,
          username: useAuthStore.getState().user?.username
        }, roomId);
      } catch (e) {
        console.error('Error creating offer', e);
      }
    };

    // Receive offer -> create answer
    const handleOffer = async (payload) => {
      const peerId = payload.senderId;
      if (!localStream.current) return;
      
      try {
        updateParticipant(peerId, { username: payload.username, isMuted: !!payload.isMuted });
        const pc = createPeerConnection(peerId, payload.username);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        
        // Process queued ICE candidates
        if (pc.candidateQueue) {
          for (const cand of pc.candidateQueue) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
          }
          pc.candidateQueue = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        wsManager.send('webrtc_answer', { 
          targetUserId: peerId, 
          sdp: pc.localDescription,
          username: useAuthStore.getState().user?.username
        }, roomId);
      } catch (e) {
        console.error('Error handling offer', e);
      }
    };

    // Receive answer -> set remote description
    const handleAnswer = async (payload) => {
      const peerId = payload.senderId;
      const pc = peerConnections.current.get(peerId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          
          // Process queued ICE candidates
          if (pc.candidateQueue) {
            for (const cand of pc.candidateQueue) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
            }
            pc.candidateQueue = [];
          }
        } catch (e) {
          console.error('Error setting remote answer', e);
        }
      }
    };

    // Receive ICE candidate
    const handleIce = async (payload) => {
      const peerId = payload.senderId;
      const pc = peerConnections.current.get(peerId);
      if (pc && payload.candidate) {
        try {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            if (!pc.candidateQueue) pc.candidateQueue = [];
            pc.candidateQueue.push(payload.candidate);
          }
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    };

    // Someone muted/unmuted
    const handleMuteToggle = (payload) => {
      updateParticipant(payload.senderId, { isMuted: payload.isMuted });
    };

    const handleVoiceState = (payload) => {
      const activeParticipants = payload?.participants || [];
      activeParticipants.forEach((participant) => {
        if (!participant?.userId || participant.userId === myUserId) return;
        updateParticipant(participant.userId, {
          username: participant.username,
          isMuted: !!participant.isMuted,
          isSpeaking: false,
        });
      });
    };

    // Someone left voice
    const handleLeave = (payload) => {
      removeParticipant(payload.senderId);
    };

    // Register WebRTC spec events from frontend.md Section 5.1
    wsManager.on('voice_join', handleJoin);
    wsManager.on('voice_state', handleVoiceState);
    wsManager.on('webrtc_offer', handleOffer);
    wsManager.on('webrtc_answer', handleAnswer);
    wsManager.on('webrtc_ice', handleIce);
    wsManager.on('voice_mute_toggle', handleMuteToggle);
    wsManager.on('voice_leave', handleLeave);

    return () => {
      wsManager.off('voice_join', handleJoin);
      wsManager.off('voice_state', handleVoiceState);
      wsManager.off('webrtc_offer', handleOffer);
      wsManager.off('webrtc_answer', handleAnswer);
      wsManager.off('webrtc_ice', handleIce);
      wsManager.off('voice_mute_toggle', handleMuteToggle);
      wsManager.off('voice_leave', handleLeave);
      stopLocalStream();
    };
  }, [roomId, myUserId, stopLocalStream, updateParticipant, removeParticipant]);

  // Create RTCPeerConnection helper
  const createPeerConnection = (userId, customUsername) => {
    // If it already exists, use it
    if (peerConnections.current.has(userId)) {
      return peerConnections.current.get(userId);
    }

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current.set(userId, pc);

    // Try to get username from store to ensure it's not unknown
    // We import useRoomStore on top of the file
    const storeMember = useRoomStore.getState().members.find(m => m.userId === userId);
    const resolvedUsername = customUsername || storeMember?.username || 'Unknown';

    // Initial participant state
    updateParticipant(userId, { 
      username: resolvedUsername, 
      isMuted: false, 
      isSpeaking: false 
    });

    // Add local tracks to PC
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    }

    // Handle ICE candidates to send to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsManager.send('webrtc_ice', {
          targetUserId: userId,
          candidate: event.candidate
        }, roomId);
      }
    };
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      updateParticipant(userId, { stream: remoteStream });
      setupAudioLevelMonitoring(userId, remoteStream);
    };

    // Cleanup on disconnect
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removeParticipant(userId);
      }
    };

    return pc;
  };

  // Monitor audio levels to detect speaking state
  const setupAudioLevelMonitoring = (userId, stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.updateInterval = 100;
    analyser.smoothingTimeConstant = 0.2;
    analyser.fftSize = 256;

    try {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!peerConnections.current.has(userId) && userId !== myUserId) {
          audioContext.close();
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        
        const average = sum / bufferLength;
        const isSpeaking = average > 20; // Threshold

        // Only trigger update if state changed to prevent re-renders
        setParticipants(prev => {
          const current = prev.get(userId);
          if (current && current.isSpeaking !== isSpeaking) {
            const next = new Map(prev);
            next.set(userId, { ...current, isSpeaking });
            return next;
          }
          return prev;
        });

        requestAnimationFrame(checkLevel);
      };

      checkLevel();
    } catch (e) {
      console.warn('Could not setup audio monitoring', e);
    }
  };

  return {
    isConnected,
    isMuted,
    status,
    participants: Array.from(participants.values()),
    myUserId,
    startVoice: startLocalStream,
    stopVoice: stopLocalStream,
    toggleMute
  };
}
