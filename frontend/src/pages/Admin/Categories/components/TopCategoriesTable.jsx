// src/pages/Admin/Categories/components/TopCategoriesTable.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Award, Star, Medal, TrendingUp, TrendingDown, Package, DollarSign, ShoppingBag, Percent, Clock } from 'lucide-react';
import { fmtCurrency, fmtNumber } from '@/pages/Dashboard/utils';
import DaysInStockBadge from './DaysInStockBadge';

export default function TopCategoriesTable({ analytics = [] }) {
  // Sort by profit and take top 10
  const sortedCategories = analytics
    .sort((a, b) => (b.profit_approx || 0) - (a.profit_approx || 0))
    .slice(0, 10);

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Award className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-orange-500" />;
      default:
        return <Star className="h-5 w-5 text-blue-500" />;
    }
  };

  const getRankBadge = (index) => {
    const baseClasses = "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold";
    switch (index) {
      case 0:
        return `${baseClasses} bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg`;
      case 1:
        return `${baseClasses} bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg`;
      case 2:
        return `${baseClasses} bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg`;
      default:
        return `${baseClasses} bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md`;
    }
  };

  const getPerformanceLabel = (index, profitPercent) => {
    if (index === 0) return { label: "Champion", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (index === 1) return { label: "Excellence", color: "text-gray-600", bg: "bg-gray-100" };
    if (index === 2) return { label: "Outstanding", color: "text-orange-600", bg: "bg-orange-100" };
    if (profitPercent > 15) return { label: "High Performer", color: "text-green-600", bg: "bg-green-100" };
    if (profitPercent > 5) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    return { label: "Standard", color: "text-gray-600", bg: "bg-gray-100" };
  };

  if (sortedCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No performance data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-2 font-bold text-gray-700 text-sm uppercase tracking-wider">Rank</th>
              <th className="text-left py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Category</th>
              <th className="text-right py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Products</th>
              <th className="text-right py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Sold</th>
              <th className="text-right py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Revenue</th>
              <th className="text-right py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Profit</th>
              <th className="text-center py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Performance</th>
              <th className="text-right py-4 px-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Market Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedCategories.map((category, index) => {
              const performance = getPerformanceLabel(index, category.pct_of_total_profit || 0);
              const profitMargin = category.revenue_approx ? ((category.profit_approx || 0) / category.revenue_approx) * 100 : 0;
              
              return (
                <motion.tr
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="group hover:bg-gradient-to-r hover:from-rose-50/50 hover:to-pink-50/50 transition-all duration-200"
                >
                  {/* Rank */}
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-2">
                      <div className={getRankBadge(index)}>
                        <span className="font-bold">{index + 1}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getRankIcon(index)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-rose-700 transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-500 truncate max-w-48">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Products Count */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-bold text-gray-800">
                        {fmtNumber(category.products_count || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">products</p>
                  </td>

                  {/* Sold Quantity */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-bold text-green-600">
                        {fmtNumber(category.sold_qty || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      <Percent className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {category.pct_of_all_sold || 0}% of total
                      </p>
                    </div>
                  </td>

                  {/* Revenue */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <DollarSign className="h-4 w-4 text-blue-500" />
                      <span className="text-lg font-bold text-blue-600">
                        {fmtCurrency(category.revenue_approx || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">revenue</p>
                  </td>

                  {/* Profit */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <span className={`text-lg font-bold ${(category.profit_approx || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {fmtCurrency(category.profit_approx || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      <span className={`text-xs font-semibold ${profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {profitMargin.toFixed(1)}% margin
                      </span>
                    </div>
                  </td>

                  {/* Performance Badge */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${performance.color} ${performance.bg} border`}>
                        {performance.label}
                      </span>
                      {category.avg_days_in_stock !== undefined && (
                        <DaysInStockBadge 
                          days={category.avg_days_in_stock} 
                          size="xs" 
                          showIcon={true}
                        />
                      )}
                    </div>
                  </td>

                  {/* Market Share */}
                  <td className="py-4 px-4 text-right">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.abs(category.pct_of_total_profit || 0))}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                          'bg-gradient-to-r from-blue-400 to-indigo-500'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {Math.abs(category.pct_of_total_profit || 0).toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500">of total profit</p>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Categories</p>
            <p className="text-2xl font-bold text-gray-800">{sortedCategories.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-bold text-blue-600">
              {fmtNumber(sortedCategories.reduce((sum, cat) => sum + (cat.products_count || 0), 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              {fmtCurrency(sortedCategories.reduce((sum, cat) => sum + (cat.revenue_approx || 0), 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Profit</p>
            <p className="text-2xl font-bold text-emerald-600">
              {fmtCurrency(sortedCategories.reduce((sum, cat) => sum + (cat.profit_approx || 0), 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}