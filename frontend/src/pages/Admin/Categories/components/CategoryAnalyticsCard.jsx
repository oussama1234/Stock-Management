// src/pages/Admin/Categories/components/CategoryAnalyticsCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Package, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { fmtCurrency, fmtNumber } from '@/pages/Dashboard/utils';

export default function CategoryAnalyticsCard({ 
  data = [], 
  rangeDays = 30, 
  title = "Category Analytics",
  subtitle = "Performance metrics",
  gradient = "from-blue-500 to-indigo-600",
  icon: IconComponent
}) {
  // Calculate totals for comparison
  const totals = data.reduce((acc, category) => ({
    sold_qty: acc.sold_qty + (category.sold_qty || 0),
    purchased_qty: acc.purchased_qty + (category.purchased_qty || 0),
    profit_approx: acc.profit_approx + (category.profit_approx || 0),
    revenue_approx: acc.revenue_approx + (category.revenue_approx || 0)
  }), { sold_qty: 0, purchased_qty: 0, profit_approx: 0, revenue_approx: 0 });

  // Get top 6 categories for display
  const topCategories = data
    .sort((a, b) => (b.profit_approx || 0) - (a.profit_approx || 0))
    .slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-100/40 rounded-3xl p-6 shadow-2xl border border-blue-200/40 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 rounded-full"
        />
        <motion.div
          animate={{
            rotate: -360,
            y: [-10, 10, -10]
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-r from-indigo-400/20 to-purple-500/20 rounded-full"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`bg-gradient-to-r ${gradient} p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}
          >
            {IconComponent && <IconComponent className="h-7 w-7 text-white" />}
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
              {title}
            </h3>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <p className="text-blue-600 text-sm font-medium">
                {subtitle} • Last {rangeDays} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 border border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Revenue</p>
              <motion.p 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-black text-blue-800 mt-1"
              >
                {fmtCurrency(totals.revenue_approx)}
              </motion.p>
            </div>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="bg-blue-500 p-3 rounded-xl shadow-md"
            >
              <DollarSign className="h-5 w-5 text-white" />
            </motion.div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl p-4 border border-indigo-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Profit</p>
              <motion.p 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-black text-indigo-800 mt-1"
              >
                {fmtCurrency(totals.profit_approx)}
              </motion.p>
            </div>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="bg-indigo-500 p-3 rounded-xl shadow-md"
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Category Performance List */}
      <div className="relative z-10">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2 text-indigo-600" />
          Top Performing Categories
        </h4>
        
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300">
          {topCategories.length > 0 ? topCategories.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-gray-800 text-lg">{category.name}</h5>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                        idx === 1 ? 'bg-gray-100 text-gray-800' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        #{idx + 1}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Sold</p>
                      <p className="font-bold text-green-600">{fmtNumber(category.sold_qty || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Revenue</p>
                      <p className="font-bold text-blue-600">{fmtCurrency(category.revenue_approx || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Profit</p>
                      <p className={`font-bold ${(category.profit_approx || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmtCurrency(category.profit_approx || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Performance indicators */}
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center text-xs">
                      <Percent className="h-3 w-3 mr-1 text-gray-500" />
                      <span className="text-gray-600">
                        {category.pct_of_all_sold}% of sales
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <DollarSign className="h-3 w-3 mr-1 text-gray-500" />
                      <span className="text-gray-600">
                        {category.products_count || 0} products
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No category data available</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}