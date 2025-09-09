// Updated Navbar.jsx with improved colors
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Menu, X, BarChart3, Settings, LogOut, User, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { HomeRoute } from '../router/Index';
const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const {logoutUser, user} = useAuth();
  const navigate = useNavigate();

  

  const handleLogout = async () => {
    // Implement logout functionality here
  
    setIsProfileOpen(false);
    // Call logout function from auth context
    await logoutUser();
    // Optionally, you can redirect to login page or show a message
    // For example, using window.location:
    navigate(HomeRoute);

  }

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gradient-to-r from-indigo-800 to-blue-900 border-b border-indigo-700/50 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="text-blue-100 p-2 rounded-md hover:bg-indigo-700/40 hover:text-white transition-all duration-300"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="hidden md:block relative"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-blue-300" />
              </div>
              <input
                type="text"
                placeholder="Search inventory..."
                className="pl-10 pr-4 py-2 bg-indigo-700/30 border border-indigo-600/50 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none text-white placeholder-blue-200 transition-all duration-300"
              />
            </motion.div>

            {/* Notifications */}
            <motion.div whileHover={{ scale: 1.1 }} className="relative">
              <button className="p-2 text-blue-200 hover:text-white rounded-full hover:bg-indigo-700/40 transition-colors duration-300">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
            </motion.div>

            {/* Profile Dropdown */}
            <motion.div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-md"
                >
                  
                 // split 2 pieces first o, and second M 
                  {user && user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'OM'}
                </motion.div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="origin-top-right absolute right-0 mt-2 w-64 rounded-2xl shadow-lg bg-gradient-to-b from-indigo-800 to-blue-900 border border-indigo-700/50 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-indigo-700/50">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-sm text-blue-300">{user.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link href="#" className="flex items-center px-4 py-2 text-blue-200 hover:text-white hover:bg-indigo-700/40 transition-colors duration-300">
                        <User className="h-4 w-4 mr-2" />
                        My Profile
                      </Link>
                      <Link href="#" className="flex items-center px-4 py-2 text-blue-200 hover:text-white hover:bg-indigo-700/40 transition-colors duration-300">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                     
                      <Link href="#" className="flex items-center px-4 py-2 text-blue-200 hover:text-white hover:bg-indigo-700/40 transition-colors duration-300">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Help & Support
                      </Link>
                    </div>
                    
                    <div className="py-1 border-t border-indigo-700/50">
                      <Link onClick={handleLogout} className="flex items-center px-4 py-2 text-blue-200 hover:text-white hover:bg-indigo-700/40 transition-colors duration-300">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;