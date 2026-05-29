import React from 'react';

// Renders a single matrix cell spec { shape, count, rot, fill } to a canvas.
// Deliberately a neutral geometric style, distinct from the training stimuli,
// so the assessment format never resembles a trained task.
function drawPrimitive(ctx, shape, x, y, r, rot, fill, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rot || 0) * Math.PI / 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  } else if (shape === 'square') {
    ctx.rect(-r, -r, r * 2, r * 2);
  } else if (shape === 'triangle') {
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.92, r * 0.8); ctx.lineTo(-r * 0.92, r * 0.8); ctx.closePath();
  } else if (shape === 'diamond') {
    ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath();
  }
  if (fill === 'solid') ctx.fill(); else ctx.stroke();
  ctx.restore();
}

export default function CellCanvas({ cell, size = 96, color = '#c7d2fe', empty = false, question = false }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    if (question) {
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.font = `bold ${size * 0.5}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', size / 2, size / 2 + 2);
      return;
    }
    if (empty || !cell) return;
    const n = cell.count || 1;
    const r = size * (n >= 3 ? 0.12 : n === 2 ? 0.15 : 0.2);
    const cy = size / 2;
    const positions = n === 1 ? [size / 2]
      : n === 2 ? [size * 0.33, size * 0.67]
      : [size * 0.24, size * 0.5, size * 0.76];
    positions.forEach(px => drawPrimitive(ctx, cell.shape, px, cy, r, cell.rot, cell.fill, color));
  }, [cell, size, color, empty, question]);
  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} />;
}
