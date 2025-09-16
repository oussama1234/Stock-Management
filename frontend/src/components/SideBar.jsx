// Updated Sidebar.jsx with active route detection
import { motion } from "framer-motion";
import {
  BarChart3,
  ChevronDown,
  Database,
  Home,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { DashboardRoute, ProductsRoute, UsersRoute } from "../router/Index";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    {
      id: 1,
      name: "Dashboard",
      icon: Home,
      link: DashboardRoute,
      hasSubmenu: false,
    },
    {
      id: 2,
      name: "Products",
      icon: Package,
      link: ProductsRoute,
      hasSubmenu: false,
    },
    { id: 3, name: "Users", icon: Users, link: UsersRoute, hasSubmenu: false },
    { id: 4, name: "Sales", icon: TrendingUp, link: "#", hasSubmenu: false },
    {
      id: 5,
      name: "Purchases",
      icon: ShoppingCart,
      link: "#",
      hasSubmenu: false,
    },
    { id: 6, name: "Inventory", icon: Database, link: "#", hasSubmenu: false },
    { id: 7, name: "Reports", icon: BarChart3, link: "#", hasSubmenu: false },
    { id: 8, name: "Settings", icon: Settings, link: "#", hasSubmenu: false },
  ];

  // Check if a menu item is active based on current route
  const isActive = (link) => {
    return location.pathname === link;
  };

  const containerVariants = {
    open: { width: 256, opacity: 1 },
    closed: { width: 0, opacity: 0 },
  };

  const itemVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -20 },
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
              <span className="text-xl font-bold text-white">
                Stock Manager
              </span>
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
                <Link
                  to={item.link}
                  onClick={() => {
                    // Close sidebar on mobile when a link is clicked
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-blue-100 hover:text-white hover:bg-indigo-700/40 transition-all duration-300 ${
                    isActive(item.link)
                      ? "bg-indigo-600 text-white shadow-md"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.hasSubmenu && <ChevronDown className="h-4 w-4" />}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-indigo-700/50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-indigo-700/40 p-4 rounded-xl backdrop-blur-sm"
            >
              <h3 className="text-white text-sm font-medium mb-1">
                Stock Manager v1.0
              </h3>
              <p className="text-blue-200 text-xs">
                Inventory Management System
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
