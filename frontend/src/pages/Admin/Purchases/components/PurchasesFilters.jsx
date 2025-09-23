// src/pages/Admin/Purchases/components/PurchasesFilters.jsx
// Beautiful filters component with animations, search, date range, amount filters
// - Advanced filtering with supplier and user selection
// - Export functionality with loading states
// - Beautiful animations and hover effects
// - Responsive design with collapsible advanced filters

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Building2,
  User,
  X,
  ChevronDown,
  Sparkles,
  FileDown
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getSuppliers } from "@/api/Purchases";
import LoadingButton from "@/components/Spinners/LoadingButton";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

const expandVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2 }
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

export default function PurchasesFilters({
  onSearch,
  onNewPurchase,
  onFiltersChange,
  onExport,
  isExporting
}) {
  // Local state for filters
  const [search, setSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  // Debug: Log state changes
  console.log('📊 PurchasesFilters state:', {
    suppliersCount: suppliers.length,
    loadingSuppliers,
    showAdvanced
  });
  
  // Advanced filter state
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    supplierId: "",
    userId: ""
  });

  // Load suppliers for dropdown
  useEffect(() => {
    const loadSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const result = await getSuppliers({ per_page: 100 });
        setSuppliers(result.data || result || []);
        console.log('✅ Suppliers loaded:', result.data?.length || 0);
      } catch (error) {
        console.error("Failed to load suppliers:", error);
        // Set empty array so the UI doesn't stay loading forever
        setSuppliers([]);
        // Add a timeout to prevent infinite loading
        setTimeout(() => setLoadingSuppliers(false), 2000);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    
    // Add timeout as fallback in case the request hangs
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Suppliers loading timeout, setting empty array');
      setSuppliers([]);
      setLoadingSuppliers(false);
    }, 5000); // 5 second timeout
    
    loadSuppliers().finally(() => clearTimeout(timeoutId));
  }, []);

  // Handle search input without auto-triggering
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  // Handle search button click
  const handleSearchSubmit = useCallback(() => {
    onSearch?.(search);
  }, [onSearch, search]);

  // Handle Enter key in search input
  const handleSearchKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);

  // Handle filter changes (no auto-trigger)
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Don't auto-trigger anymore - wait for button click
  }, [filters]);

  // Apply filters button handler
  const handleApplyFilters = useCallback(() => {
    // Remove empty filters
    const cleanFilters = Object.entries(filters).reduce((acc, [k, v]) => {
      if (v !== "" && v !== null && v !== undefined) {
        acc[k] = v;
      }
      return acc;
    }, {});
    
    // Apply search and filters
    onSearch?.(search);
    onFiltersChange?.(cleanFilters);
  }, [filters, search, onSearch, onFiltersChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const emptyFilters = {
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
      supplierId: "",
      userId: ""
    };
    setFilters(emptyFilters);
    setSearch("");
    onSearch?.("");
    onFiltersChange?.({});
  }, [onSearch, onFiltersChange]);

  // Check if any filters are active
  const hasActiveFilters = search || Object.values(filters).some(v => v !== "");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6"
    >
      {/* Main Filter Row */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Search */}
        <motion.div variants={itemVariants} className="flex-1 min-w-[300px]">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="absolute inset-y-0 left-0 flex items-center pl-4"
            >
              <Search className="h-5 w-5 text-emerald-500" />
            </motion.div>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search purchases, suppliers, products..."
              className="w-full pl-12 pr-20 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all duration-300 bg-white/50 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    handleSearchChange("");
                    onSearch?.("");
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Advanced Filters Toggle */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
              showAdvanced || hasActiveFilters
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Filters</span>
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 ml-1" />
            </motion.div>
            {hasActiveFilters && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-2 bg-white/20 text-xs px-2 py-1 rounded-full"
              >
                {Object.values(filters).filter(v => v !== "").length + (search ? 1 : 0)}
              </motion.div>
            )}
          </motion.button>

          {/* Export Button */}
          <motion.div variants={itemVariants}>
            <LoadingButton
              onClick={onExport}
              loading={isExporting}
              loadingMessage="Exporting..."
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </LoadingButton>
          </motion.div>

          {/* New Purchase Button */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewPurchase}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="h-5 w-5 mr-2" />
            </motion.div>
            <span className="font-medium">New Purchase</span>
          </motion.button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="border-t border-gray-200 pt-6"
          >
            <div className="flex items-center mb-4">
              <Sparkles className="h-5 w-5 text-emerald-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Advanced Filters</h3>
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearFilters}
                  className="ml-auto text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  Clear All
                </motion.button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date From */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 text-emerald-500 mr-2" />
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all duration-300"
                />
              </motion.div>

              {/* Date To */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-2"
              >
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 text-emerald-500 mr-2" />
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all duration-300"
                />
              </motion.div>

              {/* Supplier Filter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Building2 className="h-4 w-4 text-emerald-500 mr-2" />
                  Supplier
                </label>
                <select
                  value={filters.supplierId}
                  onChange={(e) => handleFilterChange("supplierId", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all duration-300 bg-white"
                  disabled={loadingSuppliers}
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </motion.div>

              {/* Min Amount */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-2"
              >
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <DollarSign className="h-4 w-4 text-emerald-500 mr-2" />
                  Min Amount
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all duration-300"
                />
              </motion.div>

              {/* Max Amount */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <DollarSign className="h-4 w-4 text-emerald-500 mr-2" />
                  Max Amount
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all duration-300"
                />
              </motion.div>
            </div>
            
            {/* Apply Filters Button */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilters}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </motion.button>
              
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearFilters}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </motion.button>
              )}
            </div>

            {/* Active Filters Display */}
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    
                    {search && (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        Search: "{search}"
                        <button
                          onClick={() => handleSearchChange("")}
                          className="ml-2 hover:text-emerald-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.span>
                    )}
                    
                    {Object.entries(filters).map(([key, value]) => {
                      if (!value) return null;
                      
                      const labels = {
                        dateFrom: "From",
                        dateTo: "To",
                        minAmount: "Min",
                        maxAmount: "Max",
                        supplierId: "Supplier",
                        userId: "User"
                      };
                      
                      let displayValue = value;
                      if (key === 'supplierId') {
                        const supplier = suppliers.find(s => s.id == value);
                        displayValue = supplier?.name || value;
                      }
                      
                      return (
                        <motion.span
                          key={key}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {labels[key]}: {displayValue}
                          <button
                            onClick={() => handleFilterChange(key, "")}
                            className="ml-2 hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.span>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}