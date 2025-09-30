// src/pages/Inventory/NewInventoryList.jsx
// High-performance inventory list with advanced filtering and modern design
import React, { memo, useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Search, Filter, Download, RefreshCw, Eye, Edit3,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Plus,
  Grid3X3, List, BarChart3, AlertTriangle
} from 'lucide-react';
import { getInventoryOverview } from '@/api/Inventory';
import { ProductsRoute } from '@/router/Index';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import InventoryNavTabs from './components/shared/InventoryNavTabs';
import InventoryKpiCard from './components/shared/InventoryKpiCard';

// Lazy load components
const ProductCard = React.lazy(() => import('./components/cards/ProductCard'));
const ExportModal = React.lazy(() => import('./components/modals/ExportModal'));

// Status badge component
const StatusBadge = memo(function StatusBadge({ stock, reserved, available, lowStockThreshold = 10 }) {
  const availableStock = Number(available || 0);
  const totalStock = Number(stock || 0);
  
  let status = 'good';
  let label = 'Good Stock';
  let variant = 'success';
  
  if (availableStock <= 0) {
    status = 'out';
    label = 'Out of Stock';
    variant = 'danger';
  } else if (availableStock <= lowStockThreshold) {
    status = 'low';
    label = 'Low Stock';
    variant = 'warning';
  }

  const variants = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {label}
    </span>
  );
});

// Custom hook for inventory data management
const useInventoryList = (initialParams) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  const [debouncedSearch, setDebouncedSearch] = useState(initialParams.search || '');
  
  const abortRef = useRef(null);
  const hasLoadedRef = useRef(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(params.search || ''), 300);
    return () => clearTimeout(timer);
  }, [params.search]);

  const effectiveParams = useMemo(() => ({ 
    ...params, 
    search: debouncedSearch 
  }), [params, debouncedSearch]);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setError(null);
      if (!hasLoadedRef.current) setLoading(true);
      
      const response = await getInventoryOverview(effectiveParams);
      setData(response);
      hasLoadedRef.current = true;
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e?.response?.data?.message || e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveParams]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    params,
    setParams,
    refetch: fetchData,
    hasLoaded: hasLoadedRef.current
  };
};

// Custom hook for view management
const useViewState = () => {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const toggleFilters = useCallback(() => setShowFilters(prev => !prev), []);
  const toggleExport = useCallback(() => setShowExport(prev => !prev), []);

  return {
    viewMode,
    setViewMode,
    showFilters,
    setShowFilters,
    toggleFilters,
    showExport,
    setShowExport,
    toggleExport
  };
};

