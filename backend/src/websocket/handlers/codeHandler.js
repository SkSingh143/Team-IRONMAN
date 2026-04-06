const roomSessions = require('../roomSessions');
const Room = require('../../models/Room');

const handleCodeShare = async (ws, data, roomId, userId) => {
  const { code, language } = data;

  // Broadcast to other clients immediately
  const room = roomSessions.get(roomId);
  if (room) {
    const message = JSON.stringify({
      type: 'code_update',
      data: { code, language, userId }
    });

    for (const [clientWs, clientData] of room.clients.entries()) {
      if (clientWs !== ws && clientWs.readyState === 1) {
        clientWs.send(message);
      }
    }
  }

  // Persist code in DB asynchronously
  try {
    const updatePayload = {};
    if (code !== undefined) updatePayload.codeSnippet = code;
    if (language !== undefined) updatePayload.codeLanguage = language;

    if (Object.keys(updatePayload).length > 0) {
      await Room.findOneAndUpdate({ roomId }, updatePayload);
    }
  } catch (err) {
    console.error('Error saving code snippet:', err);
  }
};

module.exports = { handleCodeShare };
