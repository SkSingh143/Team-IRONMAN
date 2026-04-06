import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const CURSOR_COLORS = [
  '#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C',
  '#4DABF7', '#9775FA', '#F783AC', '#20C997',
  '#E64980', '#339AF0', '#FF922B', '#51CF66',
];

function getCursorColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export default function CursorOverlay() {
  const cursors = useUIStore(s => s.cursors);
  const myUserId = useAuthStore(s => s.user?._id);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <AnimatePresence>
        {Object.entries(cursors).map(([userId, data]) => {
          if (userId === myUserId) return null;
          const color = getCursorColor(userId);
          
          return (
            <motion.div
              key={userId}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: data.x,
                y: data.y,
                transition: { 
                  type: "spring",
                  stiffness: 800,
                  damping: 35,
                  mass: 0.5
                }
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute pointer-events-none origin-top-left flex flex-col"
            >
              <svg 
                className="w-4 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" 
                viewBox="0 0 16 20" 
                fill={color}
              >
                <path d="M0 0L16 12H8L5.6 19.2L0 0Z" />
              </svg>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.1 } }}
                className="absolute top-[18px] left-[10px] px-1.5 py-[2px] text-[10px] font-bold text-white rounded-md whitespace-nowrap shadow-md whitespace-pre"
                style={{ backgroundColor: color }}
              >
                {data.username || 'User'}
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
