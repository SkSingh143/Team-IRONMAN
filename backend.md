**LiveCollab**

**BACKEND Developer Guide**

Node.js • Express • MongoDB • WebSocket • JWT • WebRTC Signaling

_Self-contained guide - build entire backend independently_

**Frontend contact: share API contracts from Section 4 - they depend on you**

# 0\. Quick Start - Running in 5 Minutes

**⚡ Run these exact commands. Backend must listen on port 4000.**

\# 1. Create project

mkdir backend && cd backend

npm init -y

\# 2. Install ALL dependencies

npm install express mongoose bcryptjs jsonwebtoken cookie-parser

npm install cors ws nanoid express-rate-limit express-validator dotenv

\# 3. Install dev dependencies

npm install --save-dev nodemon

\# 4. package.json scripts

"scripts": {

"dev": "nodemon server.js",

"start": "node server.js"

}

\# 5. Create .env (see Section 3)

\# 6. Start

npm run dev # → <http://localhost:4000>

**⚠️ Frontend runs on port 5173. CORS is configured to allow it. Never change these ports without telling the frontend dev.**

# 1\. Complete Folder Structure

backend/

├── src/

│ ├── config/

│ │ └── db.js ← Mongoose connect()

│ │

│ ├── controllers/

│ │ ├── authController.js ← register, login, refresh, logout, getMe

│ │ └── roomController.js ← createRoom, getRoom, deleteRoom, kickUser

│ │

│ ├── middleware/

│ │ ├── authMiddleware.js ← verifyAccessToken (JWT check on protected routes)

│ │ ├── rateLimiter.js ← express-rate-limit configs

│ │ └── errorHandler.js ← Global Express error handler

│ │

│ ├── models/

│ │ ├── User.js ← Mongoose schema

│ │ ├── Room.js ← Mongoose schema

│ │ ├── Element.js ← Mongoose schema (drawing strokes)

│ │ └── Poll.js ← Mongoose schema

│ │

│ ├── routes/

│ │ ├── authRoutes.js ← /api/auth/\*

│ │ └── roomRoutes.js ← /api/rooms/\*

│ │

│ ├── services/

│ │ ├── tokenService.js ← signAccessToken, signRefreshToken, verify

│ │ └── roomService.js ← business logic for room ops

│ │

│ └── websocket/

│ ├── wsServer.js ← WS server, auth on upgrade, room routing

│ ├── roomSessions.js ← In-memory Map: roomId → { clients, elements }

│ └── handlers/

│ ├── drawHandler.js ← handle draw + delete_element

│ ├── cursorHandler.js ← handle cursor_move

│ ├── codeHandler.js ← handle code_share

│ ├── pollHandler.js ← handle poll_create + poll_vote

│ └── voiceHandler.js ← handle voice_signal (relay only)

│

├── app.js ← Express app setup (no listen)

├── server.js ← HTTP + WS server entry (listens on PORT)

├── .env

└── package.json

# 2\. Environment Variables (.env)

**Copy this EXACTLY into your .env file. Never commit .env to git.**

PORT=4000

MONGODB_URI=mongodb://localhost:27017/livecollab

\# OR MongoDB Atlas: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/livecollab

JWT_ACCESS_SECRET=replace-with-random-64-char-string-here-abc123xyz

JWT_REFRESH_SECRET=different-random-64-char-string-here-def456uvw

JWT_ACCESS_EXPIRES=15m

JWT_REFRESH_EXPIRES=7d

FRONTEND_URL=<http://localhost:5173>

NODE_ENV=development

| **Variable**        | **Purpose**                | **Production Value**            |
| ------------------- | -------------------------- | ------------------------------- |
| PORT                | HTTP + WS server port      | 4000 (Railway auto-assigns)     |
| MONGODB_URI         | MongoDB connection string  | MongoDB Atlas URI               |
| JWT_ACCESS_SECRET   | Sign access tokens (15min) | Random 64-char string           |
| JWT_REFRESH_SECRET  | Sign refresh tokens (7d)   | Different random 64-char string |
| JWT_ACCESS_EXPIRES  | Access token TTL           | 15m                             |
| JWT_REFRESH_EXPIRES | Refresh token TTL          | 7d                              |
| FRONTEND_URL        | Allowed CORS origin        | <https://yourapp.vercel.app>    |
| NODE_ENV            | Environment flag           | production                      |

