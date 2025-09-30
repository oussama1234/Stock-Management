// src/pages/Admin/Categories/CategoriesDashboard.jsx
// Beautiful animated categories dashboard with gradient cards and stunning design
// - Modern gradient KPI cards with hover effects and animations
// - Category performance analytics with sparkline charts
// - Best/Good seller indicators with beautiful icons and colors
// - Responsive design with smooth transitions

import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import {
  Layers,
  Package2,
  TrendingUp,
  TrendingDown,
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
  Zap,
  Award,
  ShoppingBag,
  Users,
  Eye,
  Filter,
  Settings,
  Plus,
  RefreshCw,
  Flame,
  ThumbsUp,
  CheckCircle,
  Percent
} from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";

import ContentSpinner from "@/components/Spinners/ContentSpinner";
import { CategoriesService } from '@/api/Categories';
import { fmtCurrency, fmtNumber } from "@/pages/Dashboard/utils";
import CategoryFormModal from "./CategoryFormModal";

// Reusable components
import CategoryKpiCard from "./components/CategoryKpiCard";
import CategoryAnalyticsCard from "./components/CategoryAnalyticsCard";
import CategoryPerformanceCard from "./components/CategoryPerformanceCard";
import TopCategoriesTable from "./components/TopCategoriesTable";
import CategoryDistributionChart from "./components/CategoryDistributionChart";
import DateRangePicker from "@/pages/Dashboard/components/DateRangePicker";

// Custom hook for categories analytics
const useCategoriesMetrics = (rangeDays = 30) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metrics, analytics, topSelling, topPurchased, profitDistribution] = await Promise.all([
        CategoriesService.metrics({ range_days: rangeDays }),
        CategoriesService.analytics({ range_days: rangeDays }),
        CategoriesService.topSelling({ range_days: rangeDays, limit: 10 }),
        CategoriesService.topPurchased({ range_days: rangeDays, limit: 10 }),
        CategoriesService.profitDistribution({ range_days: rangeDays })
      ]);

      setData({
        metrics,
        analytics,
        topSelling,
        topPurchased,
        profitDistribution
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, loading, error, refetch: fetchMetrics };
};

