// src/pages/Inventory/components/modals/AdjustmentFormModal.jsx
// Modern form modal for inventory adjustments
import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Search, AlertTriangle } from 'lucide-react';
import { getProducts } from '@/api/Products';

const AdjustmentFormModal = memo(function AdjustmentFormModal({ 
  open, 
  onOpenChange, 
  onProceed 
}) {
  const [formData, setFormData] = useState({
    product_id: '',
    current_quantity: 0,
    new_quantity: '',
    reason: '',
    notes: ''
  });
  
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch products on mount
  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts({ limit: 100 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSelect = (product) => {
    setFormData(prev => ({
      ...prev,
      product_id: product.id,
      current_quantity: product.stock || 0
    }));
    setSearchTerm(product.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.product_id) newErrors.product_id = 'Please select a product';
    if (!formData.new_quantity) newErrors.new_quantity = 'Please enter new quantity';
    if (!formData.reason) newErrors.reason = 'Please select a reason';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Find selected product for confirmation
    const selectedProduct = products.find(p => p.id === formData.product_id);
    
    onProceed({
      ...formData,
      productName: selectedProduct?.name
    });
  };

  const handleClose = () => {
    setFormData({
      product_id: '',
      current_quantity: 0,
      new_quantity: '',
      reason: '',
      notes: ''
    });
    setSearchTerm('');
    setErrors({});
    onOpenChange(false);
  };

  const reasons = [
    'Restock',
    'Damage',
    'Theft',
    'Found Stock',
    'Return',
    'Expired',
    'Transfer',
    'Count Correction',
    'Other'
  ];

  if (!open) return null;

  const adjustment = formData.new_quantity ? Number(formData.new_quantity) - formData.current_quantity : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Inventory Adjustment
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Adjust stock quantity for a product
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product *
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Dropdown */}
                {searchTerm && !formData.product_id && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductSelect(product)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Stock: {product.stock || 0}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.product_id && (
                <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>
              )}
            </div>

            {/* Current Quantity Display */}
            {formData.product_id && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Quantity:
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formData.current_quantity}
                  </span>
                </div>
              </div>
            )}

            {/* New Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={formData.new_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, new_quantity: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new quantity"
              />
              {errors.new_quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.new_quantity}</p>
              )}
              
              {/* Adjustment Preview */}
              {formData.new_quantity && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Adjustment:</span>
                  <span className={`text-sm font-medium ${
                    adjustment > 0 ? 'text-green-600' : adjustment < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {adjustment > 0 ? '+' : ''}{adjustment}
                  </span>
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a reason</option>
                {reasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Additional notes about this adjustment..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default AdjustmentFormModal;