const { WebSocketServer } = require('ws');
const url = require('url');
const { verifyAccessToken } = require('../services/tokenService');
const roomSessions = require('./roomSessions');

const Room = require('../models/Room');
const Element = require('../models/Element');
const Poll = require('../models/Poll');

// Handlers
const { handleDraw, handleDeleteElement, handleClearCanvas } = require('./handlers/drawHandler');
const { handleCursorMove } = require('./handlers/cursorHandler');
const { handleCodeShare } = require('./handlers/codeHandler');
const { handlePollCreate, handlePollVote, handlePollDelete } = require('./handlers/pollHandler');
const { handleVoiceSignal } = require('./handlers/voiceHandler');

const normalizeRoomId = (roomId) => String(roomId || '').trim().toUpperCase();

const initWS = (server) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const parsedUrl = url.parse(request.url, true);
      const token = parsedUrl.query.token;
      const roomId = normalizeRoomId(parsedUrl.query.roomId);

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

  wss.on('connection', async (ws, request) => {
    const { userId, roomId } = request;

    try {
      // 1. Validate Room & Permissions
      const roomDoc = await Room.findOne({ roomId }).populate('members.userId', 'username');
      if (!roomDoc) { ws.close(); return; }

      if (roomDoc.bannedUsers.includes(userId)) {
        ws.close(); return;
      }

      const memberInfo = roomDoc.members.find(m => m.userId && m.userId._id.toString() === userId);
      const role = memberInfo ? memberInfo.role : 'member';
      const canParticipate = memberInfo ? memberInfo.canParticipate : false;
      const username = memberInfo && memberInfo.userId ? memberInfo.userId.username : 'Unknown';

      // 2. Register Session
      if (!roomSessions.has(roomId)) {
        roomSessions.set(roomId, {
          allowAllPermissions: roomDoc.allowAllPermissions,
          clients: new Map(),
          voiceParticipants: new Map(),
        });
      }
      const room = roomSessions.get(roomId);
      if (!room.voiceParticipants) room.voiceParticipants = new Map();
      room.clients.set(ws, { userId, username, role, canParticipate, inVoice: false, isMuted: false });

      // 3. Dispatch Initial state snapshot
      const elements = await Element.find({ roomId, deleted: false });
      const polls = await Poll.find({ roomId });
      
      const snapshotMsg = JSON.stringify({
        type: 'canvas_snapshot',
        data: {
          elements,
          polls,
          codeSnippet: roomDoc.codeSnippet,
          codeLanguage: roomDoc.codeLanguage,
          members: roomDoc.members.map(m => ({
            userId: m.userId._id,
            username: m.userId.username,
            role: m.role,
            canParticipate: m.canParticipate
          }))
        }
      });
      ws.send(snapshotMsg);

      // 4. Broadcast join
      const joinMsg = JSON.stringify({ type: 'user_joined', data: { userId, username, role, canParticipate } });
      for (const clientWs of room.clients.keys()) {
        if (clientWs !== ws && clientWs.readyState === 1) {
          clientWs.send(joinMsg); // Broadcast to existing clients
        }
      }

      // 5. Message Handling
      ws.on('message', async (messageBuffer) => {
        try {
          const messageStr = messageBuffer.toString();
          const payload = JSON.parse(messageStr);
          
          // Permission Gate
          const modifyingActions = [
            'draw', 'delete_element', 'clear_canvas', 
            'code_share', 
            'poll_create', 'poll_delete', 
            'voice_join', 'webrtc_offer', 'webrtc_answer', 'webrtc_ice', 'voice_mute_toggle'
          ];

          if (modifyingActions.includes(payload.type)) {
            const clientData = room.clients.get(ws);
            if (!clientData) return;
            const hasPerm = clientData.role === 'admin' || clientData.canParticipate || room.allowAllPermissions;
            if (!hasPerm) {
              // Notify client it was denied so it can drop optimistic updates if needed
              if (payload.type === 'draw' || payload.type === 'code_share') {
                ws.send(JSON.stringify({ type: 'permission_denied', data: { action: payload.type } }));
              }
              return;
            }
          }
          
          switch (payload.type) {
            case 'draw':
              await handleDraw(ws, payload.data, roomId, userId);
              break;
            case 'delete_element':
              await handleDeleteElement(ws, payload.data, roomId);
              break;
            case 'clear_canvas':
              await handleClearCanvas(ws, payload.data, roomId, userId);
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
            case 'poll_delete':
              await handlePollDelete(ws, payload.data, roomId, userId);
              break;
            case 'webrtc_offer':
            case 'webrtc_answer':
            case 'webrtc_ice':
            case 'voice_join':
            case 'voice_leave':
            case 'voice_mute_toggle':
              handleVoiceSignal(ws, payload.type, payload.data, roomId, userId);
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
          const clientData = room.clients.get(ws);
          if (clientData?.inVoice) {
            room.voiceParticipants.delete(userId);
            const voiceLeaveMsg = JSON.stringify({ type: 'voice_leave', data: { senderId: userId } });
            for (const [clientWs] of room.clients.entries()) {
              if (clientWs !== ws && clientWs.readyState === 1) clientWs.send(voiceLeaveMsg);
            }
          }
          room.clients.delete(ws);
          
          if (room.clients.size === 0) {
            roomSessions.delete(roomId);
          } else {
            const leaveMsg = JSON.stringify({ type: 'user_leave', data: { userId } });
            for (const clientWs of room.clients.keys()) {
              if (clientWs.readyState === 1) clientWs.send(leaveMsg);
            }
          }
        }
      });

    } catch (err) {
      console.error('Error in WS Connection logic:', err);
      ws.close();
    }
  });
};

module.exports = { initWS };
