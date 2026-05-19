import { NavLink, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, Briefcase, FileText, Building2,
  Receipt, Settings, LogOut, ChevronDown, ChevronRight,
  Palette, Shield, Type, ClipboardList, X, Globe, Bug,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { authService } from '../../services/authService';
import { cn, getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface SidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, collapsed, onClose }: SidebarProps) {
  const { user, canAccess, logout } = useAuthStore();
  const { appName, appLogo } = useThemeStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  // When collapsed and hovered, sidebar floats over content as an overlay
  const isExpanded = !collapsed || hovered;

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      queryClient.clear();
      navigate('/login');
      toast.success(t('auth.logout'));
    },
  });

  const isSuperAdmin = !!user?.isSuperAdmin;

  const navItems = [
    { labelKey: 'nav.dashboard',  icon: <LayoutDashboard size={18} />, path: '/dashboard',    permission: 'dashboard:view' },
    ...(isSuperAdmin ? [{ labelKey: 'Business', icon: <Building2 size={18} />, path: '/business', permission: undefined as string | undefined }] : []),
    { labelKey: 'nav.cvDatabase', icon: <FileText size={18} />,        path: '/cv-database',  permission: 'cv:view' },
    { labelKey: 'nav.jobOpenings',icon: <Briefcase size={18} />,       path: '/job-openings', permission: 'jobs:view' },
    { labelKey: 'nav.employees',  icon: <Users size={18} />,           path: '/employees',    permission: 'employees:view' },
    { labelKey: 'nav.clients',    icon: <Building2 size={18} />,       path: '/clients',      permission: 'clients:view' },
    { labelKey: 'nav.invoices',   icon: <Receipt size={18} />,         path: '/invoices',     permission: 'invoices:view' },
    {
      labelKey: 'nav.settings',
      icon: <Settings size={18} />,
      children: [
        { labelKey: 'settings.theme',     path: '/settings/theme',     icon: <Palette size={15} />,       permission: 'settings:theme' },
        { labelKey: 'settings.roles',     path: '/settings/roles',     icon: <Shield size={15} />,        permission: 'settings:roles' },
        { labelKey: 'settings.fonts',     path: '/settings/fonts',     icon: <Type size={15} />,          permission: 'settings:fonts' },
        { labelKey: 'settings.auditLogs', path: '/settings/audit',     icon: <ClipboardList size={15} />, permission: 'audit:view' },
        { labelKey: 'settings.languages', path: '/settings/languages', icon: <Globe size={15} />,         permission: 'settings:view' },
        ...(isSuperAdmin ? [{ labelKey: 'Bug Reports', path: '/settings/bug-reports', icon: <Bug size={15} />, permission: undefined as string | undefined }] : []),
      ],
    },
  ];

  const filteredItems = navItems.filter((item) => {
    if ('children' in item && item.children) {
      const visibleChildren = item.children.filter(c => !c.permission || canAccess(c.permission));
      return visibleChildren.length > 0;
    }
    if (!('permission' in item) || !item.permission) return true;
    return canAccess(item.permission as string);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col transition-[width,transform] duration-300 overflow-hidden',
          // Mobile: slide in/out
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Width: 64px when collapsed+not-hovered, 256px otherwise
          isExpanded ? 'w-64' : 'w-16',
          // When hovered in collapsed state, cast a shadow to indicate overlay
          collapsed && hovered && 'shadow-2xl',
        )}
        style={{ backgroundColor: 'var(--sidebar, #0F172A)' }}
      >
        {/* Logo / Brand */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0 overflow-hidden">
          <div className="flex items-center gap-2 flex-shrink-0">
            {appLogo ? (
              <img src={`/uploads/${appLogo}`} alt="Logo" className="h-8 w-8 object-contain flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">HR</span>
              </div>
            )}
          </div>
          {isExpanded && (
            <span className="text-white font-semibold text-sm truncate ml-2 transition-opacity duration-200">
              {appName || 'HR System'}
            </span>
          )}
          {/* Mobile close */}
          {isExpanded && (
            <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white ml-auto">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {filteredItems.map((item) => (
            <div key={item.labelKey}>
              {'path' in item && item.path ? (
                <NavLink
                  to={item.path as string}
                  onClick={onClose}
                  title={!isExpanded ? t(item.labelKey) : undefined}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg mx-1.5',
                    isActive && 'bg-primary-600/30 text-white',
                    !isExpanded && 'justify-center px-0 mx-1.5',
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {isExpanded && <span className="truncate">{t(item.labelKey)}</span>}
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() => isExpanded && setExpandedItem(expandedItem === item.labelKey ? null : item.labelKey)}
                    title={!isExpanded ? t(item.labelKey) : undefined}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg mx-1.5 w-[calc(100%-12px)]',
                      !isExpanded && 'justify-center px-0',
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {isExpanded && (
                      <>
                        <span className="flex-1 text-left truncate">{t(item.labelKey)}</span>
                        {expandedItem === item.labelKey ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </>
                    )}
                  </button>
                  {isExpanded && expandedItem === item.labelKey && item.children && (
                    <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                      {item.children.filter(c => !c.permission || canAccess(c.permission)).map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={({ isActive }) => cn(
                            'flex items-center gap-2.5 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors rounded-lg',
                            isActive && 'bg-primary-600/30 text-white',
                          )}
                        >
                          {child.icon}
                          <span>{t(child.labelKey)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-white/10 p-2 flex-shrink-0">
          <NavLink
            to="/profile"
            title={!isExpanded ? `${user?.firstName} ${user?.lastName}` : undefined}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer overflow-hidden',
              !isExpanded && 'justify-center',
            )}
          >
            {user?.profilePhoto ? (
              <img src={`/uploads/${user.profilePhoto}`} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {getInitials(user?.firstName || '', user?.lastName)}
              </div>
            )}
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-slate-400 text-xs truncate">{user?.role?.name}</p>
              </div>
            )}
          </NavLink>

          <button
            onClick={() => logoutMutation.mutate()}
            title={!isExpanded ? t('auth.logout') : undefined}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 w-full text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg mt-1 transition-colors',
              !isExpanded && 'justify-center px-0',
            )}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {isExpanded && <span>{t('auth.logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
