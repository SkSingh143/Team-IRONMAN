// src/utils/wsManager.js
import useAuthStore from '../store/authStore';

class WSManager {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnect = 3;
    this._roomId = null;
  }

  connect(roomId) {
    // Close existing connection if any
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }

    this._roomId = roomId;
    const token = useAuthStore.getState().accessToken;
    const url = `${import.meta.env.VITE_WS_URL}?token=${token}&roomId=${roomId}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[WS] Connected to room:', roomId);
      this.reconnectAttempts = 0;
      // Notify listeners
      if (this.listeners['_connected']) {
        this.listeners['_connected'].forEach(cb => cb());
      }
    };

    this.ws.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data);
        if (this.listeners[type]) {
          this.listeners[type].forEach(cb => cb(data));
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    this.ws.onclose = (e) => {
      console.log('[WS] Disconnected, code:', e.code);
      // Notify listeners
      if (this.listeners['_disconnected']) {
        this.listeners['_disconnected'].forEach(cb => cb());
      }
      // Auto-reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnect) {
        const delay = Math.pow(2, this.reconnectAttempts) * 1000;
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnect})`);
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(roomId);
        }, delay);
      } else {
        console.log('[WS] Max reconnect attempts reached');
        if (this.listeners['_max_reconnect']) {
          this.listeners['_max_reconnect'].forEach(cb => cb());
        }
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }

  send(event, payload, roomId) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const userId = useAuthStore.getState().user?._id;
      this.ws.send(JSON.stringify({ type: event, data: payload, roomId, userId }));
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on intentional close
      this.ws.close();
      this.ws = null;
    }
    this.listeners = {};
    this.reconnectAttempts = 0;
    this._roomId = null;
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WSManager();
