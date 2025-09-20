// src/pages/Admin/Sales/components/SalesFilters.jsx
// Search and action bar for the Sales page.
// - Provides a search input that filters by customer, product, category, user
// - Emits onSearch callback with debounced text
// - Includes a "New Sale" button to open the sale modal

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Filter, Plus, Search, Download, Calendar, X, DollarSign } from "lucide-react";
import { AxiosClient } from "@/api/AxiosClient";

export default function SalesFilters({ onSearch, onNewSale, onFiltersChange }) {
  const [text, setText] = useState("");
  const [appliedText, setAppliedText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'sale_date',
    sortOrder: 'desc'
  });
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'sale_date',
    sortOrder: 'desc'
  });
  const [exporting, setExporting] = useState(false);

  // Apply search and filters
  const applyFilters = useCallback(() => {
    setAppliedText(text);
    setAppliedFilters(filters);
    onSearch?.(text);
    onFiltersChange?.(filters);
  }, [text, filters, onSearch, onFiltersChange]);

  // Apply on Enter key
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  }, [applyFilters]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    const defaultFilters = {
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'sale_date',
      sortOrder: 'desc'
    };
    setText('');
    setFilters(defaultFilters);
    setAppliedText('');
    setAppliedFilters(defaultFilters);
    onSearch?.('');
    onFiltersChange?.(defaultFilters);
  }, [onSearch, onFiltersChange]);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams({
        search: appliedText,
        date_from: appliedFilters.dateFrom,
        date_to: appliedFilters.dateTo,
        format: 'csv'
      });
      
      const response = await AxiosClient.get(`/sales/export?${params}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [appliedText, appliedFilters.dateFrom, appliedFilters.dateTo]);

  return (
    <div className="mb-6 space-y-4">
      {/* Main filter row */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search field */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search by customer, product, category, user..."
            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-300"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={applyFilters}
            className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors duration-300 flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            Apply
          </button>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-300 flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors duration-300 flex items-center disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewSale}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 flex items-center shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Sale
          </motion.button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 rounded-xl p-4 border border-gray-200"
        >
          <div className="space-y-4">
            {/* Date Range Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Amount Range Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Min Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter('minAmount', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Max Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxAmount}
                  onChange={(e) => updateFilter('maxAmount', e.target.value)}
                  placeholder="1000.00"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Sorting Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="sale_date">Date</option>
                  <option value="total_amount">Amount</option>
                  <option value="customer_name">Customer</option>
                  <option value="created_at">Created</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => updateFilter('sortOrder', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <div className="text-sm text-gray-600">
              {(appliedText || appliedFilters.dateFrom || appliedFilters.dateTo || appliedFilters.minAmount || appliedFilters.maxAmount) && (
                <span>Filters active: 
                  {appliedText && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1">Search</span>} 
                  {appliedFilters.dateFrom && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-1">Date Range</span>}
                  {appliedFilters.minAmount && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-1">Min Amount</span>}
                  {appliedFilters.maxAmount && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-1">Max Amount</span>}
                  {appliedFilters.sortBy !== 'sale_date' && <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs mr-1">Custom Sort</span>}
                </span>
              )}
            </div>
            <div className="space-x-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              >
                <Search className="h-4 w-4 mr-1" />
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
