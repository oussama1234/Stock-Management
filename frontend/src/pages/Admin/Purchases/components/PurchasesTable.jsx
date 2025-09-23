// src/pages/Admin/Purchases/components/PurchasesTable.jsx
// Beautiful animated table for purchases listing with hover effects and expandable rows
// - Shows purchase meta (date, supplier, user), total, items count
// - Expand row to reveal line items (product, qty, price) with beautiful cards
// - Provides Edit/Delete actions with smooth hover animations
// - Sortable columns with animated sort indicators

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Pencil, 
  Trash2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Building2,
  User,
  Package,
  Calendar,
  DollarSign,
  ShoppingCart,
  Sparkles,
  Box
} from "lucide-react";
import { useState } from "react";

// Animation variants for table rows
const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

// Animation variants for expandable content
const expandVariants = {
  hidden: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.2 }
  },
  visible: { 
    height: 'auto', 
    opacity: 1,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Animation variants for purchase item cards
const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200
    }
  }
};

export default function PurchasesTable({ 
  rows, 
  onEdit, 
  onDelete, 
  formatCurrency, 
  formatDate, 
  onSort, 
  sortBy, 
  sortOrder 
}) {
  const [expanded, setExpanded] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);

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

  const SortableHeader = ({ column, children, icon: Icon }) => (
    <th className="px-6 py-4 text-left">
      <button
        onClick={() => handleSort(column)}
        className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 group"
      >
        {Icon && <Icon className="h-4 w-4 text-emerald-500" />}
        <span>{children}</span>
        <span 
          className={`transition-all duration-300 ${
            sortBy === column 
              ? 'opacity-100 text-emerald-600' 
              : 'opacity-0 group-hover:opacity-70 text-gray-400'
          } ${sortBy === column && sortOrder === 'asc' ? 'rotate-180' : ''}`}
        >
          {getSortIcon(column)}
        </span>
      </button>
    </th>
  );

  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No purchases found</h3>
        <p className="text-gray-500 dark:text-gray-400">Start by creating your first purchase order.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200/60 dark:border-gray-600/60">
            <SortableHeader column="purchase_date" icon={Calendar}>
              Date
            </SortableHeader>
            <th className="px-6 py-4 text-left">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Building2 className="h-4 w-4 text-emerald-500" />
                <span>Supplier</span>
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4 text-emerald-500" />
                <span>Purchaser</span>
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Package className="h-4 w-4 text-emerald-500" />
                <span>Items</span>
              </div>
            </th>
            <SortableHeader column="total_amount" icon={DollarSign}>
              Total
            </SortableHeader>
            <th className="px-6 py-4 text-right">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((purchase, index) => (
            <React.Fragment key={purchase.id}>
              <tr
                onMouseEnter={() => setHoveredRow(purchase.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`border-b border-gray-100 dark:border-gray-700 transition-all duration-300 ${
                  hoveredRow === purchase.id 
                    ? 'bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 shadow-sm' 
                    : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-2 rounded-lg mr-3">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(purchase.purchase_date)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">#{purchase.id}</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-lg mr-3">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {purchase.supplier?.name || 'Unknown Supplier'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {purchase.supplier?.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-2 rounded-lg mr-3">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {purchase.user?.name || 'Unknown User'}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800">
                    <Box className="h-3 w-3 mr-1" />
                    <span className="text-sm font-medium">
                      {(purchase.purchaseItems || purchase.purchase_items || []).length}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-lg font-bold text-emerald-600">
                    {formatCurrency(purchase.total_amount)}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    {/* Expand/Collapse Button */}
                    <button 
                      onClick={() => toggle(purchase.id)}
                      className="p-2 rounded-xl bg-white border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className={`transform transition-transform duration-200 ${expanded[purchase.id] ? 'rotate-180' : ''}`}>
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      </div>
                    </button>

                    {/* Edit Button */}
                    <button 
                      onClick={() => onEdit?.(purchase)}
                      className="p-2 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 hover:from-blue-200 hover:to-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    <button 
                      onClick={() => onDelete?.(purchase)}
                      className="p-2 rounded-xl bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 hover:from-rose-200 hover:to-red-200 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Expandable Row Content */}
              <tr>
                <td colSpan={6} className="p-0">
                  {expanded[purchase.id] ? (
                    <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 overflow-hidden">
                      <div className={`transition-all duration-300 ${expanded[purchase.id] ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-8 py-6">
                          <div className="flex items-center mb-4">
                            <Sparkles className="h-5 w-5 text-emerald-500 mr-2" />
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                              Purchase Items
                            </h4>
                            <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                              {(purchase.purchaseItems || purchase.purchase_items || []).length} items
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(purchase.purchaseItems || purchase.purchase_items || []).map((item) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 p-5 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow duration-200"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                      {item.product?.name}
                                    </div>
                                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                                      {item.product?.category?.name || 'Uncategorized'}
                                    </div>
                                  </div>
                                  <div className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                    #{item.id}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                      <Package className="h-3 w-3 mr-1" />
                                      Quantity
                                    </span>
                                    <span className="font-semibold text-emerald-600">
                                      {item.quantity}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      Unit Price
                                    </span>
                                    <span className="font-semibold">
                                      {formatCurrency(item.price)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Line Total
                                    </span>
                                    <span className="font-bold text-emerald-600 text-lg">
                                      {formatCurrency(item.price * item.quantity)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {(!(purchase.purchaseItems || purchase.purchase_items) || (purchase.purchaseItems || purchase.purchase_items || []).length === 0) && (
                            <div className="text-center py-8 text-gray-500">
                              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No items found for this purchase</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </td>
              </tr>
              </React.Fragment>
            ))}
        </tbody>
      </table>
    </div>
  );
}