# 3\. MongoDB Schemas (Mongoose)

## 3.1 User Model - src/models/User.js

const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({

email: { type: String, required: true, unique: true, lowercase: true, trim: true },

username: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },

passwordHash: { type: String, required: true },

refreshTokenHash: { type: String, default: null }, // bcrypt hash of refresh token

}, { timestamps: true });

UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);

## 3.2 Room Model - src/models/Room.js

const RoomSchema = new Schema({

roomId: { type: String, required: true, unique: true }, // nanoid(10)

name: { type: String, required: true, maxlength: 80 },

adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

members: \[{

userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

role: { type: String, enum: \['admin', 'member'\], default: 'member' },

joinedAt: { type: Date, default: Date.now }

}\],

codeSnippet: { type: String, default: '' },

codeLanguage: { type: String, default: 'javascript' },

}, { timestamps: true });

RoomSchema.index({ roomId: 1 });

module.exports = mongoose.model('Room', RoomSchema);

## 3.3 Element Model - src/models/Element.js

// Stores drawing strokes - append only, never mutate

const ElementSchema = new Schema({

elementId: { type: String, required: true, unique: true }, // client-generated UUID

roomId: { type: String, required: true },

userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

type: { type: String, enum: \['stroke'\], default: 'stroke' },

points: \[{ x: Number, y: Number }\], // max 2000 points

color: { type: String, default: '#000000' },

lineWidth: { type: Number, default: 2 },

tool: { type: String, enum: \['pen', 'eraser'\], default: 'pen' },

deleted: { type: Boolean, default: false }, // soft delete - never hard delete

}, { timestamps: true });

ElementSchema.index({ roomId: 1 });

ElementSchema.index({ userId: 1 });

module.exports = mongoose.model('Element', ElementSchema);

## 3.4 Poll Model - src/models/Poll.js

const PollSchema = new Schema({

pollId: { type: String, required: true, unique: true }, // nanoid

roomId: { type: String, required: true },

createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

question: { type: String, required: true, maxlength: 200 },

options: \[{

id: { type: String, required: true }, // nanoid per option

text: { type: String, required: true, maxlength: 100 },

votes: { type: Number, default: 0 }

}\],

voters: \[{ type: Schema.Types.ObjectId, ref: 'User' }\], // prevents double-voting

isActive: { type: Boolean, default: true },

}, { timestamps: true });

PollSchema.index({ roomId: 1 });

module.exports = mongoose.model('Poll', PollSchema);

# 4\. REST API - Full Implementation

**Frontend expects EXACTLY these routes, methods, and response shapes. Do not change without coordinating.**

## 4.1 All REST Routes

| **Method** | **Route**               | **Auth**       | **Controller Function**   | **Description**       |
| ---------- | ----------------------- | -------------- | ------------------------- | --------------------- |
| POST       | /api/auth/register      | None           | authController.register   | Register new user     |
| POST       | /api/auth/login         | None           | authController.login      | Login, get token pair |
| POST       | /api/auth/refresh       | Cookie only    | authController.refresh    | Rotate refresh token  |
| POST       | /api/auth/logout        | Cookie only    | authController.logout     | Clear refresh token   |
| GET        | /api/auth/me            | Bearer         | authController.getMe      | Get current user      |
| POST       | /api/rooms              | Bearer         | roomController.create     | Create new room       |
| GET        | /api/rooms/:roomId      | Bearer         | roomController.getRoom    | Get room data         |
| DELETE     | /api/rooms/:roomId      | Bearer (admin) | roomController.deleteRoom | Delete room           |
| POST       | /api/rooms/:roomId/kick | Bearer (admin) | roomController.kickUser   | Remove member         |

## 4.2 app.js - Express Setup

// src/app.js

const express = require('express');

const cors = require('cors');

