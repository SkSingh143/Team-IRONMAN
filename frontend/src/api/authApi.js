// src/api/authApi.js
import api from '../utils/axiosInstance';

// POST /api/auth/register
// Body: { email, username, password }
// Returns: { accessToken, user: { _id, username, email } }
// Also sets: refreshToken cookie (HTTP-only, auto-handled)
export const register = (data) => api.post('/api/auth/register', data);

// POST /api/auth/login
// Body: { email, password }
// Returns: { accessToken, user: { _id, username, email } }
export const login = (data) => api.post('/api/auth/login', data);

// POST /api/auth/refresh (no body — reads cookie automatically)
// Returns: { accessToken }
export const refresh = () => api.post('/api/auth/refresh');

// POST /api/auth/logout (no body — clears cookie server-side)
// Returns: { message: 'Logged out' }
export const logout = () => api.post('/api/auth/logout');

// GET /api/auth/me
// Returns: { _id, username, email }
export const getMe = () => api.get('/api/auth/me');
