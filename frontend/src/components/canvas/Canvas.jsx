import { useRef } from 'react';
import { useCanvas } from '../../hooks/useCanvas';

export default function Canvas() {
  const canvasRef = useRef(null);
  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  } = useCanvas(canvasRef);

  return (
    <div className="relative w-full h-full overflow-hidden bg-root">
      <canvas
        ref={canvasRef}
        className="block cursor-crosshair bg-root"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
