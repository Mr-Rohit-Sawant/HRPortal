import { useState, useRef, useEffect, useCallback } from 'react';
import { Bug, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
  const [pos, setPos]         = useState<Pos>(loadPos);
  const [busy, setBusy]       = useState(false); // spinner stays on until modal fully closed
  const [modalOpen, setModalOpen]   = useState(false);
  const [screenshot, setScreenshot] = useState<Blob | null>(null);

  const dragState  = useRef<{ dragging: boolean; moved: boolean }>({ dragging: false, moved: false });
  const btnRef     = useRef<HTMLButtonElement>(null);


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

  const visible = (() => {
    if (!isAuthenticated || !settings) return false;
    if (isSuperAdmin) return !settings.disabledSuperAdmin;
    return !settings.disabledAll;
  })();

  const persist = useCallback((p: Pos) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }, []);

  const captureFrame = async (): Promise<Blob | null> => {
    // Hide the button so it won't appear in the screenshot
    if (btnRef.current) btnRef.current.style.visibility = 'hidden';
    await new Promise(r => setTimeout(r, 60)); // let browser repaint without button

    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { displaySurface: 'browser', frameRate: 1 },
        audio: false,
        preferCurrentTab: true,       // Chrome 107+: auto-selects current tab
        selfBrowserSurface: 'include',
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await new Promise<void>(resolve => { video.onloadedmetadata = () => resolve(); });
      await video.play();
      await new Promise(r => requestAnimationFrame(r));

      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);

      // Stop sharing immediately — removes the browser's "sharing" indicator
      stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());

      return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    } finally {
      if (btnRef.current) btnRef.current.style.visibility = '';
    }
  };

  const handleClick = async () => {
    if (dragState.current.moved) { dragState.current.moved = false; return; }
    if (busy) return; // prevent double-click while report is in progress
    setBusy(true);
    try {
      const blob = await captureFrame();
      setScreenshot(blob);
      setModalOpen(true);
    } catch (err: any) {
      // User cancelled the share dialog — open modal without screenshot
      if (err?.name !== 'NotAllowedError') console.error('Screenshot capture failed', err);
      setScreenshot(null);
      setModalOpen(true);
    }
  };

  // Called when modal is closed (submitted or cancelled) — stop the spinner
  const handleModalClose = () => {
    setModalOpen(false);
    setScreenshot(null);
    setBusy(false);
  };

  // Drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = { dragging: true, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    dragState.current.moved = true;
    setPos({
      right:  Math.max(8, window.innerWidth  - e.clientX - 28),
      bottom: Math.max(8, window.innerHeight - e.clientY - 28),
    });
  };
  const onPointerUp = () => {
    if (dragState.current.dragging) {
      dragState.current.dragging = false;
      setPos(p => { persist(p); return p; });
    }
  };

  useEffect(() => {
    const onResize = () => setPos(p => ({
      right:  Math.min(p.right,  window.innerWidth  - 56),
      bottom: Math.min(p.bottom, window.innerHeight - 56),
    }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!visible) return null;

  return (
    <>
      <button
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        disabled={busy && !modalOpen} // allow click while modal open only to prevent re-entry
        title={busy ? 'Bug report in progress…' : 'Report a bug or suggestion'}
        className="fixed z-[9998] w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-500 text-white shadow-lg flex items-center justify-center transition-colors touch-none select-none"
        style={{ right: pos.right, bottom: pos.bottom }}
      >
        {busy
          ? <Loader2 size={22} className="animate-spin" />
          : <Bug size={22} />}
      </button>

      <BugReportModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        screenshot={screenshot}
      />
    </>
  );
}
