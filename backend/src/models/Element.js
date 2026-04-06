const mongoose = require('mongoose');
const { Schema } = mongoose;

const ElementSchema = new Schema({
  elementId: { type: String, required: true, unique: true }, // client-generated UUID
  roomId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['stroke'], default: 'stroke' },
  points: [{ x: Number, y: Number }], // max 2000 points
  color: { type: String, default: '#000000' },
  lineWidth: { type: Number, default: 2 },
  tool: { type: String, enum: ['pen', 'eraser'], default: 'pen' },
  deleted: { type: Boolean, default: false }, // soft delete - never hard delete
}, { timestamps: true });

ElementSchema.index({ roomId: 1 });
ElementSchema.index({ userId: 1 });

module.exports = mongoose.model('Element', ElementSchema);
