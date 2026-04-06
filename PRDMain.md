**LiveCollab**

Product Requirement Document

Real-Time Collaborative Whiteboard Platform | 24-Hour Hackathon Build

_Version 1.0 | Full-Stack Implementation Blueprint_

# **1\. Product Overview**

## **1.1 Problem Statement**

Remote teams and hackathon participants lack a lightweight, browser-native tool that combines real-time drawing, voice chat, code sharing, and live polls in a single shareable session - without requiring any downloads, accounts on third-party services, or complex setup.

## **1.2 Solution**

LiveCollab is a browser-based collaborative workspace where users join a room by link, draw on a shared canvas in real-time, speak via WebRTC voice, paste code snippets with syntax context, and create instant polls - all synced through WebSockets with zero friction.

## **1.3 Key Value Proposition**

- Zero-install: runs entirely in the browser
- Sub-100ms drawing sync via WebSockets
- Persistent rooms backed by MongoDB
- JWT-secured identity with refresh token rotation
- Admin/member authorization model per room

# **2\. Feature Breakdown**

## **MVP - Must Build in 24 Hours**

| **#** | **Feature**                                   | **Owner**               | **Priority** |
| ----- | --------------------------------------------- | ----------------------- | ------------ |
| 1     | Email + password registration & login         | Backend + Frontend      | P0           |
| 2     | JWT access + refresh token flow               | Backend                 | P0           |
| 3     | Create room / join room by ID or link         | Backend + Frontend      | P0           |
| 4     | Real-time canvas drawing sync (WebSocket)     | Backend + Frontend      | P0           |
| 5     | Live cursor positions for all users           | Backend + Frontend      | P0           |
| 6     | Code snippet panel with sharing               | Frontend + Backend (WS) | P1           |
| 7     | Live polls - create & vote                    | Backend + Frontend      | P1           |
| 8     | WebRTC voice chat (signaling via WS)          | Frontend + Backend (WS) | P1           |
| 9     | Room admin controls (kick user, clear canvas) | Backend + Frontend      | P1           |
| 10    | Reconnect & state replay on re-join           | Backend                 | P1           |

## **Advanced - If Time Permits**

- Persistent element history (undo/redo per user)
- Sticky notes / text annotations on canvas
- Dark / light theme toggle
- Export canvas as PNG
- Room password protection
- User avatars and display names

# **3\. Detailed User Flows**

## **3.1 Authentication Flow**

- User visits /register - fills email, username, password
- Frontend POSTs to POST /api/auth/register
- Backend hashes password with bcrypt (salt rounds: 10)
- Backend creates User document in MongoDB
- Backend returns accessToken (15m) + sets refreshToken in HTTP-only cookie
- User visits /login - submits credentials
- Backend verifies password hash, issues new token pair
- Frontend stores accessToken in memory (never localStorage)
- On 401, frontend calls POST /api/auth/refresh - backend rotates refresh token
- Logout: POST /api/auth/logout - backend clears cookie and blacklists refresh token

## **3.2 Room Creation / Join Flow**

- Authenticated user visits /dashboard
- Clicks 'Create Room' - frontend POSTs to POST /api/rooms
- Backend generates unique roomId (nanoid), saves Room doc, returns roomId
- Frontend redirects to /room/:roomId
- Another user pastes link or enters roomId - frontend hits GET /api/rooms/:roomId
- Both users open WebSocket connection to ws://server/room/:roomId
- Backend emits join_room event with current canvas state snapshot

## **3.3 Real-Time Collaboration Flow**

- User draws on canvas - client emits draw event with stroke payload
- Backend WebSocket server receives draw, appends to room's element list in memory
- Backend broadcasts draw to all other clients in the room
- Every 30s (or on threshold), backend flushes element buffer to MongoDB
- User moves mouse - client emits cursor_move with {x, y, userId}
- Backend rebroadcasts cursor_move to others (no persistence)
- On reconnect, backend sends full canvas snapshot from memory (or DB fallback)

