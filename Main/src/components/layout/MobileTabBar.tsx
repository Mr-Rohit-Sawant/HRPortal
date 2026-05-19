import { useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, LayoutGrid, Settings,
  FileText, Building2, Receipt, Users, X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/helpers';

const LISTING_PATHS = ['/cv-database', '/clients', '/invoices', '/business', '/employees'];
const SETTINGS_PATHS = ['/profile', '/settings'];

export default function MobileTabBar() {
  const { canAccess, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [listingsOpen, setListingsOpen] = useState(false);
  const isSuperAdmin = !!user?.isSuperAdmin;

  const isListingsActive = LISTING_PATHS.some(p => location.pathname.startsWith(p));
  const isSettingsActive = SETTINGS_PATHS.some(p => location.pathname.startsWith(p));

  const listingItems = [
    ...(isSuperAdmin ? [{ label: 'Business', icon: <Building2 size={22} />, path: '/business' }] : []),
    ...(canAccess('cv:view') ? [{ label: 'CV Database', icon: <FileText size={22} />, path: '/cv-database' }] : []),
    ...(canAccess('employees:view') ? [{ label: 'Employees', icon: <Users size={22} />, path: '/employees' }] : []),
    ...(canAccess('clients:view') ? [{ label: 'Clients', icon: <Building2 size={22} />, path: '/clients' }] : []),
    ...(canAccess('invoices:view') ? [{ label: 'Invoices', icon: <Receipt size={22} />, path: '/invoices' }] : []),
  ];

  const hasSettingsAccess =
    canAccess('settings:theme') ||
    canAccess('settings:roles') ||
    canAccess('settings:fonts') ||
    canAccess('audit:view') ||
    canAccess('settings:view') ||
    isSuperAdmin;

  const tabItem = (
    label: string,
    icon: React.ReactNode,
    isActive: boolean,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
        isActive
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <>
      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
            isActive
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
          )}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {/* Job Openings */}
        {canAccess('jobs:view') && (
          <NavLink
            to="/job-openings"
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
            )}
          >
            <Briefcase size={20} />
            <span>Jobs</span>
          </NavLink>
        )}

        {/* Listings */}
        {tabItem(
          'Listings',
          <LayoutGrid size={20} />,
          isListingsActive,
          () => setListingsOpen(true),
        )}

        {/* Settings — hidden if role has no settings access */}
        {hasSettingsAccess && (
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
              isActive || isSettingsActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
            )}
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        )}
      </nav>

      {/* ── Listings Sheet ───────────────────────────────────────────────── */}
      {listingsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setListingsOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white text-base">Listings</span>
              <button
                onClick={() => setListingsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {listingItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setListingsOpen(false); }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95',
                      isActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50',
                    )}
                  >
                    {item.icon}
                    <span className="text-xs font-medium leading-tight text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
