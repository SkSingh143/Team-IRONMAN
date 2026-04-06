// src/hooks/useCanvas.js
import { useRef, useCallback, useEffect } from 'react';
import useUIStore from '../store/uiStore';
import useRoomStore from '../store/roomStore';
import useAuthStore from '../store/authStore';
import { wsManager } from '../utils/wsManager';
import { drawStroke, drawShape } from '../utils/canvasUtils';

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

  // Redraw all elements from store
  const redrawAll = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach(el => {
      if (el.type === 'stroke') {
        drawStroke(ctx, el);
      } else if (el.type === 'shape') {
        drawShape(ctx, el);
      }
    });
  }, [elements, getCtx, canvasRef]);

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
  }, [activeTool, activeColor, lineWidth, canvasTheme]);

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
      const user = useAuthStore.getState().user;
      const username = user ? user.username : 'Anonymous';
      wsManager.send('cursor_move', { x: pos.x, y: pos.y, username }, roomId);
    }

    if (!isDrawing.current) return;

    const ctx = getCtx();
    if (!ctx) return;

    const pts = currentPoints.current;
    
    if (activeTool === 'pen' || activeTool === 'eraser') {
      const lastPt = pts[pts.length - 1];
      const newPt = [pos.x, pos.y];

      // Draw live segment
      drawLiveSegment(ctx, lastPt, newPt);
      pts.push(newPt);
    } else {
      // Shape tools
      const startPt = pts[0];
      const endPt = [pos.x, pos.y];
      pts[1] = endPt;

      redrawAll();
      
      const tempShape = {
        type: 'shape',
        shapeType: activeTool,
        start: startPt,
        end: endPt,
        color: activeColor,
        lineWidth: lineWidth
      };
      drawShape(ctx, tempShape);
    }
  }, [getCtx, getPos, drawLiveSegment, redrawAll, activeTool, activeColor, lineWidth, roomId]);

  const onPointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const pts = currentPoints.current;
    if (pts.length < 2) {
      currentPoints.current = [];
      return;
    }

    const userId = useAuthStore.getState().user?._id;
    let element;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      element = {
        elementId: crypto.randomUUID(),
        type: 'stroke',
        points: pts,
        color: activeColor,
        lineWidth: lineWidth,
        tool: activeTool,
        theme: canvasTheme,
        userId,
      };
    } else {
      if (!pts[1]) {
        currentPoints.current = [];
        return;
      }
      element = {
        elementId: crypto.randomUUID(),
        type: 'shape',
        shapeType: activeTool,
        start: pts[0],
        end: pts[1],
        color: activeColor,
        lineWidth: lineWidth,
        theme: canvasTheme,
        userId,
      };
    }

    // Add to local store
    addElement(element);

    // Emit to server
    wsManager.send('draw', element, roomId);

    currentPoints.current = [];
  }, [activeColor, lineWidth, activeTool, canvasTheme, roomId, addElement]);

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
