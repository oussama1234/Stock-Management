// src/pages/Reports/Products/ProductAnalytics.jsx
// High-performance product analytics dashboard with beautiful modern design
import { ProductsService } from "@/api/Products";
import ContentSpinner from "@/components/Spinners/ContentSpinner";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  Calendar,
  Crown,
  DollarSign,
  Download,
  Package,
  Percent,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductAnalyticsCard from "./components/ProductAnalyticsCard";
import ProductKpiCard from "./components/ProductKpiCard";
import ProductPerformanceCard from "./components/ProductPerformanceCard";
import StockMovementChart from "./components/StockMovementChart";

// Enhanced color palette with gradients
const COLORS = {
  primary: ["#6366F1", "#8B5CF6", "#A855F7"],
  success: ["#22C55E", "#10B981", "#14B8A6"],
  warning: ["#F59E0B", "#FB923C", "#FBBF24"],
  danger: ["#EF4444", "#F87171", "#FB7185"],
  info: ["#06B6D4", "#22D3EE", "#38BDF8"],
  chart: [
    "#6366F1",
    "#22C55E",
    "#F59E0B",
    "#EF4444",
    "#06B6D4",
    "#8B5CF6",
    "#10B981",
    "#EC4899",
    "#F97316",
  ],
};

// Utility functions
const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n || 0
  );
const fmtNumber = (n) => new Intl.NumberFormat("en-US").format(n || 0);
const fmtPercent = (n) => `${Number(n || 0).toFixed(1)}%`;

