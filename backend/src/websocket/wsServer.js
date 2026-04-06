const { WebSocketServer } = require('ws');
const url = require('url');
const { verifyAccessToken } = require('../services/tokenService');
const roomSessions = require('./roomSessions');

// Handlers
const { handleDraw, handleDeleteElement } = require('./handlers/drawHandler');
const { handleCursorMove } = require('./handlers/cursorHandler');
const { handleCodeShare } = require('./handlers/codeHandler');
const { handlePollCreate, handlePollVote } = require('./handlers/pollHandler');
const { handleVoiceSignal } = require('./handlers/voiceHandler');

const initWS = (server) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const parsedUrl = url.parse(request.url, true);
      const token = parsedUrl.query.token;
      const roomId = parsedUrl.query.roomId;

      if (!token || !roomId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const decoded = verifyAccessToken(token);
      request.userId = decoded.userId;
      request.roomId = roomId;

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      console.error('WebSocket Upgrade Error:', err.message);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request) => {
    const { userId, roomId } = request;

    // Join room session
    if (!roomSessions.has(roomId)) {
      roomSessions.set(roomId, { clients: new Map() });
    }
    const room = roomSessions.get(roomId);
    room.clients.set(ws, { userId });

    // Broadcast user joined (optional, good for live participant list)
    // omit if frontend doesn't need it or use a separate event.

    ws.on('message', async (messageBuffer) => {
      try {
        const messageStr = messageBuffer.toString();
        const payload = JSON.parse(messageStr);
        
        // Dispatch based on payload type
        switch (payload.type) {
          case 'draw':
            await handleDraw(ws, payload.data, roomId, userId);
            break;
          case 'delete_element':
            await handleDeleteElement(ws, payload.data, roomId);
            break;
          case 'cursor_move':
            handleCursorMove(ws, payload.data, roomId, userId);
            break;
          case 'code_share':
            await handleCodeShare(ws, payload.data, roomId, userId);
            break;
          case 'poll_create':
            await handlePollCreate(ws, payload.data, roomId, userId);
            break;
          case 'poll_vote':
            await handlePollVote(ws, payload.data, roomId, userId);
            break;
          case 'voice_signal':
            handleVoiceSignal(ws, payload.data, roomId, userId);
            break;
          default:
            console.warn('Unknown message type:', payload.type);
        }
      } catch (err) {
        console.error('WS Message parsing/handling error:', err);
      }
    });

    ws.on('close', () => {
      if (roomSessions.has(roomId)) {
        const room = roomSessions.get(roomId);
        room.clients.delete(ws);
        
        // Clean up empty rooms memory
        if (room.clients.size === 0) {
          roomSessions.delete(roomId);
        } else {
          // Tell others user left (cursor cleanup)
          const leaveMsg = JSON.stringify({ type: 'user_leave', data: { userId } });
          for (const clientWs of room.clients.keys()) {
            if (clientWs.readyState === 1) clientWs.send(leaveMsg);
          }
        }
      }
    });
  });
};

module.exports = { initWS };
