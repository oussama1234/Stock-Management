// src/pages/Admin/Sales/components/SaleModal.jsx
// Modal for creating or editing a sale.
// - Captures customer name, sale_date, tax, discount
// - Lets user add multiple items (product_id, quantity, price)
// - Emits onSubmit(payload) for parent to call create/update API
// NOTE: For brevity, product selector is a simple numeric input; you can replace
// it with a searchable dropdown (using your categories/products queries) later.

import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import ProductSelector from "./ProductSelector";
import SalesLoadingButton from "./SalesLoadingButton";

// Helper function to format datetime for datetime-local input
const formatDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    // Format as YYYY-MM-DDTHH:mm (required by datetime-local input)
    return date.toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

export default function SaleModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(() => ({
    customer_name: initial?.customer_name || "",
    sale_date: formatDateTimeLocal(initial?.sale_date) || "",
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

  // Reset form when initial changes (switching between create/edit or different sales)
  useEffect(() => {
    setForm({
      customer_name: initial?.customer_name || "",
      sale_date: formatDateTimeLocal(initial?.sale_date) || "",
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
  }, [initial, open]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateItem = (idx, patch) => setForm((f) => ({
    ...f,
    items: f.items.map((it, i) => i === idx ? { ...it, ...patch } : it),
  }));
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
      // Coerce numeric fields safely and format date properly
      const payload = {
        customer_name: form.customer_name || undefined,
        sale_date: form.sale_date ? form.sale_date : undefined, // Send as YYYY-MM-DDTHH:mm format
        tax: Number(form.tax) || 0,
        discount: Number(form.discount) || 0,
        items: form.items.map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
          price: Number(it.price),
        })).filter((it) => it.product_id && it.quantity > 0 && it.price >= 0),
      };
      
      console.log('SaleModal payload:', payload); // Debug log
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
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">{initial ? "Edit Sale" : "New Sale"}</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-300">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                    <input
                      type="text"
                      value={form.customer_name}
                      onChange={(e) => update({ customer_name: e.target.value })}
                      className="px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="datetime-local"
                      value={form.sale_date}
                      onChange={(e) => update({ sale_date: e.target.value })}
                      className="px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.tax}
                      onChange={(e) => update({ tax: e.target.value })}
                      className="px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.discount}
                      onChange={(e) => update({ discount: e.target.value })}
                      className="px-4 py-3 w-full rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-semibold text-gray-800">Items</h3>
                    <button type="button" onClick={addItem} className="px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors flex items-center">
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                          <ProductSelector
                            key={`product-selector-${modalKey}-${idx}`}
                            value={it.product_id}
                            onChange={(productId) => updateItem(idx, { product_id: productId })}
                          />
                          {errors[`item_${idx}_product`] && (
                            <div className="flex items-center mt-1 text-red-600 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {errors[`item_${idx}_product`]}
                            </div>
                          )}
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                            className={`px-3 py-2 w-full rounded-lg border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
                              errors[`item_${idx}_quantity`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors[`item_${idx}_quantity`] && (
                            <div className="flex items-center mt-1 text-red-600 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {errors[`item_${idx}_quantity`]}
                            </div>
                          )}
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.price}
                            onChange={(e) => updateItem(idx, { price: e.target.value })}
                            className={`px-3 py-2 w-full rounded-lg border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
                              errors[`item_${idx}_price`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors[`item_${idx}_price`] && (
                            <div className="flex items-center mt-1 text-red-600 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {errors[`item_${idx}_price`]}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 flex items-end">
                          <button type="button" onClick={() => removeItem(idx)} className="w-full px-3 py-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors flex items-center justify-center">
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {errors.items && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-700">{errors.items}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <SalesLoadingButton
                    type="button"
                    onClick={onClose}
                    variant="secondary"
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </SalesLoadingButton>
                  
                  <SalesLoadingButton
                    type="submit"
                    loading={loading}
                    className="flex-1"
                    variant="primary"
                  >
                    {initial ? 'Update Sale' : 'Create Sale'}
                  </SalesLoadingButton>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