# **4\. System Architecture**

## **4.1 High-Level Architecture**

┌──────────────────────────────────────────────────────────────────┐

│ BROWSER (React) │

│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐ │

│ │ Canvas │ │ Toolbar │ │ Code Panel│ │ Poll Panel │ │

│ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └──────┬──────┘ │

│ └──────────────┴──────────────┴─────────────────┘ │

│ WebSocket Client (ws://) │

│ REST API Client (axios) │

└──────────────────────────┬───────────────────────────────────────┘

│ HTTP / WebSocket

┌──────────────────────────┴───────────────────────────────────────┐

│ Node.js + Express Backend │

│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │

│ │Auth Routes│ │Room Routes│ │WS Handler│ │ Rate Limiter │ │

│ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────────────┘ │

│ └─────────────┴──────────────┘ │

│ Services / Controllers Layer │

└──────────────────────────┬───────────────────────────────────────┘

│ Mongoose ODM

┌──────────────────────────┴───────────────────────────────────────┐

│ MongoDB Atlas / Local │

│ Collections: users | rooms | elements | polls │

└──────────────────────────────────────────────────────────────────┘

# **5\. Frontend Architecture**

## **5.1 Tech Stack**

- React 18 (Vite)
- HTML5 Canvas API - raw, no library, for maximum control
- Zustand - lightweight global state (no Redux overhead for a hackathon)
- Axios - REST API calls
- native WebSocket - no socket.io client needed
- react-router-dom v6 - client-side routing

## **5.2 Folder Structure**

frontend/

├── public/

├── src/

│ ├── api/

│ │ ├── authApi.js # register, login, refresh, logout

│ │ └── roomApi.js # createRoom, getRoom

│ ├── components/

│ │ ├── canvas/

│ │ │ ├── Canvas.jsx # main drawing surface

│ │ │ ├── Toolbar.jsx # pen, eraser, color, size

│ │ │ └── CursorOverlay.jsx # other users' cursors

│ │ ├── code/

│ │ │ └── CodePanel.jsx # code sharing panel

│ │ ├── poll/

│ │ │ └── PollPanel.jsx # create & vote polls

│ │ ├── voice/

│ │ │ └── VoiceUI.jsx # mic toggle, peer indicators

│ │ └── common/

│ │ ├── Navbar.jsx

│ │ └── Toast.jsx

│ ├── hooks/

│ │ ├── useWebSocket.js # WS connect, send, receive

│ │ ├── useCanvas.js # draw logic, event handlers

│ │ └── useVoice.js # WebRTC peer connection

│ ├── pages/

│ │ ├── LoginPage.jsx # Route: /login

│ │ ├── RegisterPage.jsx # Route: /register

│ │ ├── DashboardPage.jsx # Route: /dashboard

│ │ └── RoomPage.jsx # Route: /room/:roomId

│ ├── store/

│ │ ├── authStore.js # user, accessToken

│ │ ├── roomStore.js # roomId, members, elements

│ │ └── uiStore.js # activeTab, tool, color

│ ├── utils/

│ │ ├── axiosInstance.js # interceptors + token refresh

│ │ └── wsManager.js # singleton WS connection

│ ├── App.jsx

│ └── main.jsx

├── .env

└── vite.config.js

## **5.3 Frontend Routes**

| **Route**     | **Page Component** | **Auth Required** | **Description**                  |
| ------------- | ------------------ | ----------------- | -------------------------------- |
| /             | → redirect         | No                | Redirect to /dashboard or /login |
| /login        | LoginPage.jsx      | No                | Email + password login form      |
| /register     | RegisterPage.jsx   | No                | Sign-up form                     |
| /dashboard    | DashboardPage.jsx  | Yes               | Create or join a room            |
| /room/:roomId | RoomPage.jsx       | Yes               | Full collaboration workspace     |

## **5.4 State Management (Zustand)**

### **authStore.js**

{ user, accessToken, setAuth, clearAuth }

// accessToken stored in memory only (not localStorage/sessionStorage)

### **roomStore.js**

{ roomId, members, elements, polls, codeSnippet }

// elements: append-only array - new draw events pushed here

## **5.5 WebSocket Integration Strategy**

- Singleton wsManager creates ONE WebSocket connection per room session
- useWebSocket hook subscribes to event types and routes to Zustand
- Canvas emits draw events on pointerup (not on every pixel - batch strokes)
- Cursor emits cursor_move on mousemove throttled to 50ms
- On WS disconnect, wsManager auto-reconnects with exponential backoff (max 3 retries)
- On reconnect, server sends canvas_snapshot with full element list

## **5.6 Axios Interceptor - Token Refresh**

// axiosInstance.js

axiosInstance.interceptors.response.use(

res => res,

async err => {

if (err.response?.status === 401 && !err.config.\_retry) {

err.config.\_retry = true;

await authApi.refresh(); // POST /api/auth/refresh

return axiosInstance(err.config);

}

throw err;

}

);

# **6\. Backend Architecture**

## **6.1 Tech Stack**

- Node.js 20 + Express.js
- ws npm package - native WebSocket server
- Mongoose - MongoDB ODM
- bcryptjs - password hashing
- jsonwebtoken - JWT sign/verify
- express-rate-limit - rate limiting
- cookie-parser - HTTP-only cookie handling
- dotenv - environment config

## **6.2 Folder Structure**

backend/

├── src/

│ ├── config/

│ │ └── db.js # Mongoose connect()

│ ├── controllers/

│ │ ├── authController.js # register, login, refresh, logout

│ │ └── roomController.js # createRoom, getRoom, deleteRoom

│ ├── middleware/

│ │ ├── authMiddleware.js # verifyAccessToken

│ │ ├── rateLimiter.js # express-rate-limit config

│ │ └── errorHandler.js # global error handler

│ ├── models/

│ │ ├── User.js # Mongoose User schema

│ │ ├── Room.js # Mongoose Room schema

│ │ ├── Element.js # Mongoose Element schema

│ │ └── Poll.js # Mongoose Poll schema

│ ├── routes/

│ │ ├── authRoutes.js # /api/auth/\*

│ │ └── roomRoutes.js # /api/rooms/\*

│ ├── services/

│ │ ├── authService.js # business logic for auth

│ │ ├── roomService.js # room creation, membership

│ │ └── tokenService.js # sign, verify, refresh tokens

│ ├── websocket/

│ │ ├── wsServer.js # WS server bootstrap

│ │ ├── roomSessions.js # in-memory Map of rooms

│ │ └── handlers/

│ │ ├── drawHandler.js

│ │ ├── cursorHandler.js

│ │ ├── codeHandler.js

│ │ ├── pollHandler.js

│ │ └── voiceHandler.js

│ └── app.js # Express app setup

├── server.js # HTTP + WS server entry point

├── .env

└── package.json

## **6.3 Middleware Stack**

| **Middleware** | **File**                     | **Purpose**                              |
| -------------- | ---------------------------- | ---------------------------------------- |
| cors           | app.js                       | Allow frontend origin, credentials: true |
| cookie-parser  | app.js                       | Parse HTTP-only cookie for refresh token |
| express.json() | app.js                       | Parse JSON request bodies                |
| rateLimiter    | middleware/rateLimiter.js    | 100 req/15min per IP on auth routes      |
| authMiddleware | middleware/authMiddleware.js | Verify JWT on protected routes           |
| errorHandler   | middleware/errorHandler.js   | Catch-all error response formatter       |

# **7\. API Design**

## **7.1 REST API - Auth Routes**

| **Method** | **Route**          | **Auth** | **Description**                              |
| ---------- | ------------------ | -------- | -------------------------------------------- |
| POST       | /api/auth/register | No       | Register new user                            |
| POST       | /api/auth/login    | No       | Login and receive tokens                     |
| POST       | /api/auth/refresh  | Cookie   | Rotate refresh token, issue new access token |
| POST       | /api/auth/logout   | Cookie   | Clear refresh token cookie                   |
| GET        | /api/auth/me       | Bearer   | Get current user profile                     |

### **POST /api/auth/register - Request Body**

{

"email": "<alice@example.com>",

"username": "alice",

"password": "Str0ngP@ss!"

}

### **POST /api/auth/register - Response 201**

{

"message": "User registered successfully",

"accessToken": "eyJhbGci...",

"user": { "\_id": "uid123", "username": "alice", "email": "<alice@example.com>" }

}

// + Set-Cookie: refreshToken=&lt;token&gt;; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh

### **POST /api/auth/login - Request Body**

{

"email": "<alice@example.com>",

"password": "Str0ngP@ss!"

}

### **POST /api/auth/refresh - Response 200**

{

"accessToken": "eyJhbGci..."

}

// Reads refreshToken from HTTP-only cookie

// Issues new refreshToken in cookie + new accessToken in body

## **7.2 REST API - Room Routes**

| **Method** | **Route**               | **Auth**            | **Description**                          |
| ---------- | ----------------------- | ------------------- | ---------------------------------------- |
| POST       | /api/rooms              | Bearer              | Create a new room (caller becomes admin) |
| GET        | /api/rooms/:roomId      | Bearer              | Get room metadata + member list          |
| DELETE     | /api/rooms/:roomId      | Bearer (admin only) | Delete a room and all elements           |
| POST       | /api/rooms/:roomId/kick | Bearer (admin only) | Remove a member from room                |

### **POST /api/rooms - Request Body**

{

"name": "Design Sprint Room"

}

### **POST /api/rooms - Response 201**

{

"roomId": "abc123xyz",

"name": "Design Sprint Room",

"adminId": "uid123",

"inviteLink": "<https://livecollab.app/room/abc123xyz>",

"createdAt": "2024-01-01T10:00:00Z"

}

### **GET /api/rooms/:roomId - Response 200**

{

"roomId": "abc123xyz",

"name": "Design Sprint Room",

"adminId": "uid123",

"members": \[

{ "userId": "uid123", "username": "alice", "role": "admin" },

{ "userId": "uid456", "username": "bob", "role": "member" }

\],

"elementCount": 42

}

## **7.3 WebSocket Events**

**All WS messages follow this envelope:**

{

"event": "&lt;event_name&gt;",

"payload": { /\* event-specific data \*/ },

"userId": "uid123",

"roomId": "abc123xyz",

"timestamp": 1700000000000

}

### **join_room**

// CLIENT → SERVER

{ "event": "join_room", "payload": { "roomId": "abc123xyz", "token": "eyJ..." } }

// SERVER → CLIENT (on success, sent only to joining client)

{

"event": "canvas_snapshot",

"payload": {

"elements": \[ /\* all existing draw elements \*/ \],

"members": \[ /\* current room members \*/ \],

"polls": \[ /\* active polls \*/ \],

"codeSnippet": "console.log('hello')"

}

}

// SERVER → ALL OTHERS (broadcast)

{ "event": "user_joined", "payload": { "userId": "uid456", "username": "bob" } }

### **draw**

// CLIENT → SERVER

{

"event": "draw",

"payload": {

"elementId": "el_uuid_001",

"type": "stroke",

"points": \[ \[100,200\], \[102,201\], \[105,203\] \],

"color": "#FF5733",

"lineWidth": 3,

"tool": "pen" // "pen" | "eraser"

}

}

// SERVER → ALL OTHERS (broadcast, no store to DB yet)

{ "event": "draw", "payload": { /\* same as above \*/ } }

### **delete_element**

// CLIENT → SERVER (only element owner OR admin)

{

"event": "delete_element",

"payload": { "elementId": "el_uuid_001" }

}

// SERVER validates ownership, then broadcasts:

{ "event": "element_deleted", "payload": { "elementId": "el_uuid_001" } }

### **cursor_move**

// CLIENT → SERVER (throttled 50ms on client)

{

"event": "cursor_move",

"payload": { "x": 450, "y": 320 }

}

// SERVER → ALL OTHERS (broadcast, no persistence)

{

"event": "cursor_move",

"payload": { "userId": "uid123", "username": "alice", "x": 450, "y": 320 }

}

### **code_share**

// CLIENT → SERVER

{

"event": "code_share",

"payload": {

"code": "const x = 42;",

"language": "javascript"

}

}

// SERVER → ALL OTHERS + persists to Room.codeSnippet

{ "event": "code_update", "payload": { "code": "const x = 42;", "language": "javascript", "authorId": "uid123" } }

### **poll_create**

// CLIENT → SERVER

{

"event": "poll_create",

"payload": {

"question": "Should we break for lunch?",

"options": \["Yes", "No", "In 30 min"\]

}

}

// SERVER creates Poll in DB, broadcasts:

{

"event": "poll_created",

"payload": {

"pollId": "poll_uuid_001",

"question": "Should we break for lunch?",

"options": \[

{ "id": "opt1", "text": "Yes", "votes": 0 },

{ "id": "opt2", "text": "No", "votes": 0 },

{ "id": "opt3", "text": "In 30 min", "votes": 0 }

\],

"createdBy": "uid123"

}

}

### **poll_vote**

// CLIENT → SERVER

{

"event": "poll_vote",

"payload": { "pollId": "poll_uuid_001", "optionId": "opt1" }

}

// SERVER updates Poll in DB (one vote per userId), broadcasts:

{

"event": "poll_updated",

"payload": {

"pollId": "poll_uuid_001",

"options": \[

{ "id": "opt1", "text": "Yes", "votes": 3 },

{ "id": "opt2", "text": "No", "votes": 1 },

{ "id": "opt3", "text": "In 30 min", "votes": 2 }

\]

}

}

### **voice_signal (WebRTC Signaling)**

// CLIENT → SERVER (targeted to specific peer)

{

"event": "voice_signal",

"payload": {

"targetUserId": "uid456",

"signal": {

"type": "offer", // "offer" | "answer" | "ice-candidate"

"sdp": "v=0\\r\\no=- 46...",

// OR for ICE: "candidate": { "candidate": "...", "sdpMid": "0" }

}

}

}

// SERVER relays ONLY to targetUserId (not broadcast)

{ "event": "voice_signal", "payload": { "fromUserId": "uid123", "signal": { ... } } }

# **8\. Database Schema (MongoDB / Mongoose)**

## **8.1 Users Collection**

// models/User.js

const UserSchema = new Schema({

email: { type: String, required: true, unique: true, lowercase: true, trim: true },

username: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },

passwordHash: { type: String, required: true },

refreshToken: { type: String, default: null }, // hashed; null after logout

createdAt: { type: Date, default: Date.now },

updatedAt: { type: Date, default: Date.now }

});

