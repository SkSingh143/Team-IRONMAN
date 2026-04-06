// src/store/uiStore.js
import { create } from 'zustand';

const useUIStore = create((set) => ({
  activeTool: 'pen',        // 'pen' | 'eraser'
  activeColor: '#FFFFFF',
  lineWidth: 3,
  activeTab: 'canvas',      // 'canvas' | 'code' | 'poll' | 'voice'
  cursors: {},               // { userId: { x, y, username } }
  toasts: [],

  addToast: (type, title, message) => set(s => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    return { toasts: [...s.toasts, { id, type, title, message }] };
  }),

  removeToast: (id) => set(s => ({
    toasts: s.toasts.filter(t => t.id !== id)
  })),

  setTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ activeColor: color }),
  setLineWidth: (w) => set({ lineWidth: w }),
  setTab: (tab) => set({ activeTab: tab }),

  updateCursor: (userId, data) => set(s => ({
    cursors: { ...s.cursors, [userId]: data }
  })),

  removeCursor: (userId) => set(s => {
    const c = { ...s.cursors };
    delete c[userId];
    return { cursors: c };
  }),
}));

export default useUIStore;
