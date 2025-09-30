// src/pages/Admin/Categories/CategoryListEnhanced.jsx
// Enhanced categories list with performance optimizations and beautiful design
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, BarChart3, TrendingUp, Users, AlertTriangle, Download } from 'lucide-react';
import { CategoriesService } from '@/api/Categories';
import { useConfirm } from '@/components/ConfirmContext/ConfirmContext';
import { useToast } from '@/components/Toaster/ToastContext';

// Import local components directly (not lazy loaded since they're local)
import CategoryLoadingSkeleton from './components/CategoryLoadingSkeleton';
import CategoryStatsCard from './components/CategoryStatsCard';
import CategoryListHeader from './components/CategoryListHeader';
import CategoryDataTable from './components/CategoryDataTable';
// Keep modal lazy for performance
const CategoryFormModal = React.lazy(() => import('./CategoryFormModal'));

// Number formatting utilities
const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  const num = parseFloat(value);
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }
  
  const num = parseFloat(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(num);
};

// Custom hook for data management with optimizations
const useCategoryData = () => {
  const [state, setState] = useState({
    categories: [],
    loading: true,
    error: null,
    initialLoad: true,
  });

  const abortRef = useRef(null);
  const toast = useToast();

  const fetchCategories = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Add subtle delay for initial load to prevent flash
      if (state.initialLoad) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const response = await CategoriesService.list(
        { 
          min_sales: 0,
          min_purchases: 0,
          min_profit: -999999,
          per_page: 100 
        }, 
        { signal: controller.signal }
      );

      const data = Array.isArray(response?.data?.data) 
        ? response.data.data 
        : (Array.isArray(response?.data) ? response.data : []);

      // Debug logging to see what we're receiving
      console.log('Raw API response:', response);
      console.log('Extracted data:', data);

      // Normalize data structure with proper numeric parsing
      const normalizedData = data.map(cat => {
        console.log('Processing category:', cat);
        return {
          id: cat.id,
          name: cat.name || 'Unknown Category',
          description: cat.description || '',
          products_count: parseInt(cat.products_count) || 0,
          total_sold: parseFloat(cat.sold_qty) || 0,
          total_purchased: parseFloat(cat.purchased_qty) || 0,
          total_profit: parseFloat(cat.profit_estimate) || 0,
          created_at: cat.created_at
        };
      });

      console.log('Normalized data:', normalizedData);

      setState(prev => ({
        ...prev,
        categories: normalizedData,
        loading: false,
        initialLoad: false,
        error: null
      }));

    } catch (error) {
      if (error.name !== 'CanceledError' && error.message !== 'canceled') {
        setState(prev => ({
          ...prev,
          error: error?.response?.data?.message || error.message || 'Failed to load categories',
          categories: [],
          loading: false,
          initialLoad: false
        }));
      }
    }
  }, [state.initialLoad, toast]);

  useEffect(() => {
    fetchCategories();
    return () => abortRef.current?.abort();
  }, [fetchCategories]);

  return {
    ...state,
    refetch: fetchCategories
  };
};

