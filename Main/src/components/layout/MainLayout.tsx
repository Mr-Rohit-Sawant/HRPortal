import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileTabBar from './MobileTabBar';
import BugReportButton from '../bugReport/BugReportButton';
import { cn } from '../../utils/helpers';
import { useThemeStore } from '../../stores/themeStore';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cv-database': 'CV Database',
  '/cv-database/add': 'Add Candidate',
  '/cv-database/bulk-import': 'Bulk Import CVs',
  '/job-openings': 'Job Openings',
  '/job-openings/new': 'New Job Opening',
  '/employees': 'Employee Management',
  '/employees/add': 'Add Employee',
  '/clients': 'Client Management',
  '/clients/add': 'Add Client',
  '/invoices': 'Invoices',
  '/invoices/generate': 'Generate Invoice',
  '/profile': 'My Profile',
  '/settings': 'Settings',
  '/settings/theme': 'Theme Management',
  '/settings/roles': 'Role Management',
  '/settings/fonts': 'Font Management',
  '/settings/audit': 'Audit Logs',
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { mobileTabBar } = useThemeStore();

  const title = routeTitles[location.pathname] || 'HR Recruitment System';

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      // Desktop: toggle collapse
      setSidebarCollapsed(v => !v);
    } else if (!mobileTabBar) {
      // Mobile with tab bar disabled: open sidebar overlay
      setSidebarOpen(true);
    }
    // Mobile with tab bar enabled: hamburger does nothing on mobile
  };

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        mobileHidden={mobileTabBar}
      />

      {/* Main Content — owns all scrolling so header/tabbar never move */}
      <div className={cn(
        'flex flex-col flex-1 min-w-0 h-full transition-[margin] duration-300',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        <Header
          onMenuClick={handleMenuClick}
          title={title}
          hideMobileMenu={mobileTabBar}
        />
        {/* Scrollable area — extra bottom padding on mobile when tab bar is visible */}
        <main className={cn(
          'flex-1 overflow-y-auto overscroll-none p-4 sm:p-6',
          mobileTabBar && 'pb-20 lg:pb-6',
        )}>
          <Outlet />
        </main>
      </div>

      {mobileTabBar && <MobileTabBar />}
      <BugReportButton />
    </div>
  );
}
