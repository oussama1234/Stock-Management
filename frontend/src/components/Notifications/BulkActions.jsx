// BulkActions.jsx - Bulk actions component for notifications
import { motion } from 'framer-motion';
import { CheckCheck, Trash2, X, Square, CheckSquare, Loader2 } from 'lucide-react';

const BulkActions = ({
  selectedCount,
  isAllSelected,
  onSelectAll,
  onClearSelection,
  onBulkMarkAsRead,
  onBulkDelete,
  actionLoading
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Selection info */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onSelectAll}
              className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              title={isAllSelected ? 'Deselect all' : 'Select all'}
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {selectedCount} notification{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onBulkMarkAsRead}
              disabled={actionLoading.bulkMarkingAsRead}
              className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md text-sm font-medium transition-colors"
            >
              {actionLoading.bulkMarkingAsRead ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Mark as read
            </button>

            <button
              onClick={onBulkDelete}
              disabled={actionLoading.bulkDeleting}
              className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md text-sm font-medium transition-colors"
            >
              {actionLoading.bulkDeleting ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default BulkActions;
