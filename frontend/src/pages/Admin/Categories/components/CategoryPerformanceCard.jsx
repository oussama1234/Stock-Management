// src/pages/Admin/Categories/components/CategoryPerformanceCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, ShoppingBag, Award, Crown, Flame, Star, Package } from 'lucide-react';
import { fmtNumber } from '@/pages/Dashboard/utils';

export default function CategoryPerformanceCard({ 
  topSelling = [],
  topPurchased = [],
  rangeDays = 30, 
  title = "Top Categories",
  subtitle = "Best performers",
  gradient = "from-emerald-500 to-teal-600",
  icon: IconComponent
}) {
  const [activeTab, setActiveTab] = useState('selling');

  const currentData = activeTab === 'selling' ? topSelling : topPurchased;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="group relative bg-gradient-to-br from-white via-emerald-50/20 to-green-100/40 rounded-3xl p-6 shadow-2xl border border-emerald-200/40 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-emerald-400/20 to-green-500/20 rounded-full"
        />
        <motion.div
          animate={{
            rotate: 360,
            x: [-10, 10, -10]
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            x: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-16 -right-16 w-32 h-32 bg-gradient-to-r from-green-400/20 to-teal-500/20 rounded-full"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            className={`bg-gradient-to-r ${gradient} p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}
          >
            {IconComponent && <IconComponent className="h-7 w-7 text-white" />}
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 bg-clip-text text-transparent">
              {title}
            </h3>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              <p className="text-emerald-600 text-sm font-medium">
                {subtitle} • Last {rangeDays} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative z-10 flex bg-white/60 backdrop-blur-sm rounded-2xl p-1 mb-6 border border-white/40">
        <button
          onClick={() => setActiveTab('selling')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'selling'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
              : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Top Selling
        </button>
        <button
          onClick={() => setActiveTab('purchasing')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'purchasing'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
              : 'text-gray-600 hover:text-emerald-600'
          }`}
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          Top Purchased
        </button>
      </div>

      {/* Content Area */}
      <div className="relative z-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300"
        >
          {currentData.length > 0 ? currentData.map((category, idx) => (
            <motion.div
              key={`${activeTab}-${category.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-md group/item"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Rank Badge */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                    idx === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' :
                    idx === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
                    'bg-gradient-to-r from-emerald-400 to-green-500 text-white'
                  }`}>
                    {idx === 0 && <Crown className="h-4 w-4" />}
                    {idx === 1 && <Award className="h-4 w-4" />}
                    {idx === 2 && <Star className="h-4 w-4" />}
                    {idx > 2 && <span>{idx + 1}</span>}
                  </div>
                  
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-800 text-lg group-hover/item:text-emerald-700 transition-colors">
                      {category.name}
                    </h5>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center">
                        <Package className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          Qty: {fmtNumber(category.qty || 0)}
                        </span>
                      </div>
                      {idx < 3 && (
                        <div className="flex items-center">
                          {idx === 0 && <Flame className="h-3 w-3 mr-1 text-orange-500" />}
                          {idx === 1 && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
                          {idx === 2 && <Star className="h-3 w-3 mr-1 text-blue-500" />}
                          <span className="text-xs font-semibold text-gray-700">
                            {idx === 0 ? 'Hot Seller' : idx === 1 ? 'Rising' : 'Popular'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-2xl font-black text-emerald-600"
                  >
                    {fmtNumber(category.qty || 0)}
                  </motion.div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    {activeTab === 'selling' ? 'Sold' : 'Purchased'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {currentData.length > 0 && (
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${((category.qty || 0) / (currentData[0]?.qty || 1)) * 100}%` 
                      }}
                      transition={{ duration: 1, delay: idx * 0.2 }}
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        idx === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                        'bg-gradient-to-r from-emerald-400 to-green-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No {activeTab} data available</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
