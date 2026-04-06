// src/components/code/CodePanel.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import useRoomStore from '../../store/roomStore';
import { wsManager } from '../../utils/wsManager';
import '../../styles/code.css';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

export default function CodePanel() {
  const { codeSnippet, codeLanguage, roomId } = useRoomStore();

  const [localCode, setLocalCode] = useState(codeSnippet || '');
  const [language, setLanguage] = useState(codeLanguage || 'javascript');
  const [isSynced, setIsSynced] = useState(true);
  const [lastAuthor, setLastAuthor] = useState(null);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Sync from store when remote update arrives
  useEffect(() => {
    setLocalCode(codeSnippet || '');
    setIsSynced(true);
  }, [codeSnippet]);

  useEffect(() => {
    setLanguage(codeLanguage || 'javascript');
  }, [codeLanguage]);

  // Track code_update for author info
  useEffect(() => {
    const handler = (payload) => {
      if (payload.authorId) {
        setLastAuthor(payload.authorId);
      }
    };
    wsManager.on('code_update', handler);
    return () => wsManager.off('code_update', handler);
  }, []);

  // Handle local code changes
  const handleCodeChange = (e) => {
    setLocalCode(e.target.value);
    setIsSynced(false);
  };

  // Save / share code
  const handleSave = useCallback(() => {
    wsManager.send('code_share', {
      code: localCode,
      language,
    }, roomId);
    setIsSynced(true);
  }, [localCode, language, roomId]);

  // Keyboard shortcut: Ctrl+S / Cmd+S
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

  // Sync textarea scroll with line numbers
  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Handle tab key in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newCode = localCode.substring(0, selectionStart) + '  ' + localCode.substring(selectionEnd);
      setLocalCode(newCode);
      setIsSynced(false);
      // Restore cursor position
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
      });
    }
  };

  // Line count
  const lineCount = (localCode || '').split('\n').length;
  const lines = Array.from({ length: Math.max(lineCount, 20) }, (_, i) => i + 1);

  return (
    <div className="code-panel" id="code-panel">
      {/* Header */}
      <div className="code-header">
        <div className="code-header-left">
          <div className="code-header-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Shared Code
          </div>
          <select
            className="code-lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            id="code-language-select"
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="code-header-right">
          <div className="code-status">
            <span className={`dot ${isSynced ? 'synced' : 'editing'}`} />
            {isSynced ? 'Synced' : 'Editing…'}
          </div>
          <button
            className="code-save-btn"
            onClick={handleSave}
            disabled={isSynced}
            id="code-save-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Share (Ctrl+S)
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="code-editor-wrapper">
        <div className="code-line-numbers" ref={lineNumbersRef}>
          {lines.map(n => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="code-editor"
          value={localCode}
          onChange={handleCodeChange}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder="Paste or type code here…&#10;&#10;Press Ctrl+S to share with the room."
          spellCheck={false}
          id="code-textarea"
        />
      </div>

      {/* Footer */}
      <div className="code-footer">
        <div className="code-footer-left">
          <span>{language}</span>
          <span className="code-char-count">{localCode.length} chars</span>
          <span>{lineCount} lines</span>
        </div>
        <div>
          Last writer wins · Not collaborative cursor
        </div>
      </div>
    </div>
  );
}
