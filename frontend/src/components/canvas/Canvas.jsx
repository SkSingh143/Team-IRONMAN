// src/components/canvas/Canvas.jsx
import { useRef } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import '../../styles/canvas.css';

export default function Canvas() {
  const canvasRef = useRef(null);
  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  } = useCanvas(canvasRef);

  return (
    <div className="canvas-container" id="canvas-container">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        id="drawing-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
