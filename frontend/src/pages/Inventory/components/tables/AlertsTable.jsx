// src/pages/Inventory/components/tables/AlertsTable.jsx
// Modern alerts table component with actions
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Package, Eye, ShoppingCart, Settings, 
  TrendingDown, Clock, Bell
} from 'lucide-react';

const getAlertSeverity = (stock, threshold) => {
  if (stock <= 0) return { level: 'critical', label: 'Critical', color: 'red' };
  if (stock <= Math.min(threshold * 0.3, 5)) return { level: 'high', label: 'High', color: 'orange' };
  if (stock <= threshold) return { level: 'medium', label: 'Medium', color: 'yellow' };
  return { level: 'low', label: 'Low', color: 'blue' };
};

const AlertBadge = memo(function AlertBadge({ stock, threshold }) {
  const severity = getAlertSeverity(stock, threshold);
  
  const variants = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const icons = {
    critical: AlertTriangle,
    high: TrendingDown,
    medium: Clock,
    low: Bell
  };

  const Icon = icons[severity.level];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${variants[severity.level]}`}>
      <Icon className="w-3 h-3" />
      {severity.label}
    </span>
  );
});

const AlertsTable = memo(function AlertsTable({ data = [], threshold = 10, onQuickAction }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No alerts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="space-y-2">
        {data.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {item.category_name} • Stock: {item.stock || 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <AlertBadge stock={item.stock || 0} threshold={item.low_stock_threshold || threshold} />
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onQuickAction?.(item, 'view')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                
                <button
                  onClick={() => onQuickAction?.(item, 'reorder')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title="Reorder"
                >
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                </button>
                
                <button
                  onClick={() => onQuickAction?.(item, 'adjust')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title="Adjust stock"
                >
                  <Settings className="w-4 h-4 text-orange-500" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

export default AlertsTable;