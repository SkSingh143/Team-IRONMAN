**LiveCollab**

**FRONTEND Developer Guide**

React 18 • HTML5 Canvas • WebSocket • Zustand • WebRTC

_Self-contained guide - everything you need to build independently_

**Backend contact: hand off via API contracts in Section 4**

# 0\. Quick Start - Get Running in 5 Minutes

**⚡ Start here. Run these commands, then jump to your assigned component.**

\# 1. Create Vite + React project

npm create vite@latest frontend -- --template react

cd frontend

\# 2. Install ALL dependencies

npm install axios zustand react-router-dom

npm install --save-dev @vitejs/plugin-react

\# 3. Environment file (.env in /frontend root)

VITE_API_URL=<http://localhost:4000>

VITE_WS_URL=ws://localhost:4000

\# 4. Start dev server

npm run dev # → <http://localhost:5173>

**🔌 Backend runs on port 4000. If backend isn't ready yet - use mock data (see Section 6).**

# 1\. Complete Folder Structure

**Create this EXACT structure. File names matter - they are imported by teammates.**

frontend/

├── public/

│ └── favicon.ico

├── src/

│ ├── api/

│ │ ├── authApi.js ← Auth REST calls (login, register, refresh, logout)

│ │ └── roomApi.js ← Room REST calls (create, getRoom)

│ │

│ ├── components/

│ │ ├── canvas/

│ │ │ ├── Canvas.jsx ← Main drawing surface (HTML5 Canvas)

│ │ │ ├── Toolbar.jsx ← Pen/eraser/color/size picker

│ │ │ └── CursorOverlay.jsx ← Other users' live cursors

│ │ │

│ │ ├── code/

│ │ │ └── CodePanel.jsx ← Shared code snippet panel

│ │ │

│ │ ├── poll/

│ │ │ └── PollPanel.jsx ← Create + vote on polls

│ │ │

│ │ ├── voice/

│ │ │ └── VoiceUI.jsx ← Mic toggle + peer audio (WebRTC)

│ │ │

│ │ └── common/

│ │ ├── Navbar.jsx ← Top nav bar

│ │ ├── Toast.jsx ← Error/success notifications

│ │ └── PrivateRoute.jsx ← Auth guard wrapper

│ │

│ ├── hooks/

│ │ ├── useWebSocket.js ← WS connect/send/receive hook

│ │ ├── useCanvas.js ← Drawing logic + event handlers

│ │ └── useVoice.js ← WebRTC peer connection logic

│ │

│ ├── pages/

│ │ ├── LoginPage.jsx ← Route: /login

│ │ ├── RegisterPage.jsx ← Route: /register

│ │ ├── DashboardPage.jsx ← Route: /dashboard

│ │ └── RoomPage.jsx ← Route: /room/:roomId (main workspace)

│ │

│ ├── store/

│ │ ├── authStore.js ← user, accessToken (in-memory only)

│ │ ├── roomStore.js ← roomId, members, elements, polls, code

│ │ └── uiStore.js ← activeTool, color, activeTab

│ │

│ ├── utils/

│ │ ├── axiosInstance.js ← Axios + auto token refresh interceptor

│ │ └── wsManager.js ← Singleton WebSocket manager

│ │

│ ├── App.jsx ← Router setup

│ └── main.jsx ← React entry point

│

├── .env ← VITE_API_URL, VITE_WS_URL

├── index.html

└── vite.config.js

# 2\. Frontend Routes (react-router-dom v6)

**These are ALL the pages. Each route maps to one Page component in /src/pages/.**

| **Route**     | **Page File**     | **Auth Guard**     | **What it renders**                                    |
| ------------- | ----------------- | ------------------ | ------------------------------------------------------ |
| /             | → redirect        | No                 | Redirect: if logged in → /dashboard, else → /login     |
| /login        | LoginPage.jsx     | No (public)        | Email + password form. On success → /dashboard         |
| /register     | RegisterPage.jsx  | No (public)        | Registration form. On success → /dashboard             |
| /dashboard    | DashboardPage.jsx | Yes (PrivateRoute) | Create room button + join by Room ID input             |
| /room/:roomId | RoomPage.jsx      | Yes (PrivateRoute) | Full workspace: Canvas + Toolbar + Code + Poll + Voice |

