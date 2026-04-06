const roomSessions = require('../roomSessions');

const handleVoiceSignal = (ws, type, data, roomId, userId) => {
  const { targetUserId, ...restData } = data;

  const room = roomSessions.get(roomId);
  if (!room) return;

  const clientData = room.clients.get(ws);
  if (!clientData) return;
  if (!room.voiceParticipants) room.voiceParticipants = new Map();

  if (type === 'voice_join') {
    const username = restData.username || clientData.username || 'Unknown';
    clientData.inVoice = true;
    clientData.isMuted = false;
    clientData.username = username;

    const activeParticipants = Array.from(room.voiceParticipants.entries()).map(([participantUserId, participant]) => ({
      userId: participantUserId,
      username: participant.username,
      isMuted: !!participant.isMuted,
    }));

    ws.send(JSON.stringify({
      type: 'voice_state',
      data: { participants: activeParticipants }
    }));

    room.voiceParticipants.set(userId, { username, isMuted: false });
  }

  if (type === 'voice_mute_toggle') {
    clientData.isMuted = !!restData.isMuted;
    if (room.voiceParticipants.has(userId)) {
      const participant = room.voiceParticipants.get(userId);
      room.voiceParticipants.set(userId, { ...participant, isMuted: !!restData.isMuted });
    }
  }

  if (type === 'voice_leave') {
    clientData.inVoice = false;
    clientData.isMuted = false;
    room.voiceParticipants.delete(userId);
  }

  const message = JSON.stringify({
    type,
    data: { ...restData, targetUserId, senderId: userId }
  });

  // Relay to target if specified, otherwise broadcast to room
  for (const [clientWs, clientData] of room.clients.entries()) {
    if (clientWs !== ws && clientWs.readyState === 1) {
      if (!targetUserId || clientData.userId === targetUserId) {
        clientWs.send(message);
      }
    }
  }
};

module.exports = { handleVoiceSignal };
