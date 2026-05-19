import { useRef, useEffect, useState, useCallback } from 'react';
import {
  X, Pencil, Highlighter, ArrowUpRight, Square, Minus, Plus,
  Undo2, Trash2, Check,
} from 'lucide-react';
import { cn } from '../../utils/helpers';

type Tool = 'pencil' | 'highlight' | 'arrow' | 'rect';

const PRESET_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#000000', '#FFFFFF'];

interface Props {
  imageSrc: string;
  onSave: (blob: Blob) => void;
  onClose: () => void;
}

export default function ScreenshotAnnotator({ imageSrc, onSave, onClose }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement | null>(null);

  const [tool, setTool]         = useState<Tool>('pencil');
  const [color, setColor]       = useState('#EF4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory]   = useState<ImageData[]>([]);

  const isDrawing  = useRef(false);
  const startPos   = useRef({ x: 0, y: 0 });
  const snapshot   = useRef<ImageData | null>(null); // for live preview of shapes

  // Load image onto canvas, fit to container
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      const container = containerRef.current!;
      const maxW = container.clientWidth;
      const maxH = container.clientHeight;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = 'touches' in e ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  };

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    setHistory(h => [...h, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  const undo = () => {
    if (!history.length) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory(h => h.slice(0, -1));
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    saveHistory();
    ctx.drawImage(imgRef.current!, 0, 0, canvas.width, canvas.height);
  };

  const applyStyle = (ctx: CanvasRenderingContext2D, alpha = 1) => {
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = lineWidth;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = alpha;
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const angle   = Math.atan2(y2 - y1, x2 - x1);
    const headLen = Math.max(14, lineWidth * 4);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    isDrawing.current = true;
    startPos.current  = pos;
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    saveHistory();
    snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (tool === 'pencil') {
      applyStyle(ctx);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const pos    = getPos(e);
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    if (tool === 'pencil') {
      applyStyle(ctx);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      return;
    }

    // For shapes: restore snapshot, then draw live preview
    ctx.putImageData(snapshot.current!, 0, 0);
    const { x: sx, y: sy } = startPos.current;

    if (tool === 'highlight') {
      applyStyle(ctx, 0.3);
      ctx.fillRect(sx, sy, pos.x - sx, pos.y - sy);
    } else if (tool === 'rect') {
      applyStyle(ctx);
      ctx.beginPath();
      ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
    } else if (tool === 'arrow') {
      applyStyle(ctx);
      drawArrow(ctx, sx, sy, pos.x, pos.y);
    }
  };

  const onMouseUp = () => { isDrawing.current = false; snapshot.current = null; };

  const handleSave = () => {
    canvasRef.current!.toBlob(blob => { if (blob) onSave(blob); }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-[20000] bg-black/80 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-700 flex-shrink-0 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {([
            { id: 'pencil',    icon: <Pencil size={15} />,       title: 'Pencil' },
            { id: 'highlight', icon: <Highlighter size={15} />,  title: 'Highlight' },
            { id: 'arrow',     icon: <ArrowUpRight size={15} />, title: 'Arrow' },
            { id: 'rect',      icon: <Square size={15} />,       title: 'Rectangle' },
          ] as { id: Tool; icon: React.ReactNode; title: string }[]).map(t => (
            <button
              key={t.id}
              title={t.title}
              onClick={() => setTool(t.id)}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                tool === t.id
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >{t.icon}</button>
          ))}
        </div>

        {/* Color presets */}
        <div className="flex items-center gap-1">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn('w-5 h-5 rounded-full border-2 transition-transform', color === c ? 'border-white scale-125' : 'border-transparent')}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            title="Custom colour"
          />
        </div>

        {/* Stroke width */}
        <div className="flex items-center gap-1 ml-1">
          <button onClick={() => setLineWidth(w => Math.max(1, w - 1))} className="p-1 text-slate-400 hover:text-white"><Minus size={12} /></button>
          <span className="text-xs text-slate-300 w-4 text-center">{lineWidth}</span>
          <button onClick={() => setLineWidth(w => Math.min(20, w + 1))} className="p-1 text-slate-400 hover:text-white"><Plus size={12} /></button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={undo} disabled={!history.length} title="Undo" className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40">
            <Undo2 size={13} /> Undo
          </button>
          <button onClick={clear} title="Reset to original" className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-md bg-slate-800 text-slate-300 hover:text-red-400">
            <Trash2 size={13} /> Reset
          </button>
          <button onClick={onClose} className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-md bg-slate-700 text-slate-300 hover:text-white">
            <X size={13} /> Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-primary-600 text-white hover:bg-primary-700 font-medium">
            <Check size={13} /> Done
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <canvas
          ref={canvasRef}
          style={{ cursor: tool === 'pencil' ? 'crosshair' : 'crosshair', maxWidth: '100%', maxHeight: '100%', display: 'block' }}
          className="shadow-2xl rounded"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
      </div>

      {/* Hint */}
      <div className="text-center text-xs text-slate-500 pb-2">
        {tool === 'pencil' && 'Draw freely on the screenshot'}
        {tool === 'highlight' && 'Drag to highlight an area'}
        {tool === 'arrow' && 'Drag to draw an arrow'}
        {tool === 'rect' && 'Drag to draw a rectangle'}
      </div>
    </div>
  );
}
