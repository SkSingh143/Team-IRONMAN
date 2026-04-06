/**
 * In-memory store for active rooms and connected WebSocket clients.
 * Map structure:
 * roomId -> {
 *   clients: Map<ws, { userId }>,
 * }
 */
const roomSessions = new Map();

module.exports = roomSessions;
