const Element = require('../../models/Element');
const roomSessions = require('../roomSessions');

const handleDraw = async (ws, data, roomId, userId) => {
  const { elementId, points, color, lineWidth, tool, theme } = data;

  // Broadcast to other clients in the room immediately
  const room = roomSessions.get(roomId);
  if (room) {
    const message = JSON.stringify({
      type: 'draw',
      data: data // Broadcast the full element back to friends so they can plot it
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
      if (points && points.length > 0) {
        existing.points.push(...points);
        await existing.save();
      }
    } else {
      // Create new stroke
      await Element.create({
        elementId,
        roomId,
        userId,
        type: 'stroke',
        points: points || [],
        color: color || '#000000',
        lineWidth: lineWidth || 2,
        tool: tool || 'pen',
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

const handleClearCanvas = async (ws, data, roomId, userId) => {
  const room = roomSessions.get(roomId);
  if (room) {
    const message = JSON.stringify({
      type: 'clear_canvas',
      data: {}
    });

    for (const [clientWs, clientData] of room.clients.entries()) {
      if (clientWs !== ws && clientWs.readyState === 1) {
        clientWs.send(message);
      }
    }
  }

  try {
    await Element.updateMany({ roomId }, { deleted: true });
  } catch (err) {
    console.error('Error soft deleting all elements:', err);
  }
};

module.exports = { handleDraw, handleDeleteElement, handleClearCanvas };
