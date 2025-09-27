import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  BarChart3,
  Tag,
  Check,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useProductsData } from '../contexts/ProductsContext';
import { useImageUrl } from '../hooks/useImageUrl';
import { useFormatters } from '../hooks/useFormatters';

const ProductCard = memo(({ 
  product, 
  index,
  onEdit, 
  onDelete, 
  onViewDetails,
  isDeleting,
  isSelected,
  onSelect
}) => {
  const { getImageUrl } = useImageUrl();
  const { formatCurrency } = useFormatters();
  const [imageError, setImageError] = useState(false);
  
  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { 
        text: 'Out of Stock', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
        dotColor: 'bg-red-400' 
      };
    }
    if (stock <= 10) {
      return { 
        text: 'Low Stock', 
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: Clock,
        dotColor: 'bg-amber-400' 
      };
    }
    return { 
      text: 'In Stock', 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Check,
      dotColor: 'bg-green-400' 
    };
  };

  const stockStatus = getStockStatus(product.stock);
  const imageUrl = product.image ? getImageUrl(product.image) : null;

  if (isDeleting) {
    return (
      <motion.div
        layout
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0.5, scale: 0.95 }}
        exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-2"
          />
          <p className="text-red-600 font-medium">Deleting...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-2xl hover:border-blue-200/80 transition-all duration-500 ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${product.isUpdating ? 'opacity-75' : ''}`}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product.id);
          }}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20"
        >
          <div className={`w-4 h-4 border-2 border-blue-500 rounded flex items-center justify-center ${
            isSelected ? 'bg-blue-500' : 'bg-white'
          }`}>
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </motion.button>
      </div>

      {/* Product Image */}
      <div className="relative h-52 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 overflow-hidden">
        {imageUrl && !imageError ? (
          <>
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ease-out"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-indigo-50 transition-all duration-500">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-2 group-hover:text-blue-400 transition-colors duration-300" />
              <span className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors duration-300">No Image</span>
            </div>
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-4 right-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg border ${stockStatus.color}`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${stockStatus.dotColor}`} />
            {stockStatus.text}
          </motion.div>
        </div>

        {/* Action Buttons Overlay */}
        <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="p-2.5 bg-white/90 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-white border border-white/20 shadow-lg transition-all duration-300"
          >
            <Eye className="h-4 w-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product, true); // Navigate to details page
            }}
            className="p-2.5 bg-white/90 backdrop-blur-sm text-purple-600 rounded-xl hover:bg-white border border-white/20 shadow-lg transition-all duration-300"
          >
            <BarChart3 className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Updating Indicator */}
        {product.isUpdating && (
          <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/90 px-3 py-2 rounded-lg flex items-center space-x-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
              />
              <span className="text-blue-600 text-sm font-medium">Updating...</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6">
        {/* Product Name and Category */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-2 truncate group-hover:text-blue-800 transition-colors duration-300">
            {product.name}
          </h3>
          {product.category?.name && (
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200">
                <Tag className="h-3 w-3 mr-1" />
                {product.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description || "No description available"}
        </p>

        {/* Price and Stock Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                {formatCurrency(product.price)}
              </span>
              <p className="text-xs text-gray-500">Per unit</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-800">
                {product.stock}
              </span>
              <p className="text-xs text-gray-500">In stock</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewDetails(product, true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-300"
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </motion.button>

          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(product)}
              className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Edit className="h-4 w-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(product.id)}
              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Trash2 className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;