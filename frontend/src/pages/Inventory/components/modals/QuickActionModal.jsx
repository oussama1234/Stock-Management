// src/pages/Inventory/components/modals/QuickActionModal.jsx
// Modal for bulk actions on low stock items
import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Settings, Package, CheckCircle } from 'lucide-react';

const QuickActionModal = memo(function QuickActionModal({ 
  open, 
  onClose, 
  data = [], 
  onAction 
}) {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectedAction, setSelectedAction] = useState('');

  const handleSelectAll = () => {
    if (selectedItems.size === data.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleExecuteAction = () => {
    if (!selectedAction || selectedItems.size === 0) return;
    
    const selectedProducts = data.filter(item => selectedItems.has(item.id));
    selectedProducts.forEach(product => {
      onAction?.(product, selectedAction);
    });
    
    onClose();
  };

  const actions = [
    { id: 'reorder', label: 'Create Purchase Orders', icon: ShoppingCart, color: 'blue' },
    { id: 'adjust', label: 'Bulk Stock Adjustment', icon: Settings, color: 'orange' },
    { id: 'view', label: 'View Details', icon: Package, color: 'gray' }
  ];

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Bulk Actions
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select items and choose an action to perform
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Action Selection */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose Action
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {actions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => setSelectedAction(action.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedAction === action.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-2 ${
                        selectedAction === action.id ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      <div className={`text-sm font-medium ${
                        selectedAction === action.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {action.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Item Selection */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 pb-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Items ({selectedItems.size} of {data.length})
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedItems.size === data.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-6">
                <div className="space-y-2">
                  {data.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedItems.has(item.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedItems.has(item.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedItems.has(item.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.category_name} • Stock: {item.stock || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteAction}
              disabled={!selectedAction || selectedItems.size === 0}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Execute Action
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default QuickActionModal;