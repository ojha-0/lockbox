import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// User portal
import UserLayout from './components/layout/UserLayout';
import DashboardPage from './pages/user/DashboardPage';
import MyDocumentsPage from './pages/user/MyDocumentsPage';
import UploadDocumentPage from './pages/user/UploadDocumentPage';
import ActivityLogPage from './pages/user/ActivityLogPage';
import SettingsPage from './pages/user/SettingsPage';
import SharedWithMePage from './pages/user/SharedWithMePage';

// Admin portal
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import UserDetailPage from './pages/admin/UserDetailPage';
import DocumentQueuePage from './pages/admin/DocumentQueuePage';
import DocumentReviewPage from './pages/admin/DocumentReviewPage';
import VerificationQueuePage from './pages/admin/VerificationQueuePage';
import AdminActivityLogPage from './pages/admin/AdminActivityLogPage';
import OrganizationsPage from './pages/admin/OrganizationsPage';

// Organization portal
import OrganizationLayout from './components/layout/OrganizationLayout';
import OrgDashboardPage from './pages/org/OrgDashboardPage';
import OrgApiKeyPage from './pages/org/OrgApiKeyPage';

// Guards
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import OrganizationRoute from './components/common/OrganizationRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* User portal */}
          <Route element={<ProtectedRoute />}>
            <Route element={<UserLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/documents" element={<MyDocumentsPage />} />
              <Route path="/shared" element={<SharedWithMePage />} />
              <Route path="/upload" element={<UploadDocumentPage />} />
              <Route path="/activity" element={<ActivityLogPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Admin portal */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/users/:id" element={<UserDetailPage />} />
              <Route path="/admin/verification-queue" element={<VerificationQueuePage />} />
              <Route path="/admin/documents" element={<DocumentQueuePage />} />
              <Route path="/admin/documents/:id" element={<DocumentReviewPage />} />
              <Route path="/admin/activity" element={<AdminActivityLogPage />} />
              <Route path="/admin/organizations" element={<OrganizationsPage />} />
            </Route>
          </Route>

          {/* Organization portal */}
          <Route element={<OrganizationRoute />}>
            <Route element={<OrganizationLayout />}>
              <Route path="/org" element={<OrgDashboardPage />} />
              <Route path="/org/api-key" element={<OrgApiKeyPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
