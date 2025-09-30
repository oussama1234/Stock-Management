// src/pages/Inventory/components/modals/AdjustmentConfirmationModal.jsx
// Confirmation modal for inventory adjustments
import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, TrendingUp, TrendingDown, Package } from 'lucide-react';

const AdjustmentConfirmationModal = memo(function AdjustmentConfirmationModal({ 
  open, 
  onOpenChange, 
  data, 
  onConfirm, 
  loading = false 
}) {
  if (!open || !data) return null;

  const adjustment = Number(data.new_quantity) - Number(data.current_quantity);
  const isIncrease = adjustment > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => !loading && onOpenChange(false)}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isIncrease 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {isIncrease ? (
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Confirm Adjustment
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review the changes before applying
                </p>
              </div>
            </div>
            {!loading && (
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Product Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Package className="w-8 h-8 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {data.productName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {data.reason}
                </div>
              </div>
            </div>

            {/* Adjustment Summary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Current Quantity:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {data.current_quantity}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">New Quantity:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {data.new_quantity}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">Adjustment:</span>
                <span className={`font-semibold text-lg ${
                  isIncrease ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isIncrease ? '+' : ''}{adjustment}
                </span>
              </div>
            </div>

            {/* Notes */}
            {data.notes && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Notes:
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {data.notes}
                </div>
              </div>
            )}

            {/* Warning for large adjustments */}
            {Math.abs(adjustment) > 50 && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Large Adjustment Detected
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    This adjustment is significant. Please verify the quantity is correct.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Applying...' : 'Confirm Adjustment'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default AdjustmentConfirmationModal;