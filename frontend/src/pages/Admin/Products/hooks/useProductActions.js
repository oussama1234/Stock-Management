import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProductMutation } from '../../../../GraphQL/Products/Mutations/CreateProduct';
import { useUpdateProductMutation } from '../../../../GraphQL/Products/Mutations/UpdateProduct';
import { useDeleteProductMutation } from '../../../../GraphQL/Products/Mutations/DeleteProduct';
import { useConfirm } from '../../../../components/ConfirmContext/ConfirmContext';
import { useToast } from '../../../../components/Toaster/ToastContext';
import { ProductDetailsRoute } from '../../../../router/Index';
import { useProductsData } from '../contexts/ProductsContext';

export const useProductActions = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const { refreshData, addOptimisticUpdate } = useProductsData();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    price: '',
    stock: '',
    category: '',
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // GraphQL mutations
  const {
    createProduct,
    loading: createProductLoading,
  } = useCreateProductMutation();

  const {
    updateProduct,
    loading: updateProductLoading,
  } = useUpdateProductMutation();

  const {
    deleteProductMutation,
    loading: deleteProductLoading,
  } = useDeleteProductMutation();

  // Form handlers
  const handleInputChange = useCallback((e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Create image preview if image is selected
    if (name === 'image' && files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(files[0]);
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Modal actions
  const openModal = useCallback((product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        image: product.image,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category?.id || '',
      });
      setImagePreview(product.image);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        image: null,
        price: '',
        stock: '',
        category: '',
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      image: null,
      price: '',
      stock: '',
      category: '',
    });
    setImagePreview(null);
    setErrors({});
  }, []);

  const openDetailModal = useCallback((product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  }, []);

  // CRUD operations
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingProduct) {
        // Optimistic update for better UX
        addOptimisticUpdate(editingProduct.id, {
          name: formData.name,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          isUpdating: true,
        });

        const { data } = await updateProduct({
          variables: {
            id: editingProduct.id,
            product: {
              name: formData.name,
              description: formData.description,
              image: formData.image instanceof File ? formData.image : null,
              price: parseFloat(formData.price),
              stock: parseInt(formData.stock),
              category_id: parseInt(formData.category),
            },
          },
        });

        toast.success('Product updated successfully!');
      } else {
        const newProduct = {
          name: formData.name,
          description: formData.description,
          image: formData.image,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          category_id: parseInt(formData.category),
        };

        const { data } = await createProduct({
          variables: { product: newProduct },
        });

        toast.success('Product created successfully!');
      }

      closeModal();
      await refreshData();
    } catch (error) {
      toast.error(
        error?.errors?.[0]?.extensions?.validation?.['product.image']?.[0] ||
        `Error ${editingProduct ? 'updating' : 'creating'} product`
      );
    }
  }, [
    validateForm,
    editingProduct,
    formData,
    addOptimisticUpdate,
    updateProduct,
    createProduct,
    closeModal,
    refreshData,
    toast,
  ]);

  const handleDelete = useCallback(async (productId) => {
    try {
      setDeletingProductId(productId);
      
      const confirmResult = await confirm({
        type: 'warning',
        title: 'Delete Product',
        description: 'Are you sure you want to delete this product? This action cannot be undone.',
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
      });

      if (!confirmResult) {
        setDeletingProductId(null);
        return;
      }

      // Optimistic update
      addOptimisticUpdate(productId, {
        isDeleting: true,
      });

      const { data } = await deleteProductMutation({
        variables: { id: productId },
      });

      if (data.deleteProduct?.success) {
        toast.success(data.deleteProduct.message || 'Product deleted successfully');
        await refreshData();
      }
    } catch (error) {
      toast.error(error?.message || 'Error deleting product');
      await refreshData(); // Refresh to restore state
    } finally {
      setDeletingProductId(null);
    }
  }, [confirm, deleteProductMutation, addOptimisticUpdate, refreshData, toast]);

  // Bulk operations
  const handleBulkDelete = useCallback(async (productIds) => {
    try {
      const confirmResult = await confirm({
        type: 'warning',
        title: 'Delete Multiple Products',
        description: `Are you sure you want to delete ${productIds.length} products? This action cannot be undone.`,
        confirmText: 'Yes, Delete All',
        cancelText: 'Cancel',
      });

      if (!confirmResult) return;

      // Optimistic updates
      productIds.forEach(id => {
        addOptimisticUpdate(id, { isDeleting: true });
      });

      // Delete products sequentially to avoid overwhelming the server
      const deletePromises = productIds.map(id =>
        deleteProductMutation({ variables: { id } })
      );

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} products deleted successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} products`);
      }

      await refreshData();
    } catch (error) {
      toast.error('Error during bulk delete operation');
      await refreshData();
    }
  }, [confirm, deleteProductMutation, addOptimisticUpdate, refreshData, toast]);

  const handleBulkEdit = useCallback(async (productIds, updates) => {
    try {
      // Optimistic updates
      productIds.forEach(id => {
        addOptimisticUpdate(id, { ...updates, isUpdating: true });
      });

      const updatePromises = productIds.map(id =>
        updateProduct({
          variables: {
            id,
            product: updates,
          },
        })
      );

      const results = await Promise.allSettled(updatePromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} products updated successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to update ${failCount} products`);
      }

      await refreshData();
    } catch (error) {
      toast.error('Error during bulk edit operation');
      await refreshData();
    }
  }, [updateProduct, addOptimisticUpdate, refreshData, toast]);

  // Navigation actions
  const navigateToDetails = useCallback((productId) => {
    navigate(`${ProductDetailsRoute}/${productId}`);
  }, [navigate]);

  const navigateToEdit = useCallback((productId) => {
    navigate(`${ProductDetailsRoute}/${productId}/edit`);
  }, [navigate]);

  // Export functions
  const exportToCSV = useCallback((products) => {
    try {
      const csvData = [
        ['ID', 'Name', 'Category', 'Price', 'Stock', 'Description'],
        ...products.map(product => [
          product.id,
          product.name,
          product.category?.name || 'N/A',
          product.price,
          product.stock,
          product.description || 'N/A',
        ])
      ];

      const csvContent = csvData.map(row =>
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'products-export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success('Products exported successfully');
    } catch (error) {
      toast.error('Error exporting products');
    }
  }, [toast]);

  return {
    // State
    isModalOpen,
    isDetailModalOpen,
    editingProduct,
    selectedProduct,
    formData,
    errors,
    imagePreview,
    deletingProductId,

    // Loading states
    isCreating: createProductLoading,
    isUpdating: updateProductLoading,
    isDeleting: deleteProductLoading,

    // Form handlers
    handleInputChange,
    validateForm,

    // Modal actions
    openModal,
    closeModal,
    openDetailModal,
    closeDetailModal,

    // CRUD operations
    handleSubmit,
    handleDelete,
    handleBulkDelete,
    handleBulkEdit,

    // Navigation
    navigateToDetails,
    navigateToEdit,

    // Export
    exportToCSV,
  };
};

export default useProductActions;