import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const CURSOR_COLORS = [
  '#C97B63', '#D4A373', '#E6B566', '#6B705C',
  '#B08968', '#7F5539', '#9C6644', '#2D6A4F',
  '#A8A29E', '#DDB892', '#BC6C25', '#ADC178',
];

function getCursorColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

function getDisplayName(username) {
  const trimmed = username?.trim();
  if (!trimmed) return 'User';
  return trimmed.length > 18 ? `${trimmed.slice(0, 18)}...` : trimmed;
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
          const displayName = getDisplayName(data.username);
          
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.1 } }}
                className="absolute left-[12px] top-[16px] flex items-center gap-1 rounded-full border border-white/15 px-2 py-1 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.28)] whitespace-nowrap"
                style={{ backgroundColor: color }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/90 shrink-0" />
                <span className="max-w-36 truncate">{displayName}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
