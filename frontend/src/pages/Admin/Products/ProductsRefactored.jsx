import React, { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProductsProvider, useProductsData } from './contexts/ProductsContext';
import { useProductActions } from './hooks/useProductActions';

// Components
import ProductsHeader from './components/ProductsHeader';
import ProductsFilters from './components/ProductsFilters';
import ProductsGrid from './components/ProductsGrid';
import { ProductModal, ProductDetailModal } from './Products'; // Reuse existing modals
import PaginationControls from '@/components/pagination/PaginationControls';

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

  const { refreshData, categories, isLoadingCategories, ensureCategoriesLoaded, isLoading, isRefreshing } = useProductsData();

  const handleAddProduct = () => {
    ensureCategoriesLoaded();
    openModal();
  };

  const handleEditProduct = (product) => {
    ensureCategoriesLoaded();
    openModal(product);
  };

  const handleViewDetails = (product, navigate = false) => {
    if (navigate) {
      navigateToDetails(product.id);
    } else {
      openDetailModal(product);
    }
  };

  const handleExportProducts = (products = null) => {
    // If no products specified, export all visible products
    exportToCSV(products);
  };

  // refreshData already extracted above from useProductsData

  const handleRefresh = async () => {
    await refreshData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="max-w-7xl mx-auto p-6">
        {/* Global top progress bar while queries load/refresh */}
        {(isLoading || isRefreshing) && <TopProgressBar />}

        {/* Header Section */}
        <ProductsHeader
          onAddProduct={handleAddProduct}
          onRefresh={handleRefresh}
          onExport={() => handleExportProducts()}
          isRefreshing={isRefreshing}
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
          onExport={handleExportProducts}
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

  const pages = generatePages(metadata.lastPage, currentPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="mt-12"
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <PaginationControls
          currentPage={currentPage}
          totalPages={metadata.lastPage}
          onPageChange={(p) => {
            handlePageChange(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
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
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed top-0 left-0 right-0 z-50"
  >
    <motion.div
      className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
      initial={{ width: '0%' }}
      animate={{ width: ['0%', '60%', '85%', '100%'] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ boxShadow: '0 0 10px rgba(99,102,241,0.6)' }}
    />
  </motion.div>
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