// Custom hook for search and filtering
const useSearchAndFilter = (categories) => {
  const [searchValue, setSearchValue] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Memoized filtered and sorted data for performance
  const filteredData = useMemo(() => {
    let filtered = categories;

    // Apply search filter
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase();
      filtered = categories.filter(category => 
        category.name.toLowerCase().includes(search) ||
        (category.description || '').toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle numeric fields
      if (['total_sold', 'total_purchased', 'total_profit', 'products_count'].includes(sortField)) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [categories, searchValue, sortField, sortDirection]);

  const handleSearch = useCallback((value) => {
    setSearchValue(value);
  }, []);

  const handleSort = useCallback((field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  return {
    searchValue,
    filteredData,
    sortField,
    sortDirection,
    handleSearch,
    handleSort
  };
};

// Custom hook for selection management
const useSelection = () => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleSelect = useCallback((categoryId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selectAll) => {
    if (selectAll) {
      // This should be passed the visible categories from parent
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set());
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    handleSelect,
    handleSelectAll,
    clearSelection,
    setSelectedIds
  };
};

const CategoryListEnhanced = memo(function CategoryListEnhanced() {
  const { categories, loading, error, refetch } = useCategoryData();
  const { searchValue, filteredData, sortField, sortDirection, handleSearch, handleSort } = useSearchAndFilter(categories);
  const { selectedIds, selectedCount, handleSelect, handleSelectAll, clearSelection, setSelectedIds } = useSelection();
  
  const { confirm } = useConfirm();
  const toast = useToast();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Memoized statistics with proper number formatting
  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const totalProducts = categories.reduce((sum, cat) => {
      const count = parseFloat(cat.products_count) || 0;
      return sum + count;
    }, 0);
    const totalSold = categories.reduce((sum, cat) => {
      const sold = parseFloat(cat.total_sold) || 0;
      return sum + sold;
    }, 0);
    const totalProfit = categories.reduce((sum, cat) => {
      const profit = parseFloat(cat.total_profit) || 0;
      return sum + profit;
    }, 0);

    return [
      {
        title: 'Total Categories',
        value: formatNumber(totalCategories),
        rawValue: totalCategories,
        icon: Package,
        gradient: 'from-blue-500 to-indigo-500',
        bgGradient: 'from-blue-50 to-indigo-50',
        subtitle: 'Active categories',
        trend: totalCategories > 0 ? 'up' : null,
        trendValue: null
      },
      {
        title: 'Total Products',
        value: formatNumber(totalProducts),
        rawValue: totalProducts,
        icon: BarChart3,
        gradient: 'from-green-500 to-emerald-500',
        bgGradient: 'from-green-50 to-emerald-50',
        subtitle: 'Across all categories',
        trend: totalProducts > 0 ? 'up' : null,
        trendValue: null
      },
      {
        title: 'Units Sold',
        value: formatNumber(totalSold),
        rawValue: totalSold,
        icon: TrendingUp,
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50',
        subtitle: 'Total sales volume',
        trend: totalSold > 0 ? 'up' : totalSold < 0 ? 'down' : null,
        trendValue: null
      },
      {
        title: 'Total Profit',
        value: formatCurrency(totalProfit),
        rawValue: totalProfit,
        icon: Users,
        gradient: 'from-orange-500 to-red-500',
        bgGradient: 'from-orange-50 to-red-50',
        subtitle: 'Net profit',
        trend: totalProfit > 0 ? 'up' : totalProfit < 0 ? 'down' : null,
        trendValue: null
      }
    ];
  }, [categories]);

  // CRUD handlers
  const handleAdd = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((category) => {
    setEditing(category);
    setModalOpen(true);
  }, []);

  const handleView = useCallback((category) => {
    console.log('View category:', category);
    // TODO: Implement category details view
    toast.info(`Viewing ${category.name} - Details view coming soon!`);
  }, [toast]);

  const handleDelete = useCallback(async (category) => {
    const isConfirmed = await confirm({
      type: 'danger',
      title: 'Delete Category',
      description: `Are you sure you want to delete "${category.name}"? This action cannot be undone and may affect ${category.products_count || 0} products.`,
      confirmText: 'Delete Category',
      cancelText: 'Cancel'
    });
    
    if (!isConfirmed) return;
    
    try {
      await CategoriesService.remove(category.id);
      toast.success(`Category "${category.name}" deleted successfully`);
      refetch(false); // Refresh without showing loading
      clearSelection(); // Clear selections after delete
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to delete category');
    }
  }, [confirm, toast, refetch, clearSelection]);

  const handleSubmit = useCallback(async (payload) => {
    try {
      if (editing) {
        await CategoriesService.update(editing.id, payload);
        toast.success(`Category "${payload.name}" updated successfully`);
      } else {
        await CategoriesService.create(payload);
        toast.success(`Category "${payload.name}" created successfully`);
      }
      setModalOpen(false);
      refetch(false); // Refresh without showing loading
    } catch (error) {
      throw new Error(error?.response?.data?.message || error.message || 'Operation failed');
    }
  }, [editing, toast, refetch]);

  const handleExport = useCallback(async (selectedCategories = null) => {
    setIsExporting(true);
    try {
      // Mock export functionality - replace with actual export API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const categoriesToExport = selectedCategories || filteredData;
      const csvContent = [
        ['Name', 'Description', 'Products Count', 'Units Sold', 'Units Purchased', 'Total Profit'],
        ...categoriesToExport.map(cat => [
          cat.name,
          cat.description || '',
          cat.products_count,
          cat.total_sold,
          cat.total_purchased,
          cat.total_profit
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `categories-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${categoriesToExport.length} categories successfully`);
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [filteredData, toast]);

  // Update the handleSelectAll to work with visible filtered data
  const handleSelectAllFiltered = useCallback((selectAll) => {
    if (selectAll) {
      const visibleIds = new Set(filteredData.map(cat => cat.id));
      setSelectedIds(visibleIds);
    } else {
      clearSelection();
    }
  }, [filteredData, clearSelection, setSelectedIds]);

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto text-center"
        >
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Categories
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <CategoryLoadingSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <CategoryStatsCard
            key={stat.title}
            {...stat}
            animationDelay={index * 0.1}
          />
        ))}
      </div>

      {/* Header with Search and Actions */}
      <CategoryListHeader
        totalCount={categories.length}
        filteredCount={filteredData.length}
        searchValue={searchValue}
        selectedCount={selectedCount}
        onSearchChange={handleSearch}
        onAddNew={handleAdd}
        onRefresh={refetch}
        onExport={handleExport}
        isLoading={loading}
        isExporting={isExporting}
      />

      {/* Data Table */}
      <CategoryDataTable
        categories={filteredData}
        loading={loading}
        selectedIds={selectedIds}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onSelect={handleSelect}
        onSelectAll={handleSelectAllFiltered}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onExport={handleExport}
      />

      {/* Modal - Keep Suspense only for lazy loaded modal */}
      <React.Suspense fallback={null}>
        <AnimatePresence>
          {modalOpen && (
            <CategoryFormModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              initial={editing}
              onSubmit={handleSubmit}
            />
          )}
        </AnimatePresence>
      </React.Suspense>
    </div>
  );
});

export default CategoryListEnhanced;