const cookieParser= require('cookie-parser');

const authRoutes = require('./routes/authRoutes');

const roomRoutes = require('./routes/roomRoutes');

const errorHandler= require('./middleware/errorHandler');

const app = express();

app.use(cors({

origin: process.env.FRONTEND_URL, // <http://localhost:5173>

credentials: true, // REQUIRED for cookies

}));

app.use(express.json());

app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.use('/api/rooms', roomRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;

## 4.3 server.js - HTTP + WS Entry

// server.js

require('dotenv').config();

const http = require('http');

const app = require('./src/app');

const connectDB = require('./src/config/db');

const { initWS } = require('./src/websocket/wsServer');

const PORT = process.env.PORT || 4000;

async function start() {

await connectDB();

const server = http.createServer(app);

initWS(server); // attach WS to same HTTP server

server.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));

}

start().catch(err => { console.error(err); process.exit(1); });

## 4.4 authRoutes.js

// src/routes/authRoutes.js

const router = require('express').Router();

const { body } = require('express-validator');

const authController = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

const { authLimiter }= require('../middleware/rateLimiter');

// Validation rules

const registerRules = \[

body('email').isEmail().normalizeEmail(),

body('username').isAlphanumeric().isLength({ min:2, max:30 }),

body('password').isLength({ min:8 }),

\];

const loginRules = \[

body('email').isEmail().normalizeEmail(),

body('password').notEmpty(),

\];

router.post('/register', authLimiter, registerRules, authController.register);

router.post('/login', authLimiter, loginRules, authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

## 4.5 roomRoutes.js

// src/routes/roomRoutes.js

const router = require('express').Router();

const { body } = require('express-validator');

const roomController = require('../controllers/roomController');

const authMiddleware = require('../middleware/authMiddleware');

// All room routes require valid Bearer token

router.use(authMiddleware);

router.post('/', body('name').notEmpty().isLength({max:80}), roomController.create);

router.get('/:roomId', roomController.getRoom);

router.delete('/:roomId', roomController.deleteRoom);

router.post('/:roomId/kick', body('userId').notEmpty(), roomController.kickUser);

module.exports = router;

## 4.6 tokenService.js

// src/services/tokenService.js

const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');

const signAccessToken = (userId) =>

jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES });

const signRefreshToken = (userId) =>

jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES });

const verifyAccessToken = (token) =>

jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) =>

jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const hashToken = (token) => bcrypt.hash(token, 10);

const compareToken = (token, hash) => bcrypt.compare(token, hash);

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken, compareToken };

## 4.7 authController.js - Full Implementation

// src/controllers/authController.js

const bcrypt = require('bcryptjs');

const { nanoid } = require('nanoid');

const { validationResult } = require('express-validator');

const User = require('../models/User');

const tokenSvc= require('../services/tokenService');

const COOKIE_OPTIONS = {

httpOnly: true,

secure: process.env.NODE_ENV === 'production',

sameSite: 'strict',

path: '/api/auth/refresh',

maxAge: 7 \* 24 \* 60 \* 60 \* 1000 // 7 days in ms

};

// POST /api/auth/register

exports.register = async (req, res, next) => {

try {

const errors = validationResult(req);

if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()\[0\].msg });

const { email, username, password } = req.body;

const exists = await User.findOne({ email });

if (exists) return res.status(400).json({ error: 'Email already registered' });

const passwordHash = await bcrypt.hash(password, 10);

const user = await User.create({ email, username, passwordHash });

const accessToken = tokenSvc.signAccessToken(user.\_id);

const refreshToken = tokenSvc.signRefreshToken(user.\_id);

user.refreshTokenHash = await tokenSvc.hashToken(refreshToken);

await user.save();

res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

res.status(201).json({ accessToken, user: { \_id: user.\_id, username: user.username, email: user.email } });

} catch(err) { next(err); }

};

// POST /api/auth/login

exports.login = async (req, res, next) => {

try {

const errors = validationResult(req);

if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()\[0\].msg });

const { email, password } = req.body;

const user = await User.findOne({ email });

