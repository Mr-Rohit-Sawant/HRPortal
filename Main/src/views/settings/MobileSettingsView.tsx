import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, Shield, Type, ClipboardList, Globe, Bug, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn, getInitials } from '../../utils/helpers';

export default function MobileSettingsView() {
  const { canAccess, user } = useAuthStore();
  const navigate = useNavigate();
  const isSuperAdmin = !!user?.isSuperAdmin;

  // On desktop the sidebar handles settings — redirect away
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      navigate('/profile', { replace: true });
    }
  }, [navigate]);

  const settingsItems = [
    ...(canAccess('settings:theme')  ? [{ label: 'Theme',             icon: <Palette size={18} />,     path: '/settings/theme' }]        : []),
    ...(canAccess('settings:roles')  ? [{ label: 'Roles & Permissions',icon: <Shield size={18} />,      path: '/settings/roles' }]        : []),
    ...(canAccess('settings:fonts')  ? [{ label: 'Fonts',             icon: <Type size={18} />,         path: '/settings/fonts' }]        : []),
    ...(canAccess('audit:view')      ? [{ label: 'Audit Logs',        icon: <ClipboardList size={18} />,path: '/settings/audit' }]        : []),
    ...(canAccess('settings:view')   ? [{ label: 'Languages',         icon: <Globe size={18} />,        path: '/settings/languages' }]    : []),
    ...(isSuperAdmin                 ? [{ label: 'Bug Reports',       icon: <Bug size={18} />,          path: '/settings/bug-reports' }]  : []),
  ];

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <button
        onClick={() => navigate('/profile')}
        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all text-left"
      >
        {user?.profilePhoto ? (
          <img
            src={`/uploads/${user.profilePhoto}`}
            alt=""
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white text-base font-semibold flex-shrink-0">
            {getInitials(user?.firstName || '', user?.lastName)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-slate-900 dark:text-white truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.role?.name}</p>
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">View Profile →</p>
        </div>
        <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
      </button>

      {/* Settings Items */}
      {settingsItems.length > 0 && (
        <div>
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            App Settings
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {settingsItems.map((item, idx) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3.5 px-4 py-3.5 transition-colors active:bg-slate-100 dark:active:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40',
                  idx !== 0 && 'border-t border-slate-100 dark:border-slate-700',
                )}
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400">
                  {item.icon}
                </span>
                <span className="flex-1 text-left text-sm font-medium text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
                <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
