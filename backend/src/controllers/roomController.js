const crypto = require('crypto');
const Room = require('../models/Room');
const Element = require('../models/Element');
const Poll = require('../models/Poll');

// Helper for exact 5-char ID: 3 digits, 2 letters
const generateRoomId = () => {
  const digits = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < 3; i++) id += digits[crypto.randomInt(0, 10)];
  for (let i = 0; i < 2; i++) id += letters[crypto.randomInt(0, 26)];
  // shuffle them
  return id.split('').sort(() => 0.5 - Math.random()).join('');
};

// POST /api/rooms
exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    let roomId;
    let exists = true;
    while(exists) {
      roomId = generateRoomId();
      exists = await Room.findOne({ roomId });
    }

    const room = await Room.create({
      roomId,
      name,
      adminId: req.userId,
      members: [{ userId: req.userId, role: 'admin', canParticipate: true }]
    });

    const link = `${process.env.FRONTEND_URL}/room/${roomId}`;
    res.status(201).json({ roomId, name, adminId: req.userId, inviteLink: link, createdAt: room.createdAt });
  } catch (err) { next(err); }
};

// GET /api/rooms/:roomId
exports.getRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('members.userId', 'username email');

    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    if (room.bannedUsers.includes(req.userId)) {
      return res.status(403).json({ error: 'You are banned from this room' });
    }

    let isMember = room.members.find(m => m.userId && m.userId._id.toString() === req.userId);
    if (!isMember) {
      room.members.push({ userId: req.userId, role: 'member', canParticipate: false });
      await room.save();
      await room.populate('members.userId', 'username email');
    }

    const elementCount = await Element.countDocuments({ roomId: req.params.roomId, deleted: false });

    const members = room.members.map(m => ({
      userId: m.userId._id, 
      username: m.userId.username, 
      role: m.role,
      canParticipate: m.canParticipate
    }));

    res.json({ 
      roomId: room.roomId, 
      name: room.name, 
      adminId: room.adminId, 
      allowAllPermissions: room.allowAllPermissions,
      members, 
      elementCount 
    });
  } catch (err) { next(err); }
};

// DELETE /api/rooms/:roomId (admin only)
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.adminId.toString() !== req.userId) return res.status(403).json({ error: 'Admin only' });

    await Promise.all([
      Room.deleteOne({ roomId: req.params.roomId }),
      Element.deleteMany({ roomId: req.params.roomId }),
      Poll.deleteMany({ roomId: req.params.roomId }),
    ]);

    res.json({ message: 'Room deleted' });
  } catch (err) { next(err); }
};

// POST /api/rooms/:roomId/ban (admin only)
exports.banUser = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.adminId.toString() !== req.userId) return res.status(403).json({ error: 'Admin only' });
    if (req.body.userId === req.userId) return res.status(400).json({ error: 'Cannot ban yourself' });

    room.members = room.members.filter(m => m.userId.toString() !== req.body.userId);
    if (!room.bannedUsers.includes(req.body.userId)) {
      room.bannedUsers.push(req.body.userId);
    }
    await room.save();

    res.json({ message: 'User banned' });
  } catch (err) { next(err); }
};

// PUT /api/rooms/:roomId/permissions (admin only)
exports.toggleAllPermissions = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    if (room.adminId.toString() !== req.userId) return res.status(403).json({ error: 'Admin only' });

    room.allowAllPermissions = req.body.allowAllPermissions;
    await room.save();
    
    const roomSessions = require('../websocket/roomSessions');
    if (roomSessions.has(room.roomId)) {
      roomSessions.get(room.roomId).allowAllPermissions = room.allowAllPermissions;
      const msg = JSON.stringify({ type: 'permissions_updated', data: { allowAllPermissions: room.allowAllPermissions } });
      for (const [clientWs] of roomSessions.get(room.roomId).clients.entries()) {
        if (clientWs.readyState === 1) clientWs.send(msg);
      }
    }

    res.json({ allowAllPermissions: room.allowAllPermissions });
  } catch (err) { next(err); }
};

// PUT /api/rooms/:roomId/member/:memberId/permission (admin only)
exports.toggleMemberPermission = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    if (room.adminId.toString() !== req.userId) return res.status(403).json({ error: 'Admin only' });

    const member = room.members.find(m => m.userId.toString() === req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    
    member.canParticipate = req.body.canParticipate;
    await room.save();
    
    const roomSessions = require('../websocket/roomSessions');
    if (roomSessions.has(room.roomId)) {
      const msg = JSON.stringify({ type: 'member_permission_updated', data: { userId: member.userId, canParticipate: member.canParticipate } });
      const rs = roomSessions.get(room.roomId);
      for (const [clientWs, clientData] of rs.clients.entries()) {
        if (clientData.userId === member.userId.toString()) {
            clientData.canParticipate = member.canParticipate;
        }
        if (clientWs.readyState === 1) clientWs.send(msg);
      }
    }

    res.json({ userId: member.userId, canParticipate: member.canParticipate });
  } catch (err) { next(err); }
};
