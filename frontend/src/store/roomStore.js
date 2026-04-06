// src/store/roomStore.js
import { create } from 'zustand';

const useRoomStore = create((set, get) => ({
  roomId: null,
  roomName: null,
  allowAllPermissions: false,
  members: [],          // [{ userId, username, role, canParticipate }]
  elements: [],         // drawing strokes — append only
  polls: [],            // active polls
  codeSnippet: '',      // shared code string
  codeLanguage: 'javascript',

  setRoom: (roomId, roomName, allowAllPermissions = false) => set({ roomId, roomName, allowAllPermissions }),
  setAllowAllPermissions: (allowAllPermissions) => set({ allowAllPermissions }),
  setMembers: (members) => set({ members }),
  addMember: (member) => set(s => {
    if (s.members.some(m => m.userId === member.userId)) return s;
    return { members: [...s.members, member] };
  }),
  removeMember: (userId) => set(s => ({
    members: s.members.filter(m => m.userId !== userId)
  })),
  updateMemberPermission: (userId, canParticipate) => set(s => ({
    members: s.members.map(m => m.userId === userId ? { ...m, canParticipate } : m)
  })),

  addElement: (el) => set(s => ({ elements: [...s.elements, el] })),
  setElements: (elements) => set({ elements }),
  removeElement: (elementId) => set(s => ({
    elements: s.elements.filter(e => e.elementId !== elementId)
  })),

  undoElement: (userId, wsManager) => set(s => {
    // Find the last stroke drawn by this user
    for (let i = s.elements.length - 1; i >= 0; i--) {
      if (s.elements[i].userId === userId) {
        const elementIdToRemove = s.elements[i].elementId;
        const newElements = [...s.elements];
        newElements.splice(i, 1);
        
        // Broadcast delete event
        if (wsManager && wsManager.isConnected) {
          wsManager.send('delete_element', { elementId: elementIdToRemove }, s.roomId);
        }
        return { elements: newElements };
      }
    }
    return s; // Nothing to undo
  }),

  addPoll: (poll) => set(s => ({ polls: [...s.polls, poll] })),
  removePoll: (pollId) => set(s => ({
    polls: s.polls.filter(p => p.pollId !== pollId)
  })),
  updatePoll: (updatedPoll) => set(s => ({
    polls: s.polls.map(p => p.pollId === updatedPoll.pollId ? updatedPoll : p)
  })),

  setCode: (code, lang) => set({ codeSnippet: code, codeLanguage: lang }),

  clearRoom: () => set({
    roomId: null,
    roomName: null,
    members: [],
    elements: [],
    polls: [],
    codeSnippet: '',
    codeLanguage: 'javascript',
  }),
}));

export default useRoomStore;
