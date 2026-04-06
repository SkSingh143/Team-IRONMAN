import { useRef, useEffect } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import useThemeStore from '../../store/useThemeStore';

export default function Canvas() {
  const canvasRef = useRef(null);
  const theme = useThemeStore(s => s.theme);
  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  } = useCanvas(canvasRef);

  // Center exactly in the middle of the 5000x5000 canvas on mount
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 2500 - window.innerHeight / 2;
      containerRef.current.scrollLeft = 2500 - window.innerWidth / 2;
    }
  }, []);

  const isLight = theme === 'light';
  const gridColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const bgColor = isLight ? '#FFFFFF' : '#050505';

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-auto hide-scrollbar"
      style={{ backgroundColor: bgColor }}
    >
      <div 
        className="relative" 
        style={{ 
          width: '5000px', 
          height: '5000px',
          backgroundImage: `radial-gradient(circle, ${gridColor} 1.5px, transparent 1.5px)`,
          backgroundSize: '30px 30px',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  );
}
