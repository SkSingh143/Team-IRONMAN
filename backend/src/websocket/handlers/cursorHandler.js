const roomSessions = require('../roomSessions');

const handleCursorMove = (ws, data, roomId, userId) => {
  const { x, y, username } = data;

  const room = roomSessions.get(roomId);
  if (!room) return;

  const message = JSON.stringify({
    type: 'cursor_move',
    data: { userId, x, y, username }
  });

  // Relay immediately to all other clients in the room
  for (const [clientWs, clientData] of room.clients.entries()) {
    if (clientWs !== ws && clientWs.readyState === 1) {
      clientWs.send(message);
    }
  }
};

module.exports = { handleCursorMove };
