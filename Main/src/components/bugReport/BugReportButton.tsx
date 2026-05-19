import { useState, useRef, useEffect, useCallback } from 'react';
import { Bug, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { bugReportService } from '../../services/bugReportService';
import { useAuthStore } from '../../stores/authStore';
import BugReportModal from './BugReportModal';

const STORAGE_KEY = 'bugReportButtonPos';
const DEFAULT_POS = { right: 24, bottom: 80 };

interface Pos { right: number; bottom: number; }

function loadPos(): Pos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_POS;
}

export default function BugReportButton() {
  const { user, isAuthenticated } = useAuthStore();
  const [pos, setPos] = useState<Pos>(loadPos);
  const [capturing, setCapturing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<Blob | null>(null);

  const dragState = useRef<{ dragging: boolean; moved: boolean }>({ dragging: false, moved: false });

  const { data: settings } = useQuery({
    queryKey: ['bug-report-settings'],
    queryFn: async () => {
      const res = await bugReportService.getSettings();
      return res.data.data as { disabledAll: boolean; disabledSuperAdmin: boolean };
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const isSuperAdmin = !!user?.isSuperAdmin;

  // Visibility logic
  const visible = (() => {
    if (!isAuthenticated || !settings) return false;
    if (isSuperAdmin) return !settings.disabledSuperAdmin;
    return !settings.disabledAll;
  })();

  const persist = useCallback((p: Pos) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = { dragging: true, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    dragState.current.moved = true;
    const right = Math.max(8, window.innerWidth - e.clientX - 28);
    const bottom = Math.max(8, window.innerHeight - e.clientY - 28);
    setPos({ right, bottom });
  };

  const onPointerUp = () => {
    if (dragState.current.dragging) {
      dragState.current.dragging = false;
      setPos((p) => { persist(p); return p; });
    }
  };

  const handleClick = async () => {
    if (dragState.current.moved) { dragState.current.moved = false; return; }
    setCapturing(true);
    try {
      const canvas = await html2canvas(document.body, { logging: false, useCORS: true });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      setScreenshot(blob);
    } catch {
      setScreenshot(null);
    } finally {
      setCapturing(false);
      setModalOpen(true);
    }
  };

  useEffect(() => {
    const onResize = () => setPos((p) => ({
      right: Math.min(p.right, window.innerWidth - 56),
      bottom: Math.min(p.bottom, window.innerHeight - 56),
    }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!visible) return null;

  return (
    <>
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        title="Report a bug or suggestion"
        className="fixed z-[9998] w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center transition-colors touch-none select-none"
        style={{ right: pos.right, bottom: pos.bottom }}
      >
        {capturing ? <Loader2 size={22} className="animate-spin" /> : <Bug size={22} />}
      </button>

      <BugReportModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setScreenshot(null); }}
        screenshot={screenshot}
      />
    </>
  );
}
