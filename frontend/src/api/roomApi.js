// src/api/roomApi.js
import api from '../utils/axiosInstance';

// POST /api/rooms
// Body: { name: 'Room Name' }
// Returns: { roomId, name, adminId, inviteLink, createdAt }
export const createRoom = (name) => api.post('/api/rooms', { name });

// GET /api/rooms/:roomId
// Returns: { roomId, name, adminId, members: [{userId, username, role}], elementCount }
export const getRoom = (roomId) => api.get(`/api/rooms/${roomId}`);

// DELETE /api/rooms/:roomId (admin only)
// Returns: { message: 'Room deleted' }
export const deleteRoom = (roomId) => api.delete(`/api/rooms/${roomId}`);

// POST /api/rooms/:roomId/kick (admin only)
// Body: { userId }
// Returns: { message: 'User removed' }
export const kickUser = (roomId, userId) => api.post(`/api/rooms/${roomId}/kick`, { userId });
