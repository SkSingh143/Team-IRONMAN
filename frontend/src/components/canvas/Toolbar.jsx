import { useState } from 'react';
import useUIStore from '../../store/uiStore';
import useRoomStore from '../../store/roomStore';
import useAuthStore from '../../store/authStore';
import { wsManager } from '../../utils/wsManager';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Eraser, Undo, Moon, Sun, Trash2, Download, ShieldAlert, Square, Circle, Star, Palette, ChevronRight } from 'lucide-react';
import { exportAsImage } from '../../utils/canvasUtils';

const PRESET_COLORS = [
  '#FFFFFF', '#111111', '#8B5E3C', '#D4A373',
  '#6B705C', '#2D6A4F', '#9C6644', '#B08968',
  '#A8A29E', '#7F5539', '#C97B63', '#E7D7C1',
];

const SIZES = [2, 4, 6, 8, 12, 16];

export default function Toolbar() {
  const { activeTool, activeColor, lineWidth, canvasTheme, setTool, setColor, setLineWidth, toggleTheme } = useUIStore();
  const elements = useRoomStore(s => s.elements);
  const undoElement = useRoomStore(s => s.undoElement);
  const roomId = useRoomStore(s => s.roomId);
  const members = useRoomStore(s => s.members);
  const allowAllPermissions = useRoomStore(s => s.allowAllPermissions);
  const myUserId = useAuthStore(s => s.user?._id);
  
  const [isExpanded, setIsExpanded] = useState(true);

  const currentMember = members.find(m => m.userId === myUserId);
  const isAdmin = currentMember?.role === 'admin';
  const hasPermission = isAdmin || currentMember?.canParticipate || allowAllPermissions;

  const handleUndo = () => {
    undoElement(myUserId, wsManager);
  };

  const handleClearCanvas = () => {
    wsManager.send('clear_canvas', {}, roomId);
    // clear immediately locally
    useRoomStore.getState().setElements([]);
  };

  const handleExport = () => {
    exportAsImage(elements, canvasTheme);
  };

  return (
    <div className="absolute right-6 top-24 z-20 flex items-start gap-3 max-h-[85vh] pointer-events-none">
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 bg-surface/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl pointer-events-auto hover:bg-surface-elevated transition-colors"
        title={isExpanded ? "Collapse Toolbar" : "Expand Toolbar"}
      >
        {isExpanded ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <Palette className="w-5 h-5 text-primary" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            className="w-48 bg-surface/90 backdrop-blur-xl border border-border rounded-3xl shadow-2xl p-4 flex flex-col gap-6 pointer-events-auto overflow-y-auto max-h-[80vh] custom-scrollbar"
          >
            {/* Permission indicator */}
            {!hasPermission && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-bold leading-tight">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Disabled by Admin</span>
              </div>
            )}

            {/* Drawing Tools */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Draw</span>
              <div className="grid grid-cols-3 gap-2">
                <ToolBtn active={activeTool === 'pen'} onClick={() => hasPermission && setTool('pen')} icon={<PenTool className="w-4 h-4" />} title="Pen" disabled={!hasPermission}/>
                <ToolBtn active={activeTool === 'eraser'} onClick={() => hasPermission && setTool('eraser')} icon={<Eraser className="w-4 h-4" />} title="Eraser" disabled={!hasPermission}/>
              </div>
            </div>

            {/* Shapes */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Shapes</span>
              <div className="grid grid-cols-3 gap-2">
                <ToolBtn active={activeTool === 'rect'} onClick={() => hasPermission && setTool('rect')} icon={<Square className="w-4 h-4" />} title="Rectangle" disabled={!hasPermission}/>
                <ToolBtn active={activeTool === 'circle'} onClick={() => hasPermission && setTool('circle')} icon={<Circle className="w-4 h-4" />} title="Circle" disabled={!hasPermission}/>
                <ToolBtn active={activeTool === 'star'} onClick={() => hasPermission && setTool('star')} icon={<Star className="w-4 h-4" />} title="Star" disabled={!hasPermission}/>
              </div>
            </div>

            {/* Colors */}
            <div className={`flex flex-col gap-3 pt-4 border-t border-border ${!hasPermission ? 'opacity-40 pointer-events-none' : ''}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Color</span>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    className={`w-full aspect-square rounded-lg border-2 transition-transform ${activeColor === c ? 'border-primary shadow-lg scale-110' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    disabled={!hasPermission}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 bg-surface-input p-2 rounded-xl">
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                  disabled={!hasPermission}
                />
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{activeColor}</span>
              </div>
            </div>

            {/* Size */}
            <div className={`flex flex-col gap-3 pt-4 border-t border-border ${!hasPermission ? 'opacity-40 pointer-events-none' : ''}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Thickness</span>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map(s => (
                  <button
                    key={s}
                    className={`h-10 flex items-center justify-center rounded-xl transition-all ${lineWidth === s ? 'bg-primary/20 border border-primary/50' : 'bg-surface-input hover:bg-surface-elevated border border-transparent'}`}
                    onClick={() => setLineWidth(s)}
                    disabled={!hasPermission}
                  >
                    <span className="block bg-gray-300 rounded-full" style={{ width: s, height: s }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 border-t border-border mt-auto">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Actions</span>
              <div className="grid grid-cols-2 gap-2">
                <ToolBtn onClick={hasPermission ? handleUndo : undefined} icon={<Undo className="w-4 h-4" />} title="Undo" disabled={!hasPermission}/>
                <ToolBtn onClick={handleExport} icon={<Download className="w-4 h-4" />} title="Export as image"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ToolBtn onClick={toggleTheme} icon={canvasTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-400" />} title="Toggle Theme" />
                {isAdmin && (
                  <ToolBtn onClick={handleClearCanvas} icon={<Trash2 className="w-4 h-4 text-red-500" />} title="Clear Canvas" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolBtn({ active, onClick, icon, title, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={disabled ? "Disabled by Admin" : title}
      className={`relative w-full aspect-[4/3] flex items-center justify-center rounded-xl transition-all flex-col ${
        disabled 
          ? 'text-gray-600 bg-surface-input/50 cursor-not-allowed'
          : active 
            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
            : 'text-gray-400 bg-surface-input hover:bg-surface-elevated hover:text-white'
      }`}
    >
      {icon}
    </button>
  );
}