### App.jsx - Router Setup

// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';

import RegisterPage from './pages/RegisterPage';

import DashboardPage from './pages/DashboardPage';

import RoomPage from './pages/RoomPage';

import PrivateRoute from './components/common/PrivateRoute';

export default function App() {

return (

&lt;BrowserRouter&gt;

&lt;Routes&gt;

&lt;Route path='/' element={<Navigate to='/dashboard' replace /&gt;} />

&lt;Route path='/login' element={<LoginPage /&gt;} />

&lt;Route path='/register' element={<RegisterPage /&gt;} />

&lt;Route path='/dashboard' element={<PrivateRoute&gt;&lt;DashboardPage /&gt;&lt;/PrivateRoute&gt;} />

&lt;Route path='/room/:roomId' element={<PrivateRoute&gt;&lt;RoomPage /&gt;&lt;/PrivateRoute&gt;} />

&lt;/Routes&gt;

&lt;/BrowserRouter&gt;

);

}

# 3\. State Management (Zustand Stores)

**NEVER use localStorage for tokens. Store accessToken in authStore (in-memory) only.**

## 3.1 authStore.js

// src/store/authStore.js

import { create } from 'zustand';

const useAuthStore = create((set) => ({

user: null, // { \_id, username, email }

accessToken: null, // SHORT-LIVED - in memory only, never localStorage

setAuth: (user, accessToken) => set({ user, accessToken }),

clearAuth: () => set({ user: null, accessToken: null }),

setAccessToken: (accessToken) => set({ accessToken }),

}));

export default useAuthStore;

## 3.2 roomStore.js

// src/store/roomStore.js

import { create } from 'zustand';

const useRoomStore = create((set, get) => ({

roomId: null,

roomName: null,

members: \[\], // \[{ userId, username, role }\]

elements: \[\], // drawing strokes - append only

polls: \[\], // active polls

codeSnippet: '', // shared code string

codeLanguage: 'javascript',

setRoom: (roomId, roomName) => set({ roomId, roomName }),

setMembers: (members) => set({ members }),

addMember: (member) => set(s => ({ members: \[...s.members, member\] })),

removeMember: (userId) => set(s => ({ members: s.members.filter(m => m.userId !== userId) })),

addElement: (el) => set(s => ({ elements: \[...s.elements, el\] })),

setElements: (elements) => set({ elements }),

removeElement: (elementId) => set(s => ({ elements: s.elements.filter(e => e.elementId !== elementId) })),

addPoll: (poll) => set(s => ({ polls: \[...s.polls, poll\] })),

updatePoll: (updatedPoll) => set(s => ({

polls: s.polls.map(p => p.pollId === updatedPoll.pollId ? updatedPoll : p)

})),

setCode: (code, lang) => set({ codeSnippet: code, codeLanguage: lang }),

clearRoom: () => set({ roomId:null, roomName:null, members:\[\], elements:\[\], polls:\[\], codeSnippet:'', codeLanguage:'javascript' }),

}));

export default useRoomStore;

## 3.3 uiStore.js

// src/store/uiStore.js

import { create } from 'zustand';

const useUIStore = create((set) => ({

activeTool: 'pen', // 'pen' | 'eraser'

activeColor: '#000000',

lineWidth: 3,

activeTab: 'canvas', // 'canvas' | 'code' | 'poll' | 'voice'

cursors: {}, // { userId: { x, y, username } }

setTool: (tool) => set({ activeTool: tool }),

setColor: (color) => set({ activeColor: color }),

setLineWidth: (w) => set({ lineWidth: w }),

setTab: (tab) => set({ activeTab: tab }),

updateCursor: (userId, data) => set(s => ({

cursors: { ...s.cursors, \[userId\]: data }

})),

removeCursor: (userId) => set(s => {

const c = { ...s.cursors }; delete c\[userId\]; return { cursors: c };

}),

}));

export default useUIStore;

# 4\. API Contracts - What Backend Provides

**You ONLY call these endpoints. Do NOT change URLs or payload shapes. Agree with backend dev before changing anything.**

## 4.1 Axios Instance (with auto token-refresh)

