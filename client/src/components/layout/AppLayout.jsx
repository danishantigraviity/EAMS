import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AIChatWidget from '../AIChatWidget';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/assets': 'Asset Management',
  '/asset-types': 'Asset Types',
  '/digital-assets': 'Digital Assets',
  '/digital-asset-categories': 'Digital Asset Categories',
  '/licenses': 'License Management',
  '/employees': 'Employee Management',
  '/departments': 'Department Management',
  '/maintenance': 'Maintenance Requests',
  '/reports': 'Reports & Analytics',
  '/qr-scanner': 'QR Scanner',
  '/my-dashboard': 'My Dashboard',
  '/my-assets': 'My Assets',
  '/my-requests': 'My Requests',
  '/profile': 'Profile',
};

export default function AppLayout() {
  const { theme } = useSelector(s => s.ui);
  const { user } = useSelector(s => s.auth);
  const location = useLocation();

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const title = pageTitles[location.pathname] || 'EAMS';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 lg:p-6 max-w-screen-2xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      {user?.role !== 'employee' && <AIChatWidget />}
    </div>
  );
}
