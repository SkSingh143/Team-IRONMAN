import { useState, useEffect, useRef, useCallback } from 'react';
import useRoomStore from '../../store/roomStore';
import { wsManager } from '../../utils/wsManager';
import { motion } from 'framer-motion';
import { Code, Share, Save } from 'lucide-react';

const LANGUAGES = [
  { value: 'text', label: 'Plain Text' },
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
  const [language, setLanguage] = useState(codeLanguage || 'text');
  const [isSynced, setIsSynced] = useState(true);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  useEffect(() => {
    setLocalCode(codeSnippet || '');
    setIsSynced(true);
  }, [codeSnippet]);

  useEffect(() => {
    setLanguage(codeLanguage || 'text');
  }, [codeLanguage]);

  const handleCodeChange = (e) => {
    setLocalCode(e.target.value);
    setIsSynced(false);
  };

  const handleSave = useCallback(() => {
    wsManager.send('code_share', { code: localCode, language }, roomId);
    setIsSynced(true);
  }, [localCode, language, roomId]);

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
      const newCode = localCode.substring(0, selectionStart) + '  ' + localCode.substring(selectionEnd);
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
    <div className="flex flex-col h-full bg-root">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between p-4 border-b border-border bg-surface shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Code className="w-5 h-5 text-primary" />
            Shared Code
          </div>
          <select
            className="px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-sm font-medium text-gray-300 focus:outline-none focus:border-primary transition-colors appearance-none pr-8 cursor-pointer"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'none\' stroke=\'%239B9DB8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M3 5l3 3 3-3\'/%3E%3C/svg%3E")', backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat' }}
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setIsSynced(false); }}
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-2 h-2 rounded-full ${isSynced ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isSynced ? 'Synced' : 'Editing…'}
          </div>
          <button
            onClick={handleSave}
            disabled={isSynced}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isSynced ? 'bg-surface-elevated text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5'}`}
          >
            <Share className="w-4 h-4" />
            Share (Ctrl+S)
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <div className="flex-1 relative overflow-hidden bg-root">
        <div 
          ref={lineNumbersRef}
          className="absolute top-0 left-0 bottom-0 w-12 bg-surface border-r border-border py-4 px-2 text-right text-[13px] leading-7 font-mono text-gray-500 select-none overflow-hidden"
        >
          {lines.map(n => <div key={n} className="opacity-50">{n}</div>)}
        </div>
        <textarea
          ref={textareaRef}
          value={localCode}
          onChange={handleCodeChange}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder="Paste or type code here…&#10;&#10;Press Ctrl+S to share with the room."
          spellCheck={false}
          className="w-full h-full p-4 pl-16 bg-root text-gray-300 font-mono text-[13px] leading-7 outline-none resize-none whitespace-pre overflow-x-auto"
        />
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-4 py-2 bg-surface border-t border-border text-xs text-gray-500 shrink-0">
        <div className="flex gap-4">
          <span>{LANGUAGES.find(l=>l.value===language)?.label}</span>
          <span className="font-mono">{localCode.length} chars</span>
          <span>{lineCount} lines</span>
        </div>
        <div>Last writer wins</div>
      </footer>
    </div>
  );
}
