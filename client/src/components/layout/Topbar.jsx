import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Moon, Sun, Bell, Search, X, Package, Users, Shield } from 'lucide-react';
import { toggleTheme } from '../../features/ui/uiSlice';
import { setMobileSidebar } from '../../features/ui/uiSlice';
import { fetchNotifications, markRead, markAllRead } from '../../features/notifications/notificationSlice';
import { aiService } from '../../services/aiService';
import { formatDistanceToNow } from 'date-fns';
import ProfileImage from '../ui/ProfileImage';

export default function Topbar({ title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useSelector(s => s.ui);
  const { items: notifications, unreadCount } = useSelector(s => s.notifications);
  const { user } = useSelector(s => s.auth);

  const [notifOpen, setNotifOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [placeholder, setPlaceholder] = useState('Search assets, employees, licenses...');
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setPlaceholder('Search...');
      } else {
        setPlaceholder('Search assets, employees, licenses...');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce the localQuery update to avoid typing lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [localQuery]);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        try {
          const { data } = await aiService.search(searchQuery);
          setSearchResults(data.data);
        } catch {
          setSearchResults(null);
        }
        setSearching(false);
      } else {
        setSearchResults(null);
      }
    };
    fetchResults();
  }, [searchQuery]);

  const handleNotifClick = (notif) => {
    dispatch(markRead(notif._id));
    setNotifOpen(false);
    if (notif.resourceType === 'Asset') navigate(`/assets`);
    else if (notif.resourceType === 'License') navigate(`/licenses`);
  };

  return (
    <header className="h-16 bg-white dark:bg-dark-800 border-b border-gray-100 dark:border-dark-600 flex items-center gap-4 px-4 lg:px-6 sticky top-0 z-30">
      {/* Mobile menu */}
      <button
        onClick={() => dispatch(setMobileSidebar(true))}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-lg font-bold text-gray-900 dark:text-white font-heading hidden sm:block truncate">{title}</h1>

      {/* Search */}
      <div ref={searchRef} className="flex-1 max-w-[180px] sm:max-w-sm md:max-w-md relative mx-2 sm:mx-4 group">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2 bg-gray-50/70 focus:bg-white dark:bg-dark-800/50 border border-gray-200/50 dark:border-dark-600/30 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          {localQuery && (
            <button onClick={() => { setLocalQuery(''); setSearchQuery(''); setSearchResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {searchResults && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-700 rounded-xl shadow-2xl border border-gray-100 dark:border-dark-600 overflow-hidden z-50 w-[280px] sm:w-full"
            >
              {searching ? (
                <div className="p-4 text-sm text-gray-500 text-center">Searching...</div>
              ) : searchResults.total === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">No results found</div>
              ) : (
                <>
                  {searchResults.assets?.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-dark-800">Assets</div>
                      {searchResults.assets.map(a => (
                        <button key={a._id} onClick={() => { navigate(`/assets?search=${encodeURIComponent(a.name)}`); setSearchResults(null); setSearchQuery(''); setLocalQuery(''); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-600 text-left">
                          <Package size={14} className="text-primary-500 flex-shrink-0" />
                          <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.name}</p><p className="text-xs text-gray-400">{a.type} · {a.serialNumber}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.employees?.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-dark-800">Employees</div>
                      {searchResults.employees.map(e => (
                        <button key={e._id} onClick={() => { navigate(`/employees?search=${encodeURIComponent(e.name)}`); setSearchResults(null); setSearchQuery(''); setLocalQuery(''); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-600 text-left">
                          <Users size={14} className="text-accent-500 flex-shrink-0" />
                          <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{e.name}</p><p className="text-xs text-gray-400">{e.email}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.licenses?.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-dark-800">Licenses</div>
                      {searchResults.licenses.map(l => (
                        <button key={l._id} onClick={() => { navigate(`/licenses?search=${encodeURIComponent(l.softwareName)}`); setSearchResults(null); setSearchQuery(''); setLocalQuery(''); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-600 text-left">
                          <Shield size={14} className="text-blue-500 flex-shrink-0" />
                          <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{l.softwareName}</p><p className="text-xs text-gray-400">{l.vendor}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-700 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-600 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-600">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm font-heading">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={() => dispatch(markAllRead())} className="text-xs text-primary-500 hover:underline font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map(notif => (
                      <button
                        key={notif._id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-600 border-b border-gray-50 dark:border-dark-600 last:border-0 transition-colors ${!notif.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.isRead ? 'bg-primary-500' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="cursor-pointer flex-shrink-0" onClick={() => navigate('/profile')}>
          <ProfileImage
            src={user?.profileImage}
            name={user?.name}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            fallbackClassName="w-9 h-9 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          />
        </div>
      </div>
    </header>
  );
}