export default function CategoriesDashboard() {
  // Range selector for analytics (7, 14, 30, 90, 180, 365)
  const [rangeDays, setRangeDays] = useState(30);
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Fetch categories metrics (cached for performance)
  const { data, loading, error, refetch } = useCategoriesMetrics(rangeDays);

  const openNew = () => { setEditing(null); setOpen(true); };

  const onSubmit = async (payload) => {
    try {
      if (editing) {
        await CategoriesService.update(editing.id, payload);
      } else {
        await CategoriesService.create(payload);
      }
      setOpen(false);
      refetch(); // Refresh data
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-3xl mr-4 shadow-lg">
              <Layers className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Categories Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                Loading category insights...
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl h-32 animate-pulse shadow-xl"
            />
          ))}
        </div>
        
        <ContentSpinner fullWidth message="Loading categories analytics..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
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
              <h3 className="text-xl font-bold text-red-800 mb-2">Categories Dashboard Error</h3>
              <p className="text-red-700">{error}</p>
              <button 
                onClick={refetch}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Beautiful KPI cards with gradients and animations
  const kpis = [
    {
      label: "Total Categories",
      value: fmtNumber(data?.metrics?.total_categories),
      Icon: Layers,
      gradient: "from-blue-500 via-indigo-500 to-purple-600",
      subtitle: "Active categories",
      iconBg: "from-blue-100 to-indigo-100",
      iconColor: "text-blue-600",
      delta: data?.metrics?.growth_rate
    },
    {
      label: "Active Categories",
      value: fmtNumber(data?.metrics?.active_categories),
      Icon: Package,
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      subtitle: "With stock available",
      iconBg: "from-emerald-100 to-green-100",
      iconColor: "text-emerald-600"
    },
    {
      label: "Top Performer",
      value: data?.metrics?.top_performer?.name || "N/A",
      Icon: Crown,
      gradient: "from-yellow-500 via-orange-500 to-red-600",
      subtitle: `${fmtNumber(data?.metrics?.top_performer?.sales)} sold`,
      iconBg: "from-yellow-100 to-orange-100",
      iconColor: "text-yellow-600"
    },
    {
      label: "Avg Products/Category",
      value: fmtNumber(Math.round(data?.metrics?.avg_products_per_category || 0)),
      Icon: BarChart3,
      gradient: "from-pink-500 via-rose-500 to-red-600",
      subtitle: "Distribution efficiency",
      iconBg: "from-pink-100 to-rose-100",
      iconColor: "text-pink-600"
    },
    {
      label: "Categories with Sales",
      value: fmtNumber(data?.metrics?.categories_with_sales),
      Icon: TrendingUp,
      gradient: "from-cyan-500 via-sky-500 to-blue-600",
      subtitle: `Last ${rangeDays} days`,
      iconBg: "from-cyan-100 to-sky-100",
      iconColor: "text-cyan-600"
    },
    {
      label: "Growth Rate",
      value: `${data?.metrics?.growth_rate >= 0 ? '+' : ''}${data?.metrics?.growth_rate}%`,
      Icon: data?.metrics?.growth_rate >= 0 ? TrendingUp : TrendingDown,
      gradient: data?.metrics?.growth_rate >= 0 
        ? "from-green-500 via-emerald-500 to-teal-600" 
        : "from-red-500 via-rose-500 to-pink-600",
      subtitle: "Sales velocity",
      iconBg: data?.metrics?.growth_rate >= 0 
        ? "from-green-100 to-emerald-100" 
        : "from-red-100 to-rose-100",
      iconColor: data?.metrics?.growth_rate >= 0 
        ? "text-green-600" 
        : "text-red-600"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Beautiful Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
      >
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-3xl mr-4 shadow-xl">
            <Layers className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Categories Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center text-sm">
              <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
              Performance insights for the last <span className="font-semibold text-purple-600 dark:text-purple-400 mx-1">{rangeDays}</span> days
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-200 p-2"
          >
            <Calendar className="h-5 w-5 text-gray-500 mr-2" />
            <DateRangePicker value={rangeDays} onChange={setRangeDays} />
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={openNew}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            New Category
          </motion.button>
        </div>
      </motion.div>

      {/* Beautiful KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <CategoryKpiCard
            key={kpi.label}
            {...kpi}
            index={idx}
          />
        ))}
      </div>

      {/* Analytics Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Performance Analytics */}
        <CategoryAnalyticsCard 
          data={data?.analytics || []}
          rangeDays={rangeDays}
          title="Category Performance"
          subtitle="Sales, purchases & profit analysis"
          gradient="from-blue-500 via-indigo-500 to-purple-600"
          icon={BarChart3}
        />

        {/* Top Categories Analytics */}
        <CategoryPerformanceCard 
          topSelling={data?.topSelling || []}
          topPurchased={data?.topPurchased || []}
          rangeDays={rangeDays}
          title="Top Categories"
          subtitle="Best performing categories"
          gradient="from-emerald-500 via-green-500 to-teal-600"
          icon={Award}
        />
      </div>

      {/* Profit Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 rounded-3xl shadow-2xl p-6 border border-orange-200/30 backdrop-blur-sm"
      >
        <div>
          <CategoryDistributionChart data={data?.profitDistribution || []} />
        </div>
      </motion.div>
      
      {/* Top Categories Table - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="bg-gradient-to-br from-white via-rose-50/30 to-pink-50/50 rounded-3xl shadow-2xl p-6 border border-rose-200/30 backdrop-blur-sm mt-6"
      >
        <div className="flex items-center mb-4">
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-2 rounded-xl mr-3 shadow-lg">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Category Performance Leaderboard
          </h3>
        </div>
        <TopCategoriesTable analytics={data?.analytics || []} />
      </motion.div>

      {/* Category Form Modal */}
      <CategoryFormModal 
        open={open} 
        onOpenChange={setOpen} 
        initial={editing} 
        onSubmit={onSubmit} 
      />
    </div>
  );
}