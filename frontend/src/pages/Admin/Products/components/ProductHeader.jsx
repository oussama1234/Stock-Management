import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Printer, Download, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStockValidation } from '../hooks/useStockValidation';

const ProductHeader = memo(({
  product,
  isRefreshing,
  onRefresh,
  onEdit,
  onPrint,
  onDownload
}) => {
  const navigate = useNavigate();
  const { stockStatus } = useStockValidation(product?.stock);

  const handleGoBack = () => {
    navigate('/dashboard/products');
  };

  if (!product) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 mb-6"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Section - Back Button and Product Info */}
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoBack}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </motion.button>
          
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {product.name}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${stockStatus.color}`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  stockStatus.level === 'good' ? 'bg-green-400' :
                  stockStatus.level === 'low' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                {stockStatus.text}
              </motion.span>
              
              {product.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  {product.category}
                </span>
              )}
              
              <span className="text-sm text-gray-500 font-mono">
                SKU: {product.sku}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex items-center space-x-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRefresh?.(); }}
            disabled={isRefreshing}
            className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 disabled:opacity-50"
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RotateCcw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(); }}
            className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl shadow-lg transition-all duration-300"
            title="Edit product"
            aria-label="Edit product"
          >
            <Edit className="h-5 w-5" />
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (typeof onPrint === 'function') onPrint(); }}
            className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-lg transition-all duration-300"
            title="Print details"
            aria-label="Print details"
          >
            <Printer className="h-5 w-5" />
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDownload?.(); }}
            className="p-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl shadow-lg transition-all duration-300"
            title="Download CSV"
            aria-label="Download CSV"
          >
            <Download className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

ProductHeader.displayName = 'ProductHeader';

export default ProductHeader;