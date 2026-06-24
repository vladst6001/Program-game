import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore, EditorObject } from '../../store/editorStore';

export default function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objects = useEditorStore((s) => s.objects);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const selectObject = useEditorStore((s) => s.selectObject);
  const updateObject = useEditorStore((s) => s.updateObject);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const gridSize = 30;

    ctx.strokeStyle = '#252532';
    ctx.lineWidth = 0.5;
    for (let x = cx % gridSize; x < rect.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = cy % gridSize; y < rect.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#353548';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, rect.height);
    ctx.moveTo(0, cy);
    ctx.lineTo(rect.width, cy);
    ctx.stroke();

    const drawSize = 60;

    for (const obj of objects) {
      if (!obj.visible) continue;
      const x = cx + obj.position[0] * gridSize;
      const y = cy - obj.position[1] * gridSize;
      const w = drawSize * obj.scale[0];
      const h = drawSize * obj.scale[1];
      const isSelected = obj.id === selectedObjectId;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-obj.rotation[2]);
      ctx.fillStyle = obj.color;
      ctx.globalAlpha = 0.8;

      if (obj.type === 'cube' || obj.type === 'group') {
        ctx.fillRect(-w / 2, -h / 2, w, h);
      } else if (obj.type === 'sphere') {
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'cylinder') {
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.beginPath();
        ctx.ellipse(0, -h / 2, w / 2, h / 6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'plane') {
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }

      ctx.globalAlpha = 1;

      if (isSelected) {
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
        ctx.setLineDash([]);
      }

      ctx.restore();
    }
  }, [objects, selectedObjectId]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const gridSize = 30;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: string | null = null;
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (!obj.visible) continue;
      const x = cx + obj.position[0] * gridSize;
      const y = cy - obj.position[1] * gridSize;
      const w = 60 * obj.scale[0];
      const h = 60 * obj.scale[1];
      if (mx >= x - w / 2 && mx <= x + w / 2 && my >= y - h / 2 && my <= y + h / 2) {
        found = obj.id;
        break;
      }
    }
    selectObject(found);
  };

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedObjectId || e.buttons !== 1) return;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const gridSize = 30;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const newX = Math.round((mx - cx) / gridSize * 4) / 4;
      const newY = Math.round((cy - my) / gridSize * 4) / 4;
      updateObject(selectedObjectId, { position: [newX, newY, 0] });
    },
    [selectedObjectId, updateObject]
  );

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      onClick={handleClick}
      onMouseMove={handleDrag}
    />
  );
}
