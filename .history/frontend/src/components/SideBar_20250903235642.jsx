// Sidebar.jsx
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
  Database
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { id: 1, name: 'Dashboard', icon: Home, link: '#', active: true },
    { id: 2, name: 'Products', icon: Package, link: '#', active: false, hasSubmenu: true },
    { id: 3, name: 'Sales', icon: TrendingUp, link: '#', active: false },
    { id: 4, name: 'Purchases', icon: ShoppingCart, link: '#', active: false },
    { id: 5, name: 'Users', icon: Users, link: '#', active: false },
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
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <motion.div
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={containerVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed lg:relative top-0 left-0 h-full bg-gradient-to-b from-blue-900 to-indigo-900 border-r border-white/10 backdrop-blur-md z-30 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center p-4 border-b border-white/10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">StockAI</span>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <a
                  href={item.link}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-blue-200 hover:text-white hover:bg-white/5 transition-all duration-300 ${
                    item.active ? 'bg-white/10 text-white' : ''
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

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 p-4 rounded-xl"
            >
              <h3 className="text-white text-sm font-medium mb-1">Upgrade to Pro</h3>
              <p className="text-blue-300 text-xs mb-3">Get access to all features</p>
              <button className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:from-blue-400 hover:to-purple-400 transition-all duration-300">
                Upgrade Now
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default SideBar;