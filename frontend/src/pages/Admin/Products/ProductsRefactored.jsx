import React, { memo, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProductsProvider, useProductsData } from './contexts/ProductsContext';
import { useProductActions } from './hooks/useProductActions';

// Components
import ProductsHeader from './components/ProductsHeader';
import ProductsFilters from './components/ProductsFilters';
import ProductsGrid from './components/ProductsGrid';
import { ProductModal, ProductDetailModal } from './Products'; // Reuse existing modals
import PaginationControls from '@/components/pagination/PaginationControls';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import { useProductsCsvExport } from './hooks/useProductsCsvExport';

const ProductsContent = memo(() => {
  const {
    // Modal state
    isModalOpen,
    isDetailModalOpen,
    selectedProduct,
    editingProduct,
    formData,
    errors,
    imagePreview,
    
    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
    
    // Actions
    openModal,
    closeModal,
    openDetailModal,
    closeDetailModal,
    handleInputChange,
    handleSubmit,
    handleDelete,
    handleBulkDelete,
    handleBulkEdit,
    navigateToDetails,
    exportToCSV,
  } = useProductActions();

  const { refreshData, categories, isLoadingCategories, ensureCategoriesLoaded, isLoading, isRefreshing, isInitialLoading, searchTerm, categoryFilter, stockFilter, sortBy, sortOrder } = useProductsData();

  const handleAddProduct = useCallback(() => {
    ensureCategoriesLoaded();
    openModal();
  }, [ensureCategoriesLoaded, openModal]);

  const handleEditProduct = useCallback((product) => {
    ensureCategoriesLoaded();
    openModal(product);
  }, [ensureCategoriesLoaded, openModal]);

  const handleViewDetails = useCallback((product, navigate = false) => {
    if (navigate) {
      navigateToDetails(product.id);
    } else {
      openDetailModal(product);
    }
  }, [navigateToDetails, openDetailModal]);

  // CSV export for all products (with filters)
  const { exportProductsCsv, isExporting } = useProductsCsvExport();
  const handleExportProducts = useCallback(() => {
    exportProductsCsv({
      searchTerm,
      categoryFilter,
      stockFilter,
      sortBy,
      sortOrder,
    });
  }, [exportProductsCsv, searchTerm, categoryFilter, stockFilter, sortBy, sortOrder]);

  // refreshData already extracted above from useProductsData

  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-6">
        <ContentSpinner fullWidth size="large" message="Loading products..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-6">
        {/* Global top progress bar while queries load/refresh */}
        {(isLoading || isRefreshing) && <TopProgressBar />}

        {/* Header Section */}
        <ProductsHeader
          onAddProduct={handleAddProduct}
          onRefresh={handleRefresh}
          onExport={handleExportProducts}
          isRefreshing={isRefreshing}
          isExporting={isExporting}
        />

        {/* Filters Section */}
        <ProductsFilters />

        {/* Products Grid */}
        <ProductsGrid
          onEdit={handleEditProduct}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
          onAddProduct={handleAddProduct}
          onBulkDelete={handleBulkDelete}
          onBulkEdit={handleBulkEdit}
          onExport={(subset) => exportToCSV(subset || [])}
        />

        {/* Pagination */}
        <PaginationSection />

        {/* Modals */}
        <AnimatePresence>
          {isModalOpen && (
            <ProductModal
              formData={formData}
              errors={errors}
              editingProduct={editingProduct}
              imagePreview={imagePreview}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              closeModal={closeModal}
              categories={categories}
              loadingCategories={isLoadingCategories}
              createProductLoading={isCreating}
              updateProductLoading={isUpdating}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDetailModalOpen && selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              closeModal={closeDetailModal}
            />
          )}
        </AnimatePresence>
    </div>
  );
});

const PaginationSection = memo(() => {
  const { 
    metadata, 
    currentPage, 
    perPage, 
    handlePageChange, 
    handlePerPageChange 
  } = useProductsData();

  if (!metadata.lastPage || metadata.lastPage <= 1) {
    return null;
  }

  // Generate page list for pagination
  const generatePages = (totalPages, currentPage) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pages = useMemo(() => generatePages(metadata.lastPage, currentPage), [metadata.lastPage, currentPage]);

  const onChangePage = useCallback((p) => {
    handlePageChange(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [handlePageChange]);

  const onPerPageChange = useCallback((value) => {
    handlePerPageChange(value);
  }, [handlePerPageChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="mt-12"
    >
      <div className="bg-white/80 rounded-2xl shadow-lg border border-white/20 p-6">
        <PaginationControls
          currentPage={currentPage}
          totalPages={metadata.lastPage}
          onPageChange={onChangePage}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          from={metadata.from}
          to={metadata.to}
          total={metadata.total}
          pages={pages}
        />
      </div>
    </motion.div>
  );
});

// Lightweight top progress bar shown during loading/refetch
const TopProgressBar = memo(() => (
  <div className="fixed top-0 left-0 right-0 z-50">
    <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse" />
  </div>
));

// Main Products Component with Context Provider
const ProductsRefactored = memo(() => {
  return (
    <ProductsProvider>
      <ProductsContent />
    </ProductsProvider>
  );
});


ProductsContent.displayName = 'ProductsContent';
PaginationSection.displayName = 'PaginationSection';
ProductsRefactored.displayName = 'ProductsRefactored';

export default ProductsRefactored;