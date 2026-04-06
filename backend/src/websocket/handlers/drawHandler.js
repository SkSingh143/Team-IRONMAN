const Element = require('../../models/Element');
const roomSessions = require('../roomSessions');

const handleDraw = async (ws, data, roomId, userId) => {
  const { elementId, payload } = data; // payload should contain points, color, lineWidth, tool etc.

  // Broadcast to other clients in the room immediately
  const room = roomSessions.get(roomId);
  if (room) {
    const message = JSON.stringify({
      type: 'draw',
      data: { elementId, userId, payload }
    });

    for (const [clientWs, clientData] of room.clients.entries()) {
      if (clientWs !== ws && clientWs.readyState === 1) { // 1 = WebSocket.OPEN
        clientWs.send(message);
      }
    }
  }

  // Save to DB asynchronously
  try {
    const existing = await Element.findOne({ elementId });
    if (existing) {
      // Append points if it's the same stroke
      if (payload.points && payload.points.length > 0) {
        existing.points.push(...payload.points);
        await existing.save();
      }
    } else {
      // Create new stroke
      await Element.create({
        elementId,
        roomId,
        userId,
        type: 'stroke',
        points: payload.points || [],
        color: payload.color || '#000000',
        lineWidth: payload.lineWidth || 2,
        tool: payload.tool || 'pen'
      });
    }
  } catch (err) {
    console.error('Error saving draw element:', err);
  }
};

const handleDeleteElement = async (ws, data, roomId) => {
  const { elementId } = data;

  // Broadcast
  const room = roomSessions.get(roomId);
  if (room) {
    const message = JSON.stringify({
      type: 'delete_element',
      data: { elementId }
    });

    for (const [clientWs, clientData] of room.clients.entries()) {
      if (clientWs !== ws && clientWs.readyState === 1) {
        clientWs.send(message);
      }
    }
  }

  // Soft delete in DB
  try {
    await Element.findOneAndUpdate({ elementId, roomId }, { deleted: true });
  } catch (err) {
    console.error('Error soft deleting element:', err);
  }
};

module.exports = { handleDraw, handleDeleteElement };
