// src/pages/Dashboard/components/TopSellingTable.jsx
// Beautiful animated top selling products with modern card design

import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Crown, 
  Medal, 
  Award, 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Star,
  Zap,
  Target,
  ExternalLink
} from "lucide-react";
import { fmtCurrency, fmtNumber } from "../utils";
import { ProductDetailsRoute } from "@/router/Index";

const TopSellingTable = React.memo(function TopSellingTable({ rows = [] }) {
  const navigate = useNavigate();

  const handleProductClick = (productId) => {
    if (productId) {
      navigate(`${ProductDetailsRoute}/${productId}`);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-3xl p-8 text-center border border-gray-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gradient-to-r from-gray-400 to-slate-500 p-4 rounded-2xl">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">No Sales Data</h3>
            <p className="text-gray-600">Start selling to see top performing products</p>
          </div>
        </div>
      </div>
    );
  }

  const getRankIcon = (index) => {
    if (index === 0) return { icon: Crown, color: 'from-yellow-400 to-orange-500' };
    if (index === 1) return { icon: Medal, color: 'from-gray-400 to-slate-500' };
    if (index === 2) return { icon: Award, color: 'from-amber-600 to-orange-700' };
    return { icon: Star, color: 'from-purple-500 to-pink-600' };
  };

  const getRankBadge = (index) => {
    if (index === 0) return { text: '#1 Bestseller', color: 'bg-gradient-to-r from-yellow-400 to-orange-500' };
    if (index === 1) return { text: '#2 Popular', color: 'bg-gradient-to-r from-gray-400 to-slate-500' };
    if (index === 2) return { text: '#3 Rising', color: 'bg-gradient-to-r from-amber-600 to-orange-700' };
    return { text: `#${index + 1}`, color: 'bg-gradient-to-r from-purple-500 to-pink-600' };
  };

  return (
    <div className="space-y-4">
      {rows.map((row, index) => {
        const rankIcon = getRankIcon(index);
        const rankBadge = getRankBadge(index);
        const RankIcon = rankIcon.icon;
        
        return (
          <motion.div
            key={row.product_id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
            whileHover={{ 
              scale: 1.03, 
              y: -4,
              boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.25)"
            }}
            onClick={() => handleProductClick(row.product_id)}
            className={`relative bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/50 rounded-2xl p-5 shadow-lg border border-indigo-200/30 backdrop-blur-sm transition-all duration-300 group cursor-pointer overflow-hidden hover:ring-2 hover:ring-indigo-400/50 ${
              index === 0 ? 'ring-2 ring-yellow-400/50' : ''
            }`}
          >
            {/* Rank Badge */}
            <div className="absolute top-0 right-0">
              <div className={`${rankBadge.color} text-white text-xs font-bold px-3 py-1 rounded-bl-2xl rounded-tr-2xl shadow-lg`}>
                {rankBadge.text}
              </div>
            </div>

            {/* Sparkle effect for #1 */}
            {index === 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute top-2 left-2"
              >
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-1.5 rounded-full shadow-lg">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </motion.div>
            )}

            <div className="flex items-center space-x-4 mt-2">
              {/* Rank Icon */}
              <div className={`bg-gradient-to-r ${rankIcon.color} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <RankIcon className="h-6 w-6 text-white" />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {row?.product?.image && (
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      src={row.product.image}
                      alt={row?.product?.name}
                      className="w-8 h-8 rounded-lg object-cover shadow-md border-2 border-white"
                    />
                  )}
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-gray-800 text-lg leading-tight truncate">
                      {row?.product?.name || `Product #${row.product_id}`}
                    </h4>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.2 }}
                      className="text-indigo-500 group-hover:text-indigo-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </motion.div>
                  </div>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-white/60 rounded-xl p-3 backdrop-blur-sm border border-white/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Quantity Sold</p>
                        <p className="text-lg font-bold text-gray-800">{fmtNumber(row.qty)}</p>
                      </div>
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/60 rounded-xl p-3 backdrop-blur-sm border border-white/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Total Revenue</p>
                        <p className="text-lg font-bold text-green-700">{fmtCurrency(row.revenue)}</p>
                      </div>
                      <div className="bg-green-100 p-2 rounded-lg">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-600 font-medium">
                    {index === 0 ? 'Top Performer' : index < 3 ? 'High Performer' : 'Good Sales'}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Rank #{index + 1}
              </div>
            </div>

            {/* Animated Background Pattern for #1 */}
            {index === 0 && (
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-10 -right-10 w-20 h-20 border-2 border-yellow-200/30 rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-10 -left-10 w-16 h-16 border-2 border-orange-200/30 rounded-full"
                />
              </div>
            )}
          </motion.div>
        );
      })}
      
      {/* Summary Footer */}
      {rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rows.length * 0.1 + 0.2, duration: 0.5 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-gray-800">Top {rows.length} Products</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-lg font-bold text-indigo-700">
                {fmtCurrency(rows.reduce((sum, row) => sum + Number(row.revenue), 0))}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
});

export default TopSellingTable;
