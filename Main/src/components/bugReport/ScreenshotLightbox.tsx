import { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface BugFile { url: string; mimeType?: string; originalName?: string; }

interface Props {
  images: BugFile[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ScreenshotLightbox({ images, initialIndex = 0, onClose }: Props) {
  const [index, setIndex]   = useState(initialIndex);
  const [scale, setScale]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetView = useCallback(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, []);

  const prev = useCallback(() => { setIndex(i => (i - 1 + images.length) % images.length); resetView(); }, [images.length, resetView]);
  const next = useCallback(() => { setIndex(i => (i + 1) % images.length); resetView(); }, [images.length, resetView]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')       onClose();
      if (e.key === 'ArrowLeft')    prev();
      if (e.key === 'ArrowRight')   next();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 4));
      if (e.key === '-')            setScale(s => Math.max(s - 0.25, 0.25));
      if (e.key === '0')            resetView();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next, resetView]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.min(Math.max(s + delta, 0.25), 4));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[10001] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white/60 text-sm">
          {images.length > 1 && `${index + 1} / ${images.length} — `}
          {current.originalName || `Screenshot ${index + 1}`}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(s - 0.25, 0.25))} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"><ZoomOut size={16} /></button>
          <button onClick={resetView} className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors">{Math.round(scale * 100)}%</button>
          <button onClick={() => setScale(s => Math.min(s + 0.25, 4))} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"><ZoomIn size={16} /></button>
          <button onClick={resetView} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"><RotateCcw size={16} /></button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"><X size={16} /></button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={current.url}
          alt={current.originalName || 'screenshot'}
          draggable={false}
          className="max-w-none select-none"
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transition: dragging ? 'none' : 'transform 0.15s ease',
            maxHeight: '100%',
            maxWidth: scale <= 1 ? '100%' : 'none',
          }}
        />
      </div>

      {/* Prev/Next */}
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          ><ChevronLeft size={22} /></button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          ><ChevronRight size={22} /></button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="flex items-center justify-center gap-2 py-3 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setIndex(i); resetView(); }}
              className={cn('w-12 h-9 rounded overflow-hidden border-2 transition-all', i === index ? 'border-primary-400 opacity-100' : 'border-white/20 opacity-50 hover:opacity-80')}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Keyboard hint */}
      <div className="text-center pb-3 text-white/30 text-[11px] flex-shrink-0">
        ← → navigate · scroll to zoom · 0 reset · Esc close
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
