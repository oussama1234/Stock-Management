// src/pages/Inventory/Adjustments/AdjustmentFormModal.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts, getProductById } from '@/api/Products';
import { getProductStockInfo } from '@/api/StockValidation';
import { Check, Loader2, Minus, Plus, Search, X } from 'lucide-react';

const reasons = [
  { value: 'damage', label: 'Damage' },
  { value: 'lost', label: 'Lost' },
  { value: 'correction', label: 'Correction' },
  { value: 'other', label: 'Other' },
];

export default function AdjustmentFormModal({ open, onOpenChange, onProceed, initialProductId, initialProductName }) {
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productOpen, setProductOpen] = useState(false);
  const comboRef = useRef(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentStock, setCurrentStock] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  const [newQty, setNewQty] = useState('');
  const [reason, setReason] = useState('correction');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const handler = (e) => { if (comboRef.current && !comboRef.current.contains(e.target)) { setProductOpen(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setLoadingProducts(true);
        const res = await getProducts({ per_page: 200 });
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (active) setProducts(list);
      } catch (e) {
        if (active) setProducts([]);
      } finally {
        if (active) setLoadingProducts(false);
      }
    };
    run();
    return () => { active = false; };
  }, [open]);

  const fetchStock = useCallback(async (id) => {
    setLoadingStock(true);
    try {
      // Try dedicated stock info endpoint first
      const info = await getProductStockInfo(Number(id));
      const stock = info?.current_stock ?? info?.data?.current_stock ?? info?.stock ?? null;
      if (typeof stock === 'number') setCurrentStock(stock);
      else {
        const p = await getProductById(Number(id));
        const pd = p?.data || p;
        setCurrentStock(typeof pd?.stock === 'number' ? pd.stock : null);
      }
    } catch (e) {
      try {
        const p = await getProductById(Number(id));
        const pd = p?.data || p;
        setCurrentStock(typeof pd?.stock === 'number' ? pd.stock : null);
      } catch (_) {
        setCurrentStock(null);
      }
    } finally {
      setLoadingStock(false);
    }
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedProduct(null); setCurrentStock(null); setNewQty(''); setReason('correction'); setNotes(''); setProductSearch(''); setProductOpen(false);
    }
  }, [open]);

  // Preselect product if provided when modal opens
  useEffect(() => {
    if (open && initialProductId) {
      const p = { id: Number(initialProductId), name: initialProductName || `Product #${initialProductId}` };
      setSelectedProduct(p);
      fetchStock(Number(initialProductId));
    }
  }, [open, initialProductId, initialProductName, fetchStock]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter(p => !q || (p.name || '').toLowerCase().includes(q));
  }, [productSearch, products]);

  const diff = useMemo(() => {
    const cur = Number(currentStock ?? 0);
    const nxt = Number(newQty || 0);
    return nxt - cur;
  }, [currentStock, newQty]);

  const canProceed = selectedProduct && newQty !== '' && Number.isFinite(Number(newQty));

  const onSelectProduct = async (p) => {
    setSelectedProduct(p); setProductOpen(false); await fetchStock(p.id);
  };

  const onConfirm = () => {
    if (!canProceed) return;
    onProceed?.({
      product: selectedProduct,
      product_id: selectedProduct.id,
      current_stock: Number(currentStock ?? 0),
      new_quantity: Number(newQty),
      difference: diff,
      reason,
      notes: notes?.trim() || null,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200 p-0 focus:outline-none"
          aria-label="New Inventory Adjustment"
        >
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold">New Inventory Adjustment</Dialog.Title>
              <Dialog.Close className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="mt-4 space-y-4">
              {/* Product selector */}
              <div className="relative" ref={comboRef}>
                <label className="block text-sm text-gray-600 mb-1">Product</label>
                <button
                  type="button"
                  onClick={() => setProductOpen(o => !o)}
                  className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 bg-white hover:shadow text-left"
                  aria-haspopup="listbox"
                  aria-expanded={productOpen}
                >
                  <span className="truncate">
                    {selectedProduct ? selectedProduct.name : (loadingProducts ? 'Loading products...' : 'Select product...')}
                  </span>
                  <Search className="h-4 w-4 opacity-60" />
                </button>
                <AnimatePresence>
                  {productOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-2"
                      role="listbox"
                    >
                      <div className="flex items-center gap-2 p-2 border-b border-gray-200">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                          autoFocus
                          className="flex-1 bg-transparent outline-none text-sm"
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-64 overflow-auto py-1">
                        {filteredProducts.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => onSelectProduct(p)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 flex items-center justify-between ${selectedProduct?.id === p.id ? 'bg-gray-50' : ''}`}
                            role="option"
                            aria-selected={selectedProduct?.id === p.id}
                          >
                            <span className="truncate">{p.name}</span>
                            {selectedProduct?.id === p.id && <Check className="h-4 w-4 opacity-80" />}
                          </button>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Current stock and new quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Current Stock</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
                    {loadingStock ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : null}
                    <span className="font-medium">{currentStock ?? '—'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">New Stock Quantity</label>
                  <div className="inline-flex items-center w-full rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setNewQty(v => String(Math.max(0, (Number(v || 0) - 1))))}
                      className="p-2 hover:bg-gray-100"
                      aria-label="Decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      inputMode="numeric"
                      type="number"
                      min={0}
                      className="flex-1 px-3 py-2 outline-none"
                      placeholder="0"
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setNewQty(v => String(Math.max(0, (Number(v || 0) + 1))))}
                      className="p-2 hover:bg-gray-100"
                      aria-label="Increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Difference badge */}
                  {selectedProduct && newQty !== '' && (
                    <div className="mt-2 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border ${diff >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {diff >= 0 ? '+ ' : '- '}{Math.abs(diff)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Adjustment Reason</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-label="Adjustment Reason"
                >
                  {reasons.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-gray-500">Why stock changed</div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white resize-y"
                  placeholder="Add any relevant details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <button className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">Cancel</button>
              </Dialog.Close>
              <button
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow disabled:opacity-60"
                disabled={!canProceed}
                onClick={onConfirm}
              >
                Confirm Adjustment
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
