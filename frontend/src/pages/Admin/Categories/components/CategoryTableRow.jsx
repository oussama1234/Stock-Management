// src/pages/Admin/Categories/components/CategoryTableRow.jsx
// Optimized table row with memoization and lazy loading
import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart
} from 'lucide-react';

const CategoryTableRow = memo(function CategoryTableRow({
  category,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onView,
  onExport
}) {
  // Memoized formatters
  const formatCurrency = useCallback((value) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }, []);

  const formatNumber = useCallback((value) => {
    const num = parseInt(value) || 0;
    return new Intl.NumberFormat('en-US').format(num);
  }, []);

  // Memoized event handlers to prevent re-renders
  const handleSelect = useCallback(() => {
    onSelect?.(category.id);
  }, [onSelect, category.id]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit?.(category);
  }, [onEdit, category]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete?.(category);
  }, [onDelete, category]);

  const handleView = useCallback((e) => {
    e.stopPropagation();
    onView?.(category);
  }, [onView, category]);

  const handleRowClick = useCallback(() => {
    onView?.(category);
  }, [onView, category]);

  // Memoized profit indicator
  const profitIndicator = category.total_profit > 0 ? 'positive' : 
                         category.total_profit < 0 ? 'negative' : 'neutral';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.03,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.03)' }}
      className="border-b border-gray-100 cursor-pointer transition-all duration-200 group"
      onClick={handleRowClick}
    >
      {/* Selection Checkbox */}
      <td className="p-4 w-12">
        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
          />
        </motion.div>
      </td>

      {/* Category Info */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200"
          >
            <Package className="h-6 w-6 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate">
              {category.name}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {category.description || 'No description'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ID: {category.id}
            </div>
          </div>
        </div>
      </td>

      {/* Products Count */}
      <td className="p-4 text-center">
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="inline-flex items-center justify-center w-12 h-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full border border-gray-200 group-hover:border-blue-300 transition-all duration-200"
        >
          <span className="text-sm font-semibold text-gray-700">
            {formatNumber(category.products_count)}
          </span>
        </motion.div>
      </td>

      {/* Units Sold */}
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <ShoppingCart className="h-4 w-4 text-green-500" />
          <div>
            <div className="font-semibold text-gray-900">
              {formatNumber(category.total_sold)}
            </div>
            <div className="text-xs text-gray-500">units</div>
          </div>
        </div>
      </td>

      {/* Units Purchased */}
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Package className="h-4 w-4 text-blue-500" />
          <div>
            <div className="font-semibold text-gray-900">
              {formatNumber(category.total_purchased)}
            </div>
            <div className="text-xs text-gray-500">units</div>
          </div>
        </div>
      </td>

      {/* Total Profit */}
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {profitIndicator === 'positive' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : profitIndicator === 'negative' ? (
            <TrendingDown className="h-4 w-4 text-red-500" />
          ) : (
            <DollarSign className="h-4 w-4 text-gray-400" />
          )}
          <div>
            <div className={`font-semibold ${
              profitIndicator === 'positive' ? 'text-green-600' :
              profitIndicator === 'negative' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {formatCurrency(category.total_profit)}
            </div>
            <div className={`text-xs ${
              profitIndicator === 'positive' ? 'text-green-500' :
              profitIndicator === 'negative' ? 'text-red-500' :
              'text-gray-500'
            }`}>
              {profitIndicator === 'positive' ? 'Profit' :
               profitIndicator === 'negative' ? 'Loss' : 'Neutral'}
            </div>
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="p-4">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleView}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEdit}
            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors duration-200"
            title="Edit Category"
          >
            <Edit className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete Category"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>

          <motion.div className="relative group/menu">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              title="More Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </motion.button>
            
            {/* Dropdown menu would go here */}
          </motion.div>
        </div>
      </td>
    </motion.tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.category.id === nextProps.category.id &&
    prevProps.category.name === nextProps.category.name &&
    prevProps.category.total_sold === nextProps.category.total_sold &&
    prevProps.category.total_purchased === nextProps.category.total_purchased &&
    prevProps.category.total_profit === nextProps.category.total_profit &&
    prevProps.category.products_count === nextProps.category.products_count &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.index === nextProps.index
  );
});

export default CategoryTableRow;