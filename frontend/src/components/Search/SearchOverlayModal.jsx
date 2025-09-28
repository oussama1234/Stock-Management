// src/components/Search/SearchOverlayModal.jsx
import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search as SearchIcon } from 'lucide-react';

function SearchOverlayModal({ open, term, setTerm, loading, results, onClose, onViewAll, onNavigateProduct }) {
  const products = results?.products?.data || [];
  const suppliers = results?.suppliers?.data || [];
  const customers = (results?.customers?.data || []).map(c => ({ name: c.customer_name, last: c.last_sale_date }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[9999]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="absolute inset-x-0 top-0 bg-white dark:bg-gray-900 rounded-b-3xl shadow-2xl border-b border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl"><SearchIcon className="h-5 w-5 text-gray-500" /></div>
              <input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search anything..."
                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400"
              />
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              {loading ? (
                <div className="grid grid-cols-1 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {/* Products */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-2">Products</div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
                      {(products.length === 0) ? (
                        <div className="p-3 text-sm text-gray-500">No products</div>
                      ) : products.map(p => (
                        <button key={`p-${p.id}`} onClick={() => onNavigateProduct?.(p.id)} className="w-full text-left p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                          {p.image ? <img src={p.image} alt="" className="w-8 h-8 rounded" /> : <div className="w-8 h-8 rounded bg-gray-100" />}
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-xs text-gray-500 truncate">{p.category || '—'} • Stock {p.available}/{p.stock}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suppliers */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-2">Suppliers</div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
                      {(suppliers.length === 0) ? (
                        <div className="p-3 text-sm text-gray-500">No suppliers</div>
                      ) : suppliers.map(s => (
                        <div key={`s-${s.id}`} className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">S</div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{s.name}</div>
                            <div className="text-xs text-gray-500 truncate">{s.email || '—'} • {s.phone || ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customers */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-2">Customers</div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
                      {(customers.length === 0) ? (
                        <div className="p-3 text-sm text-gray-500">No customers</div>
                      ) : customers.map((c, idx) => (
                        <div key={`c-${idx}`} className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">C</div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{c.name}</div>
                            <div className="text-xs text-gray-500 truncate">Last {c.last ? new Date(c.last).toLocaleDateString() : '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 text-right">
                    <button onClick={onViewAll} className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200">View all results</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(SearchOverlayModal);
