const roomSessions = require('../roomSessions');
const Room = require('../../models/Room');

const handleCodeShare = async (ws, data, roomId, userId) => {
  const { codeSnippet, codeLanguage } = data;

  // Broadcast to other clients immediately
  const room = roomSessions.get(roomId);
  if (room) {
    const message = JSON.stringify({
      type: 'code_share',
      data: { codeSnippet, codeLanguage, userId }
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
    if (codeSnippet !== undefined) updatePayload.codeSnippet = codeSnippet;
    if (codeLanguage !== undefined) updatePayload.codeLanguage = codeLanguage;

    if (Object.keys(updatePayload).length > 0) {
      await Room.findOneAndUpdate({ roomId }, updatePayload);
    }
  } catch (err) {
    console.error('Error saving code snippet:', err);
  }
};

module.exports = { handleCodeShare };