const NewInventoryList = memo(function NewInventoryList() {
  const navigate = useNavigate();
  const initialParams = {
    page: 1,
    per_page: 20,
    search: '',
    stock_status: '',
    sort_by: 'name',
    sort_order: 'asc',
    category_id: null
  };

  const { data, loading, error, params, setParams, refetch, hasLoaded } = useInventoryList(initialParams);
  const { viewMode, setViewMode, showFilters, toggleFilters, showExport, toggleExport } = useViewState();

  const items = data?.data || [];
  const meta = data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: params.per_page };

  // Memoized calculations
  const summary = useMemo(() => {
    if (!items.length) return { totalProducts: 0, totalStock: 0, lowStock: 0, outOfStock: 0 };
    
    return items.reduce((acc, item) => {
      acc.totalProducts += 1;
      acc.totalStock += Number(item.stock || 0);
      
      const available = Number(item.available_stock || 0);
      if (available <= 0) acc.outOfStock += 1;
      else if (available <= 10) acc.lowStock += 1;
      
      return acc;
    }, { totalProducts: 0, totalStock: 0, lowStock: 0, outOfStock: 0 });
  }, [items]);

  // Categories from current items
  const categories = useMemo(() => {
    const categoryMap = new Map();
    items.forEach(item => {
      const id = item.category_id ?? item.category?.id;
      const name = item.category_name ?? item.category?.name;
      if (id && name) categoryMap.set(id, name);
    });
    return Array.from(categoryMap, ([id, name]) => ({ id, name }));
  }, [items]);

  // Pagination helpers
  const pagination = useMemo(() => {
    const current = meta.current_page || 1;
    const last = meta.last_page || 1;
    const maxVisible = 7;
    
    if (last <= maxVisible) {
      return Array.from({ length: last }, (_, i) => i + 1);
    }
    
    const pages = [1];
    let start = Math.max(2, current - 2);
    let end = Math.min(last - 1, current + 2);
    
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < last - 1) pages.push('...');
    pages.push(last);
    
    return pages;
  }, [meta.current_page, meta.last_page]);

  // Event handlers
  const handleSort = useCallback((field) => {
    setParams(prev => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  }, [setParams]);

  const handlePageChange = useCallback((page) => {
    setParams(prev => ({ ...prev, page }));
  }, [setParams]);

  const handleProductClick = useCallback((productId) => {
    navigate(`${ProductsRoute}/${productId}`);
  }, [navigate]);

  const SortButton = memo(({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1 text-left font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
    >
      {children}
      {params.sort_by === field ? (
        params.sort_order === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
      ) : (
        <ArrowUpDown className="w-4 h-4 opacity-50" />
      )}
    </button>
  ));

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
            <Package className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Inventory List
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your product inventory
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          
          <button
            onClick={() => navigate(ProductsRoute)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Product</span>
          </button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <InventoryNavTabs />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InventoryKpiCard
          title="Total Products"
          value={summary.totalProducts}
          icon={Package}
          variant="primary"
          animationDelay={0}
          subtitle="In inventory"
        />
        <InventoryKpiCard
          title="Total Stock"
          value={summary.totalStock}
          icon={BarChart3}
          variant="success"
          animationDelay={0.1}
          subtitle="Units available"
        />
        <InventoryKpiCard
          title="Low Stock"
          value={summary.lowStock}
          icon={AlertTriangle}
          variant="warning"
          animationDelay={0.2}
          subtitle="Need attention"
        />
        <InventoryKpiCard
          title="Out of Stock"
          value={summary.outOfStock}
          icon={AlertTriangle}
          variant="danger"
          animationDelay={0.3}
          subtitle="No stock"
        />
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={params.search}
              onChange={(e) => setParams(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-10 pr-4 py-2 w-64 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={params.stock_status}
            onChange={(e) => setParams(prev => ({ ...prev, stock_status: e.target.value, page: 1 }))}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
          >
            <option value="">All Status</option>
            <option value="in">Good Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          {/* Category Filter */}
          <select
            value={params.category_id || ''}
            onChange={(e) => setParams(prev => ({ ...prev, category_id: e.target.value ? Number(e.target.value) : null, page: 1 }))}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={toggleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading && !hasLoaded ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center"
        >
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-medium mb-1">Error loading inventory</h3>
          <p className="text-sm opacity-90">{error}</p>
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 text-center"
        >
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No products found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Try adjusting your filters or add new products to your inventory
          </p>
          <button
            onClick={() => navigate(ProductsRoute)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </motion.div>
      ) : (
        <>
          {/* Table/Grid View */}
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <SortButton field="name">Product</SortButton>
                      </th>
                      <th className="px-6 py-4 text-right">
                        <SortButton field="stock">Stock</SortButton>
                      </th>
                      <th className="px-6 py-4 text-right">
                        <SortButton field="reserved_stock">Reserved</SortButton>
                      </th>
                      <th className="px-6 py-4 text-right">
                        <SortButton field="available_stock">Available</SortButton>
                      </th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group"
                        onClick={() => handleProductClick(item.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {item.name}
                              </div>
                              {item.category_name && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {item.category_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {new Intl.NumberFormat().format(item.stock || 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                          {new Intl.NumberFormat().format(item.reserved_stock || 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                          {new Intl.NumberFormat().format(item.available_stock || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            stock={item.stock}
                            reserved={item.reserved_stock}
                            available={item.available_stock}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(item.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                              title="More actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <Suspense fallback={<div>Loading...</div>}>
                {items.map((item, index) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onEdit={() => handleProductClick(item.id)}
                    animationDelay={index * 0.02}
                  />
                ))}
              </Suspense>
            </div>
          )}

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((meta.current_page - 1) * meta.per_page) + 1} to {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} results
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={meta.current_page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {pagination.map((page, index) => (
                  typeof page === 'number' ? (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        page === meta.current_page
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                      {page}
                    </span>
                  )
                ))}
                
                <button
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page >= meta.last_page}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(meta.last_page)}
                  disabled={meta.current_page >= meta.last_page}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Export Modal */}
      <Suspense fallback={null}>
        {showExport && (
          <ExportModal
            open={showExport}
            onClose={toggleExport}
            data={items}
            filename="inventory-list"
          />
        )}
      </Suspense>
    </div>
  );
});

export default NewInventoryList;