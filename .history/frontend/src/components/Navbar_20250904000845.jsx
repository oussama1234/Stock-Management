// Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Menu, X, BarChart3, Settings, LogOut, User, HelpCircle } from 'lucide-react';

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

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
    <nav className="bg-gradient-to-r from-blue-900 to-indigo-900 border-b border-white/10 backdrop-blur-md">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="text-white p-2 rounded-md hover:bg-white/10 transition-all duration-300"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center ml-4"
            >
              <BarChart3 className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-xl font-bold text-white">StockAI Manager</span>
            </motion.div>
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
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-white placeholder-blue-200 transition-all duration-300"
              />
            </motion.div>

            {/* Notifications */}
            <motion.div whileHover={{ scale: 1.1 }} className="relative">
              <button className="p-2 text-blue-200 hover:text-white rounded-full hover:bg-white/10 transition-colors duration-300">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
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
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold"
                >
                  OM
                </motion.div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="origin-top-right absolute right-0 mt-2 w-64 rounded-2xl shadow-lg bg-gradient-to-b from-blue-900 to-indigo-900 border border-white/10 backdrop-blur-md overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">Oussama Meqqadmi</p>
                      <p className="text-sm text-blue-300">oussama@stockai.com</p>
                    </div>
                    
                    <div className="py-1">
                      <a href="#" className="flex items-center px-4 py-2 text-blue-200 hover:text-white hover:bg-white/5 transition-colors duration-300">
                        <User className="h-4 w-4 mr-2" />
                        My Profile
                      </a>
                      <a href="#" className="flex items-center px-4 py-2 text-blue-200 hover:text-white hover:bg-white/5 transition-colors duration-300">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </a>
                      <a href="#" className="flex items-center px-4 py-2 text-blue-200 hover:text-white hover:bg-white/5 transition-colors duration-300">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Help & Support
                      </a>
                    </div>
                    
                    <div className="py-1 border-t border-white/10">
                      <a href="#" className="flex items-center px-4 py-2 text-blue-200 hover:text-white hover:bg-white/5 transition-colors duration-300">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </a>
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