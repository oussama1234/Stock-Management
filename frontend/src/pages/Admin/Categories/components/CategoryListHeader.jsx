// src/pages/Admin/Categories/components/CategoryListHeader.jsx
// Enhanced header with search, filters, and actions
import { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  RefreshCw,
  SlidersHorizontal,
  X,
  CheckCircle,
  AlertCircle,
  Minus
} from 'lucide-react';

const CategoryListHeader = memo(function CategoryListHeader({
  title = 'Categories Management',
  subtitle,
  totalCount = 0,
  filteredCount = 0,
  searchValue = '',
  onSearchChange,
  onAddNew,
  onRefresh,
  onExport,
  isLoading = false,
  isExporting = false,
  selectedCount = 0
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [profitFilter, setProfitFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSearchChange = useCallback((e) => {
    onSearchChange?.(e.target.value);
  }, [onSearchChange]);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const handleAddNew = useCallback(() => {
    onAddNew?.();
  }, [onAddNew]);

  const handleExport = useCallback(() => {
    onExport?.();
  }, [onExport]);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleProfitFilterChange = useCallback((value) => {
    setProfitFilter(value);
    // You can add callback here to notify parent component
  }, []);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
    // You can add callback here to notify parent component
  }, []);

  const clearFilters = useCallback(() => {
    setProfitFilter('all');
    setStatusFilter('all');
    onSearchChange?.('');
  }, [onSearchChange]);

  const hasActiveFilters = profitFilter !== 'all' || statusFilter !== 'all' || searchValue;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 space-y-4">
      {/* Main Header Row */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900"
          >
            {title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-gray-600"
          >
            {subtitle || `Showing ${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()} categories`}
            {selectedCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {selectedCount} selected
              </span>
            )}
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={isExporting || totalCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
            <span className="text-sm font-medium">
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium">Add Category</span>
          </motion.button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
          />
          {searchValue && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSearchChange?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </div>

        {/* Filter Toggle */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleFilters}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
            showFilters || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </motion.button>

        {hasActiveFilters && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            Clear all
          </motion.button>
        )}
      </div>

      {/* Expandable Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Profitability Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Profitability</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All', icon: Minus },
                    { value: 'profitable', label: 'Profitable', icon: CheckCircle },
                    { value: 'losing', label: 'Loss Making', icon: AlertCircle }
                  ].map(({ value, label, icon: Icon }) => (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleProfitFilterChange(value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                        profitFilter === value
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`h-3 w-3 ${
                        value === 'profitable' ? 'text-green-500' :
                        value === 'losing' ? 'text-red-500' : 'text-gray-400'
                      }`} />
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ].map(({ value, label }) => (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStatusFilterChange(value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                        statusFilter === value
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Quick Stats</label>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Total Categories: {totalCount}</div>
                  <div>Filtered Results: {filteredCount}</div>
                  {selectedCount > 0 && <div>Selected: {selectedCount}</div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CategoryListHeader;