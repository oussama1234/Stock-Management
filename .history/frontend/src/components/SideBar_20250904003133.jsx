// Updated Sidebar.jsx with improved colors
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Settings,
  BarChart3,
  ChevronDown,
  Database,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { id: 1, name: 'Dashboard', icon: Home, link: '#', active: true },
    { id: 2, name: 'Users', icon: Users, link: '#', active: false },
    { id: 3, name: 'Products', icon: Package, link: '#', active: false, hasSubmenu: true },
    { id: 4, name: 'Sales', icon: TrendingUp, link: '#', active: false },
    { id: 5, name: 'Purchases', icon: ShoppingCart, link: '#', active: false },
    { id: 6, name: 'Inventory', icon: Database, link: '#', active: false },
    { id: 7, name: 'Reports', icon: BarChart3, link: '#', active: false },
    { id: 8, name: 'Settings', icon: Settings, link: '#', active: false },
  ];

  const containerVariants = {
    open: { width: 256, opacity: 1 },
    closed: { width: 0, opacity: 0 }
  };

  const itemVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -20 }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <motion.div
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={containerVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed lg:relative top-0 left-0 h-full bg-gradient-to-b from-indigo-800 to-blue-900 border-r border-indigo-700/50 shadow-xl z-30 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-indigo-700/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-8 w-8 text-blue-300" />
              <span className="text-xl font-bold text-white">Stock Manager</span>
            </motion.div>
            
            <button 
              onClick={toggleSidebar}
              className="lg:hidden text-blue-200 hover:text-white p-1 rounded-md hover:bg-indigo-700/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <a
                  href={item.link}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-blue-100 hover:text-white hover:bg-indigo-700/40 transition-all duration-300 ${
                    item.active ? 'bg-indigo-600 text-white shadow-md' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.hasSubmenu && (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </a>
              </motion.div>
            ))}
          </nav>

          
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;