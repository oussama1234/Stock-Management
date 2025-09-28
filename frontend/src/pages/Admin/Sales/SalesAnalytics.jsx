// src/pages/Admin/Sales/SalesAnalytics.jsx
// Sales analytics dashboard with charts and metrics

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Package, AlertTriangle, DollarSign, ShoppingCart, Crown } from "lucide-react";
import { 
  getSalesOverview, 
  getSalesTrends, 
  getTopProducts, 
  getTopCustomers, 
  getSalesByCategory,
  getSalesPeople,
  getLowStockAlerts 
} from "@/api/SalesAnalytics";
import ContentSpinner from "@/components/Spinners/ContentSpinner";

export default function SalesAnalytics() {
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: {},
    trends: [],
    topProducts: [],
    topCustomers: [],
    categories: [],
    salesPeople: [],
    lowStock: []
  });
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        overview,
        trends,
        topProducts,
        topCustomers,
        categories,
        salesPeople,
        lowStock
      ] = await Promise.all([
        getSalesOverview({ period }),
        getSalesTrends({ period, interval: 'day' }),
        getTopProducts({ period, limit: 5 }),
        getTopCustomers({ period, limit: 5 }),
        getSalesByCategory({ period }),
        getSalesPeople({ period }),
        getLowStockAlerts({ days: parseInt(period), threshold: 10 })
      ]);

      setData({
        overview,
        trends,
        topProducts,
        topCustomers,
        categories,
        salesPeople,
        lowStock
      });
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const formatCurrency = (amount) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);

  const formatNumber = (num) =>
    new Intl.NumberFormat("en-US").format(num || 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mr-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sales Analytics</h1>
              <p className="text-gray-600 dark:text-gray-300">Sales performance insights and trends</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        
        {/* Minimal, theme-colored spinner */}
        <div className="py-8">
          <ContentSpinner fullWidth size="large" message="Loading analytics..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
      >
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mr-4">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sales Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300">Sales performance insights and trends</p>
          </div>
        </div>
        
        {/* Period Selector */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ 
            y: -8, 
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
          }}
          className="group bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl shadow-xl p-8 border border-emerald-200/20 backdrop-blur-sm transform transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100 mb-2 tracking-wide uppercase">Total Sales</p>
              <p className="text-3xl font-bold text-white mb-1">
                {formatCurrency(data.overview.total_sales)}
              </p>
              <div className="flex items-center text-emerald-100 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>Revenue Generated</span>
              </div>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ 
            y: -8, 
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
          }}
          className="group bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl shadow-xl p-8 border border-blue-200/20 backdrop-blur-sm transform transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-100 mb-2 tracking-wide uppercase">Total Orders</p>
              <p className="text-3xl font-bold text-white mb-1">
                {formatNumber(data.overview.total_orders)}
              </p>
              <div className="flex items-center text-blue-100 text-xs">
                <Package className="h-3 w-3 mr-1" />
                <span>Orders Completed</span>
              </div>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ 
            y: -8, 
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
          }}
          className="group bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 rounded-3xl shadow-xl p-8 border border-purple-200/20 backdrop-blur-sm transform transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-100 mb-2 tracking-wide uppercase">Avg Order Value</p>
              <p className="text-3xl font-bold text-white mb-1">
                {formatCurrency(data.overview.average_order_value)}
              </p>
              <div className="flex items-center text-purple-100 text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                <span>Per Transaction</span>
              </div>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ 
            y: -8, 
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
          }}
          className="group bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 rounded-3xl shadow-xl p-8 border border-orange-200/20 backdrop-blur-sm transform transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-100 mb-2 tracking-wide uppercase">Items Sold</p>
              <p className="text-3xl font-bold text-white mb-1">
                {formatNumber(data.overview.total_items_sold)}
              </p>
              <div className="flex items-center text-orange-100 text-xs">
                <Users className="h-3 w-3 mr-1" />
                <span>Units Moved</span>
              </div>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/50 rounded-3xl shadow-2xl p-8 border border-yellow-200/30 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-3 rounded-2xl mr-4 shadow-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Top Products
            </h3>
          </div>
          <div className="space-y-4">
            {data.topProducts.slice(0, 5).map((product, index) => (
              <motion.div 
                key={product.product_id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ x: 8, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-yellow-50/50 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 shadow-md">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{product.product?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      {formatNumber(product.total_quantity)} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-gray-800 dark:text-gray-200">{formatCurrency(product.total_revenue)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/50 rounded-3xl shadow-2xl p-8 border border-indigo-200/30 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl mr-4 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Top Customers
            </h3>
          </div>
          <div className="space-y-4">
            {data.topCustomers.slice(0, 5).map((customer, index) => (
              <motion.div 
                key={customer.customer_name} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ x: -8, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 shadow-md">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{customer.customer_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      {formatNumber(customer.total_orders)} orders placed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-gray-800 dark:text-gray-200">{formatCurrency(customer.total_spent)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Sales by Category and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 rounded-3xl shadow-2xl p-8 border border-green-200/30 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-2xl mr-4 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Sales by Category
            </h3>
          </div>
          <div className="space-y-4">
            {data.categories.slice(0, 5).map((category, index) => (
              <motion.div 
                key={category.category_id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 25px -8px rgba(0, 0, 0, 0.1)" }}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-green-50/50 rounded-2xl border border-green-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-2xl mr-4 shadow-md flex items-center justify-center"
                    style={{ backgroundColor: `hsl(${index * 72}, 70%, 55%)` }}
                  >
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold text-lg">{category.category_name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-gray-800 dark:text-gray-200">{formatCurrency(category.total_revenue)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-end">
                    <Package className="h-3 w-3 mr-1" />
                    {formatNumber(category.total_quantity)} items
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-white via-red-50/30 to-rose-50/50 rounded-3xl shadow-2xl p-8 border border-red-200/30 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-3 rounded-2xl mr-4 shadow-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Low Stock Alerts
            </h3>
          </div>
          <div className="space-y-4">
            {data.lowStock.slice(0, 5).map((item, index) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ x: -4, boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.2)" }}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50/80 to-rose-50/80 rounded-2xl border border-red-200 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 p-2 rounded-full mr-4 shadow-md">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.category_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-bold text-xl">{item.stock} left</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.daily_velocity > 0 ? `${Math.ceil(item.days_remaining)} days left` : 'No recent sales'}
                  </p>
                </div>
              </motion.div>
            ))}
            {data.lowStock.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center py-8"
              >
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-2xl inline-block mb-4">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-500 text-lg font-medium">No low stock alerts</p>
                <p className="text-gray-400 text-sm">All products are well stocked!</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