if (!user) return res.status(401).json({ error: 'Invalid credentials' });

const valid = await bcrypt.compare(password, user.passwordHash);

if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

const accessToken = tokenSvc.signAccessToken(user.\_id);

const refreshToken = tokenSvc.signRefreshToken(user.\_id);

user.refreshTokenHash = await tokenSvc.hashToken(refreshToken);

await user.save();

res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

res.json({ accessToken, user: { \_id: user.\_id, username: user.username, email: user.email } });

} catch(err) { next(err); }

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

const newAccess = tokenSvc.signAccessToken(user.\_id);

const newRefresh = tokenSvc.signRefreshToken(user.\_id);

user.refreshTokenHash = await tokenSvc.hashToken(newRefresh);

await user.save();

res.cookie('refreshToken', newRefresh, COOKIE_OPTIONS);

res.json({ accessToken: newAccess });

} catch(err) { next(err); }

};

// POST /api/auth/logout

exports.logout = async (req, res, next) => {

try {

const token = req.cookies.refreshToken;

if (token) {

const decoded = tokenSvc.verifyRefreshToken(token).catch(() => null);

if (decoded) await User.findByIdAndUpdate(decoded.userId, { refreshTokenHash: null });

}

res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

res.json({ message: 'Logged out' });

} catch(err) { next(err); }

};

// GET /api/auth/me

exports.getMe = async (req, res, next) => {

try {

const user = await User.findById(req.userId).select('-passwordHash -refreshTokenHash');

if (!user) return res.status(404).json({ error: 'User not found' });

res.json(user);

} catch(err) { next(err); }

};

## 4.8 authMiddleware.js

// src/middleware/authMiddleware.js

const { verifyAccessToken } = require('../services/tokenService');

module.exports = (req, res, next) => {

const header = req.headers.authorization;

if (!header?.startsWith('Bearer '))

return res.status(401).json({ error: 'No token provided' });

const token = header.split(' ')\[1\];

try {

const decoded = verifyAccessToken(token);

req.userId = decoded.userId;

next();

} catch(err) {

return res.status(401).json({ error: 'Token invalid or expired' });

}

};

## 4.9 roomController.js

// src/controllers/roomController.js

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

roomId, name,

adminId: req.userId,

members: \[{ userId: req.userId, role: 'admin' }\]

});

