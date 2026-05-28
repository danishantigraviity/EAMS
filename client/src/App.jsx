import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Layout
import AppLayout from './components/layout/AppLayout';
import Button from './components/ui/Button';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import { ForgotPasswordPage, VerifyOTPPage, ResetPasswordPage } from './pages/auth/AuthPages';

// Admin pages
import DashboardPage from './pages/admin/DashboardPage';
import AssetsPage from './pages/admin/AssetsPage';
import LicensesPage from './pages/admin/LicensesPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import MaintenancePage from './pages/admin/MaintenancePage';
import ReportsPage from './pages/admin/ReportsPage';
import QRScannerPage from './pages/admin/QRScannerPage';
import DigitalAssetsPage from './pages/admin/DigitalAssetsPage';
import AssetTypesPage from './pages/admin/AssetTypesPage';
import DigitalAssetCategoriesPage from './pages/admin/DigitalAssetCategoriesPage';
import AssetRequestsPage from './pages/admin/AssetRequestsPage';

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import { getMe } from './features/auth/authSlice';

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-dark-900">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <Loader2 size={36} className="text-primary-500" />
      </motion.div>
    </div>
  );
}

function RequireAuth({ allowedRoles }) {
  const { user, accessToken } = useSelector(s => s.auth);
  if (!accessToken || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'employee' ? '/my-dashboard' : '/dashboard'} replace />;
  }
  return <Outlet />;
}

function PublicRoute() {
  const { accessToken, user } = useSelector(s => s.auth);
  if (accessToken && user) {
    return <Navigate to={user.role === 'employee' ? '/my-dashboard' : '/dashboard'} replace />;
  }
  return <Outlet />;
}

function ProfilePage() {
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { authService } = await import('./services/authService');
      const fd = new FormData();
      fd.append('name', data.name);
      if (data.phone) fd.append('phone', data.phone);
      await authService.updateProfile(fd);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">My Profile</h2>
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-accent-400 rounded-2xl flex items-center justify-center flex-shrink-0">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span className="text-white text-2xl font-bold">{user?.name?.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white font-heading">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input {...register('name')} className="input" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input {...register('phone')} className="input" placeholder="+91 XXXXX XXXXX" />
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-dark-600">
            <p className="text-xs text-gray-400 mb-3">Account Information (read-only)</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium dark:text-gray-300">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Role</span>
                <span className="font-medium capitalize dark:text-gray-300">{user?.role?.replace(/_/g, ' ')}</span>
              </div>
              {user?.employeeId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Employee ID</span>
                  <span className="font-mono text-xs dark:text-gray-300">{user.employeeId}</span>
                </div>
              )}
            </div>
          </div>
          <Button type="submit" loading={loading} className="w-full justify-center">Save Changes</Button>
        </form>
      </div>
    </div>
  );
}

const ADMIN_ROLES = ['super_admin', 'hr_team', 'it_team', 'sbi_team', 'insurance_team', 'business_associate'];
const MANAGEMENT_ROLES = ['super_admin', 'hr_team', 'it_team'];

export default function App() {
  const { theme } = useSelector(s => s.ui);
  const { initialized, accessToken } = useSelector(s => s.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    if (!initialized && accessToken) {
      dispatch(getMe());
    }
  }, [initialized, accessToken, dispatch]);

  if (!initialized) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>

            {/* Admin / Staff routes */}
            <Route element={<RequireAuth allowedRoles={ADMIN_ROLES} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/asset-types" element={<AssetTypesPage />} />
              <Route path="/digital-assets" element={<DigitalAssetsPage />} />
              <Route path="/digital-asset-categories" element={<DigitalAssetCategoriesPage />} />
              <Route path="/licenses" element={<LicensesPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/qr-scanner" element={<QRScannerPage />} />
              <Route path="/asset-requests" element={<AssetRequestsPage />} />
            </Route>

            {/* Management-only routes */}
            <Route element={<RequireAuth allowedRoles={MANAGEMENT_ROLES} />}>
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            {/* Employee + Admin shared routes */}
            <Route element={<RequireAuth allowedRoles={['employee', ...ADMIN_ROLES]} />}>
              <Route path="/my-dashboard" element={<EmployeeDashboard />} />
              <Route path="/my-assets" element={<EmployeeDashboard />} />
              <Route path="/my-requests" element={<MaintenancePage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
