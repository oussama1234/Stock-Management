import React, { memo, useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { usePreferences } from '@/context/PreferencesContext';

// Context and Hooks
import { ProductDataProvider, useProductData } from './context/ProductDataContext';
import useProductTransactionActions from './hooks/useProductTransactionActions';
import { useProductPrint } from './hooks/useProductPrint';
import { useProductsExport } from './hooks/useProductsExport';
import { useCategoriesQuery } from '../../../GraphQL/Categories/Queries/Categories';
import { useUpdateProductMutation } from '../../../GraphQL/Products/Mutations/UpdateProduct';
import { useToast } from '../../../components/Toaster/ToastContext';

// Components
import ProductHeader from './components/ProductHeader';
import ProductImageSection from './components/ProductImageSection';
import ProductStatsCards from './components/ProductStatsCards';
import ProductTabs from './components/ProductTabs';
import ProductPrintDocument from './components/print/ProductPrintDocument';

// Modals for creating/editing sales and purchases
import SaleModal from '../Sales/components/SaleModal';
import PurchaseModal from '../Purchases/components/PurchaseModal';
import { ProductModal } from './Products';
import AdjustmentFormModal from '@/pages/Inventory/Adjustments/AdjustmentFormModal';
import AdjustmentConfirmationModal from '@/pages/Inventory/Adjustments/AdjustmentConfirmationModal';
import { postInventoryAdjustment } from '@/api/Inventory';

// Loading Component
const LoadingSpinner = memo(() => {
  const { currentTheme } = usePreferences();
  const colorClass = currentTheme?.text || 'text-blue-500';
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-white/80 rounded-3xl shadow-xl border border-white/20 p-12 inline-flex flex-col items-center">
          <div className="inline-block">
<RefreshCw className={`h-12 w-12 ${colorClass} animate-spin`} style={{ animationDuration: '1s' }} />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Loading Product Details</h3>
          <p className="mt-2 text-gray-600">Please wait while we fetch the latest data...</p>
        </div>
      </div>
    </div>
  );
});

