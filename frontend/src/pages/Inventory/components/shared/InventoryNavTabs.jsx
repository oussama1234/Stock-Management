// src/pages/Inventory/components/shared/InventoryNavTabs.jsx
// Modern navigation tabs with smooth animations and active states
import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  InventoryRoute, 
  InventoryListRoute, 
  InventoryAdjustmentsRoute, 
  InventoryLowStockRoute 
} from '@/router/Index';

const InventoryNavTabs = memo(function InventoryNavTabs({ className = '' }) {
  const location = useLocation();

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      path: InventoryRoute,
      icon: LayoutDashboard,
      description: 'Dashboard & analytics'
    },
    {
      id: 'list',
      label: 'Inventory',
      path: InventoryListRoute,
      icon: Package,
      description: 'Product inventory'
    },
    {
      id: 'adjustments',
      label: 'Adjustments',
      path: InventoryAdjustmentsRoute,
      icon: Settings,
      description: 'Stock adjustments'
    },
    {
      id: 'alerts',
      label: 'Low Stock',
      path: InventoryLowStockRoute,
      icon: AlertTriangle,
      description: 'Stock alerts'
    }
  ];

  const activeTab = tabs.find(tab => {
    if (tab.path === InventoryRoute) {
      return location.pathname === InventoryRoute;
    }
    return location.pathname.startsWith(tab.path);
  })?.id || 'overview';

  return (
    <div className={`flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit ${className}`}>
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;

        return (
          <Link
            key={tab.id}
            to={tab.path}
            className="relative group"
            title={tab.description}
          >
            <motion.div
              className={`
                relative flex items-center gap-3 px-4 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}

              {/* Icon */}
              <motion.div
                className="relative z-10 flex items-center justify-center"
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="w-4 h-4" />
              </motion.div>

              {/* Label */}
              <span className="relative z-10 whitespace-nowrap">
                {tab.label}
              </span>

              {/* Indicator dot for active state */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="relative z-10 w-2 h-2 rounded-full bg-blue-500 ml-1"
                />
              )}
            </motion.div>

            {/* Tooltip on hover (optional enhancement) */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap">
                {tab.description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
});

export default InventoryNavTabs;