import { Menu, Bell, Sun, Moon, Globe } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../../services/settingsService';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/helpers';
import { SUPPORTED_LANGUAGES } from '../../i18n';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { isDark, toggleDark } = useThemeStore();
  const { user } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();

  const { data: notifications, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await settingsService.getNotifications();
      return res.data.data || [];
    },
    refetchInterval: 30000,
  });

  const unread = notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleMarkAllRead = async () => {
    await settingsService.markAllRead();
    refetch();
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Menu Button */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
      >
        <Menu size={20} />
      </button>

      {/* Title */}
      {title && (
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block">{title}</h1>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors text-xs font-medium"
            title="Change Language"
          >
            <Globe size={16} />
            <span className="hidden sm:block">{currentLang.nativeName}</span>
          </button>

          {langOpen && (
            <div className="absolute right-0 top-11 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Language</p>
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700',
                    language === lang.code
                      ? 'text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20'
                      : 'text-slate-700 dark:text-slate-300'
                  )}
                >
                  <span>{lang.nativeName}</span>
                  <span className="text-xs text-slate-400">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setLangOpen(false); }}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 card shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-sm">{t('common.notifications')}</span>
                {unread > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline">
                    {t('common.markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!notifications?.length ? (
                  <p className="text-center text-slate-400 text-sm py-8">{t('common.noData')}</p>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={cn(
                        'px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0',
                        !n.isRead && 'bg-primary-50 dark:bg-primary-900/20'
                      )}
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div
          className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200 dark:border-slate-700 cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-semibold">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.role?.name}</p>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(notifOpen || langOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setLangOpen(false); }} />
      )}
    </header>
  );
}
