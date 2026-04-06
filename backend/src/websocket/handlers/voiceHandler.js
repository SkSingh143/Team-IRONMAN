const roomSessions = require('../roomSessions');

const handleVoiceSignal = (ws, data, roomId, userId) => {
  const { signal, targetUserId } = data;

  const room = roomSessions.get(roomId);
  if (!room) return;

  const message = JSON.stringify({
    type: 'voice_signal',
    data: { senderId: userId, signal }
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
