// src/pages/Admin/Sales/components/SalesTable.jsx
// Animated, hover-friendly table for sales listing.
// - Shows sale meta (date, customer, user), total, items count
// - Expand row to reveal line items (product, qty, price)
// - Provides Edit/Delete actions via callbacks

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Eye, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";

export default function SalesTable({ rows, onEdit, onDelete, formatCurrency, formatDate, onSort, sortBy, sortOrder }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSort = (column) => {
    if (onSort) {
      const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
      onSort(column, newOrder);
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />;
  };

  const SortableHeader = ({ column, children }) => (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => handleSort(column)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors group"
      >
        <span>{children}</span>
        <span className={`transition-opacity ${sortBy === column ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          {getSortIcon(column)}
        </span>
      </button>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <SortableHeader column="sale_date">Date</SortableHeader>
            <SortableHeader column="customer_name">Customer</SortableHeader>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sold By</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Items</th>
            <SortableHeader column="total_amount">Total</SortableHeader>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sale) => (
            <>
              <tr key={sale.id} className="border-b border-gray-100 hover:bg-indigo-50/40 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700">{formatDate(sale.sale_date)}</td>
                <td className="px-4 py-3 text-sm text-gray-800 font-medium">{sale.customer_name || 'Walk-in Customer'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{sale.user?.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{sale.items?.length || 0}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button onClick={() => toggle(sale.id)} className="p-2 rounded-lg bg-white border hover:border-indigo-300 hover:shadow transition-all">
                      {expanded[sale.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button onClick={() => onEdit?.(sale)} className="p-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete?.(sale)} className="p-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="p-0">
                  <AnimatePresence initial={false}>
                    {expanded[sale.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white"
                      >
                        <div className="px-6 py-4">
                          <div className="text-sm text-gray-600 mb-2">Line Items</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sale.items?.map((it) => (
                              <motion.div
                                key={it.id}
                                whileHover={{ y: -2 }}
                                className="rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-4 shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-gray-800">{it.product?.name}</div>
                                  <div className="text-xs text-gray-500">#{it.id}</div>
                                </div>
                                <div className="mt-2 flex justify-between text-sm">
                                  <span className="text-gray-600">Qty</span>
                                  <span className="font-medium">{it.quantity}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Price</span>
                                  <span className="font-medium">{formatCurrency(it.price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Total</span>
                                  <span className="font-semibold">{formatCurrency(it.price * it.quantity)}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
