// src/store/roomStore.js
import { create } from 'zustand';

const useRoomStore = create((set, get) => ({
  roomId: null,
  roomName: null,
  members: [],          // [{ userId, username, role }]
  elements: [],         // drawing strokes — append only
  polls: [],            // active polls
  codeSnippet: '',      // shared code string
  codeLanguage: 'javascript',

  setRoom: (roomId, roomName) => set({ roomId, roomName }),
  setMembers: (members) => set({ members }),
  addMember: (member) => set(s => ({ members: [...s.members, member] })),
  removeMember: (userId) => set(s => ({
    members: s.members.filter(m => m.userId !== userId)
  })),

  addElement: (el) => set(s => ({ elements: [...s.elements, el] })),
  setElements: (elements) => set({ elements }),
  removeElement: (elementId) => set(s => ({
    elements: s.elements.filter(e => e.elementId !== elementId)
  })),

  addPoll: (poll) => set(s => ({ polls: [...s.polls, poll] })),
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
