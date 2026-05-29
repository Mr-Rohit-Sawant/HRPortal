import { useState, useCallback } from 'react';

const MIN_PX = 280;
const MAX_VW = 0.92; // max 92% of viewport

export function usePanelResize() {
  const [width, setWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);

    const onMove = (ev: MouseEvent) => {
      const maxPx = window.innerWidth * MAX_VW;
      const newW = Math.max(MIN_PX, Math.min(maxPx, window.innerWidth - ev.clientX));
      setWidth(newW);
    };

    const onUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  return {
    panelStyle: width ? { width: `${width}px`, maxWidth: 'none' } : undefined,
    dragHandleProps: { onMouseDown },
    dragging,
  };
}
