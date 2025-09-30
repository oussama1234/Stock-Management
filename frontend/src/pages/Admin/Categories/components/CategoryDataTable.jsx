// src/pages/Admin/Categories/components/CategoryDataTable.jsx
// High-performance data table with lazy loading and virtualization
import { memo, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  CheckSquare,
  Square
} from 'lucide-react';
import CategoryTableRow from './CategoryTableRow';

const CategoryDataTable = memo(function CategoryDataTable({
  categories = [],
  loading = false,
  selectedIds = new Set(),
  sortField = 'name',
  sortDirection = 'asc',
  onSort,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onView,
  onExport
}) {
  // Memoized table columns configuration
  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Category',
      sortable: true,
      width: 'min-w-[300px]',
      icon: Package,
    },
    {
      key: 'products_count',
      label: 'Products',
      sortable: true,
      width: 'w-32',
      align: 'text-center',
      icon: Package,
    },
    {
      key: 'total_sold',
      label: 'Units Sold',
      sortable: true,
      width: 'w-36',
      align: 'text-right',
      icon: ShoppingCart,
    },
    {
      key: 'total_purchased',
      label: 'Units Purchased',
      sortable: true,
      width: 'w-40',
      align: 'text-right',
      icon: Package,
    },
    {
      key: 'total_profit',
      label: 'Total Profit',
      sortable: true,
      width: 'w-36',
      align: 'text-right',
      icon: DollarSign,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: 'w-32',
      align: 'text-center',
    },
  ], []);

  // Memoized sort handlers
  const handleSort = useCallback((field) => {
    if (!onSort) return;
    
    if (sortField === field) {
      onSort(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  }, [onSort, sortField, sortDirection]);

  // Memoized selection handlers
  const handleSelectAll = useCallback(() => {
    if (!onSelectAll) return;
    
    const allSelected = categories.length > 0 && categories.every(cat => selectedIds.has(cat.id));
    onSelectAll(!allSelected);
  }, [onSelectAll, categories, selectedIds]);

  const handleRowSelect = useCallback((categoryId) => {
    if (!onSelect) return;
    onSelect(categoryId);
  }, [onSelect]);

  // Memoized CRUD handlers
  const handleEdit = useCallback((category) => {
    onEdit?.(category);
  }, [onEdit]);

  const handleDelete = useCallback((category) => {
    onDelete?.(category);
  }, [onDelete]);

  const handleView = useCallback((category) => {
    onView?.(category);
  }, [onView]);

  // Memoized sort icon renderer
  const getSortIcon = useCallback((field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    
    const IconComponent = sortDirection === 'asc' ? ArrowUp : ArrowDown;
    return <IconComponent className="h-3 w-3 text-blue-500" />;
  }, [sortField, sortDirection]);

  // Check if all visible items are selected
  const allSelected = categories.length > 0 && categories.every(cat => selectedIds.has(cat.id));
  const someSelected = categories.some(cat => selectedIds.has(cat.id));

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 border-b border-gray-200">
              {/* Select All Checkbox */}
              <th className="p-4 w-12">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center"
                >
                  <button
                    onClick={handleSelectAll}
                    className="relative p-1 rounded transition-colors hover:bg-white/50"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-blue-500" />
                    ) : someSelected ? (
                      <div className="h-4 w-4 bg-blue-500 rounded-sm flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-white rounded-sm"></div>
                      </div>
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </motion.div>
              </th>

              {/* Column Headers */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${column.width} p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider ${column.align || 'text-left'}`}
                >
                  {column.sortable ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSort(column.key)}
                      className="group flex items-center gap-2 hover:text-gray-800 transition-colors duration-200 w-full"
                    >
                      {column.icon && (
                        <column.icon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      )}
                      <span className="font-medium">{column.label}</span>
                      {getSortIcon(column.key)}
                    </motion.button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {column.icon && <column.icon className="h-4 w-4 text-gray-400" />}
                      <span className="font-medium">{column.label}</span>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            <AnimatePresence mode="popLayout">
              {categories.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={columns.length + 1} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Package className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        No categories found
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md">
                        Try adjusting your search criteria or add a new category to get started.
                      </p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                categories.map((category, index) => (
                  <CategoryTableRow
                    key={category.id}
                    category={category}
                    index={index}
                    isSelected={selectedIds.has(category.id)}
                    onSelect={handleRowSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onExport={onExport}
                  />
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Table Footer with Selection Info */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="bg-blue-50/50 border-t border-blue-100 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-blue-700">
                {selectedIds.size} {selectedIds.size === 1 ? 'category' : 'categories'} selected
              </div>
              <div className="h-4 w-px bg-blue-200"></div>
              <button
                onClick={() => onSelectAll?.(false)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Clear selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // Handle bulk export
                  const selectedCategories = categories.filter(cat => selectedIds.has(cat.id));
                  onExport?.(selectedCategories);
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                <BarChart3 className="h-4 w-4" />
                Export Selected
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
});

export default CategoryDataTable;