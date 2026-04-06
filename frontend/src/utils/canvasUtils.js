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

export const exportAsImage = (elements, canvasTheme) => {
  if (elements.length === 0) {
    alert("Canvas is empty");
    return;
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  elements.forEach(el => {
    if (el.points) {
      el.points.forEach(p => {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      });
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
  });

  const dataUrl = tempCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `livecollab-export-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