// Indexes: email (unique)

## **8.2 Rooms Collection**

// models/Room.js

const MemberSchema = new Schema({

userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

role: { type: String, enum: \['admin', 'member'\], default: 'member' },

joinedAt: { type: Date, default: Date.now }

}, { \_id: false });

const RoomSchema = new Schema({

roomId: { type: String, required: true, unique: true }, // nanoid(10)

name: { type: String, required: true, maxlength: 80 },

adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

members: \[MemberSchema\],

codeSnippet: { type: String, default: '' },

codeLanguage:{ type: String, default: 'javascript' },

createdAt: { type: Date, default: Date.now },

updatedAt: { type: Date, default: Date.now }

});

// Indexes: roomId (unique), adminId

## **8.3 Elements Collection (Drawing Strokes)**

// models/Element.js

const ElementSchema = new Schema({

elementId: { type: String, required: true, unique: true }, // client-generated uuid

roomId: { type: String, required: true, index: true },

userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

type: { type: String, enum: \['stroke', 'text'\], default: 'stroke' },

points: \[{ x: Number, y: Number }\],

color: { type: String, default: '#000000' },

lineWidth: { type: Number, default: 2 },

tool: { type: String, enum: \['pen', 'eraser'\], default: 'pen' },

deleted: { type: Boolean, default: false }, // soft delete

createdAt: { type: Date, default: Date.now }

});

