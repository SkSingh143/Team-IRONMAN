const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const tokenSvc = require('../services/tokenService');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/api/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, username, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, passwordHash });

    const accessToken = tokenSvc.signAccessToken(user._id);
    const refreshToken = tokenSvc.signRefreshToken(user._id);

    user.refreshTokenHash = await tokenSvc.hashToken(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.status(201).json({ accessToken, user: { _id: user._id, username: user.username, email: user.email } });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = tokenSvc.signAccessToken(user._id);
    const refreshToken = tokenSvc.signRefreshToken(user._id);

    user.refreshTokenHash = await tokenSvc.hashToken(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken, user: { _id: user._id, username: user.username, email: user.email } });
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const decoded = tokenSvc.verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.refreshTokenHash) return res.status(401).json({ error: 'Invalid token' });

    const valid = await tokenSvc.compareToken(token, user.refreshTokenHash);
    if (!valid) return res.status(401).json({ error: 'Token reuse detected' });

    // Rotate: issue new pair
    const newAccess = tokenSvc.signAccessToken(user._id);
    const newRefresh = tokenSvc.signRefreshToken(user._id);

    user.refreshTokenHash = await tokenSvc.hashToken(newRefresh);
    await user.save();

    res.cookie('refreshToken', newRefresh, COOKIE_OPTIONS);
    res.json({ accessToken: newAccess });
  } catch (err) { next(err); }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      let decoded;
      try {
        decoded = tokenSvc.verifyRefreshToken(token);
      } catch (err) {
        decoded = null;
      }
      if (decoded) await User.findByIdAndUpdate(decoded.userId, { refreshTokenHash: null });
    }

    res.clearCookie('refreshToken', { 
      path: '/api/auth/refresh',
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -refreshTokenHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (err) { next(err); }
};
