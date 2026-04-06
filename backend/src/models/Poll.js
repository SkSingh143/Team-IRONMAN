const mongoose = require('mongoose');
const { Schema } = mongoose;

const PollSchema = new Schema({
  pollId: { type: String, required: true, unique: true }, // nanoid
  roomId: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true, maxlength: 200 },
  options: [{
    id: { type: String, required: true }, // nanoid per option
    text: { type: String, required: true, maxlength: 100 },
    votes: { type: Number, default: 0 }
  }],
  voters: [{ type: Schema.Types.ObjectId, ref: 'User' }], // prevents double-voting
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

PollSchema.index({ roomId: 1 });

module.exports = mongoose.model('Poll', PollSchema);