// Indexes: roomId, userId, elementId

// Note: append-only; deleted flag instead of hard delete for audit

## **8.4 Polls Collection**

// models/Poll.js

const OptionSchema = new Schema({

id: { type: String, required: true }, // nanoid

text: { type: String, required: true },

votes: { type: Number, default: 0 }

}, { \_id: false });

const PollSchema = new Schema({

pollId: { type: String, required: true, unique: true },

roomId: { type: String, required: true, index: true },

createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

question: { type: String, required: true, maxlength: 200 },

options: \[OptionSchema\],

voters: \[{ type: Schema.Types.ObjectId, ref: 'User' }\], // prevent double-vote

isActive: { type: Boolean, default: true },

createdAt: { type: Date, default: Date.now }

});

# **9\. Real-Time Data Flow**

## **9.1 Drawing Sync**

- User presses pointer down on canvas - drawing begins
- On pointer up, Canvas.jsx collects full stroke as array of {x,y} points
- Client emits draw event with elementId (client-generated nanoid), points, color, lineWidth
- wsServer.js receives draw event, validates JWT from WS connection header
- drawHandler.js pushes element to roomSessions in-memory Map
- drawHandler.js broadcasts draw to all other WS clients in room
- Every 30 seconds OR every 100 new elements, flush in-memory elements to MongoDB (bulkWrite)

