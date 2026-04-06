const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },
  passwordHash: { type: String, required: true },
  refreshTokenHash: { type: String, default: null }, // bcrypt hash of refresh token
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
