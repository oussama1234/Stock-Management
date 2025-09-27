// Enhanced Modern Navbar with Glassmorphism UI/UX
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { HomeRoute, MyProfileRoute, SupportRoute, DashboardRoute } from "../router/Index";
import { useToast } from "./Toaster/ToastContext";
import { useNotificationContext } from "@/context/NotificationContext";
import NotificationDropdown from "./Notifications/NotificationDropdown";
const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const { logoutUser, user } = useAuth();
  const { preferences, currentTheme, toggleDarkMode } = usePreferences();
  const navigate = useNavigate();
  const Toast = useToast();
  const location = useLocation();

  // Use shared notification context for real-time updates
  const { unreadCount } = useNotificationContext();

  // Navigate to low stock alerts in dashboard
  const handleNavigateToLowStock = useCallback(() => {
    navigate(DashboardRoute);
    // Wait for navigation then scroll to low stock section
    setTimeout(() => {
      const lowStockElement = document.getElementById('low-stock-alerts');
      if (lowStockElement) {
        lowStockElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  }, [navigate]);

  // Set active link style for navbar
  const isActive = (link) => {
    return location.pathname === link;
  };

  const handleLogout = async () => {
    // Implement logout functionality here

    setIsProfileOpen(false);

    // Call logout function from auth context
    await logoutUser();

    // Optionally, you can redirect to login page or show a message
    // For example, using window.location:
    navigate(HomeRoute);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Implement global search functionality here
      Toast.success(`Searching for "${searchTerm}"`);
    }
  };

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg z-[100]"
    >
      {/* Background decoration */}
      <div className={`absolute inset-0 bg-gradient-to-r ${currentTheme.primary}/5 via-purple-500/5 to-indigo-500/5 dark:from-gray-800/20 dark:via-gray-700/20 dark:to-gray-800/20`} />
      
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Enhanced Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSidebar}
              className={`p-2.5 bg-gray-100 dark:bg-gray-800 ${currentTheme.hover} text-gray-600 dark:text-gray-300 ${currentTheme.text} rounded-xl border border-gray-200 dark:border-gray-700 ${currentTheme.border} transition-all duration-300 shadow-sm hover:shadow-md`}
            >
              <motion.div
                animate={{ rotate: isSidebarOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isSidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.div>
            </motion.button>
            
            {/* Breadcrumb or Page Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="hidden sm:block"
            >
              <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Stock Manager
              </h1>
            </motion.div>
          </div>

          {/* Center Section - Enhanced Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onSubmit={handleSearchSubmit}
              className="relative"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Search products, orders, customers..."
                  className="w-full pl-12 pr-12 py-3 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-blue-500/20 focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 shadow-sm backdrop-blur-sm"
                />
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </motion.form>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className={`p-2.5 bg-gray-100 dark:bg-gray-800 ${currentTheme.hover} ${currentTheme.text} text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 ${currentTheme.border} transition-all duration-300 shadow-sm hover:shadow-md`}
            >
              {preferences.dark_mode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </motion.button>

            {/* Enhanced Notifications */}
            <motion.div 
              className="relative" 
              ref={notificationsRef}
              whileHover={{ scale: 1.05 }}
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2.5 bg-gray-100 dark:bg-gray-800 ${currentTheme.hover} text-gray-600 dark:text-gray-300 ${currentTheme.text} rounded-xl border border-gray-200 dark:border-gray-700 ${currentTheme.border} transition-all duration-300 shadow-sm hover:shadow-md`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>

            {/* Real Notifications Dropdown */}
            <AnimatePresence>
              <NotificationDropdown 
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                onNavigateToLowStock={handleNavigateToLowStock}
              />
            </AnimatePresence>
          </motion.div>

            {/* Enhanced Profile Dropdown */}
            <motion.div 
              className="relative" 
              ref={profileRef}
              whileHover={{ scale: 1.02 }}
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm"
              >
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center shadow-sm ${currentTheme.gradient}`}
                  >
                    {user && user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user && user.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </span>
                    )}
                  </motion.div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                </div>
                
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role || 'Member'}
                  </p>
                </div>
                
                <motion.div
                  animate={{ rotate: isProfileOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </motion.div>
              </motion.button>

              {/* Enhanced Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-3 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-[9999]"
                  >
                    {/* Profile Header */}
                    <div className={`p-6 ${currentTheme.bg}/80 border-b border-gray-100 dark:border-gray-700`}>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={`h-12 w-12 rounded-xl overflow-hidden ${currentTheme.gradient} flex items-center justify-center shadow-lg`}>
                            {user && user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.name || "User"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold">
                                {user && user.name
                                  ? user.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                  : "U"}
                              </span>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            👤 {user?.name || 'User'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                          <p className={`text-xs ${currentTheme.text} font-medium mt-1 capitalize`}>
                            {user?.role || 'Member'} Account
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to={MyProfileRoute}
                        onClick={() => setIsProfileOpen(false)}
                        className={`flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:${currentTheme.text} ${currentTheme.hover} transition-all duration-300 ${
                          isActive(MyProfileRoute)
                            ? `${currentTheme.bg} ${currentTheme.text} border-r-2 ${currentTheme.border}`
                            : ""
                        }`}
                      >
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">My Profile</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">View and edit profile</p>
                        </div>
                      </Link>
                      
                      <Link
                        to="/dashboard/profile?tab=preferences"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-300"
                      >
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                          <Settings className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Settings</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">App preferences</p>
                        </div>
                      </Link>

                      <Link
                        to={SupportRoute}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all duration-300"
                      >
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Help & Support</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Get assistance</p>
                        </div>
                      </Link>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        className="w-full flex items-center px-6 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300 mx-2"
                      >
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Sign Out</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Logout from account</p>
                        </div>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
