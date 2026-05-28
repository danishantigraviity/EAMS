import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Users, Shield, Wrench, Bell, BarChart3,
  FileText, QrCode, HardDrive, LogOut, Settings, ChevronLeft, ChevronRight,
  Cpu, FolderOpen, Building2, X, Sliders, Tag,
} from 'lucide-react';
import { logoutUser } from '../../features/auth/authSlice';
import { toggleSidebar, setMobileSidebar } from '../../features/ui/uiSlice';
import toast from 'react-hot-toast';

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assets', icon: Package, label: 'Assets' },
  { to: '/asset-types', icon: Sliders, label: 'Asset Types' },
  { to: '/digital-assets', icon: FolderOpen, label: 'Digital Assets' },
  { to: '/digital-asset-categories', icon: Tag, label: 'Asset Categories' },
  { to: '/licenses', icon: Shield, label: 'Licenses' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/departments', icon: Building2, label: 'Departments' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/asset-requests', icon: FileText, label: 'Asset Requests' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/qr-scanner', icon: QrCode, label: 'QR Scanner' },
];

const employeeLinks = [
  { to: '/my-dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/my-assets', icon: Package, label: 'My Assets' },
  { to: '/my-requests', icon: FileText, label: 'My Requests' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { sidebarOpen, mobileSidebarOpen } = useSelector(s => s.ui);

  const isEmployee = user?.role === 'employee';
  const links = isEmployee ? employeeLinks : adminLinks;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-dark-600 ${!sidebarOpen ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-400 rounded-xl flex items-center justify-center flex-shrink-0">
          <Cpu size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
              <p className="font-bold text-gray-900 dark:text-white font-heading text-sm leading-tight">EAMS</p>
              <p className="text-xs text-gray-400">Asset Management</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => dispatch(setMobileSidebar(false))}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-3' : ''}`
            }
          >
            <link.icon size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap text-sm"
                >
                  {link.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-dark-600 space-y-1">
        <div className={`flex items-center gap-3 px-3 py-2 ${!sidebarOpen ? 'justify-center' : ''}`}>
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{user?.name?.charAt(0)}</span>
            </div>
          )}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden min-w-0"
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate capitalize">{user?.role?.replace(/_/g, ' ')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleLogout}
          className={`sidebar-item w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 ${!sidebarOpen ? 'justify-center px-3' : ''}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap text-sm"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 72 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="hidden md:flex flex-col bg-white dark:bg-dark-800 border-r border-gray-100 dark:border-dark-600 h-screen sticky top-0 overflow-hidden relative"
      >
        <SidebarContent />
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-500 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => dispatch(setMobileSidebar(false))}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed left-0 top-0 h-full w-60 bg-white dark:bg-dark-800 z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
