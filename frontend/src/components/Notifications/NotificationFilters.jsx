// NotificationFilters.jsx - Filter controls for notifications
import { useState } from 'react';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { NotificationTypes, NotificationPriorities } from '@/api/Notifications';

const NotificationFilters = ({ filters, onFilterChange, sorting, onSortingChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterUpdate = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleSortChange = (field) => {
    const newDirection = sorting.field === field && sorting.direction === 'desc' ? 'asc' : 'desc';
    onSortingChange({ field, direction: newDirection });
  };

  const clearFilters = () => {
    onFilterChange({
      readStatus: 'all',
      type: '',
      priority: '',
      category: 'all',
      searchTerm: ''
    });
  };

  const hasActiveFilters = filters.readStatus !== 'all' || filters.type || filters.priority || 
                          filters.category !== 'all' || filters.searchTerm;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterUpdate('searchTerm', e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {filters.searchTerm && (
              <button
                onClick={() => handleFilterUpdate('searchTerm', '')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Read Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filters.readStatus}
            onChange={(e) => handleFilterUpdate('readStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All notifications</option>
            <option value="unread">Unread only</option>
            <option value="read">Read only</option>
          </select>
        </div>

        {isExpanded && (
          <>
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterUpdate('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All types</option>
                <option value={NotificationTypes.LOW_STOCK}>Low Stock</option>
                <option value={NotificationTypes.SALE_CREATED}>Sale Created</option>
                <option value={NotificationTypes.PURCHASE_CREATED}>Purchase Created</option>
                <option value={NotificationTypes.STOCK_UPDATED}>Stock Updated</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterUpdate('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All priorities</option>
                <option value={NotificationPriorities.URGENT}>Urgent</option>
                <option value={NotificationPriorities.HIGH}>High</option>
                <option value={NotificationPriorities.MEDIUM}>Medium</option>
                <option value={NotificationPriorities.LOW}>Low</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterUpdate('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All categories</option>
                <option value="inventory">Inventory</option>
                <option value="sales">Sales</option>
                <option value="purchases">Purchases</option>
                <option value="system">System</option>
              </select>
            </div>
          </>
        )}

        {/* Sorting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort by
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSortChange('created_at')}
              className={`flex items-center justify-center px-3 py-2 text-sm border rounded-md transition-colors ${
                sorting.field === 'created_at'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Date
              {sorting.field === 'created_at' && (
                sorting.direction === 'desc' ? <SortDesc className="ml-1 h-3 w-3" /> : <SortAsc className="ml-1 h-3 w-3" />
              )}
            </button>
            <button
              onClick={() => handleSortChange('priority')}
              className={`flex items-center justify-center px-3 py-2 text-sm border rounded-md transition-colors ${
                sorting.field === 'priority'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Priority
              {sorting.field === 'priority' && (
                sorting.direction === 'desc' ? <SortDesc className="ml-1 h-3 w-3" /> : <SortAsc className="ml-1 h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationFilters;