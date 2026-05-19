import { useEffect, useState } from 'react';
import { X, Share, Plus } from 'lucide-react';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

function isMobile() {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const diff = Date.now() - Number(ts);
    return diff < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch { return false; }
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile() || isStandalone() || wasDismissedRecently()) return;

    if (isIOS()) {
      setIsIOSDevice(true);
      setTimeout(() => { setShow(true); setTimeout(() => setVisible(true), 50); }, 2000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => { setShow(true); setTimeout(() => setVisible(true), 50); }, 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setShow(false), 350);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-none"
      aria-live="polite"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={dismiss}
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-sm mx-4 mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl pointer-events-auto transition-all duration-350 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-500" />

        <div className="p-5">
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
              HR
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">HR Recruitment System</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add to your home screen</p>
            </div>
          </div>

          {isIOSDevice ? (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Install this app on your iPhone for quick access — works just like a native app.
              </p>

              {/* iOS Steps */}
              <div className="space-y-2.5 mb-4">
                <Step num={1} icon={<Share size={14} className="text-blue-500" />}>
                  Tap the <strong>Share</strong> button{' '}
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 ml-0.5 align-middle">
                    <Share size={11} className="text-slate-500" />
                  </span>{' '}
                  in Safari's toolbar
                </Step>
                <Step num={2} icon={<Plus size={14} className="text-blue-500" />}>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </Step>
                <Step num={3} icon={<span className="text-blue-500 font-bold text-xs">✓</span>}>
                  Tap <strong>"Add"</strong> to confirm
                </Step>
              </div>

              <button
                onClick={dismiss}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Maybe later
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Install this app on your device for quick access — no app store needed.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={dismiss}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Not now
                </button>
                <button
                  onClick={install}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                >
                  Install App
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ num, icon, children }: { num: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{num}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{children}</p>
    </div>
  );
}
