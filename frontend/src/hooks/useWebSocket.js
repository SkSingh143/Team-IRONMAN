// src/hooks/useWebSocket.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wsManager } from '../utils/wsManager';
import useRoomStore from '../store/roomStore';
import useUIStore from '../store/uiStore';

export function useWebSocket(roomId) {
  const navigate = useNavigate();
  const {
    addElement,
    removeElement,
    setElements,
    addMember,
    removeMember,
    setMembers,
    addPoll,
    updatePoll,
    removePoll,
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
    wsManager.on('clear_canvas', () => setElements([]));

    // Users
    wsManager.on('user_joined', (member) => addMember(member));
    wsManager.on('user_left', ({ userId }) => {
      removeMember(userId);
      removeCursor(userId);
    });

    // Ban events — instant removal
    wsManager.on('user_banned', ({ userId }) => {
      removeMember(userId);
      removeCursor(userId);
    });
    wsManager.on('you_are_banned', () => {
      alert('You have been banned from this room by the admin.');
      navigate('/dashboard');
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
    wsManager.on('poll_deleted', (payload) => {
      if (payload?.pollId) removePoll(payload.pollId);
    });

    // Code
    wsManager.on('code_update', ({ code, language }) => setCode(code, language));

    // Permissions
    wsManager.on('permissions_updated', ({ allowAllPermissions }) => {
      useRoomStore.getState().setAllowAllPermissions(allowAllPermissions);
    });
    wsManager.on('member_permission_updated', ({ userId, canParticipate }) => {
      useRoomStore.getState().updateMemberPermission(userId, canParticipate);
    });
    wsManager.on('permission_denied', ({ action }) => {
      alert(`Action '${action}' denied. You need permission from an admin.`);
    });

    return () => wsManager.disconnect();
  }, [roomId]);
}
