import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, RefreshCw, Download, BarChart3, Loader2 } from 'lucide-react';
import { useProductsData } from '../contexts/ProductsContext';
import { useFormatters } from '../hooks/useFormatters';
import { useDashboardMetrics } from '../../../Dashboard/useDashboardMetrics';

const ProductsHeader = memo(({ onAddProduct, onRefresh, onExport, isRefreshing, isExporting }) => {
  const { statistics, metadata } = useProductsData();
  const { formatCurrency, formatNumber } = useFormatters();
  // Global metrics across entire database (cached, lightweight)
  const { data: dashboardData } = useDashboardMetrics({ range_days: 30, low_stock_threshold: 10 });
  const totalProductsGlobal = dashboardData?.counts?.products ?? (metadata?.total || 0);
  const inStockGlobal = dashboardData?.financials?.in_stock_count ?? (statistics?.inStock || 0);
  const lowStockGlobal = dashboardData?.financials?.low_stock_count ?? (statistics?.lowStock || 0);
  const outOfStockGlobal = dashboardData?.financials?.out_of_stock_count ?? (statistics?.outOfStock || 0);
  const retailStockValueGlobal = dashboardData?.financials?.retail_stock_value ?? (statistics?.totalValue || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mb-8"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-3xl -z-10" />
      
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          {/* Left Section - Title and Icon */}
          <div className="flex items-center space-x-6">
            {/* Enhanced Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
              <div className="relative inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2"
              >
                📦 Product Inventory
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-gray-600 text-lg"
              >
                Manage your product catalog and inventory levels
              </motion.p>
            </div>
          </div>

          {/* Right Section - Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 min-w-0"
          >
            {/* Total Products */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <BarChart3 className="h-4 w-4 text-blue-600" />
<div className="text-2xl font-bold text-blue-600">{formatNumber(totalProductsGlobal)}</div>
              </div>
              <div className="text-sm text-gray-500">Total Products</div>
            </div>
            
            {/* Separator */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-px h-12 bg-gray-200" />
            </div>
            
            {/* In Stock */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
<div className="text-2xl font-bold text-green-600">{formatNumber(inStockGlobal)}</div>
              </div>
              <div className="text-sm text-gray-500">In Stock</div>
            </div>
            
            {/* Low Stock */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
<div className="text-2xl font-bold text-amber-600">{formatNumber(lowStockGlobal)}</div>
              </div>
              <div className="text-sm text-gray-500">Low Stock</div>
            </div>
          </motion.div>
        </div>
        
        {/* Additional Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 pt-6 border-t border-gray-200/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Inventory Value */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Total Inventory Value</p>
<p className="text-xl font-bold text-green-900">{formatCurrency(retailStockValueGlobal)}</p>
                </div>
              </div>
            </div>
            
            {/* Average Price */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Average Price</p>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(statistics.avgPrice)}</p>
                </div>
              </div>
            </div>
            
            {/* Out of Stock */}
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl border border-red-200/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Out of Stock</p>
<p className="text-xl font-bold text-red-900">{formatNumber(outOfStockGlobal)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6"
        >
          {/* Left side - Secondary actions */}
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all duration-200 disabled:opacity-50"
              title="Refresh products"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: isExporting ? 1 : 1.05 }}
              whileTap={{ scale: isExporting ? 1 : 0.95 }}
              onClick={onExport}
              disabled={!!isExporting}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${isExporting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              title="Export products"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'Export'}</span>
            </motion.button>
          </div>

          {/* Right side - Primary action */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddProduct}
            className="group px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center shadow-xl hover:shadow-2xl"
          >
            <div className="p-1 bg-white/20 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="font-semibold">Add New Product</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
});

ProductsHeader.displayName = 'ProductsHeader';

export default ProductsHeader;