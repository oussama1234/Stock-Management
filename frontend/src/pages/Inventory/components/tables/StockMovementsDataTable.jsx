// src/pages/Inventory/components/tables/StockMovementsDataTable.jsx
// Comprehensive data table for stock movements with full functionality
import React, { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  User, 
  Calendar, 
  FileText,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Edit3,
  MoreHorizontal,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { getInventoryHistory, exportInventoryHistory } from '@/api/Inventory';

const StockMovementsDataTable = memo(function StockMovementsDataTable({ className = '' }) {
  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(true);
  const [exporting, setExporting] = useState(false);
  const abortRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Sample data for fallback
  const sampleData = useMemo(() => [
    {
      id: 1,
      product_id: 15,
      product_name: 'Wireless Bluetooth Headphones',
      type: 'in',
      quantity: 15,
      previous_stock: 25,
      current_stock: 40,
      user_name: 'John Smith',
      reason: 'Stock replenishment',
      notes: 'New shipment received from supplier ABC',
      created_at: '2024-01-28T10:30:00Z'
    },
    {
      id: 2,
      product_id: 8,
      product_name: 'Gaming Mechanical Keyboard',
      type: 'out',
      quantity: 3,
      previous_stock: 12,
      current_stock: 9,
      user_name: 'Sarah Johnson',
      reason: 'Damaged items',
      notes: 'Water damage during transport',
      created_at: '2024-01-27T14:15:00Z'
    },
    {
      id: 3,
      product_id: 22,
      product_name: 'USB-C Charging Cable',
      type: 'in',
      quantity: 25,
      previous_stock: 5,
      current_stock: 30,
      user_name: 'Mike Wilson',
      reason: 'Inventory correction',
      notes: 'Physical count adjustment after audit',
      created_at: '2024-01-26T09:45:00Z'
    },
    {
      id: 4,
      product_id: 33,
      product_name: 'Wireless Mouse',
      type: 'out',
      quantity: 2,
      previous_stock: 18,
      current_stock: 16,
      user_name: 'Emily Davis',
      reason: 'Customer return',
      notes: 'Defective units returned by customer',
      created_at: '2024-01-25T16:20:00Z'
    },
    {
      id: 5,
      product_id: 41,
      product_name: 'Portable SSD 1TB',
      type: 'in',
      quantity: 8,
      previous_stock: 12,
      current_stock: 20,
      user_name: 'David Brown',
      reason: 'Stock transfer',
      notes: 'Transfer from warehouse B to main storage',
      created_at: '2024-01-24T11:10:00Z'
    },
    {
      id: 6,
      product_id: 7,
      product_name: '4K Webcam',
      type: 'out',
      quantity: 1,
      previous_stock: 8,
      current_stock: 7,
      user_name: 'Lisa Chen',
      reason: 'Sale',
      notes: 'Online order #ORD-2024-0156',
      created_at: '2024-01-23T13:45:00Z'
    },
    {
      id: 7,
      product_id: 19,
      product_name: 'Laptop Stand',
      type: 'in',
      quantity: 12,
      previous_stock: 3,
      current_stock: 15,
      user_name: 'Tom Anderson',
      reason: 'Purchase order',
      notes: 'Bulk order from new supplier',
      created_at: '2024-01-22T08:30:00Z'
    }
  ], []);

  // Initialize with sample data
  useEffect(() => {
    setData(sampleData);
    setTotalItems(sampleData.length);
    setTotalPages(Math.ceil(sampleData.length / pageSize));
  }, [sampleData, pageSize]);

  // Fetch data function
  const fetchData = useCallback(async (page = 1, size = pageSize) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      console.log('🔄 [StockMovementsDataTable] Fetching data...', { page, size, sortBy, sortOrder, searchTerm, typeFilter });
      setLoading(true);
      setError(null);

      const params = {
        page,
        per_page: size,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      const response = await getInventoryHistory(params);
      console.log('📊 [StockMovementsDataTable] API Response:', response);

      const movements = response?.data || response || [];
      const meta = response?.meta || {};

      if (movements.length === 0 && page === 1) {
        console.log('⚠️ [StockMovementsDataTable] No data from API, keeping sample data');
        return;
      }

      // Transform API data
      const transformedData = movements.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || item.product?.name || `Product #${item.product_id}`,
        type: item.type,
        quantity: item.quantity,
        previous_stock: item.previous_stock,
        current_stock: item.current_stock || (item.previous_stock + (item.type === 'in' ? item.quantity : -item.quantity)),
        user_name: item.user_name || item.user?.name || 'System',
        reason: item.reason || (item.type === 'in' ? 'Stock In' : 'Stock Out'),
        notes: item.notes || item.description || '',
        created_at: item.created_at || item.date
      }));

      console.log('✅ [StockMovementsDataTable] Processed data:', transformedData);
      setData(transformedData);
      setCurrentPage(meta.current_page || page);
      setTotalPages(meta.last_page || Math.ceil((meta.total || transformedData.length) / size));
      setTotalItems(meta.total || transformedData.length);
      setUsingFallback(false);

    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('❌ [StockMovementsDataTable] API Error:', e);
        setError(e?.response?.data?.message || e.message);
        console.log('📊 [StockMovementsDataTable] Keeping sample data due to API error');
      }
    } finally {
      setLoading(false);
    }
  }, [pageSize, sortBy, sortOrder, searchTerm, typeFilter]);

  // Ref to store current fetchData function to avoid dependency issues
  const fetchDataRef = useRef();
  fetchDataRef.current = fetchData;

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1);
        fetchDataRef.current(1, pageSize);
      }
    }, 500); // 500ms delay for search

    // If searchTerm is empty, fetch immediately
    if (searchTerm === '') {
      setCurrentPage(1);
      fetchDataRef.current(1, pageSize);
    }

    return () => clearTimeout(timeoutId);
  }, [searchTerm, pageSize]);

  // Effect for other filters (immediate)
  useEffect(() => {
    setCurrentPage(1);
    fetchDataRef.current(1, pageSize);
  }, [sortBy, sortOrder, typeFilter, pageSize]);

  // Initial data fetch - only on mount
  useEffect(() => {
    fetchDataRef.current(1, pageSize);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      console.log('📤 [StockMovementsDataTable] Starting export...');
      
      const params = {
        sort_by: sortBy,
        sort_order: sortOrder
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      const blob = await exportInventoryHistory(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stock-movements-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [StockMovementsDataTable] Export completed');
    } catch (e) {
      console.error('❌ [StockMovementsDataTable] Export failed:', e);
      // Fallback: export sample data as JSON
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stock-movements-fallback-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [sortBy, sortOrder, searchTerm, typeFilter, data]);

  // Handle sorting
  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy]);

  // Handle pagination
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    fetchData(page, pageSize);
  }, [fetchData, pageSize]);

  // Handle page size change
  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
    fetchData(1, size);
  }, [fetchData]);

  // Handle search - only update state, useEffect handles the API call
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // Handle filter - only update state, useEffect handles the API call
  const handleFilter = useCallback((type) => {
    setTypeFilter(type);
  }, []);

  // Helper functions
  const getMovementIcon = (type, quantity) => {
    if (type === 'in') return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (type === 'out') return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getMovementBadge = (type, quantity) => {
    const isPositive = type === 'in';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isPositive 
          ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
          : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      }`}>
        {getMovementIcon(type, quantity)}
        {isPositive ? '+' : '-'}{Math.abs(quantity)}
      </span>
    );
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <SortAsc className="w-4 h-4 opacity-30" />;
    return sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-blue-500" /> : <SortDesc className="w-4 h-4 text-blue-500" />;
  };

  // Render table header
  const renderTableHeader = () => (
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          onClick={() => handleSort('product_name')}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Product
            {getSortIcon('product_name')}
          </div>
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          onClick={() => handleSort('type')}
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Movement
            {getSortIcon('type')}
          </div>
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          onClick={() => handleSort('previous_stock')}
        >
          <div className="flex items-center gap-2">
            Previous Stock
            {getSortIcon('previous_stock')}
          </div>
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          onClick={() => handleSort('current_stock')}
        >
          <div className="flex items-center gap-2">
            Current Stock
            {getSortIcon('current_stock')}
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reason
          </div>
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          onClick={() => handleSort('user_name')}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            User
            {getSortIcon('user_name')}
          </div>
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          onClick={() => handleSort('created_at')}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date
            {getSortIcon('created_at')}
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );

  // Render table row
  const renderTableRow = (item, index) => (
    <motion.tr
      key={item.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Package className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {item.product_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ID: {item.product_id}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getMovementBadge(item.type, item.quantity)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {item.previous_stock}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        <span className="font-medium">{item.current_stock}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {item.reason}
        </span>
        {item.notes && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {item.notes.length > 50 ? `${item.notes.substring(0, 50)}...` : item.notes}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          {item.user_name}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-blue-500 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );

  // Render pagination
  const renderPagination = () => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Stock Movements
          </h3>
          {usingFallback && (
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
              Sample Data
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-64"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => handleFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData(currentPage, pageSize)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading movements...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50 text-red-400" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && data.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              {renderTableHeader()}
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {data.map((item, index) => renderTableRow(item, index))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && data.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400">No stock movements found</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default StockMovementsDataTable;