## **9.2 User Join Sync**

- Client opens WebSocket to ws://server:PORT?token=&lt;accessToken&gt;
- wsServer.js validates token on upgrade event; rejects connection if invalid
- Server adds client to roomSessions Map: rooms.get(roomId).clients.set(userId, ws)
- Server sends canvas_snapshot to joining client with all current elements, polls, codeSnippet
- Server broadcasts user_joined to all others in room

## **9.3 Reconnect Handling**

- Client wsManager detects WS close event
- Waits 1s, 2s, 4s (exponential backoff) before reconnecting
- On reconnect, client sends join_room again
- Server sends fresh canvas_snapshot (reads from memory, falls back to MongoDB if needed)
- Client redraws canvas from snapshot - no partial state

## **9.4 Conflict Handling - Append-Only Model**

- Elements are NEVER modified after creation (append-only)
- Deletion sets deleted: true flag - does not remove from DB
- All clients render elements in timestamp order
- No operational transform or CRDT needed for drawing - last draw wins on overlap
- For code panel: last writer wins (single shared snippet, not collaborative cursor)

# **10\. Edge Case Handling**

| **Edge Case**          | **Detection**                               | **Handling Strategy**                                                         |
| ---------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| User disconnect        | WS close event fires                        | Remove from roomSessions; broadcast user_left; keep their elements            |
| Reconnect storm        | Multiple rapid reconnects                   | Exponential backoff on client; server debounces join_room per userId          |
| High latency           | WS message queue grows                      | Client batches draw points; server sends ack only on join_room                |
| Spam / flooding        | draw events > 100/sec from one client       | Server-side rate limit per userId per room: drop excess events                |
| Unauthorized delete    | delete_element from non-owner               | Server checks userId vs element.userId AND admin flag; 403 if mismatch        |
| Token expiration on WS | WS connection drops mid-session             | Client refreshes token via REST, then reconnects WS                           |
| Double poll vote       | poll_vote from userId already in voters\[\] | Server checks Poll.voters array; ignores duplicate; sends current state back  |
| Empty room cleanup     | All clients disconnect                      | setTimeout: if room still empty after 60s, flush all in-memory elements to DB |
| Admin leaves           | admin userId disconnects                    | Room persists; another member can be promoted via POST /api/rooms/:id/promote |
| Invalid payload        | Malformed WS message JSON                   | try/catch in wsServer.js; send error event back to sender; do not crash       |

