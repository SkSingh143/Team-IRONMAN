// src/components/canvas/CursorOverlay.jsx
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import '../../styles/canvas.css';

// Color palette for different users' cursors
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
    <div className="cursor-overlay" id="cursor-overlay">
      {Object.entries(cursors).map(([userId, data]) => {
        // Skip own cursor
        if (userId === myUserId) return null;

        const color = getCursorColor(userId);
        return (
          <div
            key={userId}
            className="remote-cursor"
            style={{
              left: data.x + 'px',
              top: data.y + 'px',
            }}
          >
            {/* Cursor arrow */}
            <svg
              className="cursor-icon"
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill={color}
            >
              <path d="M0 0L16 12H8L5.6 19.2L0 0Z" />
            </svg>
            {/* Name label */}
            <span
              className="cursor-label"
              style={{ backgroundColor: color }}
            >
              {data.username || 'User'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
