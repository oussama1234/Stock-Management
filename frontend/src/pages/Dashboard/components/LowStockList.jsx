// src/pages/Dashboard/components/LowStockList.jsx
// Enhanced low-stock products component with velocity analysis and beautiful design

import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle, Package, Clock, TrendingDown } from "lucide-react";

const LowStockList = React.memo(function LowStockList({ products = [], showVelocity = false }) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-2xl inline-block mb-4">
          <Package className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-gray-500 text-lg font-medium">No low stock alerts</p>
        <p className="text-gray-400 text-sm">All products are well stocked!</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {products.slice(0, 10).map((product, index) => (
        <motion.div 
          key={product.id} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ x: -4, scale: 1.02, boxShadow: "0 8px 25px -8px rgba(239, 68, 68, 0.2)" }}
          className="group"
        >
          <Link 
            to={`/dashboard/products/${product.id}`}
            className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-red-50/80 to-rose-50/80 rounded-2xl border border-red-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer text-decoration-none"
          >
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-2 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            
            <div className="flex items-center space-x-3">
              {product.image && (
                <motion.img 
                  src={product.image} 
                  alt={product.name} 
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" 
                />
              )}
              <div>
                <p className="font-semibold text-gray-800 text-base group-hover:text-red-700 transition-colors">
                  {product.name}
                </p>
                {product.category_name && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <Package className="h-3 w-3 mr-1" />
                    {product.category_name}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                {product.stock} left
              </span>
            </div>
            
            {showVelocity && product.daily_velocity > 0 && (
              <div className="flex items-center text-xs text-gray-500 space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {Math.ceil(product.days_remaining)} days left
                </span>
              </div>
            )}
            
            {showVelocity && product.daily_velocity === 0 && (
              <div className="flex items-center text-xs text-gray-500 space-x-1">
                <TrendingDown className="h-3 w-3" />
                <span>No recent sales</span>
              </div>
            )}
          </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
});

export default LowStockList;
