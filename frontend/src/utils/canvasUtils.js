export const drawStroke = (ctx, stroke) => {
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
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i][0] + pts[i + 1][0]) / 2;
      const midY = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0], last[1]);
  }

  ctx.stroke();
  ctx.restore();
};

export const drawShape = (ctx, shape) => {
  if (!shape.start || !shape.end) return;

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'source-over';

  const [startX, startY] = shape.start;
  const [endX, endY] = shape.end;

  if (shape.shapeType === 'rect') {
    const width = endX - startX;
    const height = endY - startY;
    ctx.rect(startX, startY, width, height);
  } else if (shape.shapeType === 'circle') {
    const radius = Math.hypot(endX - startX, endY - startY);
    ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
  } else if (shape.shapeType === 'star') {
    const radius = Math.hypot(endX - startX, endY - startY);
    const spikes = 5;
    const innerRadius = radius / 2;
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    
    ctx.moveTo(startX, startY - radius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(startX + Math.cos(rot) * radius, startY + Math.sin(rot) * radius);
      rot += step;
      ctx.lineTo(startX + Math.cos(rot) * innerRadius, startY + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.lineTo(startX, startY - radius);
    ctx.closePath();
  }

  ctx.stroke();
  ctx.restore();
};

export const exportAsImage = (elements, canvasTheme) => {
  if (elements.length === 0) {
    alert("Canvas is empty");
    return;
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  elements.forEach(el => {
    if (el.type === 'stroke' && el.points) {
      el.points.forEach(p => {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      });
    } else if (el.type === 'shape' && el.start && el.end) {
      if (el.shapeType === 'rect') {
        const x1 = Math.min(el.start[0], el.end[0]);
        const x2 = Math.max(el.start[0], el.end[0]);
        const y1 = Math.min(el.start[1], el.end[1]);
        const y2 = Math.max(el.start[1], el.end[1]);
        if (x1 < minX) minX = x1;
        if (x2 > maxX) maxX = x2;
        if (y1 < minY) minY = y1;
        if (y2 > maxY) maxY = y2;
      } else {
        const r = Math.hypot(el.end[0] - el.start[0], el.end[1] - el.start[1]);
        const [cx, cy] = el.start;
        if (cx - r < minX) minX = cx - r;
        if (cx + r > maxX) maxX = cx + r;
        if (cy - r < minY) minY = cy - r;
        if (cy + r > maxY) maxY = cy + r;
      }
    }
  });

  const padding = 50;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');

  tempCtx.fillStyle = canvasTheme === 'light' ? '#F8F9FA' : '#0B0D17';
  tempCtx.fillRect(0, 0, width, height);
  tempCtx.translate(-minX + padding, -minY + padding);
  
  elements.forEach(el => {
    if (el.type === 'stroke') drawStroke(tempCtx, el);
    if (el.type === 'shape') drawShape(tempCtx, el);
  });

  const dataUrl = tempCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `livecollab-export-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
