const { nanoid } = require('nanoid');
const Room = require('../models/Room');
const Element = require('../models/Element');
const Poll = require('../models/Poll');

// POST /api/rooms
exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    const roomId = nanoid(10);

    const room = await Room.create({
      roomId,
      name,
      adminId: req.userId,
      members: [{ userId: req.userId, role: 'admin' }]
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

    const elementCount = await Element.countDocuments({ roomId: req.params.roomId, deleted: false });

    const members = room.members.map(m => ({
      userId: m.userId._id, 
      username: m.userId.username, 
      role: m.role
    }));

    res.json({ roomId: room.roomId, name: room.name, adminId: room.adminId, members, elementCount });
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

// POST /api/rooms/:roomId/kick (admin only)
exports.kickUser = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.adminId.toString() !== req.userId) return res.status(403).json({ error: 'Admin only' });

    room.members = room.members.filter(m => m.userId.toString() !== req.body.userId);
    await room.save();

    res.json({ message: 'User removed' });
  } catch (err) { next(err); }
};
