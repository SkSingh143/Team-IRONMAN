const roomSessions = require('../roomSessions');

const handleCursorMove = (ws, data, roomId, userId) => {
  const room = roomSessions.get(roomId);
  if (!room) return;
  const clientData = room.clients.get(ws);
  if (!clientData) return;

  const x = Number(data?.x);
  const y = Number(data?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  const message = JSON.stringify({
    type: 'cursor_move',
    data: {
      userId,
      x,
      y,
      username: clientData.username || 'Unknown',
    }
  });

  // Relay immediately to all other clients in the room
  for (const [clientWs] of room.clients.entries()) {
    if (clientWs !== ws && clientWs.readyState === 1) {
      clientWs.send(message);
    }
  }
};

module.exports = { handleCursorMove };
