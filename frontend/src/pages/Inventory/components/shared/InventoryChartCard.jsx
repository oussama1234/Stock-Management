// src/pages/Inventory/components/shared/InventoryChartCard.jsx
// High-performance chart card with beautiful modern design
import React, { memo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Loader2 } from 'lucide-react';

const InventoryChartCard = memo(function InventoryChartCard({
  title,
  subtitle,
  children,
  className = '',
  animationDelay = 0,
  height = 'h-80',
  loading = false,
  error = null,
  actions = null,
  icon: Icon = BarChart3,
  variant = 'default'
}) {
  const variants = {
    default: 'border-gray-200 dark:border-gray-700',
    primary: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10',
    success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10',
    warning: 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10'
  };

  const borderClass = variants[variant] || variants.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: animationDelay,
        type: "spring",
        stiffness: 100
      }}
      className={`
        relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800
        border ${borderClass}
        shadow-sm hover:shadow-lg transition-all duration-300
        backdrop-blur-sm
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 shadow-sm">
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`relative ${height}`}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Loading chart...</span>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-3">
                <Icon className="w-6 h-6 text-red-500" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Failed to load chart
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {error}
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: animationDelay + 0.2 }}
            className="w-full h-full p-6 pt-2"
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              }
            >
              {children}
            </Suspense>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

export default InventoryChartCard;