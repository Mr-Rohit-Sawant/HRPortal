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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginView /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordView /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordView /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />

        {/* CV Database */}
        <Route path="cv-database" element={<CVDatabaseView />} />
        <Route path="cv-database/add" element={<CVAddView />} />
        <Route path="cv-database/bulk-import" element={<CVBulkImportView />} />
        <Route path="cv-database/:id" element={<CVDetailView />} />
        <Route path="cv-database/:id/edit" element={<CVAddView />} />

        {/* Job Openings */}
        <Route path="job-openings" element={<JobOpeningsView />} />
        <Route path="job-openings/new" element={<JobOpeningFormView />} />
        <Route path="job-openings/:id" element={<JobOpeningDetailView />} />
        <Route path="job-openings/:id/edit" element={<JobOpeningFormView />} />

        {/* Employees */}
        <Route path="employees" element={<EmployeeListView />} />
        <Route path="employees/add" element={<AddEmployeeView />} />
        <Route path="employees/:id/edit" element={<AddEmployeeView />} />

        {/* Clients */}
        <Route path="clients" element={<ClientListView />} />
        <Route path="clients/add" element={<AddClientView />} />
        <Route path="clients/:id/edit" element={<AddClientView />} />

        {/* Invoices */}
        <Route path="invoices" element={<InvoiceListView />} />
        <Route path="invoices/generate" element={<GenerateInvoiceView />} />

        {/* Settings */}
        <Route path="profile" element={<ProfileView />} />
        <Route path="settings/theme" element={<ThemeManagementView />} />
        <Route path="settings/roles" element={<RoleManagementView />} />
        <Route path="settings/fonts" element={<FontManagementView />} />
        <Route path="settings/audit" element={<AuditLogsView />} />
        <Route path="settings/languages" element={<LanguageManagementView />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
