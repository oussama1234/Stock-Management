// src/pages/Admin/Purchases/PurchasesAnalytics.jsx
// Beautiful comprehensive purchases analytics page with stunning visualizations
// - Interactive charts and metrics with real-time data
// - Beautiful animations and hover effects throughout
// - Responsive design with glass morphism and gradients
// - Advanced analytics including trends, suppliers, products, and cost analysis

import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Building2,
  Package,
  Users,
  DollarSign,
  Calendar,
  ArrowLeft,
  Sparkles,
  PieChart,
  LineChart,
  Award,
  Target,
  ShoppingBag,
  Clock,
  Zap,
  Star,
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import ContentSpinner from "@/components/Spinners/ContentSpinner";
import { PurchasesRoute } from "@/router/Index";
import { getAllPurchasesAnalytics } from "@/api/PurchasesAnalytics";

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

// Beautiful card component for metrics
const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend, onClick }) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-3xl bg-gradient-to-br ${color} backdrop-blur-sm border border-white/20 shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <Icon className="h-5 w-5 text-white/80 mr-2" />
          <h3 className="text-white/90 text-sm font-medium">{title}</h3>
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        {subtitle && (
          <div className="text-white/70 text-sm">{subtitle}</div>
        )}
        {trend !== undefined && (
          <div className={`flex items-center mt-2 text-sm ${
            trend >= 0 ? 'text-green-100' : 'text-red-100'
          }`}>
            <div className="mr-1">
              <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            </div>
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  </div>
);

// Beautiful list component for top items
const TopItemsList = ({ title, items = [], icon: Icon, color, renderItem }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
    <div className={`bg-gradient-to-r ${color} p-6 text-white`}>
      <div className="flex items-center">
        <Icon className="h-6 w-6 mr-3" />
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="ml-auto text-white/80 text-sm">
          {items.length} items
        </div>
      </div>
    </div>
    
    <div className="p-6">
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.slice(0, 10).map((item, index) => (
            <div
              key={item.id || index}
              className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl hover:shadow-md transition-all duration-300"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                {index + 1}
              </div>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available</p>
        </div>
      )}
    </div>
  </div>
);

export default function PurchasesAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeDays, setRangeDays] = useState(30);

  // Format currency helper
  const formatCurrency = useCallback((n) =>
    new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD" 
    }).format(Number(n || 0)), []
  );

  // Format number helper
  const formatNumber = useCallback((n) =>
    new Intl.NumberFormat("en-US").format(Number(n || 0)), []
  );

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const data = await getAllPurchasesAnalytics(
        { range_days: rangeDays },
        { signal: controller.signal }
      );
      setAnalyticsData(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load analytics data');
      }
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!analyticsData?.overview) return [];

    const { summary } = analyticsData.overview;
    
    return [
      {
        title: "Total Purchases",
        value: formatNumber(summary.total_purchases),
        subtitle: `Last ${rangeDays} days`,
        icon: ShoppingBag,
        color: "from-blue-500 to-indigo-600",
        trend: summary.purchases_growth
      },
      {
        title: "Total Spent",
        value: formatCurrency(summary.total_amount),
        subtitle: "Purchase volume",
        icon: DollarSign,
        color: "from-emerald-500 to-teal-600",
        trend: summary.amount_growth
      },
      {
        title: "Avg Order Value",
        value: formatCurrency(summary.avg_order_value),
        subtitle: "Per purchase",
        icon: Target,
        color: "from-purple-500 to-pink-600"
      },
      {
        title: "Suppliers",
        value: formatNumber(analyticsData.suppliers?.total_suppliers || 0),
        subtitle: "Active suppliers",
        icon: Building2,
        color: "from-amber-500 to-orange-600"
      },
      {
        title: "Categories",
        value: formatNumber(analyticsData.categories?.total_categories || 0),
        subtitle: "Product categories",
        icon: Package,
        color: "from-cyan-500 to-blue-600"
      },
      {
        title: "Team Members",
        value: formatNumber(analyticsData.team?.total_team_members || 0),
        subtitle: "Purchasing team",
        icon: Users,
        color: "from-rose-500 to-red-600"
      }
    ];
  }, [analyticsData, rangeDays, formatCurrency, formatNumber]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
        </div>
        <ContentSpinner message="Loading analytics..." fullWidth size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 text-rose-700 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center">
            <div>
              <AlertTriangle className="h-6 w-6 mr-3" />
            </div>
            <div>
              <h3 className="font-semibold">Failed to load analytics</h3>
              <p className="text-sm mt-1">{error}</p>
              <button 
                onClick={fetchAnalytics}
                className="mt-3 px-4 py-2 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to={PurchasesRoute}
            className="mr-4 p-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl mr-4 shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              Purchases Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
              Comprehensive insights into purchase patterns and performance
            </p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all duration-300"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaryMetrics.map((metric, index) => (
          <div key={metric.title}>
            <MetricCard {...metric} />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Suppliers */}
        <TopItemsList
          title="Top Suppliers"
          items={analyticsData?.suppliers?.suppliers || []}
          icon={Building2}
          color="from-blue-500 to-indigo-600"
          renderItem={(supplier, index) => (
            <>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  {supplier.name}
                </div>
                <div className="text-sm text-gray-600">
                  {formatNumber(supplier.purchase_count)} purchases • {formatCurrency(supplier.avg_order_value)} avg
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(supplier.total_spent)}
                </div>
                <div className="text-sm text-gray-500">
                  {supplier.frequency_per_week.toFixed(1)}/week
                </div>
              </div>
            </>
          )}
        />

        {/* Top Products */}
        <TopItemsList
          title="Most Purchased Products"
          items={analyticsData?.topProducts?.products || []}
          icon={Package}
          color="from-emerald-500 to-teal-600"
          renderItem={(product, index) => (
            <>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  {product.name}
                </div>
                <div className="text-sm text-gray-600">
                  {product.category_name || 'Uncategorized'} • {formatNumber(product.purchase_count)} orders
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-600">
                  {formatNumber(product.total_quantity)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(product.total_value)}
                </div>
              </div>
            </>
          )}
        />
      </div>

      {/* Categories & Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories */}
        <TopItemsList
          title="Purchase by Category"
          items={analyticsData?.categories?.categories || []}
          icon={PieChart}
          color="from-purple-500 to-pink-600"
          renderItem={(category, index) => (
            <>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  {category.name || 'Uncategorized'}
                </div>
                <div className="text-sm text-gray-600">
                  {formatNumber(category.unique_products)} products • {formatNumber(category.purchase_count)} purchases
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">
                  {category.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(category.total_value)}
                </div>
              </div>
            </>
          )}
        />

        {/* Team Performance */}
        <TopItemsList
          title="Team Performance"
          items={analyticsData?.team?.team_members || []}
          icon={Users}
          color="from-amber-500 to-orange-600"
          renderItem={(member, index) => (
            <>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  {member.name}
                </div>
                <div className="text-sm text-gray-600">
                  {member.email} • {formatNumber(member.purchase_count)} purchases
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-amber-600">
                  {formatCurrency(member.total_amount)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(member.avg_order_value)} avg
                </div>
              </div>
            </>
          )}
        />
      </div>

      {/* Cost Analysis */}
      {analyticsData?.costAnalysis && (
        <div className="bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-3xl shadow-xl text-white p-8">
          <div className="flex items-center mb-6">
            <div>
              <Activity className="h-8 w-8 mr-4" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Cost Analysis</h2>
              <p className="text-white/80">Price trends and savings opportunities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center mb-3">
                <Target className="h-6 w-6 mr-3" />
                <span className="font-semibold">Products Analyzed</span>
              </div>
              <div className="text-3xl font-bold">
                {formatNumber(analyticsData.costAnalysis.summary.total_products_analyzed)}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center mb-3">
                <TrendingUp className="h-6 w-6 mr-3" />
                <span className="font-semibold">Avg Price Volatility</span>
              </div>
              <div className="text-3xl font-bold">
                {(analyticsData.costAnalysis.summary.avg_price_volatility || 0).toFixed(1)}%
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center mb-3">
                <DollarSign className="h-6 w-6 mr-3" />
                <span className="font-semibold">Potential Savings</span>
              </div>
              <div className="text-3xl font-bold">
                {formatCurrency(analyticsData.costAnalysis.summary.potential_total_savings)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-8 border-t border-gray-200">
        <div className="flex items-center justify-center text-gray-500 text-sm">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Data last updated: {analyticsData?._fetchedAt ? new Date(analyticsData._fetchedAt).toLocaleString() : 'Never'}
        </div>
      </div>
    </div>
  );
}