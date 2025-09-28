import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, X } from 'lucide-react';
import { useProductsData } from '../contexts/ProductsContext';
import ProductCard from './ProductCard';
import { MiniSpinner } from '@/components/Spinners/LoadingSpinner';

const EmptyState = memo(({ searchTerm, onAddProduct, onClearSearch }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="col-span-full"
  >
<div className="bg-white/80 rounded-3xl shadow-lg border border-white/20 p-12 text-center">
      <div className="relative mb-8">
<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full" />
        <div className="relative inline-flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full">
          <Package className="h-16 w-16 text-gray-400" />
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          {searchTerm ? 'No products match your search' : 'No products yet'}
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {searchTerm 
            ? `We couldn't find any products matching "${searchTerm}". Try adjusting your search terms.`
            : 'Start building your inventory by adding your first product to the catalog.'
          }
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {searchTerm && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClearSearch}
              className="px-6 py-3 bg-white text-gray-700 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 flex items-center justify-center"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Search
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddProduct}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            {searchTerm ? 'Add New Product' : 'Add Your First Product'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  </motion.div>
));

const BulkActionsBar = memo(({ 
  selectedCount, 
  onBulkDelete, 
  onBulkEdit, 
  onExport, 
  onClearSelection 
}) => {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 rounded-2xl shadow-xl border border-gray-200 p-4"
    >
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} product{selectedCount > 1 ? 's' : ''} selected
        </span>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onExport()}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors duration-200"
          >
            Export
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBulkEdit()}
            className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm transition-colors duration-200"
          >
            Bulk Edit
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBulkDelete()}
            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors duration-200"
          >
            Delete
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearSelection}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

const ProductsGrid = memo(({ 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onAddProduct,
  onBulkDelete,
  onBulkEdit,
  onExport
}) => {
  const {
    products,
    searchTerm,
    selectedProducts,
    selectedCount,
    viewMode,
    isLoading,
    isRefreshing,
    isInPlaceLoading,
    isInitialLoading,
    error,
    handleSelectProduct,
    handleClearSearch,
    handleClearSelection,
  } = useProductsData();

  // Loading state: show skeletons only during initial load before first response
  const hasData = Array.isArray(products) && products.length > 0;
  if (isInitialLoading) {
    const skeletonCount = viewMode === 'grid' ? 12 : 8;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-80 bg-gray-200 rounded-2xl"></div>
          </div>
        ))}
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center"
      >
        <div className="text-red-600 mb-4">
          <Package className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Error Loading Products</h3>
          <p className="text-sm mt-2">Unable to load products. Please try refreshing the page.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <AnimatePresence>
        <BulkActionsBar
          selectedCount={selectedCount}
          onBulkDelete={() => onBulkDelete(Array.from(selectedProducts))}
          onBulkEdit={() => onBulkEdit(Array.from(selectedProducts))}
          onExport={() => onExport(products.filter(p => selectedProducts.has(p.id)))}
          onClearSelection={handleClearSelection}
        />
      </AnimatePresence>

      {/* Products Grid/Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={
          (viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4') + ' relative'
        }
      >
        <AnimatePresence mode="popLayout">
          {products.length === 0 ? (
            <EmptyState
              searchTerm={searchTerm}
              onAddProduct={onAddProduct}
              onClearSearch={handleClearSearch}
            />
          ) : (
            products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                isDeleting={product.isDeleting}
                isSelected={selectedProducts.has(product.id)}
                onSelect={handleSelectProduct}
              />
            ))
          )}
        </AnimatePresence>

        {/* Refresh overlay (non-blocking) */}
        <AnimatePresence>
          {(isRefreshing || isInPlaceLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-white/50 rounded-2xl flex items-center justify-center"
            >
              <div className="flex items-center space-x-3 bg-white/80 px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                <MiniSpinner size="small" />
                <span className="text-sm font-medium text-gray-700">Loading...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
});

ProductsGrid.displayName = 'ProductsGrid';
EmptyState.displayName = 'EmptyState';
BulkActionsBar.displayName = 'BulkActionsBar';

export default ProductsGrid;