// src/hooks/useCanvas.js
import { useRef, useCallback, useEffect } from 'react';
import useUIStore from '../store/uiStore';
import useRoomStore from '../store/roomStore';
import useAuthStore from '../store/authStore';
import { wsManager } from '../utils/wsManager';

export function useCanvas(canvasRef) {
  const isDrawing = useRef(false);
  const currentPoints = useRef([]);
  const lastCursorEmit = useRef(0);

  const activeTool = useUIStore(s => s.activeTool);
  const activeColor = useUIStore(s => s.activeColor);
  const canvasTheme = useUIStore(s => s.canvasTheme);
  const lineWidth = useUIStore(s => s.lineWidth);
  const elements = useRoomStore(s => s.elements);
  const roomId = useRoomStore(s => s.roomId);
  const addElement = useRoomStore(s => s.addElement);

  // Get canvas 2D context
  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext('2d');
  }, [canvasRef]);

  // Get mouse/touch position relative to canvas without double DPR scaling
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left),
      y: (clientY - rect.top),
    };
  }, [canvasRef]);

  // Draw a single stroke on the canvas
  const drawStroke = useCallback((ctx, stroke) => {
    if (!stroke.points || stroke.points.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = stroke.tool === 'eraser' 
      ? (stroke.theme === 'light' ? '#F8F9FA' : '#0B0D17') 
      : stroke.color;
    ctx.lineWidth = stroke.tool === 'eraser' ? stroke.lineWidth * 3 : stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';

    const pts = stroke.points;
    ctx.moveTo(pts[0][0], pts[0][1]);

    if (pts.length === 2) {
      ctx.lineTo(pts[1][0], pts[1][1]);
    } else {
      // Smooth curve through points
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i][0] + pts[i + 1][0]) / 2;
        const midY = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], midX, midY);
      }
      // Last point
      const last = pts[pts.length - 1];
      ctx.lineTo(last[0], last[1]);
    }

    ctx.stroke();
    ctx.restore();
  }, []);

  // Redraw all elements from store
  const redrawAll = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach(el => {
      if (el.type === 'stroke') {
        drawStroke(ctx, el);
      }
    });
  }, [elements, getCtx, canvasRef, drawStroke]);

  // Redraw when elements change
  useEffect(() => {
    redrawAll();
  }, [elements, redrawAll]);

  // Setup massive scrollable canvas sizing
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 5000;
    const h = 5000;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Redraw after resize
    redrawAll();
  }, [canvasRef, redrawAll]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Draw live segment (while user is drawing, before emitting)
  const drawLiveSegment = useCallback((ctx, from, to) => {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = activeTool === 'eraser' 
      ? (canvasTheme === 'light' ? '#F8F9FA' : '#0B0D17') 
      : activeColor;
    ctx.lineWidth = activeTool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
    ctx.restore();
  }, [activeTool, activeColor, lineWidth]);

  // --- Pointer Event Handlers ---

  const onPointerDown = useCallback((e) => {
    const ctx = getCtx();
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getPos(e);
    currentPoints.current = [[pos.x, pos.y]];
  }, [getCtx, getPos]);

  const onPointerMove = useCallback((e) => {
    const pos = getPos(e);

    // Emit cursor position (throttled 50ms)
    const now = Date.now();
    if (now - lastCursorEmit.current > 50) {
      lastCursorEmit.current = now;
      wsManager.send('cursor_move', { x: pos.x, y: pos.y }, roomId);
    }

    if (!isDrawing.current) return;

    const ctx = getCtx();
    if (!ctx) return;

    const pts = currentPoints.current;
    const lastPt = pts[pts.length - 1];
    const newPt = [pos.x, pos.y];

    // Draw live segment
    drawLiveSegment(ctx, lastPt, newPt);
    currentPoints.current.push(newPt);
  }, [getCtx, getPos, drawLiveSegment, roomId]);

  const onPointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const pts = currentPoints.current;
    if (pts.length < 2) {
      currentPoints.current = [];
      return;
    }

    const userId = useAuthStore.getState().user?._id;
    const element = {
      elementId: crypto.randomUUID(),
      type: 'stroke',
      points: pts,
      color: activeColor,
      lineWidth: lineWidth,
      tool: activeTool,
      theme: canvasTheme,
      userId,
    };

    // Add to local store
    addElement(element);

    // Emit to server
    wsManager.send('draw', element, roomId);

    currentPoints.current = [];
  }, [activeColor, lineWidth, activeTool, roomId, addElement]);

  const onPointerLeave = useCallback(() => {
    if (isDrawing.current) {
      onPointerUp();
    }
  }, [onPointerUp]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    resizeCanvas,
    redrawAll,
  };
}