# **11\. Security Considerations**

## **11.1 JWT Design**

- Access token: 15-minute expiry, signed with HS256, stored in memory only
- Refresh token: 7-day expiry, stored as HTTP-only Secure SameSite=Strict cookie
- Refresh token stored as bcrypt hash in DB - raw token never persisted
- On logout: DB refreshToken field set to null; old cookie cannot be reused
- On WS connect: token passed as query param or Authorization header upgrade

## **11.2 Input Validation**

- All REST route bodies validated with express-validator before hitting controllers
- email: isEmail(), password: minLength(8), username: alphanumeric 2-30 chars
- WS payloads validated in each handler (type checks, length limits, enum checks)
- Draw points: max 2000 points per stroke; coordinates clamped to canvas bounds
- Poll options: max 6 options, each max 100 chars; question max 200 chars

## **11.3 Rate Limiting**

- Auth routes: 10 requests / 15 minutes per IP (express-rate-limit)
- Room creation: 5 rooms / hour per userId
- WS draw events: 100 events / second per userId (in-memory counter, reset every 1s)

## **11.4 Authorization Checks**

- Every protected REST route calls authMiddleware.js - verifies Bearer token
- Room deletion, kick user: checks req.user.id === room.adminId
- Element deletion: checks req.user.id === element.userId OR admin
- WS events: userId extracted from verified token only - never from payload

