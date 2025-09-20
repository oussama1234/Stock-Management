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
      console.error("Analytics error:", err);
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
              <h1 className="text-3xl font-bold text-gray-800">Sales Analytics</h1>
              <p className="text-gray-600">Sales performance insights and trends</p>
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
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
            <h1 className="text-3xl font-bold text-gray-800">Sales Analytics</h1>
            <p className="text-gray-600">Sales performance insights and trends</p>
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
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(data.overview.total_sales)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatNumber(data.overview.total_orders)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(data.overview.average_order_value)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Items Sold</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatNumber(data.overview.total_items_sold)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Package className="h-6 w-6 text-orange-600" />
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
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Crown className="h-5 w-5 text-yellow-500 mr-2" />
            Top Products
          </h3>
          <div className="space-y-4">
            {data.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{product.product?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{formatNumber(product.total_quantity)} sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{formatCurrency(product.total_revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Users className="h-5 w-5 text-indigo-500 mr-2" />
            Top Customers
          </h3>
          <div className="space-y-4">
            {data.topCustomers.slice(0, 5).map((customer, index) => (
              <div key={customer.customer_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{customer.customer_name}</p>
                    <p className="text-sm text-gray-600">{formatNumber(customer.total_orders)} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{formatCurrency(customer.total_spent)}</p>
                </div>
              </div>
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
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">Sales by Category</h3>
          <div className="space-y-4">
            {data.categories.slice(0, 5).map((category, index) => (
              <div key={category.category_id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: `hsl(${index * 72}, 70%, 50%)` }}
                  ></div>
                  <span className="text-gray-800 font-medium">{category.category_name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{formatCurrency(category.total_revenue)}</p>
                  <p className="text-sm text-gray-600">{formatNumber(category.total_quantity)} items</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Low Stock Alerts
          </h3>
          <div className="space-y-4">
            {data.lowStock.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.category_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-semibold">{item.stock} left</p>
                  <p className="text-xs text-gray-500">
                    {item.daily_velocity > 0 ? `${Math.ceil(item.days_remaining)} days left` : 'No recent sales'}
                  </p>
                </div>
              </div>
            ))}
            {data.lowStock.length === 0 && (
              <p className="text-gray-500 text-center py-4">No low stock alerts</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}