const link = \`\${process.env.FRONTEND_URL}/room/\${roomId}\`;

res.status(201).json({ roomId, name, adminId: req.userId, inviteLink: link, createdAt: room.createdAt });

} catch(err) { next(err); }

};

// GET /api/rooms/:roomId

exports.getRoom = async (req, res, next) => {

try {

const room = await Room.findOne({ roomId: req.params.roomId })

.populate('members.userId', 'username email');

if (!room) return res.status(404).json({ error: 'Room not found' });

const elementCount = await Element.countDocuments({ roomId: req.params.roomId, deleted: false });

const members = room.members.map(m => ({

userId: m.userId.\_id, username: m.userId.username, role: m.role

}));

res.json({ roomId: room.roomId, name: room.name, adminId: room.adminId, members, elementCount });

} catch(err) { next(err); }

};

// DELETE /api/rooms/:roomId (admin only)

exports.deleteRoom = async (req, res, next) => {

try {

const room = await Room.findOne({ roomId: req.params.roomId });

if (!room) return res.status(404).json({ error: 'Room not found' });

if (room.adminId.toString() !== req.userId) return res.status(403).json({ error: 'Admin only' });

await Promise.all(\[

Room.deleteOne({ roomId: req.params.roomId }),

Element.deleteMany({ roomId: req.params.roomId }),

Poll.deleteMany({ roomId: req.params.roomId }),

\]);

res.json({ message: 'Room deleted' });

} catch(err) { next(err); }

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

} catch(err) { next(err); }

};

## 4.10 rateLimiter.js + errorHandler.js

// src/middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({

windowMs: 15 \* 60 \* 1000, // 15 minutes

max: 10,

message: { error: 'Too many attempts. Try again in 15 minutes.' }

});

// ────────────────────────────────────────────

// src/middleware/errorHandler.js

module.exports = (err, req, res, next) => {

console.error(err.stack);

const status = err.status || 500;

const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

res.status(status).json({ error: message });

};

# 5\. WebSocket Server - Full Implementation

## 5.1 roomSessions.js - In-Memory State

**This is the source of truth for live room state. Elements are flushed to DB every 30s.**

// src/websocket/roomSessions.js

// Structure: Map&lt;roomId, { clients: Map<userId, ws&gt;, elements: \[\], flushTimer: null }>

const sessions = new Map();

function getOrCreateSession(roomId) {

if (!sessions.has(roomId)) {

sessions.set(roomId, { clients: new Map(), elements: \[\], flushTimer: null });

}

return sessions.get(roomId);

}

function addClient(roomId, userId, ws) {

const session = getOrCreateSession(roomId);

session.clients.set(userId, ws);

return session;

}

function removeClient(roomId, userId) {

const session = sessions.get(roomId);

if (session) {

session.clients.delete(userId);

if (session.clients.size === 0) {

// Room empty - flush elements to DB after 60s then clean up

session.flushTimer = setTimeout(() => flushAndClean(roomId), 60000);

}

}

}

function broadcast(roomId, message, excludeUserId = null) {

const session = sessions.get(roomId);

if (!session) return;

const raw = JSON.stringify(message);

session.clients.forEach((ws, uid) => {

if (uid !== excludeUserId && ws.readyState === 1) ws.send(raw);

});

}

function sendToUser(roomId, userId, message) {

const session = sessions.get(roomId);

const ws = session?.clients.get(userId);

if (ws?.readyState === 1) ws.send(JSON.stringify(message));

}

async function flushAndClean(roomId) {

const Element = require('../models/Element');

const session = sessions.get(roomId);

if (!session || session.elements.length === 0) { sessions.delete(roomId); return; }

await Element.bulkWrite(session.elements.map(el => ({

updateOne: { filter: { elementId: el.elementId }, update: { \$set: el }, upsert: true }

})));

sessions.delete(roomId);

}

module.exports = { getOrCreateSession, addClient, removeClient, broadcast, sendToUser, sessions };

## 5.2 wsServer.js - Main WebSocket Server

// src/websocket/wsServer.js

const { WebSocketServer } = require('ws');

const url = require('url');

const { verifyAccessToken } = require('../services/tokenService');

const { addClient, removeClient, broadcast, sendToUser, getOrCreateSession } = require('./roomSessions');

const User = require('../models/User');

const Room = require('../models/Room');

const Element = require('../models/Element');

const Poll = require('../models/Poll');

const drawHandler = require('./handlers/drawHandler');

const cursorHandler = require('./handlers/cursorHandler');

const codeHandler = require('./handlers/codeHandler');

const pollHandler = require('./handlers/pollHandler');

const voiceHandler = require('./handlers/voiceHandler');

function initWS(server) {

const wss = new WebSocketServer({ server });

wss.on('connection', async (ws, req) => {

// 1. Auth: extract token from query string

const params = new url.URLSearchParams(req.url.replace('/?', ''));

const token = params.get('token');

const roomId = params.get('roomId');

let userId;

try { userId = verifyAccessToken(token).userId; }

catch { ws.close(4001, 'Unauthorized'); return; }

if (!roomId) { ws.close(4002, 'No roomId'); return; }

// 2. Load user and room from DB

const \[user, room\] = await Promise.all(\[

User.findById(userId).select('username email'),

Room.findOne({ roomId }),

\]);

if (!user || !room) { ws.close(4004, 'Not found'); return; }

// 3. Add to room members in DB if not already there

const isMember = room.members.some(m => m.userId.toString() === userId);

if (!isMember) {

room.members.push({ userId, role: 'member' });

await room.save();

}

// 4. Register in session

const session = addClient(roomId, userId, ws);

ws.userId = userId; ws.roomId = roomId; ws.username = user.username;

// 5. Send canvas snapshot to joining client

const \[elements, polls\] = await Promise.all(\[

Element.find({ roomId, deleted: false }),

Poll.find({ roomId, isActive: true }),

\]);

// Merge DB elements with in-memory (in-memory may have newer unflushed ones)

const allElements = \[...elements, ...session.elements.filter(

el => !elements.find(e => e.elementId === el.elementId)

)\];

sendToUser(roomId, userId, {

event: 'canvas_snapshot',

payload: {

elements: allElements,

members: room.members,

polls,

codeSnippet: room.codeSnippet,

codeLanguage: room.codeLanguage,

}

});

// 6. Broadcast user_joined to others

broadcast(roomId, { event: 'user_joined', payload: { userId, username: user.username, role: isMember ? 'member' : 'member' } }, userId);

// 7. Handle incoming messages

ws.on('message', (raw) => {

let msg;

try { msg = JSON.parse(raw); } catch { return; }

const { event, payload } = msg;

switch(event) {

case 'draw': drawHandler.handleDraw(ws, payload); break;

case 'delete_element': drawHandler.handleDelete(ws, payload); break;

case 'cursor_move': cursorHandler.handle(ws, payload); break;

case 'code_share': codeHandler.handle(ws, payload); break;

case 'poll_create': pollHandler.handleCreate(ws, payload); break;

case 'poll_vote': pollHandler.handleVote(ws, payload); break;

case 'voice_signal': voiceHandler.handle(ws, payload); break;

default: break;

}

});

// 8. Handle disconnect

ws.on('close', () => {

removeClient(roomId, userId);

broadcast(roomId, { event: 'user_left', payload: { userId } });

});

});

}

module.exports = { initWS };

## 5.3 All WebSocket Event Handlers

### drawHandler.js

// src/websocket/handlers/drawHandler.js

const { broadcast, sessions } = require('../roomSessions');

const Element = require('../../models/Element');

exports.handleDraw = (ws, payload) => {

const { roomId, userId } = ws;

// Validate payload

if (!payload.elementId || !Array.isArray(payload.points)) return;

if (payload.points.length > 2000) return; // spam protection

const el = { ...payload, roomId, userId, deleted: false };

// Add to in-memory session

const session = sessions.get(roomId);

if (session) session.elements.push(el);

// Flush to DB every 100 elements

if (session && session.elements.length % 100 === 0) flushElements(roomId);

// Broadcast to others

broadcast(roomId, { event: 'draw', payload: el }, userId);

};

exports.handleDelete = async (ws, payload) => {

const { roomId, userId } = ws;

const { elementId } = payload;

if (!elementId) return;

// Check ownership in memory first, then DB

const session = sessions.get(roomId);

const memEl = session?.elements.find(e => e.elementId === elementId);

const isOwner = memEl?.userId === userId;

const isAdmin = /\* check room adminId \*/ false; // load from Room model if needed

if (!isOwner && !isAdmin) {

// Fallback: check DB

const dbEl = await Element.findOne({ elementId });

if (!dbEl || dbEl.userId.toString() !== userId) return; // 403 - ignore silently

await Element.updateOne({ elementId }, { deleted: true });

} else if (memEl) {

memEl.deleted = true;

}

broadcast(roomId, { event: 'element_deleted', payload: { elementId } }, userId);

};

async function flushElements(roomId) {

const session = sessions.get(roomId);

if (!session || session.elements.length === 0) return;

const toFlush = \[...session.elements\];

await Element.bulkWrite(toFlush.map(el => ({

updateOne: { filter: { elementId: el.elementId }, update: { \$set: el }, upsert: true }

})));

}

### cursorHandler.js

// src/websocket/handlers/cursorHandler.js

const { broadcast } = require('../roomSessions');

exports.handle = (ws, payload) => {

const { x, y } = payload;

if (typeof x !== 'number' || typeof y !== 'number') return;

// No persistence - just relay

broadcast(ws.roomId,

{ event: 'cursor_move', payload: { userId: ws.userId, username: ws.username, x, y } },

ws.userId // exclude sender

);

};

### codeHandler.js

// src/websocket/handlers/codeHandler.js

const { broadcast } = require('../roomSessions');

const Room = require('../../models/Room');

exports.handle = async (ws, payload) => {

const { code, language } = payload;

if (typeof code !== 'string' || code.length > 50000) return;

// Persist to Room

await Room.updateOne({ roomId: ws.roomId }, { codeSnippet: code, codeLanguage: language || 'javascript' });

// Broadcast update

broadcast(ws.roomId,

{ event: 'code_update', payload: { code, language, authorId: ws.userId, authorName: ws.username } },

ws.userId

);

};

### pollHandler.js

// src/websocket/handlers/pollHandler.js

const { broadcast } = require('../roomSessions');

const Poll = require('../../models/Poll');

const { nanoid } = require('nanoid');

exports.handleCreate = async (ws, payload) => {

const { question, options } = payload;

if (!question || !Array.isArray(options) || options.length &lt; 2 || options.length &gt; 6) return;

const poll = await Poll.create({

pollId: nanoid(),

roomId: ws.roomId,

createdBy: ws.userId,

question,

options: options.map(text => ({ id: nanoid(6), text, votes: 0 })),

});

broadcast(ws.roomId, { event: 'poll_created', payload: poll.toObject() }); // include sender

};

exports.handleVote = async (ws, payload) => {

const { pollId, optionId } = payload;

if (!pollId || !optionId) return;

const poll = await Poll.findOne({ pollId });

if (!poll || !poll.isActive) return;

// Prevent double-vote

if (poll.voters.some(v => v.toString() === ws.userId)) return;

const option = poll.options.find(o => o.id === optionId);

if (!option) return;

option.votes += 1;

poll.voters.push(ws.userId);

await poll.save();

broadcast(ws.roomId, { event: 'poll_updated', payload: { pollId, options: poll.options } });

};

### voiceHandler.js

// src/websocket/handlers/voiceHandler.js

const { sendToUser } = require('../roomSessions');

// Pure relay - server does NOT process WebRTC signals

exports.handle = (ws, payload) => {

const { targetUserId, signal } = payload;

if (!targetUserId || !signal) return;

// Relay signal to specific peer (not broadcast)

sendToUser(ws.roomId, targetUserId, {

event: 'voice_signal',

payload: { fromUserId: ws.userId, signal }

});

};

# 6\. WebSocket Event Reference for Backend

**These are all events backend must handle (receive) and emit (send). Frontend expects exactly these names.**

| **Event**      | **Direction** | **Handler File**            | **Persisted to DB?**                  | **Broadcast or Relay?**                          |
| -------------- | ------------- | --------------------------- | ------------------------------------- | ------------------------------------------------ |
| join_room      | CLIENT→SERVER | wsServer.js (on connection) | Adds member to Room                   | canvas_snapshot to sender; user_joined to others |
| draw           | CLIENT→SERVER | drawHandler.handleDraw      | In-memory, flush every 100 or 30s     | Broadcast to all except sender                   |
| delete_element | CLIENT→SERVER | drawHandler.handleDelete    | Element.deleted = true in DB          | element_deleted to all                           |
| cursor_move    | CLIENT→SERVER | cursorHandler.handle        | Never                                 | cursor_move to all except sender                 |
| code_share     | CLIENT→SERVER | codeHandler.handle          | Room.codeSnippet updated              | code_update to all except sender                 |
| poll_create    | CLIENT→SERVER | pollHandler.handleCreate    | New Poll document in DB               | poll_created to ALL (including sender)           |
| poll_vote      | CLIENT→SERVER | pollHandler.handleVote      | Poll.options\[n\].votes++, voters\[\] | poll_updated to ALL                              |
| voice_signal   | CLIENT→SERVER | voiceHandler.handle         | Never                                 | Relay to targetUserId only                       |

# 7\. Edge Cases - Backend Responsibilities

| **Scenario**                    | **Where to Handle**       | **How**                                                              |
| ------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| JWT expired on WS connect       | wsServer.js on connection | Catch verifyAccessToken error → ws.close(4001)                       |
| Client sends invalid JSON       | wsServer.js on message    | try/catch JSON.parse, return silently                                |
| Client floods draw events       | drawHandler.handleDraw    | Track count per userId per second, drop if > 100/s                   |
| Double poll vote                | pollHandler.handleVote    | Check poll.voters array before incrementing                          |
| Delete another user's element   | drawHandler.handleDelete  | Check userId match before soft-deleting                              |
| Room empty after all disconnect | roomSessions.removeClient | Wait 60s, then flush in-memory elements to DB                        |
| Refresh token reuse (stolen)    | authController.refresh    | Compare hash; if mismatch, clear DB hash and return 401              |
| Auth rate limit hit             | rateLimiter.authLimiter   | 429 response with retry message                                      |
| MongoDB connection lost         | db.js + server.js         | Mongoose auto-reconnect; catch errors in controllers, call next(err) |

# 8\. Database Config

// src/config/db.js

const mongoose = require('mongoose');

async function connectDB() {

await mongoose.connect(process.env.MONGODB_URI, {

serverSelectionTimeoutMS: 5000,

});

console.log('MongoDB connected');

}

module.exports = connectDB;

# 9\. Deployment (Railway)

\# 1. Push backend/ to GitHub

\# 2. Create Railway project → Deploy from GitHub

\# 3. Set environment variables in Railway Dashboard:

\# PORT, MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,

\# JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES, FRONTEND_URL, NODE_ENV

\# 4. Railway auto-provides HTTPS + WSS - no extra config needed

\# 5. Health check: GET <https://your-app.railway.app/health> → { status: 'ok' }

# 10\. Backend Developer Checklist

| **Task**                                             | **File(s)**                             | **Done?** |
| ---------------------------------------------------- | --------------------------------------- | --------- |
| Init project + install all deps                      | package.json                            | ☐         |
| Create .env with all variables                       | .env                                    | ☐         |
| MongoDB connection                                   | src/config/db.js                        | ☐         |
| User model (with refreshTokenHash)                   | src/models/User.js                      | ☐         |
| Room model (with members\[\])                        | src/models/Room.js                      | ☐         |
| Element model (append-only)                          | src/models/Element.js                   | ☐         |
| Poll model (with voters\[\])                         | src/models/Poll.js                      | ☐         |
| tokenService (sign/verify/hash)                      | src/services/tokenService.js            | ☐         |
| authController (register/login/refresh/logout/getMe) | src/controllers/authController.js       | ☐         |
| authMiddleware (Bearer token check)                  | src/middleware/authMiddleware.js        | ☐         |
| rateLimiter + errorHandler                           | src/middleware/                         | ☐         |
| authRoutes with validation                           | src/routes/authRoutes.js                | ☐         |
| roomController (create/get/delete/kick)              | src/controllers/roomController.js       | ☐         |
| roomRoutes                                           | src/routes/roomRoutes.js                | ☐         |
| app.js (CORS, middleware, routes)                    | src/app.js                              | ☐         |
| roomSessions in-memory Map                           | src/websocket/roomSessions.js           | ☐         |
| wsServer.js (auth on upgrade, join, disconnect)      | src/websocket/wsServer.js               | ☐         |
| drawHandler (draw + delete_element)                  | src/websocket/handlers/drawHandler.js   | ☐         |
| cursorHandler (relay only)                           | src/websocket/handlers/cursorHandler.js | ☐         |
| codeHandler (persist + broadcast)                    | src/websocket/handlers/codeHandler.js   | ☐         |
| pollHandler (create + vote)                          | src/websocket/handlers/pollHandler.js   | ☐         |
| voiceHandler (relay to targetUserId)                 | src/websocket/handlers/voiceHandler.js  | ☐         |
| server.js (HTTP + WS on same server)                 | server.js                               | ☐         |
| Test /health endpoint                                | GET /health                             | ☐         |
| Test auth flow with Postman/Thunder Client           | All /api/auth/\* routes                 | ☐         |
| Test WS connection with wscat tool                   | ws://localhost:4000?token=X&roomId=Y    | ☐         |

**- END OF BACKEND GUIDE -**

_Questions? Coordinate with frontend dev via Section 4 API contracts._