// Error Component
const ErrorDisplay = memo(({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-md"
    >
      <div className="bg-white/80 rounded-3xl shadow-xl border border-white/20 p-8">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Product</h3>
        <p className="text-gray-600 mb-6">
          {error?.message || 'An unexpected error occurred while loading the product details.'}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl shadow-lg transition-all duration-200"
        >
          Try Again
        </motion.button>
      </div>
    </motion.div>
  </div>
));

// Main Product Details Content Component
const ProductDetailsContent = memo(() => {
  const navigate = useNavigate();
  const toast = useToast();
  const { 
    product, 
    isLoading, 
    error, 
    refreshData 
  } = useProductData();

  // Product edit modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '', // ProductModal expects 'category', not 'category_id'
    image: null
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // GraphQL hooks for product editing
  const [loadCategories, { data: categoriesData, loading: loadingCategories }] = useCategoriesQuery();
  const { updateProduct, loading: updateProductLoading } = useUpdateProductMutation();

  // Shared transaction actions (create/edit/delete + modal state)
  const {
    // modal flags
    saleModalOpen,
    purchaseModalOpen,
    // initial data (memoized)
    saleInitial,
    purchaseInitial,
    // openers/closers
    openCreateSale,
    openCreatePurchase,
    openEditSale,
    openEditPurchase,
    closeSaleModal,
    closePurchaseModal,
    // submit
    submitSale,
    submitPurchase,
    // delete
    deleteSaleByItem,
    deletePurchaseByItem,
  } = useProductTransactionActions();

  // Product edit handlers
  const handleEdit = useCallback(async () => {
    if (!product) return;

    try {
      // Load categories on demand and use the immediate result to avoid race conditions
      const result = await loadCategories();
      const loadedCategories = result?.data?.categories || categoriesData?.categories || [];

      // product.category in this view is a string (name). Support fallback if it's an object.
      const productCategoryName = typeof product.category === 'string' 
        ? product.category 
        : (product.category?.name || '');

      // Resolve category id by name; if no match, leave empty so user can choose
      const matchingCategory = loadedCategories.find(cat => cat.name === productCategoryName);
      const categoryId = matchingCategory ? String(matchingCategory.id) : '';

      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price != null ? String(product.price) : '',
        stock: product.stock != null ? String(product.stock) : '',
        category: categoryId, // select value expects id as string
        image: null,
      });

      setImagePreview(product.image || null);
      setErrors({});
      setIsProductModalOpen(true);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Still open modal with existing values; user can pick category once loaded
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price != null ? String(product.price) : '',
        stock: product.stock != null ? String(product.stock) : '',
        category: '',
        image: null,
      });
      setIsProductModalOpen(true);
    }
  }, [product, loadCategories, categoriesData?.categories]);

  const handleInputChange = useCallback((e) => {
    // Align with shared ProductModal signature (event-based handler)
    const { name, value, files } = e.target || {};
    const newValue = files ? files[0] : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (name === 'image' && files && files[0] instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      const productInput = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: parseInt(formData.category), // Map 'category' form field to API field
      };

      if (formData.image instanceof File) {
        productInput.image = formData.image;
      }

      await updateProduct({
        variables: {
          id: Number(product.id),
          product: productInput,
        },
      });

      toast.success('Product updated successfully! ✅');
      setIsProductModalOpen(false);
      await refreshData();
    } catch (error) {
      toast.error('Failed to update product: ' + (error.message || 'Unknown error'));
      setErrors({ submit: error.message });
    }
  }, [formData, product, updateProduct, toast, refreshData]);

  const closeProductModal = useCallback(() => {
    setIsProductModalOpen(false);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image: null
    });
    setImagePreview(null);
    setErrors({});
  }, []);

  const { printRef, handlePrint } = useProductPrint();

  // Inventory adjustment modals state
  const [adjFormOpen, setAdjFormOpen] = useState(false);
  const [adjConfirmOpen, setAdjConfirmOpen] = useState(false);
  const [pendingAdjustment, setPendingAdjustment] = useState(null);
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  const openCreateAdjustment = useCallback(() => {
    setAdjFormOpen(true);
  }, []);

  const onProceedAdjustment = useCallback((data) => {
    setPendingAdjustment(data);
    setAdjFormOpen(false);
    setAdjConfirmOpen(true);
  }, []);

  const onConfirmAdjustment = useCallback(async () => {
    try {
      setSavingAdjustment(true);
      await postInventoryAdjustment({
        product_id: Number(pendingAdjustment.product_id),
        new_quantity: Number(pendingAdjustment.new_quantity),
        reason: pendingAdjustment.reason,
        notes: pendingAdjustment.notes || undefined,
      });
      setAdjConfirmOpen(false);
      setPendingAdjustment(null);
      toast.success('Inventory adjusted successfully');
      await refreshData();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to save adjustment');
    } finally {
      setSavingAdjustment(false);
    }
  }, [pendingAdjustment, refreshData, toast]);

  // Multi-sheet Excel export hook
  const { exportProductsData, isExporting } = useProductsExport();
  const memoizedExport = useCallback(() => exportProductsData(), [exportProductsData]);

  const handleDownload = useCallback(async () => {
    if (!product) return;
    
    try {
      // This would implement CSV export functionality
      const csvData = [
        ['Field', 'Value'],
        ['Name', product.name],
        ['SKU', product.sku],
        ['Category', product.category || 'N/A'],
        ['Current Stock', product.stock || 0],
        ['Price', product.price || 0],
        ['Description', product.description || 'N/A']
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `product-${product.sku || product.id}-details.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading product data:', error);
    }
  }, [product]);

  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  const handleRetry = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  if (!product) {
    return <ErrorDisplay error={{ message: 'Product not found' }} onRetry={handleRetry} />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Product Header */}
        <ProductHeader
          product={product}
          isRefreshing={isLoading}
          onRefresh={handleRefresh}
          onEdit={handleEdit}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onExport={memoizedExport}
          isExporting={isExporting}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column - Image Section */}
          <div className="xl:col-span-4">
            <ProductImageSection product={product} />
          </div>

          {/* Right Column - Stats */}
          <div className="xl:col-span-8 space-y-8">
            {/* Product Statistics Cards */}
            <ProductStatsCards />
          </div>
        </div>

        {/* Full-width Product Tabs (Sales, Purchases, Stock Movements) */}
        <div className="mt-8">
          <ProductTabs 
            onAddNewSale={openCreateSale}
            onAddNewPurchase={openCreatePurchase}
            onAddNewMovement={openCreateAdjustment}
            onEditSale={openEditSale}
            onDeleteSale={deleteSaleByItem}
            onEditPurchase={openEditPurchase}
            onDeletePurchase={deletePurchaseByItem}
          />
        </div>
      </div>

      {/* Modals */}
      {/* Adjustment Modals */}
      <AdjustmentFormModal open={adjFormOpen} onOpenChange={setAdjFormOpen} onProceed={onProceedAdjustment} initialProductId={product?.id} initialProductName={product?.name} />
      <AdjustmentConfirmationModal open={adjConfirmOpen} onOpenChange={setAdjConfirmOpen} data={pendingAdjustment} onConfirm={onConfirmAdjustment} loading={savingAdjustment} />

      <SaleModal
        open={saleModalOpen}
        onClose={closeSaleModal}
        onSubmit={submitSale}
        initial={saleInitial}
      />

      <PurchaseModal
        open={purchaseModalOpen}
        onClose={closePurchaseModal}
        onSubmit={submitPurchase}
        initial={purchaseInitial}
        hideDate={true}
      />

      {/* Product Edit Modal */}
      {isProductModalOpen && (() => {
        console.log('Rendering ProductModal with:', {
          formData,
          categories: categoriesData?.categories,
          loadingCategories
        });
        return (
          <ProductModal
            formData={formData}
            errors={errors}
            editingProduct={product}
            imagePreview={imagePreview}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            closeModal={closeProductModal}
            categories={categoriesData?.categories || []}
            loadingCategories={loadingCategories}
            createProductLoading={false}
            updateProductLoading={updateProductLoading}
          />
        );
      })()}
    </div>
      {/* Print-only document (hidden on screen, shown in print) */}
      <ProductPrintDocument ref={printRef} />
    </>
  );
});

// Main ProductDetails Component with Context Provider
const ProductDetails = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Validate product ID
  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="bg-white/80 rounded-3xl shadow-xl border border-white/20 p-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Invalid Product ID</h3>
            <p className="text-gray-600 mb-6">No product ID was provided in the URL.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/products')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200"
            >
              Back to Products
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ProductDataProvider productId={id}>
      <ProductDetailsContent />
    </ProductDataProvider>
  );
});

// Display Names for React DevTools
LoadingSpinner.displayName = 'LoadingSpinner';
ErrorDisplay.displayName = 'ErrorDisplay';
ProductDetailsContent.displayName = 'ProductDetailsContent';
ProductDetails.displayName = 'ProductDetails';

export default ProductDetails;