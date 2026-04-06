import useUIStore from '../../store/uiStore';
import useRoomStore from '../../store/roomStore';
import useAuthStore from '../../store/authStore';
import { wsManager } from '../../utils/wsManager';
import { motion } from 'framer-motion';
import { PenTool, Eraser, Undo, Moon, Sun, Trash2 } from 'lucide-react';

const PRESET_COLORS = [
  '#FFFFFF', '#FF6B6B', '#FFA94D', '#FFD43B',
  '#69DB7C', '#4DABF7', '#9775FA', '#F783AC',
  '#868E96', '#20C997', '#339AF0', '#E64980',
];

const SIZES = [2, 4, 6, 8, 12, 16];

export default function Toolbar() {
  const { activeTool, activeColor, lineWidth, canvasTheme, setTool, setColor, setLineWidth, toggleTheme } = useUIStore();
  const undoElement = useRoomStore(s => s.undoElement);
  const roomId = useRoomStore(s => s.roomId);
  const members = useRoomStore(s => s.members);
  const myUserId = useAuthStore(s => s.user?._id);
  const isAdmin = members.find(m => m.userId === myUserId)?.role === 'admin';

  const handleUndo = () => {
    undoElement(myUserId, wsManager);
  };

  const handleClearCanvas = () => {
    wsManager.send('clear_canvas', {}, roomId);
    // clear immediately locally
    useRoomStore.getState().setElements([]);
  };

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 p-3 bg-surface/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-20 max-w-[95vw] overflow-x-auto hide-scrollbar"
    >
      {/* Board Theme */}
      <div className="flex flex-col items-center justify-center px-2 border-r border-border shrink-0">
         <ToolBtn 
            onClick={toggleTheme} 
            icon={canvasTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />} 
            title="Toggle Board Theme"
          />
      </div>

      {/* Tools */}
      <div className="flex flex-col gap-2 px-3 border-r border-border shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 pl-1">Tool</span>
        <div className="flex gap-1">
          <ToolBtn 
            active={activeTool === 'pen'} 
            onClick={() => setTool('pen')} 
            icon={<PenTool className="w-5 h-5" />} 
          />
          <ToolBtn 
            active={activeTool === 'eraser'} 
            onClick={() => setTool('eraser')} 
            icon={<Eraser className="w-5 h-5" />} 
          />
          <div className="w-px bg-border mx-1" />
          <ToolBtn 
            onClick={handleUndo} 
            icon={<Undo className="w-5 h-5" />} 
            title="Undo"
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

      {/* Colors */}
      <div className="flex flex-col gap-2 px-3 border-r border-border">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 pl-1 hidden sm:block">Color</span>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-6 gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                className={`w-6 h-6 rounded-sm border-2 transition-all ${activeColor === c ? 'border-root ring-2 ring-primary scale-110' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-md cursor-pointer border-0 p-0 bg-transparent"
            />
            <span className="text-[10px] font-mono text-gray-500 uppercase">{activeColor}</span>
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="hidden md:flex flex-col gap-2 px-3">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 pl-1">Size</span>
        <div className="flex items-center gap-1">
          {SIZES.map(s => (
            <button
              key={s}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${lineWidth === s ? 'bg-primary/20 ring-1 ring-primary/50' : 'hover:bg-surface-elevated'}`}
              onClick={() => setLineWidth(s)}
            >
              <span className="block bg-gray-300 rounded-full" style={{ width: s, height: s }} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ToolBtn({ active, onClick, icon, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-primary border border-primary-light text-white shadow-lg shadow-primary/20' : 'text-gray-400 bg-transparent border border-transparent hover:bg-surface-elevated hover:text-white'}`}
    >
      {icon}
    </button>
  );
}
