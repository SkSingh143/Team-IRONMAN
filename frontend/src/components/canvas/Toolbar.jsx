import useUIStore from '../../store/uiStore';
import useRoomStore from '../../store/roomStore';
import useAuthStore from '../../store/authStore';
import { wsManager } from '../../utils/wsManager';
import { motion } from 'framer-motion';
import { PenTool, Eraser, Undo, Moon, Sun, Trash2, Download, ShieldAlert } from 'lucide-react';
import { exportAsImage } from '../../utils/canvasUtils';

const PRESET_COLORS = [
  '#FFFFFF', '#FF6B6B', '#FFA94D', '#FFD43B',
  '#69DB7C', '#4DABF7', '#9775FA', '#F783AC',
  '#868E96', '#20C997', '#339AF0', '#E64980',
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
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 p-3 bg-surface/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-20 max-w-[95vw] overflow-x-auto hide-scrollbar"
    >
      {/* Board Theme — always accessible */}
      <div className="flex flex-col items-center justify-center px-2 border-r border-border shrink-0">
         <ToolBtn 
            onClick={toggleTheme} 
            icon={canvasTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />} 
            title="Toggle Board Theme"
          />
      </div>

      {/* Tools — permission gated */}
      <div className="flex flex-col gap-2 px-3 border-r border-border shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 pl-1">Tool</span>
        <div className="flex gap-1">
          <div className="relative group">
            <ToolBtn 
              active={activeTool === 'pen'} 
              onClick={() => hasPermission && setTool('pen')} 
              icon={<PenTool className={`w-5 h-5 ${!hasPermission ? 'opacity-40' : ''}`} />} 
              disabled={!hasPermission}
            />
            {!hasPermission && <DisabledTooltip />}
          </div>
          <div className="relative group">
            <ToolBtn 
              active={activeTool === 'eraser'} 
              onClick={() => hasPermission && setTool('eraser')} 
              icon={<Eraser className={`w-5 h-5 ${!hasPermission ? 'opacity-40' : ''}`} />} 
              disabled={!hasPermission}
            />
            {!hasPermission && <DisabledTooltip />}
          </div>
          <div className="w-px bg-border mx-1" />
          <div className="relative group">
            <ToolBtn 
              onClick={hasPermission ? handleUndo : undefined} 
              icon={<Undo className={`w-5 h-5 ${!hasPermission ? 'opacity-40' : ''}`} />} 
              title="Undo"
              disabled={!hasPermission}
            />
            {!hasPermission && <DisabledTooltip />}
          </div>
          <ToolBtn 
            onClick={handleExport} 
            icon={<Download className="w-5 h-5" />} 
            title="Export as Image"
          />
          {isAdmin && (
            <ToolBtn 
              onClick={handleClearCanvas} 
              icon={<Trash2 className="w-5 h-5 text-red-500" />} 
              title="Clear Canvas"
            />
          )}
        </div>
      </div>

      {/* Colors — permission gated */}
      <div className={`flex flex-col gap-2 px-3 border-r border-border ${!hasPermission ? 'opacity-40 pointer-events-none' : ''}`}>
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 pl-1 hidden sm:block">Color</span>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-6 gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                className={`w-6 h-6 rounded-sm border-2 transition-all ${activeColor === c ? 'border-root ring-2 ring-primary scale-110' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                disabled={!hasPermission}
              />
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-md cursor-pointer border-0 p-0 bg-transparent"
              disabled={!hasPermission}
            />
            <span className="text-[10px] font-mono text-gray-500 uppercase">{activeColor}</span>
          </div>
        </div>
      </div>

      {/* Size — permission gated */}
      <div className={`hidden md:flex flex-col gap-2 px-3 ${!hasPermission ? 'opacity-40 pointer-events-none' : ''}`}>
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 pl-1">Size</span>
        <div className="flex items-center gap-1">
          {SIZES.map(s => (
            <button
              key={s}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${lineWidth === s ? 'bg-primary/20 ring-1 ring-primary/50' : 'hover:bg-surface-elevated'}`}
              onClick={() => setLineWidth(s)}
              disabled={!hasPermission}
            >
              <span className="block bg-gray-300 rounded-full" style={{ width: s, height: s }} />
            </button>
          ))}
        </div>
      </div>

      {/* Permission indicator */}
      {!hasPermission && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[10px] font-bold shrink-0">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Disabled by Admin</span>
        </div>
      )}
    </motion.div>
  );
}

function DisabledTooltip() {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-800 text-gray-300 text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-border shadow-lg z-50">
      <ShieldAlert className="w-3 h-3 inline mr-0.5 text-amber-400" />
      Disabled by Admin
    </div>
  );
}

function ToolBtn({ active, onClick, icon, title, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
        disabled 
          ? 'text-gray-600 bg-transparent border border-transparent cursor-not-allowed'
          : active 
            ? 'bg-primary border border-primary-light text-white shadow-lg shadow-primary/20' 
            : 'text-gray-400 bg-transparent border border-transparent hover:bg-surface-elevated hover:text-white'
      }`}
    >
      {icon}
    </button>
  );
}
