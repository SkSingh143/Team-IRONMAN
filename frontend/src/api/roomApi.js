// src/api/roomApi.js
import api from '../utils/axiosInstance';

// POST /api/rooms
// Body: { name: 'Room Name' }
// Returns: { roomId, name, adminId, inviteLink, createdAt }
export const createRoom = (name) => api.post('/api/rooms', { name });

// GET /api/rooms/me/history
export const getMyHistory = () => api.get('/api/rooms/me/history');

// GET /api/rooms/:roomId
// Returns: { roomId, name, adminId, members: [{userId, username, role}], elementCount }
export const getRoom = (roomId) => api.get(`/api/rooms/${roomId}`);

// DELETE /api/rooms/:roomId (admin only)
// Returns: { message: 'Room deleted' }
export const deleteRoom = (roomId) => api.delete(`/api/rooms/${roomId}`);

// POST /api/rooms/:roomId/ban (admin only)
// Body: { userId }
// Returns: { message: 'User banned' }
export const banUser = (roomId, userId) => api.post(`/api/rooms/${roomId}/ban`, { userId });

// PUT /api/rooms/:roomId/permissions
export const toggleAllPermissions = (roomId, allowAllPermissions) => api.put(`/api/rooms/${roomId}/permissions`, { allowAllPermissions });

// PUT /api/rooms/:roomId/member/:memberId/permission
export const toggleMemberPermission = (roomId, memberId, canParticipate) => api.put(`/api/rooms/${roomId}/member/${memberId}/permission`, { canParticipate });
