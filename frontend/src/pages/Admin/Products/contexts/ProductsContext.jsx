import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import { PRODUCTS_QUERY } from '../../../../GraphQL/Products/Queries/Products';
import { useCategoriesQuery } from '../../../../GraphQL/Categories/Queries/Categories';
import { useProductsFiltering } from '../hooks/useProductsFiltering';

const ProductsContext = createContext();

const SAFE_DEFAULTS = {
  // Data
  products: [],
  categories: [],
  metadata: { total: 0, perPage: 12, currentPage: 1, lastPage: 1, from: 0, to: 0, hasMorePages: false },
  statistics: { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0, avgPrice: 0 },
  filterOptions: {
    categories: [],
    stockLevels: [
      { value: '', label: 'All Stock Levels' },
      { value: 'in_stock', label: 'In Stock (>10)' },
      { value: 'low_stock', label: 'Low Stock (1-10)' },
      { value: 'out_of_stock', label: 'Out of Stock (0)' }
    ],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'price', label: 'Price' },
      { value: 'stock', label: 'Stock' },
      { value: 'created_at', label: 'Date Added' },
      { value: 'category', label: 'Category' }
    ]
  },

  // State
  currentPage: 1,
  perPage: 12,
  searchTerm: '',
  debouncedSearchTerm: '',
  categoryFilter: '',
  stockFilter: '',
  sortBy: 'name',
  sortOrder: 'asc',
  selectedProducts: new Set(),
  viewMode: 'grid',

  // Loading states
  isLoading: false,
  isLoadingCategories: false,
  isRefreshing: false,
  isInPlaceLoading: false,
  isInitialLoading: true, // assume loading when provider missing to avoid flash
  error: null,

  // Actions (no-ops)
  handlePageChange: () => {},
  handlePerPageChange: () => {},
  handleSearchChange: () => {},
  handleClearSearch: () => {},
  handleCategoryFilter: () => {},
  handleStockFilter: () => {},
  handleSortChange: () => {},
  handleClearFilters: () => {},
  handleViewModeChange: () => {},

  handleSelectProduct: () => {},
  handleSelectAll: () => {},
  handleClearSelection: () => {},
  selectedCount: 0,
  isAllSelected: false,

  // Data management
  refreshData: async () => {},
  ensureCategoriesLoaded: () => {},
  addOptimisticUpdate: () => {},
};

export const useProductsData = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    // Fail-soft to avoid crashing entire route when a child component is
    // rendered outside the provider by mistake.
    if (typeof window !== 'undefined' && window?.console) {
      console.error('useProductsData must be used within ProductsProvider — returning safe defaults');
    }
    return SAFE_DEFAULTS;
  }
  return context;
};

