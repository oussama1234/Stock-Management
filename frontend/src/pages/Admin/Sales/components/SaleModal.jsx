// src/pages/Admin/Sales/components/SaleModal.jsx
// Modal for creating or editing a sale.
// - Captures customer name, tax, discount (sale dates are handled automatically by backend)
// - Lets user add multiple items (product_id, quantity, price)
// - Emits onSubmit(payload) for parent to call create/update API
// NOTE: For brevity, product selector is a simple numeric input; you can replace
// it with a searchable dropdown (using your categories/products queries) later.

import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Trash2, AlertTriangle, ShoppingCart, Sparkles, Calendar, Users, DollarSign, Package, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import ProductSelector from "./ProductSelector";
import SalesLoadingButton from "./SalesLoadingButton";
import useStockValidation from "@/hooks/useStockValidation";


export default function SaleModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(() => ({
    customer_name: initial?.customer_name || "",
    tax: initial?.tax || 0,
    discount: initial?.discount || 0,
    items: initial?.items?.length ? initial.items.map(item => ({
      product_id: item.product_id || item.product?.id || "",
      quantity: item.quantity || 1,
      price: item.price || 0
    })) : [ { product_id: "", quantity: 1, price: 0 } ],
  }));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [modalKey, setModalKey] = useState(Date.now()); // Force component refresh
  const { validateProductStock, getValidationState, clearValidationState } = useStockValidation();

  // Reset form when initial changes (switching between create/edit or different sales)
  useEffect(() => {
    setForm({
      customer_name: initial?.customer_name || "",
      tax: initial?.tax || 0,
      discount: initial?.discount || 0,
      items: initial?.items?.length ? initial.items.map(item => ({
        product_id: item.product_id || item.product?.id || "",
        quantity: item.quantity || 1,
        price: item.price || 0
      })) : [ { product_id: "", quantity: 1, price: 0 } ],
    });
    setErrors({});
    setModalKey(Date.now()); // Force ProductSelector refresh
    clearValidationState(); // Clear stock validation state
  }, [initial, open, clearValidationState]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateItem = (idx, patch) => {
    setForm((f) => {
      const newItems = f.items.map((it, i) => i === idx ? { ...it, ...patch } : it);
      
      // If quantity or product_id changed, validate stock
      if ((patch.quantity !== undefined || patch.product_id !== undefined)) {
        const item = newItems[idx];
        if (item.product_id && item.quantity > 0) {
          const validationKey = `item_${idx}`;
          validateProductStock(item.product_id, item.quantity, { key: validationKey });
        }
      }
      
      return { ...f, items: newItems };
    });
  };
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { product_id: "", quantity: 1, price: 0 }] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.items.length) {
      newErrors.items = 'At least one item is required';
    } else {
      form.items.forEach((item, index) => {
        if (!item.product_id) {
          newErrors[`item_${index}_product`] = 'Product is required';
        }
        if (!item.quantity || item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
        }
        if (!item.price || item.price < 0) {
          newErrors[`item_${index}_price`] = 'Price must be 0 or greater';
        }
        
        // Check stock validation state
        const validationKey = `item_${index}`;
        const stockValidation = getValidationState(validationKey);
        if (item.product_id && item.quantity > 0 && !stockValidation.valid && stockValidation.error) {
          newErrors[`item_${index}_stock`] = stockValidation.error;
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // Coerce numeric fields safely - let backend handle timestamps automatically
      const payload = {
        customer_name: form.customer_name || undefined,
        tax: Number(form.tax) || 0,
        discount: Number(form.discount) || 0,
        items: form.items.map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
          price: Number(it.price),
        })).filter((it) => it.product_id && it.quantity > 0 && it.price >= 0),
      };
      
      await onSubmit?.(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Beautiful Header */}
            <div className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 px-8 py-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-rose-600/20"></div>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-white/5 rounded-full"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                    <ShoppingCart className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <motion.h2 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-2xl font-bold text-white flex items-center"
                    >
                      {initial ? "Edit Sale" : "New Sale"}
                      <Sparkles className="h-5 w-5 ml-2 text-yellow-300" />
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-purple-100 text-sm"
                    >
                      {initial ? "Update sale transaction details" : "Create a new sale transaction"}
                    </motion.p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose} 
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all duration-300 backdrop-blur-sm"
                >
                  <X className="h-6 w-6 text-white" />
                </motion.button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Form content starts here */}

              <form onSubmit={submit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Users className="h-4 w-4 text-purple-500 mr-2" />
                      Customer Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.customer_name}
                        onChange={(e) => update({ customer_name: e.target.value })}
                        className="px-6 py-4 w-full rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all duration-300 bg-gradient-to-r from-white to-purple-50/30 placeholder-gray-400"
                        placeholder="Enter customer name (optional)"
                      />
                    </div>
                  </motion.div>
                  
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <DollarSign className="h-4 w-4 text-emerald-500 mr-2" />
                      Tax (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.tax}
                        onChange={(e) => update({ tax: e.target.value })}
                        className="px-6 py-4 w-full rounded-2xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all duration-300 bg-gradient-to-r from-white to-emerald-50/30 placeholder-gray-400"
                        placeholder="0.00"
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <DollarSign className="h-4 w-4 text-rose-500 mr-2" />
                      Discount (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.discount}
                        onChange={(e) => update({ discount: e.target.value })}
                        className="px-6 py-4 w-full rounded-2xl border-2 border-gray-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 focus:outline-none transition-all duration-300 bg-gradient-to-r from-white to-rose-50/30 placeholder-gray-400"
                        placeholder="0.00"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Items */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-xl mr-3">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Sale Items
                      </h3>
                    </div>
                    <motion.button 
                      type="button" 
                      onClick={addItem} 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </motion.button>
                  </div>

                  <div className="space-y-5">
                    {form.items.map((it, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="bg-gradient-to-r from-gray-50 to-indigo-50/50 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                              <Package className="h-3 w-3 text-indigo-500 mr-1" />
                              Product
                            </label>
                            <ProductSelector
                              key={`product-selector-${modalKey}-${idx}`}
                              value={it.product_id}
                              onChange={(productId) => updateItem(idx, { product_id: productId })}
                            />
                            {errors[`item_${idx}_product`] && (
                              <div className="flex items-center mt-2 text-red-600 text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {errors[`item_${idx}_product`]}
                              </div>
                            )}
                          </div>
                          
                          <div className="col-span-6 md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                              Quantity
                              {(() => {
                                const validationKey = `item_${idx}`;
                                const stockValidation = getValidationState(validationKey);
                                if (it.product_id && it.quantity > 0) {
                                  if (stockValidation.loading) {
                                    return <Clock className="h-3 w-3 ml-1 text-blue-500 animate-spin" />;
                                  } else if (stockValidation.valid) {
                                    return <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />;
                                  } else if (stockValidation.error) {
                                    return <XCircle className="h-3 w-3 ml-1 text-red-500" />;
                                  }
                                }
                                return null;
                              })()} 
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                                className={`px-4 py-3 w-full rounded-xl border-2 focus:ring-4 focus:outline-none transition-all duration-300 bg-white ${
                                  errors[`item_${idx}_quantity`] || errors[`item_${idx}_stock`]
                                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                                    : (() => {
                                        const validationKey = `item_${idx}`;
                                        const stockValidation = getValidationState(validationKey);
                                        if (it.product_id && it.quantity > 0 && stockValidation.valid) {
                                          return 'border-green-300 focus:border-green-400 focus:ring-green-100';
                                        }
                                        return 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-100';
                                      })()
                                }`}
                              />
                            </div>
                            {errors[`item_${idx}_quantity`] && (
                              <div className="flex items-center mt-2 text-red-600 text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {errors[`item_${idx}_quantity`]}
                              </div>
                            )}
                            {errors[`item_${idx}_stock`] && (
                              <div className="flex items-center mt-2 text-red-600 text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
                                {errors[`item_${idx}_stock`]}
                              </div>
                            )}
                            {(() => {
                              const validationKey = `item_${idx}`;
                              const stockValidation = getValidationState(validationKey);
                              if (it.product_id && it.quantity > 0 && stockValidation.valid && stockValidation.warnings?.length > 0) {
                                return (
                                  <div className="flex items-center mt-2 text-amber-600 text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {stockValidation.warnings[0]}
                                  </div>
                                );
                              }
                              return null;
                            })()} 
                          </div>
                          
                          <div className="col-span-6 md:col-span-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.price}
                              onChange={(e) => updateItem(idx, { price: e.target.value })}
                              className={`px-4 py-3 w-full rounded-xl border-2 focus:ring-4 focus:outline-none transition-all duration-300 bg-white ${
                                errors[`item_${idx}_price`] 
                                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100' 
                                  : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-100'
                              }`}
                            />
                            {errors[`item_${idx}_price`] && (
                              <div className="flex items-center mt-2 text-red-600 text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {errors[`item_${idx}_price`]}
                              </div>
                            )}
                          </div>
                          
                          <div className="col-span-12 md:col-span-2 flex items-end">
                            <motion.button 
                              type="button" 
                              onClick={() => removeItem(idx)} 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-full px-3 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </div>
                        
                        {/* Show subtotal for this item */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Item Subtotal:</span>
                            <span className="text-lg font-bold text-gray-800">
                              ${((it.quantity || 0) * (it.price || 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Total Calculation Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 shadow-sm"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl mr-3">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Sale Summary
                      </h3>
                    </div>
                    
                    {(() => {
                      // Calculate totals using same logic as backend
                      const itemsSubtotal = form.items.reduce((sum, item) => {
                        const quantity = Number(item.quantity) || 0;
                        const price = Number(item.price) || 0;
                        return sum + (quantity * price);
                      }, 0);
                      
                      const taxPercentage = Number(form.tax) || 0;
                      const discountPercentage = Number(form.discount) || 0;
                      
                      const taxAmount = (taxPercentage / 100) * itemsSubtotal;
                      const discountAmount = (discountPercentage / 100) * itemsSubtotal;
                      const finalTotal = Math.max(0, itemsSubtotal + taxAmount - discountAmount);
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-gray-700">
                            <span className="font-medium">Items Subtotal:</span>
                            <span className="font-semibold">${itemsSubtotal.toFixed(2)}</span>
                          </div>
                          
                          {taxPercentage > 0 && (
                            <div className="flex justify-between items-center text-emerald-600">
                              <span className="font-medium">Tax ({taxPercentage}%):</span>
                              <span className="font-semibold">+${taxAmount.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {discountPercentage > 0 && (
                            <div className="flex justify-between items-center text-rose-600">
                              <span className="font-medium">Discount ({discountPercentage}%):</span>
                              <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="pt-3 border-t border-purple-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold text-gray-800">Final Total:</span>
                              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                ${finalTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                </motion.div>

                {errors.items && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl shadow-sm"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <span className="text-red-700 font-medium">{errors.items}</span>
                  </motion.div>
                )}

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-4 pt-6 border-t border-gray-200"
                >
                  <motion.button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-bold hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {initial ? 'Update Sale' : 'Create Sale'}
                      </div>
                    )}
                  </motion.button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
