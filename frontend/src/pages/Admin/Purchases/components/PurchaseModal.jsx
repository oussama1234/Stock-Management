// src/pages/Admin/Purchases/components/PurchaseModal.jsx
// Beautiful modal for creating and editing purchases with line items
// - Form validation and error handling
// - Dynamic product selection with search
// - Beautiful animations and hover effects
// - Supplier selection with create new option

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Building2,
  Calendar,
  Package,
  DollarSign,
  Trash2,
  Save,
  AlertTriangle,
  Search,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/Toaster/ToastContext";
import LoadingButton from "@/components/Spinners/LoadingButton";
import { getProducts } from "@/api/Products";
import { getSuppliers, createSupplier } from "@/api/Purchases";

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 50
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200
    }
  }
};

export default function PurchaseModal({ open, onClose, onSubmit, initial = null, hideDate = false }) {
  const toast = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    supplier_id: "",
    purchase_date: new Date().toISOString().split('T')[0],
    tax: 0,
    discount: 0,
    items: []
  });
  
  // Loading states
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  
  // Data states
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // UI states
  const [errors, setErrors] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({ name: "", email: "", phone: "" });

  // Initialize form data when modal opens or initial data changes
  useEffect(() => {
    if (initial) {
      setFormData({
        supplier_id: initial.supplier?.id || "",
        purchase_date: initial.purchase_date ? initial.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0],
        tax: initial.tax || 0,
        discount: initial.discount || 0,
        items: initial.purchaseItems?.map(item => ({
          product_id: item.product_id,
          product_name: item.product?.name || "",
          quantity: item.quantity,
          price: item.price
        })) || []
      });
    } else {
      setFormData({
        supplier_id: "",
        purchase_date: new Date().toISOString().split('T')[0],
        tax: 0,
        discount: 0,
        items: []
      });
    }
    setErrors({});
  }, [initial, open]);

  // Load products and suppliers when modal opens
  useEffect(() => {
    if (open) {
      loadProducts();
      loadSuppliers();
    }
  }, [open]);

  // Filter products based on search
  useEffect(() => {
    const q = productSearch.trim().toLowerCase();
    if (q) {
      const filtered = products.filter(product =>
        (product.name || '').toLowerCase().includes(q) ||
        ((product.category?.name || '').toLowerCase().includes(q))
      );
      setFilteredProducts(filtered);
    } else {
      // Show all products without artificial cap
      setFilteredProducts(products);
    }
  }, [productSearch, products]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      let page = 1;
      let lastPage = 1;
      const all = [];
      do {
        const res = await getProducts({ per_page: 200, page });
        const items = res?.data || [];
        all.push(...items);
        lastPage = res?.meta?.last_page || 1;
        page++;
      } while (page <= lastPage);

      // Deduplicate by product id
      const deduped = Array.from(new Map(all.map(p => [p.id, p])).values());

      setProducts(deduped);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const result = await getSuppliers({ per_page: 100 });
      setSuppliers(result.data || result);
    } catch (error) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const addItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: "", product_name: "", quantity: 1, price: 0 }]
    }));
  }, []);

  const removeItem = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }, []);

  const updateItem = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // If product is selected, update product name
          if (field === 'product_id' && value) {
            const product = products.find(p => p.id == value);
            if (product) {
              updatedItem.product_name = product.name;
              // Set default price if not set
              if (!item.price) {
                updatedItem.price = product.price || 0;
              }
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  }, [products]);

  const handleCreateSupplier = async () => {
    if (!newSupplierData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setCreatingSupplier(true);
    try {
      const supplier = await createSupplier(newSupplierData);
      setSuppliers(prev => [...prev, supplier]);
      setFormData(prev => ({ ...prev, supplier_id: supplier.id }));
      setShowNewSupplier(false);
      setNewSupplierData({ name: "", email: "", phone: "" });
      toast.success("Supplier created successfully! ✅");
    } catch (error) {
      toast.error("Failed to create supplier");
    } finally {
      setCreatingSupplier(false);
    }
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.supplier_id) {
      newErrors.supplier_id = "Supplier is required";
    }

    if (!hideDate && !formData.purchase_date) {
      newErrors.purchase_date = "Purchase date is required";
    }

    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    formData.items.forEach((item, index) => {
      if (!item.product_id) {
        newErrors[`item_${index}_product`] = "Product is required";
      }
      if (!item.quantity || item.quantity < 1) {
        newErrors[`item_${index}_quantity`] = "Valid quantity is required";
      }
      if (item.price < 0) {
        newErrors[`item_${index}_price`] = "Price cannot be negative";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setSaving(true);
    
    try {
      const payload = {
        supplier_id: parseInt(formData.supplier_id),
        purchase_date: formData.purchase_date,
        tax: parseFloat(formData.tax) || 0,
        discount: parseFloat(formData.discount) || 0,
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        }))
      };

      if (hideDate) {
        delete payload.purchase_date;
      }

      await onSubmit(payload);
      // Don't auto-close - let parent handle success and closing
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((total, item) => {
      return total + (parseFloat(item.price || 0) * parseInt(item.quantity || 0));
    }, 0);
    
    const taxAmount = (parseFloat(formData.tax || 0) / 100) * subtotal;
    const discountAmount = (parseFloat(formData.discount || 0) / 100) * subtotal;
    
    return {
      subtotal,
      taxAmount,
      discountAmount,
      total: Math.max(0, subtotal + taxAmount - discountAmount)
    };
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  className="mr-4"
                >
                  <ShoppingBag className="h-8 w-8" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {initial ? "Edit Purchase" : "New Purchase"}
                  </h2>
                  <p className="text-emerald-100">
                    {initial ? "Update purchase details" : "Create a new purchase order"}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-6 w-6" />
              </motion.button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Building2 className="h-4 w-4 text-emerald-500 mr-2" />
                    Supplier *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => handleInputChange("supplier_id", e.target.value)}
                      className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-0 transition-all duration-300 ${
                        errors.supplier_id 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-200 focus:border-emerald-500'
                      }`}
                      disabled={loadingSuppliers}
                    >
                      <option value="">Select Supplier</option>
                      {(suppliers || []).map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowNewSupplier(true)}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      title="Add New Supplier"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                  </div>
                  {errors.supplier_id && (
                    <p className="text-red-500 text-sm flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {errors.supplier_id}
                    </p>
                  )}
                </motion.div>

                {/* Purchase Date */}
                {!hideDate && (
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4 text-emerald-500 mr-2" />
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => handleInputChange("purchase_date", e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 transition-all duration-300 ${
                        errors.purchase_date 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-200 focus:border-emerald-500'
                      }`}
                    />
                    {errors.purchase_date && (
                      <p className="text-red-500 text-sm flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {errors.purchase_date}
                      </p>
                    )}
                  </motion.div>
                )}
                
                {/* Tax */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <DollarSign className="h-4 w-4 text-emerald-500 mr-2" />
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax}
                    onChange={(e) => handleInputChange("tax", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-emerald-500 rounded-xl focus:ring-0 transition-all duration-300 bg-gradient-to-r from-white to-emerald-50/30 placeholder-gray-400"
                    placeholder="0.00"
                  />
                </motion.div>
                
                {/* Discount */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <DollarSign className="h-4 w-4 text-red-500 mr-2" />
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => handleInputChange("discount", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-red-400 rounded-xl focus:ring-0 transition-all duration-300 bg-gradient-to-r from-white to-red-50/30 placeholder-gray-400"
                    placeholder="0.00"
                  />
                </motion.div>
              </div>

              {/* Items Section */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-emerald-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Purchase Items *</h3>
                    <Sparkles className="h-4 w-4 text-emerald-400 ml-2" />
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addItem}
                    className="flex items-center px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </motion.button>
                </div>

                {errors.items && (
                  <p className="text-red-500 text-sm flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.items}
                  </p>
                )}

                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {formData.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border-2 border-gray-200 rounded-2xl hover:border-emerald-300 transition-all duration-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Product */}
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Product *
                          </label>
                          <select
                            value={item.product_id}
                            onChange={(e) => updateItem(index, "product_id", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-0 text-sm ${
                              errors[`item_${index}_product`]
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-300 focus:border-emerald-500'
                            }`}
                          >
                            <option value="">Select Product</option>
                            {(filteredProducts || []).map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - ${product.price || 0}
                              </option>
                            ))}
                          </select>
                          {errors[`item_${index}_product`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`item_${index}_product`]}
                            </p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-0 text-sm ${
                              errors[`item_${index}_quantity`]
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-300 focus:border-emerald-500'
                            }`}
                          />
                          {errors[`item_${index}_quantity`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`item_${index}_quantity`]}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="relative">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Unit Price *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(index, "price", e.target.value)}
                              className={`w-full pl-8 pr-12 py-2 border rounded-lg focus:ring-0 text-sm ${
                                errors[`item_${index}_price`]
                                  ? 'border-red-300 focus:border-red-500'
                                  : 'border-gray-300 focus:border-emerald-500'
                              }`}
                            />
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeItem(index)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                          {errors[`item_${index}_price`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`item_${index}_price`]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Show subtotal for this item (mirrors Sales design) */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Item Subtotal:</span>
                          <span className="text-lg font-bold text-gray-800">
                            ${((parseInt(item.quantity || 0) * parseFloat(item.price || 0)) || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Total */}
                {formData.items.length > 0 && (() => {
                  const totals = calculateTotal();
                  return (
                    <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl">
                      <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Purchase Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-gray-700">
                          <span className="font-medium">Items Subtotal:</span>
                          <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                        </div>
                        
                        {formData.tax > 0 && (
                          <div className="flex justify-between items-center text-emerald-600">
                            <span className="font-medium">Tax ({formData.tax}%):</span>
                            <span className="font-semibold">+${totals.taxAmount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {formData.discount > 0 && (
                          <div className="flex justify-between items-center text-red-600">
                            <span className="font-medium">Discount ({formData.discount}%):</span>
                            <span className="font-semibold">-${totals.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="pt-3 border-t border-emerald-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-emerald-800">Final Total:</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                              ${totals.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-5 w-5 mr-2" />
                    {initial ? "Update Purchase" : "Create Purchase"}
                  </div>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* New Supplier Modal */}
        <AnimatePresence>
          {showNewSupplier && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 flex items-center justify-center"
              onClick={() => setShowNewSupplier(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Add New Supplier</h3>
                  <button
                    onClick={() => setShowNewSupplier(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newSupplierData.name}
                      onChange={(e) => setNewSupplierData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-0"
                      placeholder="Supplier name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newSupplierData.email}
                      onChange={(e) => setNewSupplierData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-0"
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newSupplierData.phone}
                      onChange={(e) => setNewSupplierData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-0"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewSupplier(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    type="button"
                    onClick={handleCreateSupplier}
                    loading={creatingSupplier}
                    loadingMessage="Creating..."
                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                  >
                    Create
                  </LoadingButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
