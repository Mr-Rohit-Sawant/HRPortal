import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import MainLayout from '../components/layout/MainLayout';
import LoginView from '../views/auth/LoginView';
import ForgotPasswordView from '../views/auth/ForgotPasswordView';
import ResetPasswordView from '../views/auth/ResetPasswordView';
import DashboardView from '../views/dashboard/DashboardView';
import CVDatabaseView from '../views/cv-database/CVDatabaseView';
import CVAddView from '../views/cv-database/CVAddView';
import CVBulkImportView from '../views/cv-database/CVBulkImportView';
import CVDetailView from '../views/cv-database/CVDetailView';
import JobOpeningsView from '../views/job-openings/JobOpeningsView';
import JobOpeningDetailView from '../views/job-openings/JobOpeningDetailView';
import JobOpeningFormView from '../views/job-openings/JobOpeningFormView';
import EmployeeListView from '../views/employees/EmployeeListView';
import AddEmployeeView from '../views/employees/AddEmployeeView';
import ClientListView from '../views/clients/ClientListView';
import AddClientView from '../views/clients/AddClientView';
import InvoiceListView from '../views/invoices/InvoiceListView';
import GenerateInvoiceView from '../views/invoices/GenerateInvoiceView';
import ProfileView from '../views/settings/ProfileView';
import ThemeManagementView from '../views/settings/ThemeManagementView';
import RoleManagementView from '../views/settings/RoleManagementView';
import FontManagementView from '../views/settings/FontManagementView';
import AuditLogsView from '../views/settings/AuditLogsView';
import LanguageManagementView from '../views/settings/LanguageManagementView';
import NotificationsView from '../views/notifications/NotificationsView';
import BusinessListView from '../views/business/BusinessListView';
import BusinessDetailView from '../views/business/BusinessDetailView';
import BugReportsView from '../views/settings/BugReportsView';
import MobileSettingsView from '../views/settings/MobileSettingsView';

// Shows login at "/" when not authenticated, redirects to dashboard when authenticated
const RootRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginView />;
};

// Wraps protected pages — redirects to "/" (login) if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export default function AppRouter() {
  return (
    <Routes>
      {/* Root — shows login page without redirecting to /login */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordView />} />
      <Route path="/reset-password" element={<ResetPasswordView />} />

      {/* Protected layout — pathless route keeps all child URLs unchanged */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/business" element={<BusinessListView />} />
        <Route path="/business/:id" element={<BusinessDetailView />} />

        {/* CV Database */}
        <Route path="/cv-database" element={<CVDatabaseView />} />
        <Route path="/cv-database/add" element={<CVAddView />} />
        <Route path="/cv-database/bulk-import" element={<CVBulkImportView />} />
        <Route path="/cv-database/:id" element={<CVDetailView />} />
        <Route path="/cv-database/:id/edit" element={<CVAddView />} />

        {/* Job Openings */}
        <Route path="/job-openings" element={<JobOpeningsView />} />
        <Route path="/job-openings/new" element={<JobOpeningFormView />} />
        <Route path="/job-openings/:id" element={<JobOpeningDetailView />} />
        <Route path="/job-openings/:id/edit" element={<JobOpeningFormView />} />

        {/* Employees */}
        <Route path="/employees" element={<EmployeeListView />} />
        <Route path="/employees/add" element={<AddEmployeeView />} />
        <Route path="/employees/:id/edit" element={<AddEmployeeView />} />

        {/* Clients */}
        <Route path="/clients" element={<ClientListView />} />
        <Route path="/clients/add" element={<AddClientView />} />
        <Route path="/clients/:id/edit" element={<AddClientView />} />

        {/* Invoices */}
        <Route path="/invoices" element={<InvoiceListView />} />
        <Route path="/invoices/generate" element={<GenerateInvoiceView />} />

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationsView />} />

        {/* Settings */}
        <Route path="/settings" element={<MobileSettingsView />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/settings/theme" element={<ThemeManagementView />} />
        <Route path="/settings/roles" element={<RoleManagementView />} />
        <Route path="/settings/fonts" element={<FontManagementView />} />
        <Route path="/settings/audit" element={<AuditLogsView />} />
        <Route path="/settings/languages" element={<LanguageManagementView />} />
        <Route path="/settings/bug-reports" element={<BugReportsView />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
