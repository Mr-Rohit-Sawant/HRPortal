import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BugReportButton from '../bugReport/BugReportButton';

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
  '/settings/theme': 'Theme Management',
  '/settings/roles': 'Role Management',
  '/settings/fonts': 'Font Management',
  '/settings/audit': 'Audit Logs',
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const title = routeTitles[location.pathname] || 'HR Recruitment System';

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed(v => !v);
    } else {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        isOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content — shifts based on sidebar width */}
      <div
        className="flex flex-col min-h-screen transition-[margin] duration-300"
        style={{ marginLeft: sidebarCollapsed ? 64 : 256 }}
      >
        <Header onMenuClick={handleMenuClick} title={title} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <BugReportButton />
    </div>
  );
}
