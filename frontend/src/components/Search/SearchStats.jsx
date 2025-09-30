// src/components/Search/SearchStats.jsx
// Beautiful search statistics dashboard with animated stats cards
import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package, TrendingUp, ShoppingCart, Users, Truck, User,
  Building, Tag, Clock, DollarSign, BarChart3, Activity,
  Search, Target, Zap, Star
} from 'lucide-react';

// Utility functions
const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

const formatNumber = (num) => {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

// Individual Stat Card Component
const StatCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  bgGradient, 
  trend, 
  trendValue, 
  description,
  index = 0 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      delay: index * 0.1, 
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] 
    }}
    whileHover={{ 
      y: -4, 
      transition: { duration: 0.2 } 
    }}
    className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
  >
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-white to-transparent transform translate-x-8 -translate-y-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-gradient-to-tr from-white to-transparent transform -translate-x-4 translate-y-4" />
    </div>

    {/* Content */}
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {trend && trendValue && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend === 'up' 
              ? 'bg-green-100 text-green-700' 
              : trend === 'down'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <Activity className="w-3 h-3 rotate-180" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
        className="mb-2"
      >
        <div className="text-3xl font-bold text-gray-900">
          {value}
        </div>
      </motion.div>

      {/* Title & Description */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {description && (
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        )}
      </div>

      {/* Sparkle Effect */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Star className="w-3 h-3 text-yellow-400 animate-pulse" />
      </div>
    </div>
  </motion.div>
));

// Main Search Stats Component
const SearchStats = memo(({ searchResults, searchQuery, isLoading }) => {
  const stats = useMemo(() => {
    if (!searchResults?.results) return [];

    const results = searchResults.results;
    
    // Calculate totals - handle both direct arrays and data-wrapped arrays
    const getArrayData = (section) => {
      if (!section) return [];
      return Array.isArray(section) ? section : (section.data || []);
    };
    
    const productsArray = getArrayData(results.products);
    const salesArray = getArrayData(results.sales);
    const purchasesArray = getArrayData(results.purchases);
    const movementsArray = getArrayData(results.movements);
    const usersArray = getArrayData(results.users);
    const suppliersArray = getArrayData(results.suppliers);
    const customersArray = getArrayData(results.customers);
    const reasonsArray = getArrayData(results.reasons);
    
    const totalProducts = productsArray.length;
    const totalSales = salesArray.length;
    const totalPurchases = purchasesArray.length;
    const totalMovements = movementsArray.length;
    const totalUsers = usersArray.length;
    const totalSuppliers = suppliersArray.length;
    const totalCustomers = customersArray.length;
    const totalReasons = reasonsArray.length;

    // Calculate values
    const salesValue = salesArray.reduce((sum, sale) => 
      sum + (parseFloat(sale.total_amount) || 0), 0) || 0;
    const purchasesValue = purchasesArray.reduce((sum, purchase) => 
      sum + (parseFloat(purchase.total_amount) || 0), 0) || 0;

    // Calculate stock metrics
    const lowStockProducts = productsArray.filter(p => 
      (p.available || 0) <= (p.stock * 0.2 || 0)).length || 0;
    const outOfStockProducts = productsArray.filter(p => 
      (p.available || 0) === 0).length || 0;

    return [
      {
        title: 'Products Found',
        value: formatNumber(totalProducts),
        icon: Package,
        gradient: 'from-blue-500 to-indigo-600',
        bgGradient: 'from-blue-50 to-indigo-50',
        description: `${lowStockProducts} low stock, ${outOfStockProducts} out of stock`,
        trend: totalProducts > 0 ? 'up' : null,
        trendValue: totalProducts > 10 ? 'High' : totalProducts > 5 ? 'Med' : 'Low'
      },
      {
        title: 'Sales Volume',
        value: formatCurrency(salesValue),
        icon: TrendingUp,
        gradient: 'from-green-500 to-emerald-600',
        bgGradient: 'from-green-50 to-emerald-50',
        description: `${totalSales} transactions found`,
        trend: salesValue > 0 ? 'up' : null,
        trendValue: salesValue > 10000 ? '+High' : salesValue > 1000 ? '+Med' : '+Low'
      },
      {
        title: 'Purchase Value',
        value: formatCurrency(purchasesValue),
        icon: ShoppingCart,
        gradient: 'from-orange-500 to-red-600',
        bgGradient: 'from-orange-50 to-red-50',
        description: `${totalPurchases} orders found`,
        trend: purchasesValue > 0 ? 'up' : null,
        trendValue: purchasesValue > 5000 ? 'High' : 'Normal'
      },
      {
        title: 'Stock Movements',
        value: formatNumber(totalMovements),
        icon: Activity,
        gradient: 'from-purple-500 to-pink-600',
        bgGradient: 'from-purple-50 to-pink-50',
        description: `${totalReasons} different reasons`,
        trend: totalMovements > 0 ? 'up' : null,
        trendValue: totalMovements > 20 ? 'Active' : 'Normal'
      },
      {
        title: 'People & Entities',
        value: formatNumber(totalUsers + totalSuppliers + totalCustomers),
        icon: Users,
        gradient: 'from-teal-500 to-cyan-600',
        bgGradient: 'from-teal-50 to-cyan-50',
        description: `${totalUsers} users, ${totalSuppliers} suppliers, ${totalCustomers} customers`,
        trend: (totalUsers + totalSuppliers + totalCustomers) > 0 ? 'up' : null,
        trendValue: 'Found'
      }
    ];
  }, [searchResults]);

  const isEmpty = useMemo(() => {
    return stats.every(stat => 
      stat.value === '0' || stat.value === '$0' || stat.value === formatNumber(0)
    );
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-100 rounded-2xl p-6 h-40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isEmpty && !searchQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center"
      >
        <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Start Your Search</h3>
        <p className="text-gray-500">
          Use the search above to find products, sales, purchases, and more across your entire inventory system.
        </p>
      </motion.div>
    );
  }

  if (isEmpty && searchQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-12 text-center"
      >
        <Target className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Results Found</h3>
        <p className="text-gray-600">
          No matches found for <span className="font-medium">"{searchQuery}"</span>. 
          Try different keywords or check your spelling.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Search Overview</h2>
            <p className="text-sm text-gray-600">
              Results for "{searchQuery}" • {stats.reduce((sum, stat) => {
                const num = parseInt(stat.value.replace(/[^0-9]/g, '')) || 0;
                return sum + num;
              }, 0)} total items
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4" />
          <span>Live Results</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            index={index}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center gap-4 pt-4"
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm">
          <Clock className="w-4 h-4" />
          <span>Real-time data</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-sm">
          <Activity className="w-4 h-4" />
          <span>Updated now</span>
        </div>
      </motion.div>
    </div>
  );
});

export default SearchStats;