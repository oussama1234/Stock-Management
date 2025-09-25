// DashboardHome.jsx
// Beautiful animated dashboard with gradient cards and stunning design
// - Modern gradient cards with hover effects and animations
// - Animated counters and sparkline charts
// - Beautiful icons and color schemes
// - Responsive design with smooth transitions

import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Package2,
  Percent,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Star,
  Activity,
  Sparkles,
  Crown,
  AlertTriangle,
  Package,
  Calendar,
  PieChart,
  Target,
  Zap
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import ContentSpinner from "@/components/Spinners/ContentSpinner";

// Data hook and utils
import { useDashboardMetrics } from "@/pages/Dashboard/useDashboardMetrics";
import { fmtCurrency, fmtNumber } from "@/pages/Dashboard/utils";
import { getLowStockAlerts } from "@/api/SalesAnalytics";
import { ProductsRoute, UsersRoute, SalesRoute, PurchasesRoute } from "@/router/Index";

// Reusable components
import CategoryDistribution from "@/pages/Dashboard/components/CategoryDistribution";
import KpiCard from "@/pages/Dashboard/components/KpiCard";
import LowStockList from "@/pages/Dashboard/components/LowStockList";
import SectionCard from "@/pages/Dashboard/components/SectionCard";
import SparkLine from "@/pages/Dashboard/components/SparkLine";
import StockMovement from "@/pages/Dashboard/components/StockMovement";
import StockValue from "@/pages/Dashboard/components/StockValue";
import TopSellingTable from "@/pages/Dashboard/components/TopSellingTable";
import DateRangePicker from "@/pages/Dashboard/components/DateRangePicker";
import SalesAnalyticsChart from "@/pages/Dashboard/components/SalesAnalyticsChart";

