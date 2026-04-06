import { useState, useEffect, useRef, useCallback } from 'react';
import useRoomStore from '../../store/roomStore';
import useAuthStore from '../../store/authStore';
import { wsManager } from '../../utils/wsManager';
import { Code, Share, ShieldAlert } from 'lucide-react';

const NOTES_MODE = 'text';

export default function CodePanel() {
  const { codeSnippet, roomId, members, allowAllPermissions } = useRoomStore();
  const user = useAuthStore((s) => s.user);
  const [localCode, setLocalCode] = useState(codeSnippet || '');
  const [isSynced, setIsSynced] = useState(true);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const currentMember = members.find((m) => m.userId === user?._id);
  const isAdmin = currentMember?.role === 'admin';
  const hasPermission = isAdmin || currentMember?.canParticipate || allowAllPermissions;

  useEffect(() => {
    setLocalCode(codeSnippet || '');
    setIsSynced(true);
  }, [codeSnippet]);

  const handleCodeChange = (e) => {
    setLocalCode(e.target.value);
    setIsSynced(false);
  };

  const handleSave = useCallback(() => {
    wsManager.send('code_share', { code: localCode, language: NOTES_MODE }, roomId);
    setIsSynced(true);
  }, [localCode, roomId]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newCode = `${localCode.substring(0, selectionStart)}  ${localCode.substring(selectionEnd)}`;
      setLocalCode(newCode);
      setIsSynced(false);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
      });
    }
  };

  const lineCount = (localCode || '').split('\n').length;
  const lines = Array.from({ length: Math.max(lineCount, 20) }, (_, i) => i + 1);

  return (
    <div className="flex h-full flex-col bg-root">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface p-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Code className="w-5 h-5 text-primary" />
            Shared Notes
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-sm font-medium text-primary">
            Notes only
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasPermission ? (
            <>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`h-2 w-2 rounded-full ${isSynced ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isSynced ? 'Synced' : 'Editing...'}
              </div>
              <button
                onClick={handleSave}
                disabled={isSynced}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  isSynced
                    ? 'cursor-not-allowed bg-surface-elevated text-gray-500'
                    : 'bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary-dark'
                }`}
              >
                <Share className="w-4 h-4" />
                Share Notes (Ctrl+S)
              </button>
            </>
          ) : (
            <div className="group relative">
              <div className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-700/50 px-3 py-2 text-sm font-bold text-gray-500">
                <ShieldAlert className="w-4 h-4" />
                Sharing Disabled
              </div>
              <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-lg border border-border bg-gray-800 px-3 py-1.5 text-xs text-gray-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <ShieldAlert className="mr-1 inline h-3 w-3 text-amber-400" />
                Disabled by Admin
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden bg-root">
        <div
          ref={lineNumbersRef}
          className="absolute bottom-0 left-0 top-0 w-12 overflow-hidden border-r border-border bg-surface px-2 py-4 text-right font-mono text-[13px] leading-7 text-gray-500 select-none"
        >
          {lines.map((n) => (
            <div key={n} className="opacity-50">
              {n}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={localCode}
          onChange={hasPermission ? handleCodeChange : undefined}
          onScroll={handleScroll}
          onKeyDown={hasPermission ? handleKeyDown : undefined}
          readOnly={!hasPermission}
          placeholder={
            hasPermission
              ? 'Write shared notes here...\n\nPress Ctrl+S to share with the room.'
              : 'View-only mode. Ask admin for permission to edit notes.'
          }
          spellCheck={false}
          className={`h-full w-full resize-none overflow-x-auto whitespace-pre bg-root p-4 pl-16 font-mono text-[13px] leading-7 outline-none ${
            hasPermission ? 'text-gray-300' : 'cursor-not-allowed text-gray-500'
          }`}
        />
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-4 py-2 text-xs text-gray-500">
        <div className="flex gap-4">
          <span>Shared notes</span>
          <span className="font-mono">{localCode.length} chars</span>
          <span>{lineCount} lines</span>
        </div>
        <div>{hasPermission ? 'Realtime room notes' : 'Read-only mode'}</div>
      </footer>
    </div>
  );
}