// Date range picker component
const DatePicker = ({ value, onChange }) => {
  const ranges = [
    { value: 7, label: "7 Days" },
    { value: 14, label: "14 Days" },
    { value: 30, label: "30 Days" },
    { value: 60, label: "60 Days" },
    { value: 90, label: "90 Days" },
    { value: 180, label: "180 Days" },
    { value: 365, label: "365 Days" },
  ];

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
      {ranges.map((range) => (
        <motion.button
          key={range.value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(range.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            value === range.value
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {range.label}
        </motion.button>
      ))}
    </div>
  );
};

const ProductAnalytics = memo(function ProductAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [purchasesData, setPurchasesData] = useState(null);
  const [topSelling, setTopSelling] = useState([]);
  const [topPurchased, setTopPurchased] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [stockMovements, setStockMovements] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [params, setParams] = useState({ range_days: 30 });
  const [isExporting, setIsExporting] = useState(false);
  const abortRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      if (abortRef.current) abortRef.current.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      const [
        salesReport,
        purchasesReport,
        topSellingData,
        topPurchasedData,
        lowStockData,
        stockMovementsData,
        metricsData,
      ] = await Promise.all([
        ProductsService.salesReport(params, { signal: controller.signal }),
        ProductsService.purchasesReport(params, { signal: controller.signal }),
        ProductsService.topSelling(
          { ...params, limit: 10 },
          { signal: controller.signal }
        ),
        ProductsService.topPurchased(
          { ...params, limit: 10 },
          { signal: controller.signal }
        ),
        ProductsService.lowStockAlerts(params, { signal: controller.signal }),
        ProductsService.stockMovements(params, { signal: controller.signal }),
        ProductsService.metrics(params, { signal: controller.signal }),
      ]);

      setSalesData(salesReport);
      setPurchasesData(purchasesReport);
      setTopSelling(topSellingData?.products || []);
      setTopPurchased(topPurchasedData?.products || []);
      setLowStock(lowStockData?.items || []);
      setStockMovements(stockMovementsData);
      setMetrics(metricsData);
    } catch (e) {
      if (e.name !== "CanceledError" && e.message !== "canceled") {
        setError(e?.response?.data?.message || e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAll();
    return () => abortRef.current?.abort();
  }, [params.range_days]);

  // Memoized calculations with enhanced metrics
  const calculatedMetrics = useMemo(() => {
    if (!metrics) return {};

    return {
      totalRevenue: metrics.total_revenue || 0,
      totalPurchases: metrics.total_purchases || 0,
      totalProfit: metrics.total_profit || 0,
      totalOrders: metrics.total_orders || 0,
      avgOrderValue: metrics.avg_order_value || 0,
      lowStockCount: metrics.low_stock_count || 0,
      profitMargin: metrics.profit_margin || 0,
      topSeller: topSelling[0]?.product_name || "N/A",
    };
  }, [metrics, topSelling]);

  // Enhanced chart data with animations
  const chartData = useMemo(
    () => ({
      salesTrends: (salesData?.trends || []).map((item, idx) => ({
        period: item.period,
        revenue: Number(item.revenue || 0),
        orders: Number(item.orders || 0),
        fill: COLORS.chart[idx % COLORS.chart.length],
        animationDelay: idx * 100,
      })),
      purchasesTrends: (purchasesData?.trends || []).map((item, idx) => ({
        period: item.period,
        amount: Number(item.amount || 0),
        purchases: Number(item.purchases || 0),
        fill: COLORS.chart[idx % COLORS.chart.length],
      })),
      topSellingChart: topSelling.slice(0, 8).map((item, idx) => ({
        name:
          item.product_name?.substring(0, 15) +
          (item.product_name?.length > 15 ? "..." : ""),
        value: Number(item.total_quantity || 0),
        revenue: Number(item.gross_revenue || 0),
        fill: COLORS.chart[idx % COLORS.chart.length],
      })),
      topPurchasedChart: topPurchased.slice(0, 8).map((item, idx) => ({
        name:
          item.product_name?.substring(0, 15) +
          (item.product_name?.length > 15 ? "..." : ""),
        value: Number(item.total_quantity || 0),
        cost: Number(item.total_value || 0),
        fill: COLORS.chart[idx % COLORS.chart.length],
      })),
      stockMovementsChart: (stockMovements?.series || []).map((item, idx) => ({
        period: item.period,
        in_qty: Number(item.in_qty || 0),
        out_qty: Number(item.out_qty || 0),
        net: Number(item.in_qty || 0) - Number(item.out_qty || 0),
      })),
    }),
    [salesData, purchasesData, topSelling, topPurchased, stockMovements]
  );

  // Export to CSV functionality - memoized for performance
  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const headers = [
        "Product Name",
        "Category",
        "Units Sold",
        "Gross Revenue",
        "Stock Level",
      ];

      const rows = topSelling.map((product) => [
        product.product_name || "",
        product.category_name || "",
        product.total_quantity || 0,
        Number(product.gross_revenue || 0).toFixed(2),
        product.product_stock || 0,
      ]);

      // Add summary row
      rows.push([]);
      rows.push(["Summary"]);
      rows.push(["Total Revenue", calculatedMetrics.totalRevenue]);
      rows.push(["Total Orders", calculatedMetrics.totalOrders]);
      rows.push(["Total Profit", calculatedMetrics.totalProfit]);
      rows.push([
        "Profit Margin",
        `${calculatedMetrics.profitMargin.toFixed(1)}%`,
      ]);
      rows.push(["Low Stock Items", calculatedMetrics.lowStockCount]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `product-analytics-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [topSelling, calculatedMetrics]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 p-6"
    >
      {/* Enhanced Header with Glassmorphism */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-xl"
            >
              <Package className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Product Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Performance insights for the last{" "}
                <span className="font-semibold text-purple-600 dark:text-purple-400 mx-1">
                  {params.range_days}
                </span>{" "}
                days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <Calendar className="h-5 w-5 text-gray-500" />
              <DatePicker
                value={params.range_days}
                onChange={(days) =>
                  setParams((p) => ({ ...p, range_days: days }))
                }
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onClick={exportToCSV}
              disabled={isExporting || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-300"
            >
              <Download
                className={`h-5 w-5 ${isExporting ? "animate-bounce" : ""}`}
              />
              {isExporting ? "Exporting..." : "Export CSV"}
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              onClick={fetchAll}
              disabled={loading}
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-300"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
              />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl animate-pulse"
              />
            ))}
          </div>
          <ContentSpinner
            fullwidth
            message="Loading product analytics..."
            size="large"
          />
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Error Loading Analytics
              </h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ProductKpiCard
              title="Total Revenue"
              value={fmtCurrency(calculatedMetrics.totalRevenue)}
              icon={DollarSign}
              gradient="#22C55E"
              iconBg="bg-gradient-to-r from-green-500 to-emerald-500"
              iconColor="text-white"
              subtitle="Sales revenue"
              delta="+12.5%"
              index={0}
            />
            <ProductKpiCard
              title="Total Profit"
              value={fmtCurrency(calculatedMetrics.totalProfit)}
              icon={TrendingUp}
              gradient="#6366F1"
              iconBg="bg-gradient-to-r from-blue-500 to-indigo-500"
              iconColor="text-white"
              subtitle={`${fmtPercent(calculatedMetrics.profitMargin)} margin`}
              delta={calculatedMetrics.totalProfit >= 0 ? "+8.3%" : "-5.2%"}
              index={1}
            />
            <ProductKpiCard
              title="Total Orders"
              value={fmtNumber(calculatedMetrics.totalOrders)}
              icon={ShoppingCart}
              gradient="#F59E0B"
              iconBg="bg-gradient-to-r from-orange-500 to-yellow-500"
              iconColor="text-white"
              subtitle="Order count"
              delta="+15.2%"
              index={2}
            />
            <ProductKpiCard
              title="Avg Order Value"
              value={fmtCurrency(calculatedMetrics.avgOrderValue)}
              icon={ShoppingBag}
              gradient="#EC4899"
              iconBg="bg-gradient-to-r from-pink-500 to-rose-500"
              iconColor="text-white"
              subtitle="Per transaction"
              delta="+3.1%"
              index={3}
            />
            <ProductKpiCard
              title="Low Stock Items"
              value={fmtNumber(calculatedMetrics.lowStockCount)}
              icon={AlertTriangle}
              gradient={
                calculatedMetrics.lowStockCount > 0 ? "#EF4444" : "#22C55E"
              }
              iconBg={
                calculatedMetrics.lowStockCount > 0
                  ? "bg-gradient-to-r from-red-500 to-rose-500"
                  : "bg-gradient-to-r from-green-500 to-emerald-500"
              }
              iconColor="text-white"
              subtitle="Need attention"
              index={4}
            />
            <ProductKpiCard
              title="Top Seller"
              value={calculatedMetrics.topSeller || "N/A"}
              icon={Crown}
              gradient="#8B5CF6"
              iconBg="bg-gradient-to-r from-purple-500 to-violet-500"
              iconColor="text-white"
              subtitle="Best performing"
              index={5}
            />
            <ProductKpiCard
              title="Total Purchases"
              value={fmtCurrency(calculatedMetrics.totalPurchases)}
              icon={Package}
              gradient="#06B6D4"
              iconBg="bg-gradient-to-r from-cyan-500 to-blue-500"
              iconColor="text-white"
              subtitle="Purchase costs"
              index={6}
            />
            <ProductKpiCard
              title="Profit Margin"
              value={fmtPercent(calculatedMetrics.profitMargin)}
              icon={Percent}
              gradient={
                calculatedMetrics.profitMargin > 0 ? "#22C55E" : "#EF4444"
              }
              iconBg={
                calculatedMetrics.profitMargin > 0
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : "bg-gradient-to-r from-red-500 to-rose-500"
              }
              iconColor="text-white"
              subtitle="Overall margin"
              index={7}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Sales Trends Chart */}
            <ProductAnalyticsCard
              data={chartData.salesTrends}
              title="Sales Trends"
              subtitle="Revenue performance over time"
              icon={TrendingUp}
              gradient="from-green-500 to-emerald-500"
              chartType="area"
              dataKey="revenue"
              formatValue={fmtCurrency}
            />

            {/* Purchase Trends Chart */}
            <ProductAnalyticsCard
              data={chartData.purchasesTrends}
              title="Purchase Trends"
              subtitle="Procurement costs over time"
              icon={ShoppingCart}
              gradient="from-blue-500 to-indigo-500"
              chartType="line"
              dataKey="amount"
              formatValue={fmtCurrency}
            />
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Selling Products */}
            <ProductPerformanceCard
              data={chartData.topSellingChart}
              title="Top Selling Products"
              subtitle="Best performers by quantity"
              icon={Award}
              gradient="from-purple-500 to-pink-500"
              type="selling"
            />

            {/* Top Purchased Products */}
            <ProductPerformanceCard
              data={chartData.topPurchasedChart}
              title="Top Purchased Products"
              subtitle="Most procured items"
              icon={Package}
              gradient="from-orange-500 to-red-500"
              type="purchased"
            />
          </div>

          {/* Stock Movement and Low Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stock Movements */}
            <div className="lg:col-span-2">
              <StockMovementChart data={chartData.stockMovementsChart} />
            </div>

            {/* Low Stock Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Low Stock Alerts
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Items requiring attention
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {lowStock.length > 0 ? (
                  lowStock.slice(0, 8).map((item, idx) => (
                    <motion.div
                      key={item.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-2xl border border-red-100 dark:border-red-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <Package className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-40">
                            {item.product_name || item.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Stock: {item.stock || item.current_stock || 0}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                          {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Package className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">
                      All Good!
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No low stock alerts at the moment
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </motion.section>
  );
});

export default ProductAnalytics;
