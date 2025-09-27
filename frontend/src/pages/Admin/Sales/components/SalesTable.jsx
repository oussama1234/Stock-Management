// src/pages/Admin/Sales/components/SalesTable.jsx
// Beautiful animated table for sales listing with hover effects and expandable rows
// - Shows sale meta (date, customer, user), total, items count
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
  Users,
  User,
  Package,
  Calendar,
  DollarSign,
  ShoppingCart,
  Sparkles,
  Box,
  UserCheck,
  Star
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

// Animation variants for sale item cards
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

export default function SalesTable({ 
  rows, 
  onEdit, 
  onDelete, 
  formatCurrency, 
  formatDate, 
  onSort, 
  sortBy, 
  sortOrder,
  deletingId
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
        className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 group"
      >
        {Icon && <Icon className="h-4 w-4 text-purple-500" />}
        <span>{children}</span>
        <span 
          className={`transition-all duration-300 ${
            sortBy === column 
              ? 'opacity-100 text-purple-600' 
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
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="h-8 w-8 text-purple-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No sales found</h3>
        <p className="text-gray-500 dark:text-gray-400">Start by creating your first sale order.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200/60 dark:border-gray-600/60">
            <SortableHeader column="updated_at" icon={Calendar}>
              Date
            </SortableHeader>
            <th className="px-6 py-4 text-left">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Users className="h-4 w-4 text-purple-500" />
                <span>Customer</span>
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <UserCheck className="h-4 w-4 text-purple-500" />
                <span>Sold By</span>
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Package className="h-4 w-4 text-purple-500" />
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
          {rows.map((sale, index) => (
            <React.Fragment key={sale.id}>
              <tr
                onMouseEnter={() => setHoveredRow(sale.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`border-b border-gray-100 dark:border-gray-700 transition-all duration-300 ${
                  hoveredRow === sale.id 
                    ? 'bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-sm' 
                    : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className={`bg-gradient-to-r p-2 rounded-lg mr-3 ${
                      new Date(sale.updated_at) > new Date(sale.created_at)
                        ? 'from-amber-100 to-orange-100'
                        : 'from-green-100 to-emerald-100'
                    }`}>
                      <Calendar className={`h-4 w-4 ${
                        new Date(sale.updated_at) > new Date(sale.created_at)
                          ? 'text-amber-600'
                          : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(
                          new Date(sale.updated_at) > new Date(sale.created_at)
                            ? sale.updated_at
                            : sale.created_at
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(sale.updated_at) > new Date(sale.created_at) ? 'Updated' : 'Created'} • #{sale.id}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-lg mr-3">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {sale.customer_name || 'Walk-in Customer'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {sale.customer_name ? 'Named Customer' : 'Anonymous'}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-2 rounded-lg mr-3">
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {sale.user?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {sale.user?.role || 'staff'}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-2 rounded-lg mr-3">
                      <Package className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {sale.items?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {sale.items?.length === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-2 rounded-lg mr-3">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(sale.total_amount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Revenue
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggle(sale.id)}
                      className="group p-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <motion.div
                        animate={{ rotate: expanded[sale.id] ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
                      </motion.div>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit?.(sale)}
                      className="group p-2 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 text-purple-700 hover:text-purple-800 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Pencil className="h-4 w-4" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: deletingId === sale.id ? 1 : 1.05 }}
                      whileTap={{ scale: deletingId === sale.id ? 1 : 0.95 }}
                      onClick={() => onDelete?.(sale)}
                      disabled={deletingId === sale.id}
                      className={`group p-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md ${
                        deletingId === sale.id 
                          ? 'bg-gray-200 cursor-not-allowed'
                          : 'bg-gradient-to-r from-rose-100 to-red-200 hover:from-rose-200 hover:to-red-300 text-rose-700 hover:text-red-800'
                      }`}
                    >
                      {deletingId === sale.id ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </motion.button>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="p-0">
                  <AnimatePresence initial={false}>
                    {expanded[sale.id] && (
                      <motion.div
                        variants={expandVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="bg-gradient-to-r from-purple-50/30 to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/10 border-t border-purple-100 dark:border-purple-800"
                      >
                        <div className="px-8 py-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-2 rounded-lg mr-3">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                              </div>
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Sale Details</h4>
                            </div>
                            
                            {/* Sale-level Tax and Discount Summary */}
                            <div className="flex items-center space-x-6 bg-gradient-to-r from-gray-50 to-purple-50 px-4 py-2 rounded-xl border border-purple-100">
                              {(sale.tax > 0 || sale.discount > 0) && (
                                <>
                                  {sale.tax > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <div className="bg-emerald-100 p-1 rounded">
                                        <DollarSign className="h-3 w-3 text-emerald-600" />
                                      </div>
                                      <span className="text-xs font-medium text-emerald-700">Tax: {sale.tax}%</span>
                                    </div>
                                  )}
                                  {sale.discount > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <div className="bg-rose-100 p-1 rounded">
                                        <DollarSign className="h-3 w-3 text-rose-600" />
                                      </div>
                                      <span className="text-xs font-medium text-rose-700">Discount: {sale.discount}%</span>
                                    </div>
                                  )}
                                </>
                              ) || (
                                <span className="text-xs text-gray-500">No tax or discount applied</span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sale.items?.map((item, itemIndex) => (
                              <motion.div
                                key={item.id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: itemIndex * 0.1 }}
                                whileHover={{ 
                                  y: -4, 
                                  boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                                }}
                                className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 border border-purple-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-2 rounded-lg mr-3">
                                      <Box className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <h5 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                        {item.product?.name || 'Unknown Product'}
                                      </h5>
                                      <div className="text-xs text-purple-600 font-medium">#{item.id}</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                      <Package className="h-3 w-3 mr-1" />
                                      Quantity
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{item.quantity}</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      Unit Price
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.price)}</span>
                                  </div>
                                  
                                  {/* Show tax and discount breakdown for this item */}
                                  {(() => {
                                    const itemSubtotal = item.price * item.quantity;
                                    const itemTax = (sale.tax / 100) * itemSubtotal;
                                    const itemDiscount = (sale.discount / 100) * itemSubtotal;
                                    const itemTotal = itemSubtotal + itemTax - itemDiscount;
                                    
                                    return (
                                      <>
                                        {(sale.tax > 0 || sale.discount > 0) && (
                                          <div className="space-y-1 text-xs">
                                            <div className="flex items-center justify-between text-gray-600">
                                              <span>Item Subtotal:</span>
                                              <span>{formatCurrency(itemSubtotal)}</span>
                                            </div>
                                            
                                            {sale.tax > 0 && (
                                              <div className="flex items-center justify-between text-emerald-600">
                                                <span className="flex items-center">
                                                  <DollarSign className="h-2 w-2 mr-1" />
                                                  Tax ({sale.tax}%):
                                                </span>
                                                <span>+{formatCurrency(itemTax)}</span>
                                              </div>
                                            )}
                                            
                                            {sale.discount > 0 && (
                                              <div className="flex items-center justify-between text-rose-600">
                                                <span className="flex items-center">
                                                  <DollarSign className="h-2 w-2 mr-1" />
                                                  Discount ({sale.discount}%):
                                                </span>
                                                <span>-{formatCurrency(itemDiscount)}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        <div className="pt-2 mt-2 border-t border-purple-100 flex items-center justify-between">
                                          <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center">
                                            <Star className="h-3 w-3 mr-1 text-purple-500" />
                                            {(sale.tax > 0 || sale.discount > 0) ? 'Final Total' : 'Total'}
                                          </span>
                                          <span className="text-lg font-bold text-purple-600">
                                            {formatCurrency((sale.tax > 0 || sale.discount > 0) ? itemTotal : itemSubtotal)}
                                          </span>
                                        </div>
                                      </>
                                    );
                                  })()}
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
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
