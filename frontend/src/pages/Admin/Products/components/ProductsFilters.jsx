import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  SlidersHorizontal,
  Grid,
  List,
  ArrowUpDown,
  Check,
  Package,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useProductsData } from '../contexts/ProductsContext';

const ProductsFilters = memo(() => {
  const {
    searchTerm,
    categoryFilter,
    stockFilter,
    sortBy,
    sortOrder,
    viewMode,
    filterOptions,
    selectedCount,
    isAllSelected,
    handleSearchChange,
    handleClearSearch,
    handleCategoryFilter,
    handleStockFilter,
    handleSortChange,
    handleClearFilters,
    handleViewModeChange,
    handleSelectAll,
    handleClearSelection,
    ensureCategoriesLoaded,
  } = useProductsData();

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Load categories when needed
  useEffect(() => {
    ensureCategoriesLoaded();
  }, [ensureCategoriesLoaded]);

  // Sync local search with context
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchChange(localSearchTerm);
    }
  };

  const handleSearchSubmit = () => {
    handleSearchChange(localSearchTerm);
  };

  const handleLocalSearchChange = (value) => {
    setLocalSearchTerm(value);
  };

  const handleClearLocalSearch = () => {
    setLocalSearchTerm('');
    handleClearSearch();
  };

  const activeFiltersCount = [
    searchTerm,
    categoryFilter,
    stockFilter,
    sortBy !== 'name' || sortOrder !== 'asc',
  ].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-8"
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        {/* Main Filter Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={localSearchTerm}
              onChange={(e) => handleLocalSearchChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search products by name, category, or description..."
              className="pl-12 pr-12 py-4 w-full rounded-xl bg-white/70 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-500 shadow-sm"
            />
            {localSearchTerm && (
              <button
                onClick={handleClearLocalSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-3 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearchSubmit}
              className="group px-6 py-4 bg-white/90 text-gray-700 rounded-xl hover:bg-white border border-gray-200 hover:border-blue-300 transition-all duration-300 flex items-center shadow-sm hover:shadow-md"
            >
              <Search className="h-4 w-4 mr-2 text-blue-500 group-hover:text-blue-600" />
              <span className="font-medium">Search</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className={`group px-6 py-4 rounded-xl transition-all duration-300 flex items-center shadow-sm hover:shadow-md ${
                isFiltersExpanded
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/90 text-gray-700 border border-gray-200 hover:border-purple-300'
              }`}
            >
              <SlidersHorizontal className={`h-4 w-4 mr-2 ${isFiltersExpanded ? 'text-white' : 'text-purple-500 group-hover:text-purple-600'}`} />
              <span className="font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                  isFiltersExpanded
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${
                isFiltersExpanded ? 'rotate-180' : ''
              }`} />
            </motion.button>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleViewModeChange('table')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Advanced Filters (Expandable) */}
        <AnimatePresence>
          {isFiltersExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-gray-200/50 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={(e) => handleCategoryFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 appearance-none"
                    >
                      <option value="">All Categories</option>
                      {filterOptions.categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Stock Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Level
                  </label>
                  <div className="relative">
                    <select
                      value={stockFilter}
                      onChange={(e) => handleStockFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 appearance-none"
                    >
                      {filterOptions.stockLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value, sortOrder)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 appearance-none"
                    >
                      {filterOptions.sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSortChange(sortBy, 'asc')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        sortOrder === 'asc'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      A→Z
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSortChange(sortBy, 'desc')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        sortOrder === 'desc'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Z→A
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50">
                {/* Bulk Selection */}
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200"
                  >
                    <div className={`w-4 h-4 border-2 border-blue-500 rounded flex items-center justify-center ${
                      isAllSelected ? 'bg-blue-500' : 'bg-white'
                    }`}>
                      {isAllSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium">Select All</span>
                  </motion.button>
                  
                  {selectedCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center space-x-2 text-sm text-blue-600"
                    >
                      <span>{selectedCount} selected</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClearSelection}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  )}
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-medium transition-colors duration-200"
                  >
                    Clear All Filters
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results Info */}
        {searchTerm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-gray-200/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <Search className="h-4 w-4 mr-2" />
                Search results for 
                <span className="mx-2 px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                  "{searchTerm}"
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearSearch}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear Search
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

ProductsFilters.displayName = 'ProductsFilters';

export default ProductsFilters;