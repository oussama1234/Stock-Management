// Enhanced Modern Sidebar with Glassmorphism UI/UX
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  ChevronDown,
  Database,
  FileText,
  Heart,
  Home,
  Package,
  Phone,
  Settings,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePreferences } from "../context/PreferencesContext";
import {
  DashboardRoute,
  ProductsRoute,
  PurchasesAnalyticsRoute,
  PurchasesRoute,
  SalesAnalyticsRoute,
  SalesRoute,
  UsersRoute,
  ReportsRoute,
  InventoryRoute,
  InventoryListRoute,
  InventoryAdjustmentsRoute,
  InventoryLowStockRoute,
} from "../router/Index";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { currentTheme } = usePreferences();
  const [expandedMenus, setExpandedMenus] = useState({});

  const menuItems = [
    {
      id: 1,
      name: "Dashboard",
      icon: Home,
      link: DashboardRoute,
      hasSubmenu: false,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      textColor: "text-blue-600",
      description: "Overview & analytics",
    },
    {
      id: 2,
      name: "Products",
      icon: Package,
      link: ProductsRoute,
      hasSubmenu: false,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      textColor: "text-purple-600",
      description: "Manage inventory",
    },
    {
      id: 3,
      name: "Users",
      icon: Users,
      link: UsersRoute,
      hasSubmenu: false,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 hover:bg-green-100",
      textColor: "text-green-600",
      description: "User management",
    },
    {
      id: 4,
      name: "Sales",
      icon: TrendingUp,
      link: SalesRoute,
      hasSubmenu: false,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 hover:bg-orange-100",
      textColor: "text-orange-600",
      description: "Sales tracking",
    },
    {
      id: 5,
      name: "Purchases",
      icon: ShoppingCart,
      link: PurchasesRoute,
      hasSubmenu: false,
      color: "from-cyan-500 to-blue-500",
      bgColor: "bg-cyan-50 hover:bg-cyan-100",
      textColor: "text-cyan-600",
      description: "Purchase orders",
    },
    {
      id: 6,
      name: "Analytics",
      icon: BarChart3,
      link: "#",
      hasSubmenu: true,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50 hover:bg-emerald-100",
      textColor: "text-emerald-600",
      description: "Reports & insights",
      submenuItems: [
        {
          id: "sales-analytics",
          name: "Sales Analytics",
          icon: TrendingUp,
          link: SalesAnalyticsRoute,
          description: "Sales performance metrics",
        },
        {
          id: "purchases-analytics",
          name: "Purchases Analytics",
          icon: ShoppingCart,
          link: PurchasesAnalyticsRoute,
          description: "Purchase insights",
        },
      ],
    },
    {
      id: 7,
      name: "Inventory",
      icon: Database,
      link: "#",
      hasSubmenu: true,
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50 hover:bg-indigo-100",
      textColor: "text-indigo-600",
      description: "Stock management",
      submenuItems: [
        { id: 'inv-dashboard', name: 'Dashboard', icon: Activity, link: InventoryRoute },
        { id: 'inv-list', name: 'Inventory List', icon: Package, link: InventoryListRoute },
        { id: 'inv-adjustments', name: 'Adjustments', icon: Settings, link: InventoryAdjustmentsRoute },
        { id: 'inv-low-stock', name: 'Low Stock Alerts', icon: AlertTriangle, link: InventoryLowStockRoute },
      ],
    },
    {
      id: 8,
      name: "Reports",
      icon: FileText,
      link: ReportsRoute,
      hasSubmenu: false,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50 hover:bg-yellow-100",
      textColor: "text-yellow-600",
      description: "Custom reports",
    },
    {
      id: 9,
      name: "Settings",
      icon: Settings,
      link: "#",
      hasSubmenu: false,
      color: "from-gray-500 to-slate-500",
      bgColor: "bg-gray-50 hover:bg-gray-100",
      textColor: "text-gray-600",
      description: "App configuration",
    },
  ];

  // Check if a menu item is active based on current route
  const isActive = (link) => {
    return location.pathname === link;
  };

  // Check if any submenu item is active
  const isSubmenuActive = (submenuItems) => {
    return submenuItems?.some((item) => isActive(item.link));
  };

  // Toggle submenu
  const toggleSubmenu = (itemId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const containerVariants = {
    open: { width: 280, opacity: 1, x: 0 },
    closed: { width: 0, opacity: 0, x: -280 },
  };

  const itemVariants = {
    open: { opacity: 1, x: 0, scale: 1 },
    closed: { opacity: 0, x: -30, scale: 0.9 },
  };

  const logoVariants = {
    open: { opacity: 1, scale: 1, rotate: 0 },
    closed: { opacity: 0, scale: 0.8, rotate: -10 },
  };

  return (
    <>
      {/* Enhanced Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={containerVariants}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed lg:relative top-0 left-0 h-full bg-white/80 dark:bg-gray-800/80 border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-[95] overflow-hidden"
      >
        {/* Background decoration - matching navbar */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${currentTheme.bg}/80 dark:from-gray-800/40 dark:via-gray-700/60 dark:to-gray-800/40 via-indigo-50/60 to-purple-50/40`}
        />
        <div
          className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-r ${currentTheme.primary}/5 dark:from-gray-700/20 dark:via-gray-600/20 dark:to-gray-700/20 via-purple-500/5 to-indigo-500/5`}
        />

        <div className="relative flex flex-col h-full">
          {/* Enhanced Header */}
          <motion.div
            variants={logoVariants}
            className="p-6 border-b border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div
className={`absolute inset-0 ${currentTheme.gradient} rounded-2xl opacity-20`}
                  />
                  <div
                    className={`relative p-2 ${currentTheme.gradient} rounded-2xl shadow-lg`}
                  >
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Stock Manager
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Inventory System
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSidebar}
                className="lg:hidden p-2 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all duration-300"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-4 grid grid-cols-2 gap-3"
            >
              <div className="p-3 bg-white/80 dark:bg-gray-700/80 rounded-xl border border-gray-200/50 dark:border-gray-600/50 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Zap className={`h-4 w-4 ${currentTheme.text}`} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Active
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      24/7
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-white/80 dark:bg-gray-700/80 rounded-xl border border-gray-200/50 dark:border-gray-600/50 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Version
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      2.0
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {item.hasSubmenu ? (
                  <div
                    onClick={() => toggleSubmenu(item.id)}
                    className={`group relative flex items-center px-4 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer ${
                      isSubmenuActive(item.submenuItems) ||
                      expandedMenus[item.id]
                        ? `${currentTheme.bg} ${currentTheme.text} shadow-lg border-l-4 border-current transform scale-[1.02]`
                        : `text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${currentTheme.hover}`
                    }`}
                    title={`${item.name} - ${item.description}`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className={`p-2.5 rounded-xl transition-all duration-300 ${
                          isSubmenuActive(item.submenuItems) ||
                          expandedMenus[item.id]
                            ? `bg-white/80 ${currentTheme.text} shadow-sm`
                            : "bg-gray-100 dark:bg-gray-600 group-hover:bg-white dark:group-hover:bg-gray-500 group-hover:shadow-sm"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold transition-colors duration-300 ${
                            isSubmenuActive(item.submenuItems) ||
                            expandedMenus[item.id]
                              ? ""
                              : "group-hover:text-gray-800 dark:group-hover:text-white"
                          }`}
                        >
                          {item.name}
                        </p>
                        <p
                          className={`text-xs transition-colors duration-300 ${
                            isSubmenuActive(item.submenuItems) ||
                            expandedMenus[item.id]
                              ? "opacity-80"
                              : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <motion.div
                      animate={{ rotate: expandedMenus[item.id] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-2"
                    >
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    </motion.div>

                    {/* Active indicator for submenu parent */}
                    {isSubmenuActive(item.submenuItems) && (
                      <>
                        <motion.div
                          layoutId="activeTab"
                          className="absolute right-2 w-2 h-2 rounded-full bg-current shadow-lg"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-current opacity-5 blur-sm"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.link}
                    onClick={() => {
                      // Close sidebar on mobile when a link is clicked
                      if (window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                    className={`group relative flex items-center px-4 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                      isActive(item.link)
                        ? `${currentTheme.bg} ${currentTheme.text} shadow-lg border-l-4 border-current transform scale-[1.02]`
                        : `text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white ${currentTheme.hover}`
                    }`}
                    title={`${item.name} - ${item.description}`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className={`p-2.5 rounded-xl transition-all duration-300 ${
                          isActive(item.link)
                            ? `bg-white/80 ${currentTheme.text} shadow-sm`
                            : "bg-gray-100 dark:bg-gray-600 group-hover:bg-white dark:group-hover:bg-gray-500 group-hover:shadow-sm"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold transition-colors duration-300 ${
                            isActive(item.link)
                              ? ""
                              : "group-hover:text-gray-800 dark:group-hover:text-white"
                          }`}
                        >
                          {item.name}
                        </p>
                        <p
                          className={`text-xs transition-colors duration-300 ${
                            isActive(item.link)
                              ? "opacity-80"
                              : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Active indicator with glow */}
                    {isActive(item.link) && (
                      <>
                        <motion.div
                          layoutId="activeTab"
                          className="absolute right-2 w-2 h-2 rounded-full bg-current shadow-lg"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-current opacity-5 blur-sm"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      </>
                    )}
                  </Link>
                )}

                {/* Submenu */}
                <AnimatePresence>
                  {item.hasSubmenu && expandedMenus[item.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-4 mt-2 space-y-1 overflow-hidden"
                    >
                      {item.submenuItems.map((subItem) => (
                        <motion.div
                          key={subItem.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Link
                            to={subItem.link}
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                toggleSidebar();
                              }
                            }}
                            className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.01] ${
                              isActive(subItem.link)
                                ? `${currentTheme.bg} ${currentTheme.text} shadow-md border-l-2 border-current`
                                : `text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50`
                            }`}
                            title={subItem.description}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-1.5 rounded-lg transition-all duration-300 ${
                                  isActive(subItem.link)
                                    ? `bg-white/80 ${currentTheme.text} shadow-sm`
                                    : "bg-gray-200 dark:bg-gray-600 group-hover:bg-gray-300 dark:group-hover:bg-gray-500"
                                }`}
                              >
                                <subItem.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {subItem.name}
                                </p>
                                <p
                                  className={`text-xs ${
                                    isActive(subItem.link)
                                      ? "opacity-70"
                                      : "text-gray-400 dark:text-gray-500"
                                  }`}
                                >
                                  {subItem.description}
                                </p>
                              </div>
                            </div>

                            {isActive(subItem.link) && (
                              <motion.div
                                className="ml-auto w-1.5 h-1.5 rounded-full bg-current shadow-sm"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 25,
                                }}
                              />
                            )}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </nav>

          {/* Enhanced Footer */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
            {/* Made with Love & Contact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-gradient-to-br from-rose-50/80 via-pink-50/60 to-red-50/80 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-red-900/20 p-4 rounded-xl border border-rose-200/50 dark:border-rose-700/50 backdrop-blur-sm shadow-sm"
            >
              {/* Made with Love Header */}
              <div className="flex items-center justify-center mb-3">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex items-center space-x-2"
                >
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Made with
                  </span>
                  <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    by
                  </span>
                </motion.div>
              </div>

              {/* Developer Name */}
              <div className="text-center mb-3">
                <p className="text-sm font-semibold bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 dark:from-rose-400 dark:via-pink-400 dark:to-red-400 bg-clip-text text-transparent">
                  Oussama Meqqadmi
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Full Stack Developer
                </p>
              </div>

              {/* Contact Info */}
              <motion.a
                href="tel:+212637510285"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-400/20 dark:to-indigo-400/20 hover:from-blue-500/20 hover:to-indigo-500/20 dark:hover:from-blue-400/30 dark:hover:to-indigo-400/30 p-3 rounded-lg border border-blue-200/50 dark:border-blue-700/50 transition-all duration-300 cursor-pointer"
              >
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-300"
                >
                  <Phone className="h-3 w-3 text-white" />
                </motion.div>
                <div className="text-center">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    +212 637 510 285
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Let's connect!
                  </p>
                </div>
              </motion.a>
            </motion.div>

            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500">
                © 2025 • All rights reserved
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
