import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, clearSession } from '../services/api';

export function Navbar({ onSearch, unreadCount, notifications, markRead }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
      isScrolled ? 'glass py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <span className="text-white font-black text-xl">C</span>
          </div>
          <span className="hidden sm:block text-2xl font-black tracking-tighter text-white">
            COLLEGE<span className="text-accent-start">PORTAL</span>
          </span>
        </div>

        <div className="flex-1 max-w-2xl relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent-start transition-colors" />
          <input
            type="text"
            placeholder="Search resources, subjects, teachers..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-start/50 focus:bg-white/10 transition-all"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              onSearch(e.target.value);
            }}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
       {/*   <div className="relative">
            <button 
              className="p-2 rounded-full hover:bg-white/10 text-white relative transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 glass rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-white">Notifications</h3>
                    <span className="text-xs text-accent-start cursor-pointer hover:underline">Mark all as read</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications?.length > 0 ? (
                      notifications.map((n) => (
                        <div 
                          key={n._id} 
                          className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!n.read ? 'bg-accent-start/5' : ''}`}
                          onClick={() => markRead(n._id)}
                        >
                          <p className="text-sm text-white line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-muted mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted">No notifications</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div> */}

          <div className="relative">
            <button 
              className="flex items-center gap-2 p-1.5 pl-3 rounded-full hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
              onClick={() => setShowProfile(!showProfile)}
            >
              <span className="hidden sm:block text-sm font-medium text-white">{user?.name}</span>
              <div className="w-8 h-8 rounded-full bg-accent-start/20 border border-accent-start/30 flex items-center justify-center text-accent-start">
                <User size={18} />
              </div>
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-56 glass rounded-2xl shadow-2xl overflow-hidden p-2"
                >
                  <div className="p-3 border-b border-white/10">
                    <p className="text-xs text-muted uppercase tracking-widest font-bold">Logged in as</p>
                    <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                  </div>
                  <button 
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-white transition-colors text-sm"
                    onClick={() => navigate(user?.role === 'teacher' ? '/teacher' : '/student')}
                  >
                    <User size={18} /> Dashboard
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-sm"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  onSearch: PropTypes.func,
  unreadCount: PropTypes.number,
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      read: PropTypes.bool,
      message: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ),
  markRead: PropTypes.func,
};

Navbar.defaultProps = {
  onSearch: () => {},
  unreadCount: 0,
  notifications: [],
  markRead: () => {},
};
