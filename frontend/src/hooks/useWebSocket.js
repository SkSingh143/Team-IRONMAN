// src/hooks/useWebSocket.js
import { useEffect } from 'react';
import { wsManager } from '../utils/wsManager';
import useRoomStore from '../store/roomStore';
import useUIStore from '../store/uiStore';

export function useWebSocket(roomId) {
  const {
    addElement,
    removeElement,
    setElements,
    addMember,
    removeMember,
    setMembers,
    addPoll,
    updatePoll,
    setCode,
  } = useRoomStore();

  const { updateCursor, removeCursor } = useUIStore();

  useEffect(() => {
    if (!roomId) return;

    wsManager.connect(roomId);

    // canvas_snapshot — received once on join
    wsManager.on('canvas_snapshot', (payload) => {
      setElements(payload.elements || []);
      setMembers(payload.members || []);
      if (payload.polls) payload.polls.forEach(addPoll);
      if (payload.codeSnippet !== undefined) {
        setCode(payload.codeSnippet, payload.codeLanguage || 'javascript');
      }
    });

    // Drawing
    wsManager.on('draw', (el) => addElement(el));
    wsManager.on('element_deleted', ({ elementId }) => removeElement(elementId));

    // Users
    wsManager.on('user_joined', (member) => addMember(member));
    wsManager.on('user_left', ({ userId }) => {
      removeMember(userId);
      removeCursor(userId);
    });

    // Cursors
    wsManager.on('cursor_move', ({ userId, username, x, y }) => {
      updateCursor(userId, { x, y, username });
    });

    // Polls
    wsManager.on('poll_created', (payload) => {
      if (payload?.poll) addPoll(payload.poll);
    });
    wsManager.on('poll_updated', (payload) => {
      if (payload?.poll) updatePoll(payload.poll);
    });

    // Code
    wsManager.on('code_update', ({ code, language }) => setCode(code, language));

    return () => wsManager.disconnect();
  }, [roomId]);
}
