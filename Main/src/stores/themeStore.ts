import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  fontFamily: string;
  appName: string;
  appLogo: string;
  appFavicon: string;
  mobileTabBar: boolean;
  toggleDark: () => void;
  setTheme: (settings: Partial<Omit<ThemeState, 'toggleDark' | 'setTheme' | 'applyTheme'>>) => void;
  applyTheme: () => void;
}

function hexToRgb(hex: string) {
  const h = (hex || '#1E40AF').replace('#', '').padEnd(6, '0');
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      primaryColor: '#1E40AF',
      accentColor: '#3B82F6',
      sidebarColor: '#0F172A',
      fontFamily: 'Inter',
      appName: 'HR Recruitment System',
      appLogo: '',
      appFavicon: '',
      mobileTabBar: true,

      toggleDark: () => {
        set((s) => ({ isDark: !s.isDark }));
        get().applyTheme();
      },

      setTheme: (settings) => {
        set(settings);
        get().applyTheme();
      },

      applyTheme: () => {
        const { isDark, primaryColor, sidebarColor, fontFamily, appFavicon, appName } = get();

        // Update browser tab title
        if (appName) document.title = appName;

        // Update favicon dynamically
        if (appFavicon) {
          const faviconUrl = `/${appFavicon}?t=${Date.now()}`;
          let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
          link.type = appFavicon.endsWith('.svg') ? 'image/svg+xml' : appFavicon.endsWith('.ico') ? 'image/x-icon' : 'image/png';
        }
        const root = document.documentElement;

        // Dark mode
        isDark ? root.classList.add('dark') : root.classList.remove('dark');

        // Font
        const ff = `'${fontFamily}', system-ui, sans-serif`;
        document.body.style.fontFamily = ff;
        root.style.setProperty('--font-family', ff);

        // Sidebar colour used by Sidebar component inline style
        root.style.setProperty('--sidebar', sidebarColor);

        // Parse the primary hex
        const { r, g, b } = hexToRgb(primaryColor);

        // Build shade list: [shade, r, g, b]
        type Shade = [string, number, number, number];
        const mix = (rt: number): [number, number, number] => [
          Math.round(r + (255 - r) * rt),
          Math.round(g + (255 - g) * rt),
          Math.round(b + (255 - b) * rt),
        ];
        const dk = (rt: number): [number, number, number] => [
          Math.round(r * rt), Math.round(g * rt), Math.round(b * rt),
        ];
        const shades: Shade[] = [
          ['50',  ...mix(0.95)],
          ['100', ...mix(0.88)],
          ['200', ...mix(0.75)],
          ['300', ...mix(0.55)],
          ['400', ...mix(0.30)],
          ['500', ...mix(0.10)],
          ['600', r, g, b],
          ['700', ...dk(0.85)],
          ['800', ...dk(0.70)],
          ['900', ...dk(0.55)],
          ['950', ...dk(0.40)],
        ];

        const lines: string[] = [];

        for (const [shade, sr, sg, sb] of shades) {
          const rgb = `${sr}, ${sg}, ${sb}`;
          // Base utilities
          lines.push(`.bg-primary-${shade} { background-color: rgb(${rgb}) !important; }`);
          lines.push(`.text-primary-${shade} { color: rgb(${rgb}) !important; }`);
          lines.push(`.border-primary-${shade} { border-color: rgb(${rgb}) !important; }`);
          lines.push(`.ring-primary-${shade} { --tw-ring-color: rgb(${rgb}) !important; }`);
          lines.push(`.from-primary-${shade} { --tw-gradient-from: rgb(${rgb}) !important; }`);
          lines.push(`.to-primary-${shade} { --tw-gradient-to: rgb(${rgb}) !important; }`);
          // Hover
          lines.push(`.hover\\:bg-primary-${shade}:hover { background-color: rgb(${rgb}) !important; }`);
          lines.push(`.hover\\:text-primary-${shade}:hover { color: rgb(${rgb}) !important; }`);
          lines.push(`.hover\\:border-primary-${shade}:hover { border-color: rgb(${rgb}) !important; }`);
          // Focus
          lines.push(`.focus\\:ring-primary-${shade}:focus { --tw-ring-color: rgb(${rgb}) !important; }`);
          // Dark variants (inside .dark scope)
          lines.push(`.dark .dark\\:bg-primary-${shade} { background-color: rgb(${rgb}) !important; }`);
          lines.push(`.dark .dark\\:text-primary-${shade} { color: rgb(${rgb}) !important; }`);
          lines.push(`.dark .dark\\:border-primary-${shade} { border-color: rgb(${rgb}) !important; }`);
          // Opacity slash variants used like bg-primary-600/20
          // Tailwind generates class name `bg-primary-600\/20` (with escaped slash)
          for (const op of [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80]) {
            const alpha = (op / 100).toFixed(2);
            lines.push(`.bg-primary-${shade}\\/${op} { background-color: rgba(${rgb}, ${alpha}) !important; }`);
            lines.push(`.dark .dark\\:bg-primary-${shade}\\/${op} { background-color: rgba(${rgb}, ${alpha}) !important; }`);
            lines.push(`.text-primary-${shade}\\/${op} { color: rgba(${rgb}, ${alpha}) !important; }`);
          }
        }

        // Inject / update the dynamic style element
        let el = document.getElementById('hr-dynamic-theme') as HTMLStyleElement | null;
        if (!el) {
          el = document.createElement('style');
          el.id = 'hr-dynamic-theme';
          document.head.appendChild(el);
        }
        el.textContent = lines.join('\n');
      },
    }),
    { name: 'hr-theme' }
  )
);