## **11.5 Other**

- CORS: allow only FRONTEND_URL origin with credentials: true
- Helmet.js: sets secure HTTP headers
- MongoDB injection: Mongoose schema typing prevents most injection attacks
- No raw queries - all DB ops go through Mongoose model methods

# **12\. Deployment Plan**

## **12.1 Frontend - Vercel**

- Push frontend/ to GitHub; connect Vercel project
- Build command: vite build | Output dir: dist
- Set env var: VITE_API_URL=<https://your-backend.railway.app>
- Set env var: VITE_WS_URL=wss://your-backend.railway.app

## **12.2 Backend - Railway**

- Push backend/ to GitHub; connect Railway service
- Start command: node server.js
- Railway auto-assigns HTTPS URL + TLS (required for WSS)

## **12.3 Database - MongoDB Atlas**

- Create free M0 cluster; whitelist 0.0.0.0/0 for hackathon
- Add MONGODB_URI connection string to Railway env vars

## **12.4 Environment Variables**

| **Variable**        | **Service** | **Example Value**                | **Required** |
| ------------------- | ----------- | -------------------------------- | ------------ |
| PORT                | Backend     | 4000                             | Yes          |
| MONGODB_URI         | Backend     | mongodb+srv://...                | Yes          |
| JWT_ACCESS_SECRET   | Backend     | random-64-char-string            | Yes          |
| JWT_REFRESH_SECRET  | Backend     | different-random-64-char-string  | Yes          |
| JWT_ACCESS_EXPIRES  | Backend     | 15m                              | Yes          |
| JWT_REFRESH_EXPIRES | Backend     | 7d                               | Yes          |
| FRONTEND_URL        | Backend     | <https://livecollab.vercel.app>  | Yes          |
| VITE_API_URL        | Frontend    | <https://livecollab.railway.app> | Yes          |
| VITE_WS_URL         | Frontend    | wss://livecollab.railway.app     | Yes          |

## **12.5 Production Checklist**

- Replace console.log with a logger (winston or pino)
- Enable MongoDB Atlas network access restrictions post-hackathon
- Set NODE_ENV=production - disables stack traces in error responses
- Add retry logic for MongoDB connection (Mongoose reconnectTries)
- Monitor WS connections - Railway restarts on crash, clients auto-reconnect

**END OF DOCUMENT - LiveCollab PRD v1.0**

_Built for 24-hour execution. Ship fast, iterate faster._