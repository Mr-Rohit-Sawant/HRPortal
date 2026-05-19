import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppRouter from './routes/AppRouter';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { authService } from './services/authService';
import { settingsService } from './services/settingsService';
import InstallPrompt from './components/common/InstallPrompt';

export default function App() {
  const { setUser, setLoading } = useAuthStore();
  const { applyTheme, setTheme } = useThemeStore();

  // Load server-side theme settings so all users see the same theme
  useQuery({
    queryKey: ['app-settings-global'],
    queryFn: async () => {
      try {
        const res = await settingsService.getSettings();
        const s = res.data.data;
        if (s) {
          setTheme({
            appName: s.appName,
            appLogo: s.logo,
            appFavicon: s.favicon,
            primaryColor: s.primaryColor,
            sidebarColor: s.sidebarColor,
            fontFamily: s.fontFamily,
          });
        }
        return s;
      } catch { return null; }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await authService.getMe();
        setUser(res.data.data!);
        return res.data.data;
      } catch {
        setUser(null);
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppRouter />
      <InstallPrompt />
    </>
  );
}