// src/utils/axiosInstance.js

import axios from 'axios';

import useAuthStore from '../store/authStore';

const api = axios.create({

baseURL: import.meta.env.VITE_API_URL, // <http://localhost:4000>

withCredentials: true, // send HTTP-only cookie

});

// Attach access token to every request

api.interceptors.request.use(config => {

const token = useAuthStore.getState().accessToken;

if (token) config.headers.Authorization = \`Bearer \${token}\`;

return config;

});

// Auto-refresh on 401

api.interceptors.response.use(

res => res,

async err => {

if (err.response?.status === 401 && !err.config.\_retry) {

err.config.\_retry = true;

try {

const { data } = await api.post('/api/auth/refresh'); // uses cookie

useAuthStore.getState().setAccessToken(data.accessToken);

err.config.headers.Authorization = \`Bearer \${data.accessToken}\`;

return api(err.config);

} catch {

useAuthStore.getState().clearAuth();

window.location.href = '/login';

}

}

return Promise.reject(err);

}

);

export default api;

## 4.2 Auth API (src/api/authApi.js)

// src/api/authApi.js

import api from '../utils/axiosInstance';

// POST /api/auth/register

// Body: { email, username, password }

// Returns: { accessToken, user: { \_id, username, email } }

// Also sets: refreshToken cookie (HTTP-only, auto-handled)

export const register = (data) => api.post('/api/auth/register', data);

// POST /api/auth/login

// Body: { email, password }

// Returns: { accessToken, user: { \_id, username, email } }

export const login = (data) => api.post('/api/auth/login', data);

// POST /api/auth/refresh (no body - reads cookie automatically)

// Returns: { accessToken }

export const refresh = () => api.post('/api/auth/refresh');

// POST /api/auth/logout (no body - clears cookie server-side)

// Returns: { message: 'Logged out' }

export const logout = () => api.post('/api/auth/logout');

// GET /api/auth/me

// Returns: { \_id, username, email }

export const getMe = () => api.get('/api/auth/me');

## 4.3 Room API (src/api/roomApi.js)

// src/api/roomApi.js

import api from '../utils/axiosInstance';

// POST /api/rooms

// Body: { name: 'Room Name' }

// Returns: { roomId, name, adminId, inviteLink, createdAt }

export const createRoom = (name) => api.post('/api/rooms', { name });

// GET /api/rooms/:roomId

// Returns: { roomId, name, adminId, members: \[{userId, username, role}\], elementCount }

export const getRoom = (roomId) => api.get(\`/api/rooms/\${roomId}\`);

// DELETE /api/rooms/:roomId (admin only)

// Returns: { message: 'Room deleted' }

export const deleteRoom = (roomId) => api.delete(\`/api/rooms/\${roomId}\`);

// POST /api/rooms/:roomId/kick (admin only)

// Body: { userId }

// Returns: { message: 'User removed' }

export const kickUser = (roomId, userId) => api.post(\`/api/rooms/\${roomId}/kick\`, { userId });

## 4.4 REST Error Shape

**All backend errors follow this shape. Handle this in your catch blocks.**

// Every error response from backend:

{

"error": "Human readable message",

"code": "MACHINE_CODE" // optional

}

// Common HTTP codes:

// 400 - Bad request (validation failed)

// 401 - Unauthorized (token expired/missing)

// 403 - Forbidden (not admin, not owner)

// 404 - Room or resource not found

// 429 - Rate limited (too many requests)

// 500 - Server error

# 5\. WebSocket - Complete Event Reference

**All WS messages use this envelope. ALWAYS wrap sends in this format.**

// SEND envelope (client → server):

{

event: 'event_name',

payload: { /\* event data \*/ },

roomId: 'abc123', // always include

userId: 'uid123' // from authStore.user.\_id

}

// RECEIVE envelope (server → client):

{

event: 'event_name',

payload: { /\* event data \*/ }

}

## 5.1 wsManager.js - Singleton WebSocket

// src/utils/wsManager.js

import useAuthStore from '../store/authStore';

class WSManager {

constructor() { this.ws = null; this.listeners = {}; this.reconnectAttempts = 0; }

connect(roomId) {

const token = useAuthStore.getState().accessToken;

const url = \`\${import.meta.env.VITE_WS_URL}?token=\${token}&roomId=\${roomId}\`;

this.ws = new WebSocket(url);

this.ws.onopen = () => { this.reconnectAttempts = 0; };

this.ws.onmessage = (e) => {

try {

const { event, payload } = JSON.parse(e.data);

if (this.listeners\[event\]) {

this.listeners\[event\].forEach(cb => cb(payload));

}

} catch(err) { console.error('WS parse error', err); }

};

this.ws.onclose = () => {

if (this.reconnectAttempts < 3) {

const delay = Math.pow(2, this.reconnectAttempts) \* 1000;

setTimeout(() => { this.reconnectAttempts++; this.connect(roomId); }, delay);

}

};

}

send(event, payload, roomId) {

if (this.ws?.readyState === WebSocket.OPEN) {

const userId = useAuthStore.getState().user?.\_id;

this.ws.send(JSON.stringify({ event, payload, roomId, userId }));

}

}

on(event, callback) {

if (!this.listeners\[event\]) this.listeners\[event\] = \[\];

this.listeners\[event\].push(callback);

}

off(event, callback) {

if (this.listeners\[event\]) {

this.listeners\[event\] = this.listeners\[event\].filter(cb => cb !== callback);

}

}

disconnect() { this.ws?.close(); this.listeners = {}; }

}

export const wsManager = new WSManager();

## 5.2 useWebSocket.js Hook

// src/hooks/useWebSocket.js

import { useEffect } from 'react';

import { wsManager } from '../utils/wsManager';

import useRoomStore from '../store/roomStore';

import useUIStore from '../store/uiStore';

export function useWebSocket(roomId) {

const { addElement, removeElement, setElements, addMember, removeMember,

addPoll, updatePoll, setCode, setMembers } = useRoomStore();

const { updateCursor, removeCursor } = useUIStore();

useEffect(() => {

wsManager.connect(roomId);

// canvas_snapshot - received once on join

wsManager.on('canvas_snapshot', (payload) => {

setElements(payload.elements);

setMembers(payload.members);

payload.polls.forEach(addPoll);

setCode(payload.codeSnippet, payload.codeLanguage);

});

wsManager.on('draw', (el) => addElement(el));

wsManager.on('element_deleted', ({elementId}) => removeElement(elementId));

wsManager.on('user_joined', (member) => addMember(member));

wsManager.on('user_left', ({userId}) => { removeMember(userId); removeCursor(userId); });

wsManager.on('cursor_move', ({userId, username, x, y}) => updateCursor(userId, {x,y,username}));

wsManager.on('poll_created', (poll) => addPoll(poll));

wsManager.on('poll_updated', (poll) => updatePoll(poll));

wsManager.on('code_update', ({code, language}) => setCode(code, language));

return () => wsManager.disconnect();

}, \[roomId\]);

}

## 5.3 All WebSocket Events Cheat Sheet

| **Direction**   | **Event Name**  | **When to send / what it means**                                  |
| --------------- | --------------- | ----------------------------------------------------------------- |
| CLIENT → SERVER | join_room       | Auto-sent on WS connect via query params. No manual emit needed.  |
| SERVER → CLIENT | canvas_snapshot | Received once after joining. Loads full room state.               |
| CLIENT → SERVER | draw            | Emit after each stroke (pointer up). See payload below.           |
| SERVER → CLIENT | draw            | Another user drew something. Append to elements.                  |
| CLIENT → SERVER | delete_element  | User wants to delete their own element. Send elementId.           |
| SERVER → CLIENT | element_deleted | An element was removed. Filter it from elements array.            |
| CLIENT → SERVER | cursor_move     | Throttled (50ms). Send current mouse {x,y}.                       |
| SERVER → CLIENT | cursor_move     | Another user's cursor moved. Update cursors in uiStore.           |
| CLIENT → SERVER | code_share      | User saved code in CodePanel. Send {code, language}.              |
| SERVER → CLIENT | code_update     | Another user shared code. Update codeSnippet in roomStore.        |
| CLIENT → SERVER | poll_create     | User created a poll. Send {question, options:\[...\]}.            |
| SERVER → CLIENT | poll_created    | A poll was created. Add to polls in roomStore.                    |
| CLIENT → SERVER | poll_vote       | User voted. Send {pollId, optionId}.                              |
| SERVER → CLIENT | poll_updated    | Vote counts changed. Replace poll in polls array.                 |
| CLIENT → SERVER | voice_signal    | WebRTC signaling (offer/answer/ICE). Send {targetUserId, signal}. |
| SERVER → CLIENT | voice_signal    | WebRTC signal from peer. Pass to RTCPeerConnection.               |
| SERVER → CLIENT | user_joined     | Someone joined. Add to members.                                   |
| SERVER → CLIENT | user_left       | Someone disconnected. Remove from members + cursors.              |

## 5.4 Payload Shapes for Sending

// draw

wsManager.send('draw', {

elementId: crypto.randomUUID(), // generate on client

type: 'stroke',

points: \[\[100,200\],\[102,201\]\], // array of \[x,y\]

color: '#FF5733',

lineWidth: 3,

tool: 'pen' // 'pen' | 'eraser'

}, roomId);

// cursor_move (throttle this - every 50ms max)

wsManager.send('cursor_move', { x: 450, y: 320 }, roomId);

// delete_element

wsManager.send('delete_element', { elementId: 'el_uuid' }, roomId);

// code_share

wsManager.send('code_share', { code: 'const x = 1;', language: 'javascript' }, roomId);

// poll_create

wsManager.send('poll_create', {

question: 'Take a break?',

options: \['Yes', 'No', 'In 30 min'\]

}, roomId);

// poll_vote

wsManager.send('poll_vote', { pollId: 'poll_uuid', optionId: 'opt1' }, roomId);

// voice_signal

wsManager.send('voice_signal', {

targetUserId: 'uid456',

signal: { type: 'offer', sdp: '...' } // or ICE candidate

}, roomId);

# 6\. Component Implementation Guide

## 6.1 LoginPage.jsx

// src/pages/LoginPage.jsx

// State: email, password, error, loading

// On submit: call authApi.login({ email, password })

// → store { accessToken, user } in authStore via setAuth()

// → navigate('/dashboard')

// On error: show error message from err.response.data.error

// Link to /register at bottom

## 6.2 RegisterPage.jsx

// src/pages/RegisterPage.jsx

// State: email, username, password, error, loading

// Validation: password min 8 chars, username 2-30 chars

// On submit: call authApi.register({ email, username, password })

// → store in authStore, navigate('/dashboard')

// Link to /login at bottom

## 6.3 DashboardPage.jsx

// src/pages/DashboardPage.jsx

// Shows: username from authStore.user.username

// CREATE ROOM:

// Input: room name text field

// On click: call roomApi.createRoom(name)

// → navigate(\`/room/\${data.roomId}\`)

// JOIN ROOM:

// Input: roomId text field

// On click: call roomApi.getRoom(roomId) to validate it exists

// → navigate(\`/room/\${roomId}\`)

// LOGOUT button: call authApi.logout() → clearAuth() → navigate('/login')

## 6.4 RoomPage.jsx - Main Workspace

// src/pages/RoomPage.jsx

// Gets roomId from useParams()

// On mount:

// 1. Call roomApi.getRoom(roomId) to load room metadata

// 2. Call useWebSocket(roomId) hook to start WS connection

// Layout:

// &lt;Navbar /&gt;

// &lt;div className='workspace'&gt;

// &lt;Toolbar /&gt; (left sidebar)

// &lt;div className='main'&gt;

// Tab buttons: Canvas | Code | Poll | Voice

// { activeTab === 'canvas' && &lt;Canvas /&gt; }

// { activeTab === 'code' && &lt;CodePanel /&gt; }

// { activeTab === 'poll' && &lt;PollPanel /&gt; }

// { activeTab === 'voice' && &lt;VoiceUI /&gt; }

// &lt;CursorOverlay /&gt; (always rendered, overlaid on canvas)

// &lt;/div&gt;

// &lt;/div&gt;

// &lt;div className='members-list'&gt; shows members from roomStore &lt;/div&gt;

## 6.5 Canvas.jsx

// src/components/canvas/Canvas.jsx

// useRef for &lt;canvas&gt; element

// useRef for isDrawing boolean

// useRef for currentPoints array (accumulates during stroke)

// Read from: uiStore (activeTool, activeColor, lineWidth)

// Read from: roomStore.elements (render all on mount/update)

// EVENT HANDLERS:

// onPointerDown: set isDrawing=true, start point collection

// onPointerMove:

// if isDrawing: push point to currentPoints

// emit cursor_move (throttled 50ms) always

// draw latest segment on canvas context

// onPointerUp:

// set isDrawing=false

// emit draw event with full currentPoints

// clear currentPoints

// RENDER ALL ELEMENTS from roomStore.elements:

// useEffect(\[elements\]) → clear canvas → redraw all strokes

// When new draw event received (element added to store):

// useEffect(\[elements.length\]) → redraw single new element on top

// Canvas style: width 100%, height 100%, cursor crosshair

## 6.6 Toolbar.jsx

// src/components/canvas/Toolbar.jsx

// Reads and sets: uiStore (activeTool, activeColor, lineWidth)

// Buttons: Pen, Eraser

// Color picker: &lt;input type='color' /&gt;

// Size slider: &lt;input type='range' min=1 max=20 /&gt;

// Clear my drawings: calls wsManager.send('delete_element', ...) per own elementId

// (only user's own elementIds - filter roomStore.elements by userId)

## 6.7 CursorOverlay.jsx

// src/components/canvas/CursorOverlay.jsx

// Reads: uiStore.cursors = { userId: { x, y, username } }

// Renders: absolute-positioned &lt;div&gt; for each cursor entry

// Shows: colored dot + username label

// Style: pointer-events:none, position:absolute, top:0, left:0, w:100%, h:100%

// Skip rendering cursor for own userId (authStore.user.\_id)

## 6.8 CodePanel.jsx

// src/components/code/CodePanel.jsx

// Reads: roomStore.codeSnippet, roomStore.codeLanguage

// Local state: localCode (editable copy), language select

// &lt;textarea&gt; bound to localCode

// Language selector: javascript, python, html, css, json

// SAVE button: wsManager.send('code_share', { code: localCode, language })

// Shows: 'Last updated by \[username\]' from code_update event payload

// Note: NOT collaborative cursor - last save wins

## 6.9 PollPanel.jsx

// src/components/poll/PollPanel.jsx

// Reads: roomStore.polls

// CREATE POLL form (local state):

// question input, dynamic options (add/remove up to 6)

// On submit: wsManager.send('poll_create', { question, options })

// POLL LIST:

// For each poll: show question + options with vote counts

// Vote button per option: wsManager.send('poll_vote', { pollId, optionId })

// Disable vote buttons if userId in poll.voters (track locally or from server update)

// Show percentage bar per option

## 6.10 VoiceUI.jsx

// src/components/voice/VoiceUI.jsx

// Uses: useVoice() hook

// UI: mic on/off toggle button

// Shows: list of connected peers (from roomStore.members)

// Shows: speaking indicator (from audio level detection - optional)

// Mute self: localStream.getAudioTracks()\[0\].enabled = false

## 6.11 useVoice.js - WebRTC Hook

// src/hooks/useVoice.js

// 1. Get user media: navigator.mediaDevices.getUserMedia({ audio: true })

// 2. For each existing room member: create RTCPeerConnection, create offer

// → wsManager.send('voice_signal', { targetUserId, signal: { type:'offer', sdp } })

// 3. On 'voice_signal' WS event:

// if type==='offer' → setRemoteDesc, createAnswer, send answer signal back

// if type==='answer' → setRemoteDesc

// if type==='ice-candidate' → addIceCandidate

// 4. Add remote stream to &lt;audio&gt; element (autoplay, muted=false)

// 5. On unmount: close all peer connections, stop local stream tracks

// ICE servers (use free STUN):

// iceServers: \[{ urls: 'stun:stun.l.google.com:19302' }\]

## 6.12 PrivateRoute.jsx

// src/components/common/PrivateRoute.jsx

import { Navigate } from 'react-router-dom';

import useAuthStore from '../../store/authStore';

export default function PrivateRoute({ children }) {

const { user } = useAuthStore();

return user ? children : &lt;Navigate to='/login' replace /&gt;;

}

# 7\. Working Without Backend (Mock Mode)

**Use these mocks when backend isn't ready. Swap with real calls when backend is up.**

// src/api/authApi.js - MOCK version

export const login = async ({ email, password }) => ({

data: {

accessToken: 'mock-token-xyz',

user: { \_id: 'uid_mock_001', username: 'Alice', email }

}

});

export const register = async (data) => ({

data: { accessToken: 'mock-token-xyz', user: { \_id: 'uid_mock_001', ...data } }

});

// src/api/roomApi.js - MOCK version

export const createRoom = async (name) => ({

data: { roomId: 'room_mock_abc', name, adminId: 'uid_mock_001', inviteLink: '<http://localhost:5173/room/room_mock_abc>' }

});

export const getRoom = async (roomId) => ({

data: { roomId, name: 'Mock Room', adminId: 'uid_mock_001', members: \[\], elementCount: 0 }

});

// wsManager.js - MOCK: override send() to do nothing, manually call listeners

// wsManager.listeners\['canvas_snapshot'\]?.\[0\]({ elements:\[\], members:\[\], polls:\[\], codeSnippet:'' })

# 8\. Environment Variables & Deployment

| **Variable** | **Dev Value**           | **Prod Value**                       |
| ------------ | ----------------------- | ------------------------------------ |
| VITE_API_URL | <http://localhost:4000> | <https://livecollab-api.railway.app> |
| VITE_WS_URL  | ws://localhost:4000     | wss://livecollab-api.railway.app     |

### Deployment (Vercel)

\# Build command

npm run build

\# Output directory

dist

\# Add env vars in Vercel Dashboard → Settings → Environment Variables

\# VITE_API_URL = <https://your-backend.railway.app>

\# VITE_WS_URL = wss://your-backend.railway.app

# 9\. Frontend Developer Checklist

| **Task**                                             | **File(s)**                                     | **Done?** |
| ---------------------------------------------------- | ----------------------------------------------- | --------- |
| Set up Vite + React project                          | package.json, vite.config.js                    | ☐         |
| Create .env with API + WS URLs                       | .env                                            | ☐         |
| Implement axiosInstance with interceptors            | utils/axiosInstance.js                          | ☐         |
| Implement authApi (register, login, refresh, logout) | api/authApi.js                                  | ☐         |
| Implement roomApi (create, get, delete, kick)        | api/roomApi.js                                  | ☐         |
| Implement 3 Zustand stores                           | store/authStore, roomStore, uiStore             | ☐         |
| Implement wsManager singleton                        | utils/wsManager.js                              | ☐         |
| Implement useWebSocket hook (all event handlers)     | hooks/useWebSocket.js                           | ☐         |
| Build LoginPage + RegisterPage                       | pages/LoginPage.jsx, RegisterPage.jsx           | ☐         |
| Build DashboardPage                                  | pages/DashboardPage.jsx                         | ☐         |
| Build RoomPage with tab layout                       | pages/RoomPage.jsx                              | ☐         |
| Build Canvas + drawing logic                         | components/canvas/Canvas.jsx, useCanvas.js      | ☐         |
| Build Toolbar                                        | components/canvas/Toolbar.jsx                   | ☐         |
| Build CursorOverlay                                  | components/canvas/CursorOverlay.jsx             | ☐         |
| Build CodePanel                                      | components/code/CodePanel.jsx                   | ☐         |
| Build PollPanel                                      | components/poll/PollPanel.jsx                   | ☐         |
| Build VoiceUI + useVoice hook                        | components/voice/VoiceUI.jsx, hooks/useVoice.js | ☐         |
| Build PrivateRoute guard                             | components/common/PrivateRoute.jsx              | ☐         |
| Set up App.jsx with all routes                       | App.jsx                                         | ☐         |
| Test with mock data (no backend)                     | Mock api files                                  | ☐         |
| Test with live backend on localhost:4000             | Full integration                                | ☐         |

**- END OF FRONTEND GUIDE -**

_Questions? Coordinate with backend dev via Section 4 contract._