export default function DashboardHome() {
  // Range selector for analytics (7, 14, 30, 90, 180, 365)
  const [rangeDays, setRangeDays] = useState(30);
  
  // State for 7-day stock alerts
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loadingLowStock, setLoadingLowStock] = useState(false);

  // Fetch metrics (cached for 30s, abortable)
  const { data, loading, error } = useDashboardMetrics({
    range_days: rangeDays,
    low_stock_threshold: 5,
  });
  
  // Fetch 7-day stock alerts separately for better accuracy
  useEffect(() => {
    const fetchLowStockAlerts = async () => {
      setLoadingLowStock(true);
      try {
        const alerts = await getLowStockAlerts({ days: 7, threshold: 10 });
        setLowStockAlerts(alerts || []);
        console.log('🚨 7-day stock alerts loaded:', alerts?.length || 0);
      } catch (error) {
        console.error('Failed to load 7-day stock alerts:', error);
        setLowStockAlerts([]);
      } finally {
        setLoadingLowStock(false);
      }
    };
    
    fetchLowStockAlerts();
  }, [rangeDays]); // Refetch when range changes

  // Prepare series arrays (numbers only) for sparkline rendering
  const salesSeries = useMemo(
    () => (data?.series?.sales || []).map((s) => Number(s.total)),
    [data]
  );
  const purchasesSeries = useMemo(
    () => (data?.series?.purchases || []).map((s) => Number(s.total)),
    [data]
  );
  const movementSeries = useMemo(() => {
    const rows = data?.series?.movements || [];
    return {
      inValues: rows.map((r) => Number(r.in_qty)),
      outValues: rows.map((r) => Number(r.out_qty)),
    };
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl mr-4 shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                Loading your business insights...
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl h-32 animate-pulse shadow-xl"
            />
          ))}
        </div>
        
        <ContentSpinner fullwidth message="Loading dashboard data..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-3 rounded-2xl mr-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-800 mb-2">Dashboard Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Beautiful KPI cards with gradients and animations
  const kpis = [
    {
      label: "Total Products",
      value: fmtNumber(data?.counts?.products),
      Icon: Package2,
      gradient: "from-blue-500 via-indigo-500 to-purple-600",
      to: ProductsRoute,
      subtitle: "Products in inventory",
      iconBg: "from-blue-100 to-indigo-100",
      iconColor: "text-blue-600"
    },
    {
      label: "Active Users",
      value: fmtNumber(data?.counts?.users),
      Icon: Users,
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      to: UsersRoute,
      subtitle: "Registered users",
      iconBg: "from-emerald-100 to-green-100",
      iconColor: "text-emerald-600"
    },
    {
      label: "Total Sales",
      value: fmtCurrency(data?.financials?.total_sales_amount),
      Icon: TrendingUp,
      gradient: "from-violet-500 via-purple-500 to-pink-600",
      delta: data?.financials?.sales_deltas?.[`${rangeDays}d`] ?? data?.financials?.sales_delta_pct,
      to: SalesRoute,
      subtitle: "Revenue generated",
      iconBg: "from-violet-100 to-purple-100",
      iconColor: "text-violet-600"
    },
    {
      label: "Total Purchases",
      value: fmtCurrency(data?.financials?.total_purchases_amount),
      Icon: ShoppingBag,
      gradient: "from-amber-500 via-orange-500 to-red-600",
      delta: data?.financials?.purchases_deltas?.[`${rangeDays}d`] ?? data?.financials?.purchases_delta_pct,
      to: PurchasesRoute,
      subtitle: "Total spending",
      iconBg: "from-amber-100 to-orange-100",
      iconColor: "text-amber-600"
    },
    {
      label: "Net Profit",
      value: fmtCurrency(data?.financials?.simple_profit),
      Icon: DollarSign,
      gradient: "from-pink-500 via-rose-500 to-red-600",
      delta: data?.financials?.profit_deltas?.[`${rangeDays}d`],
      subtitle: "Sales - Purchases",
      iconBg: "from-pink-100 to-rose-100",
      iconColor: "text-pink-600"
    },
    {
      label: "Avg Order Value",
      value: fmtCurrency(data?.financials?.avg_order_value),
      Icon: Target,
      gradient: "from-cyan-500 via-sky-500 to-blue-600",
      subtitle: "Per transaction",
      iconBg: "from-cyan-100 to-sky-100",
      iconColor: "text-cyan-600"
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Beautiful Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
      >
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl mr-4 shadow-xl">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 flex items-center text-lg">
              <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
              Business insights for the last <span className="font-semibold text-purple-600 dark:text-purple-400 mx-1">{rangeDays}</span> days
            </p>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-200 p-2"
        >
          <Calendar className="h-5 w-5 text-gray-500 mr-2" />
          <DateRangePicker value={rangeDays} onChange={setRangeDays} />
        </motion.div>
      </motion.div>

      {/* Beautiful KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ 
              y: -4, 
              boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.25)" 
            }}
            className={`group bg-gradient-to-br ${kpi.gradient} rounded-2xl shadow-lg p-5 border border-white/20 backdrop-blur-sm transform transition-all duration-300 hover:scale-102 cursor-pointer`}
            onClick={() => { if (kpi.to) window.location.href = kpi.to; }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`bg-gradient-to-r ${kpi.iconBg} p-2.5 rounded-xl backdrop-blur-sm shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <kpi.Icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
              {kpi.delta && (
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                  kpi.delta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${kpi.delta < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(kpi.delta)}%
                </div>
              )}
            </div>
            
            <div className="text-white">
              <p className="text-xs font-semibold text-white/80 mb-1.5 tracking-wide uppercase">
                {kpi.label}
              </p>
              <p className="text-xl lg:text-2xl font-bold text-white mb-1">
                {kpi.value}
              </p>
              <p className="text-xs text-white/70 flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                {kpi.subtitle}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modern Sales & Purchase Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Analytics Card */}
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
                className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300"
              >
                <TrendingUp className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                  Sales Analytics
                </h3>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <p className="text-blue-600 text-sm font-medium">
                    Last {rangeDays} days • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-2xl font-bold text-sm flex items-center space-x-2 ${
              (data?.financials?.sales_delta_pct || 0) >= 0 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {(data?.financials?.sales_delta_pct || 0) >= 0 ? (
                <motion.div animate={{ y: [-2, 0, -2] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <TrendingUp className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div animate={{ y: [2, 0, 2] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <TrendingDown className="h-4 w-4" />
                </motion.div>
              )}
              <span>{(data?.financials?.sales_delta_pct || 0) >= 0 ? '+' : ''}{data?.financials?.sales_delta_pct || 0}%</span>
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/40 shadow-inner">
            <div className="relative h-32">
              <SparkLine values={salesSeries} color="#3B82F6" height={120} />
              
              {/* Date Labels */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 border border-blue-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Revenue</p>
                  <motion.p 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-black text-blue-800 mt-1"
                  >
                    {fmtCurrency(data?.financials?.total_sales_amount)}
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
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Orders</p>
                  <motion.p 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-black text-indigo-800 mt-1"
                  >
                    {fmtNumber(data?.counts?.sales)}
                  </motion.p>
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="bg-indigo-500 p-3 rounded-xl shadow-md"
                >
                  <ShoppingBag className="h-5 w-5 text-white" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Purchases Analytics Card */}
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
                className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300"
              >
                <ShoppingBag className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 bg-clip-text text-transparent">
                  Purchase Analytics
                </h3>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <p className="text-emerald-600 text-sm font-medium">
                    Last {rangeDays} days • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-2xl font-bold text-sm flex items-center space-x-2 ${
              (data?.financials?.purchases_delta_pct || 0) >= 0 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              {(data?.financials?.purchases_delta_pct || 0) >= 0 ? (
                <motion.div animate={{ y: [-2, 0, -2] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <TrendingUp className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div animate={{ y: [2, 0, 2] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <TrendingDown className="h-4 w-4" />
                </motion.div>
              )}
              <span>{(data?.financials?.purchases_delta_pct || 0) >= 0 ? '+' : ''}{data?.financials?.purchases_delta_pct || 0}%</span>
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/40 shadow-inner">
            <div className="relative h-32">
              <SparkLine values={purchasesSeries} color="#10B981" height={120} />
              
              {/* Date Labels */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-4 border border-emerald-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Spending</p>
                  <motion.p 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-black text-emerald-800 mt-1"
                  >
                    {fmtCurrency(data?.financials?.total_purchases_amount)}
                  </motion.p>
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="bg-emerald-500 p-3 rounded-xl shadow-md"
                >
                  <DollarSign className="h-5 w-5 text-white" />
                </motion.div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-teal-100 rounded-2xl p-4 border border-green-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Purchase Orders</p>
                  <motion.p 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-black text-green-800 mt-1"
                  >
                    {fmtNumber(data?.counts?.purchases)}
                  </motion.p>
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="bg-green-500 p-3 rounded-xl shadow-md"
                >
                  <Package className="h-5 w-5 text-white" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stock Value & Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/50 rounded-3xl shadow-2xl p-8 border border-cyan-200/30 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-2xl mr-4 shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Stock Value
            </h3>
          </div>
          <StockValue
            retail={data?.financials?.retail_stock_value}
            cost={data?.financials?.cost_stock_value}
            potential_profit={data?.financials?.potential_profit}
            profit_margin_percent={data?.financials?.profit_margin_percent}
            stock_products_count={data?.financials?.stock_products_count}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="lg:col-span-2 bg-gradient-to-br from-white via-rose-50/30 to-pink-50/50 rounded-3xl shadow-2xl p-8 border border-rose-200/30 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-3 rounded-2xl mr-4 shadow-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Top Selling Products
            </h3>
          </div>
          <TopSellingTable rows={data?.top_selling || []} />
        </motion.div>
      </div>

      {/* Stock Movement Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="bg-gradient-to-br from-white via-violet-50/30 to-purple-50/50 rounded-3xl shadow-2xl p-8 border border-violet-200/30 backdrop-blur-sm"
      >
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-3 rounded-2xl mr-4 shadow-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Stock Movement Analysis
          </h3>
        </div>
        <StockMovement rows={data?.series?.movements || []} />
      </motion.div>

      {/* Low Stock & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          id="low-stock-alerts"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3 }}
          className="bg-gradient-to-br from-white via-red-50/30 to-rose-50/50 rounded-3xl shadow-2xl p-8 border border-red-200/30 backdrop-blur-sm scroll-mt-20"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-3 rounded-2xl mr-4 shadow-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Low Stock Alerts
            </h3>
          </div>
          <LowStockList 
            products={lowStockAlerts.length > 0 ? lowStockAlerts : (data?.low_stock || [])} 
            showVelocity={true} 
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4 }}
          className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 rounded-3xl shadow-2xl p-8 border border-orange-200/30 backdrop-blur-sm"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-3 rounded-2xl mr-4 shadow-lg">
              <PieChart className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Category Distribution
            </h3>
          </div>
          <CategoryDistribution rows={data?.category_distribution || []} />
        </motion.div>
      </div>
    </div>
  );
}
