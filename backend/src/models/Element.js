const mongoose = require('mongoose');
const { Schema } = mongoose;

const ElementSchema = new Schema({
  elementId: { type: String, required: true, unique: true }, // client-generated UUID
  roomId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  type: { type: String, enum: ['stroke', 'shape'], default: 'stroke' },
  shapeType: { type: String, enum: ['rect', 'circle', 'star'] },
  
  start: [Number], // [x, y]
  end: [Number],   // [x, y]
  
  // Mixed array is needed to store [[x,y], [x,y]] properly without subdoc validation errors
  points: { type: Schema.Types.Mixed, default: [] }, 
  
  color: { type: String, default: '#000000' },
  lineWidth: { type: Number, default: 2 },
  tool: { type: String, enum: ['pen', 'eraser', 'rect', 'circle', 'star'], default: 'pen' },
  theme: { type: String, default: 'dark' },
  
  deleted: { type: Boolean, default: false }, // soft delete
}, { timestamps: true });

ElementSchema.index({ roomId: 1 });
ElementSchema.index({ userId: 1 });

module.exports = mongoose.model('Element', ElementSchema);