export const ProductsProvider = ({ children }) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  // Refs for debouncing
  const searchTimeoutRef = useRef(null);
  const lastSearchRef = useRef('');
  
  // Debounced search filter
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== lastSearchRef.current) {
        setCurrentPage(1); // Reset to first page on search
        lastSearchRef.current = searchTerm;
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // GraphQL Queries with optimized caching
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
    networkStatus
  } = useQuery(PRODUCTS_QUERY, {
    variables: {
      page: currentPage,
      limit: perPage,
      search: debouncedSearchTerm || null,
      category: categoryFilter ? Number(categoryFilter) : null,
      stockFilter: stockFilter || null,
      sortBy: sortBy || null,
      sortOrder: sortOrder || 'asc'
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    // Optimize with shorter cache TTL for real-time updates
    pollInterval: 30000, // Poll every 30 seconds for fresh data
  });

  const [loadCategories, { 
    data: categoriesData, 
    loading: categoriesLoading 
  }] = useCategoriesQuery();

  // Memoized products data processing (normalize types only)
  const productsRaw = useMemo(() => {
    if (!productsData?.products?.data) return [];
    return productsData.products.data.map(product => ({
      ...product,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      stock: typeof product.stock === 'string' ? parseInt(product.stock) : product.stock,
    }));
  }, [productsData?.products?.data]);

  // Memoized categories data
  const categories = useMemo(() => {
    return categoriesData?.categories || [];
  }, [categoriesData?.categories]);

  // Memoized metadata
  const metadata = useMemo(() => {
    if (!productsData?.products) return {};
    
    return {
      total: productsData.products.total,
      perPage: productsData.products.per_page,
      currentPage: productsData.products.current_page,
      lastPage: productsData.products.last_page,
      from: productsData.products.from,
      to: productsData.products.to,
      hasMorePages: productsData.products.has_more_pages,
    };
  }, [productsData?.products]);

  // Memoized statistics
  const statistics = useMemo(() => {
    if (!productsRaw.length) {
      return {
        total: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0,
        avgPrice: 0,
      };
    }

    const stats = productsRaw.reduce((acc, product) => {
      acc.totalValue += (Number(product.price) || 0) * (Number(product.stock) || 0);
      if ((Number(product.stock) || 0) === 0) {
        acc.outOfStock += 1;
      } else if ((Number(product.stock) || 0) <= 10) {
        acc.lowStock += 1;
      } else {
        acc.inStock += 1;
      }
      return acc;
    }, {
      total: productsRaw.length,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
    });

    const denom = productsRaw.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    stats.avgPrice = denom > 0 ? (stats.totalValue / denom) : 0;
    return stats;
  }, [productsRaw]);

  // Filter options for advanced filtering
  const filterOptions = useMemo(() => {
    return {
      categories: categories.map(cat => ({ value: cat.id, label: cat.name })),
      stockLevels: [
        { value: '', label: 'All Stock Levels' },
        { value: 'in_stock', label: 'In Stock (>10)' },
        { value: 'low_stock', label: 'Low Stock (1-10)' },
        { value: 'out_of_stock', label: 'Out of Stock (0)' }
      ],
      sortOptions: [
        { value: 'name', label: 'Name' },
        { value: 'price', label: 'Price' },
        { value: 'stock', label: 'Stock' },
        { value: 'created_at', label: 'Date Added' },
        { value: 'category', label: 'Category' }
      ]
    };
  }, [categories]);

  // Action handlers with useCallback for optimization
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePerPageChange = useCallback((newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  const handleCategoryFilter = useCallback((category) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  }, []);

  const handleStockFilter = useCallback((filter) => {
    setStockFilter(filter);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((field, order = 'asc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCategoryFilter('');
    setStockFilter('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // Bulk operations
  const handleSelectProduct = useCallback((productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.size === productsRaw.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(productsRaw.map(p => p.id)));
    }
  }, [productsRaw, selectedProducts.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedProducts(new Set());
  }, []);

  // Data refresh with optimistic updates
  const refreshData = useCallback(async () => {
    try {
      await refetchProducts();
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  }, [refetchProducts]);

  // Load categories on demand
  const ensureCategoriesLoaded = useCallback(() => {
    if (!categoriesData && !categoriesLoading) {
      loadCategories();
    }
  }, [categoriesData, categoriesLoading, loadCategories]);

  // Optimistic product updates for better UX
  const [optimisticUpdates, setOptimisticUpdates] = useState(new Map());

  const addOptimisticUpdate = useCallback((productId, updates) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(productId, { ...newMap.get(productId), ...updates });
      return newMap;
    });

    // Clear optimistic update after 5 seconds
    setTimeout(() => {
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(productId);
        return newMap;
      });
    }, 5000);
  }, []);

  // Apply optimistic updates to products
  const optimizedProducts = useMemo(() => {
    if (optimisticUpdates.size === 0) return productsRaw;
    return productsRaw.map(product => ({
      ...product,
      ...optimisticUpdates.get(product.id)
    }));
  }, [productsRaw, optimisticUpdates]);

  // Apply client-side filtering + sorting for current page results
  // This ensures UI filters (category, stock) and sorts (name, price, stock, category, created_at)
  // actually affect the displayed list even if the GraphQL API doesn't support them yet.
  const filteredSortedProducts = useProductsFiltering(optimizedProducts, {
    categoryFilter,
    stockFilter,
    sortBy,
    sortOrder,
  });

  // Context value with all memoized data and functions
  const contextValue = useMemo(() => {
    const hasData = (optimizedProducts && optimizedProducts.length > 0);
    const isRefetching = networkStatus === 4; // Apollo refetch
    const isVariableChange = networkStatus === 2; // setVariables
    const isFetchMore = networkStatus === 3; // fetchMore
    const isPolling = networkStatus === 6; // poll

    // Initial loading: while first response hasn't arrived yet
    const isInitialLoading = productsLoading && !productsData;

    // Loading while retaining previous data in view (cache-and-network may keep loading false)
    const isInPlaceLoading = (
      hasData && (
        isRefetching || isVariableChange || isFetchMore || isPolling || productsLoading
      )
    );

    return ({
      // Data
      products: filteredSortedProducts,
      categories,
      metadata,
      statistics,
      filterOptions,
      
      // State
      currentPage,
      perPage,
      searchTerm,
      debouncedSearchTerm,
      categoryFilter,
      stockFilter,
      sortBy,
      sortOrder,
      selectedProducts,
      viewMode,
      
      // Loading states
      isLoading: productsLoading,
      isLoadingCategories: categoriesLoading,
      isRefreshing: isRefetching,
      isInPlaceLoading,
      isInitialLoading,
      error: productsError,
      
      // Actions
      handlePageChange,
      handlePerPageChange,
      handleSearchChange,
      handleClearSearch,
      handleCategoryFilter,
      handleStockFilter,
      handleSortChange,
      handleClearFilters,
      handleViewModeChange,
      
      // Bulk operations
      handleSelectProduct,
      handleSelectAll,
      handleClearSelection,
      selectedCount: selectedProducts.size,
      isAllSelected: selectedProducts.size === filteredSortedProducts.length && filteredSortedProducts.length > 0,
      
      // Data management
      refreshData,
      ensureCategoriesLoaded,
      addOptimisticUpdate,
    });
  }, [
    filteredSortedProducts,
    categories,
    metadata,
    statistics,
    filterOptions,
    currentPage,
    perPage,
    searchTerm,
    debouncedSearchTerm,
    categoryFilter,
    stockFilter,
    sortBy,
    sortOrder,
    selectedProducts,
    viewMode,
    productsLoading,
    categoriesLoading,
    networkStatus,
    productsError,
    productsData,
    handlePageChange,
    handlePerPageChange,
    handleSearchChange,
    handleClearSearch,
    handleCategoryFilter,
    handleStockFilter,
    handleSortChange,
    handleClearFilters,
    handleViewModeChange,
    handleSelectProduct,
    handleSelectAll,
    handleClearSelection,
    filteredSortedProducts.length,
    refreshData,
    ensureCategoriesLoaded,
    addOptimisticUpdate,
  ]);

  return (
    <ProductsContext.Provider value={contextValue}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsProvider;