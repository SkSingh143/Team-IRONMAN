const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
  roomId: { type: String, required: true, unique: true }, // nanoid(10)
  name: { type: String, required: true, maxlength: 80 },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  codeSnippet: { type: String, default: '' },
  codeLanguage: { type: String, default: 'javascript' },
}, { timestamps: true });

RoomSchema.index({ roomId: 1 });

module.exports = mongoose.model('Room', RoomSchema);
