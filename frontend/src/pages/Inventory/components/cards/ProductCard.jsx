// src/pages/Inventory/components/cards/ProductCard.jsx
// Product card for grid view in inventory list
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Package, Eye, Edit3, MoreHorizontal } from 'lucide-react';

const ProductCard = memo(function ProductCard({ 
  product, 
  onEdit, 
  animationDelay = 0 
}) {
  const getStatusColor = (stock, available) => {
    if (available <= 0) return 'text-red-600 bg-red-100 border-red-200';
    if (available <= 10) return 'text-amber-600 bg-amber-100 border-amber-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  const getStatusLabel = (stock, available) => {
    if (available <= 0) return 'Out of Stock';
    if (available <= 10) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onClick={() => onEdit?.()}
    >
      {/* Product Image */}
      <div className="aspect-square mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {product.name}
          </h3>
          {product.category_name && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {product.category_name}
            </p>
          )}
        </div>

        {/* Stock Information */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {new Intl.NumberFormat().format(product.stock || 0)}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {new Intl.NumberFormat().format(product.reserved_stock || 0)}
            </div>
            <div className="text-xs text-gray-500">Reserved</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {new Intl.NumberFormat().format(product.available_stock || 0)}
            </div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
            getStatusColor(product.stock, product.available_stock)
          }`}>
            {getStatusLabel(product.stock, product.available_stock)}
          </span>

          {/* Action Button */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle more actions
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default ProductCard;