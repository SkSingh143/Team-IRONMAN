const roomSessions = require('../roomSessions');

const handleVoiceSignal = (ws, type, data, roomId, userId) => {
  const { targetUserId, ...restData } = data;

  const room = roomSessions.get(roomId);
  if (!room) return;

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
