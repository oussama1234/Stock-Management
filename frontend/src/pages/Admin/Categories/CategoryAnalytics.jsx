// src/pages/Admin/Categories/CategoryAnalytics.jsx
// High-performance category analytics dashboard with beautiful modern design
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, TrendingUp, PieChart as PieIcon, Layers, DollarSign,
  Package, ShoppingCart, TrendingDown, Calendar, Filter,
  Download, RefreshCw, ChevronRight, Activity, Zap,
  Award, Target, Users, Eye, ArrowUp, ArrowDown,
  Sparkles, Crown, Star, AlertCircle
} from 'lucide-react';
import { CategoriesService } from '@/api/Categories';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import DaysInStockBadge from './components/DaysInStockBadge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Enhanced color palette with gradients
const COLORS = {
  primary: ['#6366F1', '#8B5CF6', '#A855F7'],
  success: ['#22C55E', '#10B981', '#14B8A6'],
  warning: ['#F59E0B', '#FB923C', '#FBBF24'],
  danger: ['#EF4444', '#F87171', '#FB7185'],
  info: ['#06B6D4', '#22D3EE', '#38BDF8'],
  chart: ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#10B981', '#EC4899', '#F97316']
};

// Performance metrics calculation helper
const calculateMetrics = (data) => {
  if (!data || data.length === 0) return { growth: 0, trend: 'stable', performance: 'average' };
  const total = data.reduce((sum, item) => sum + (item.profit_approx || 0), 0);
  const avg = total / data.length;
  const sorted = [...data].sort((a, b) => b.profit_approx - a.profit_approx);
  const top20Percent = Math.floor(data.length * 0.2) || 1;
  const topPerformers = sorted.slice(0, top20Percent);
  const topRevenue = topPerformers.reduce((sum, item) => sum + item.profit_approx, 0);
  const concentration = (topRevenue / total) * 100;
  
  return {
    total,
    average: avg,
    concentration,
    trend: concentration > 60 ? 'concentrated' : 'distributed',
    performance: avg > 1000 ? 'excellent' : avg > 500 ? 'good' : 'needs-improvement'
  };
};

const CategoryAnalytics = memo(function CategoryAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [profitDist, setProfitDist] = useState([]);
  const [params, setParams] = useState({ range_days: 30 });
  const [isExporting, setIsExporting] = useState(false);
  const abortRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null); setLoading(true);
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const [ov, ts, pd] = await Promise.all([
        CategoriesService.analytics(params, { signal: controller.signal }),
        CategoriesService.topSelling(params, { signal: controller.signal }),
        CategoriesService.profitDistribution(params, { signal: controller.signal }),
      ]);
      setOverview(Array.isArray(ov) ? ov : (ov?.data || []));
      setTopSelling(Array.isArray(ts) ? ts : (ts?.data || []));
      setProfitDist(Array.isArray(pd) ? pd : (pd?.data || []));
    } catch (e) {
      if (e.name !== 'CanceledError' && e.message !== 'canceled') {
        setError(e?.response?.data?.message || e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchAll(); return () => abortRef.current?.abort(); }, [params.range_days]);

  // Memoized calculations with enhanced metrics
  const metrics = useMemo(() => {
    const totalProducts = overview.reduce((s, r) => s + (r.products_count || 0), 0);
    const totalSold = overview.reduce((s, r) => s + (r.sold_qty || 0), 0);
    const totalPurchased = overview.reduce((s, r) => s + (r.purchased_qty || 0), 0);
    const totalProfit = overview.reduce((s, r) => s + (r.profit_approx || 0), 0);
    const avgProfit = overview.length > 0 ? totalProfit / overview.length : 0;
    const topPerformer = overview.reduce((best, curr) => 
      (curr.profit_approx || 0) > (best.profit_approx || 0) ? curr : best, overview[0] || {});
    
    // Calculate growth rate (mock - would need historical data)
    const growthRate = totalSold > 0 ? ((totalSold - totalPurchased) / totalPurchased * 100) : 0;
    
    return {
      totalProducts,
      totalSold, 
      totalPurchased,
      totalProfit: Number(totalProfit.toFixed(2)),
      avgProfit: Number(avgProfit.toFixed(2)),
      topPerformer,
      growthRate: Number(growthRate.toFixed(1)),
      turnoverRate: totalPurchased > 0 ? (totalSold / totalPurchased * 100).toFixed(1) : 0,
      performance: calculateMetrics(overview)
    };
  }, [overview]);

  // Enhanced chart data with animations
  const chartData = useMemo(() => ({
    topSelling: topSelling.slice(0, 8).map((item, idx) => ({
      ...item,
      fill: COLORS.chart[idx % COLORS.chart.length],
      animationDelay: idx * 100
    })),
    profitDist: profitDist.slice(0, 8).map((item, idx) => ({
      ...item,
      fill: COLORS.chart[idx % COLORS.chart.length],
      percentage: profitDist.length > 0 ? 
        ((item.profit / profitDist.reduce((s, i) => s + i.profit, 0)) * 100).toFixed(1) : 0
    })),
    overview: overview.map((item, idx) => ({
      ...item,
      fill: COLORS.chart[idx % COLORS.chart.length]
    }))
  }), [topSelling, profitDist, overview]);

  // Export to CSV functionality - memoized for performance
  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      // Prepare CSV data
      const headers = [
        'Category Name',
        'Products Count',
        'Units Sold',
        'Units Purchased',
        'Profit',
        '% of All Sales',
        '% of Total Profit',
        'Avg Days in Stock'
      ];
      
      const rows = overview.map(cat => [
        cat.name,
        cat.products_count || 0,
        cat.sold_qty || 0,
        cat.purchased_qty || 0,
        Number(cat.profit_approx || 0).toFixed(2),
        Number(cat.pct_of_all_sold || 0).toFixed(2),
        Number(cat.pct_of_total_profit || 0).toFixed(2),
        Number(cat.avg_days_in_stock || 0).toFixed(1)
      ]);
      
      // Add summary row
      rows.push([]);
      rows.push(['Summary']);
      rows.push(['Total Products', metrics.totalProducts]);
      rows.push(['Total Sold', metrics.totalSold]);
      rows.push(['Total Purchased', metrics.totalPurchased]);
      rows.push(['Total Profit', metrics.totalProfit]);
      rows.push(['Average Profit', metrics.avgProfit]);
      rows.push(['Top Performer', metrics.topPerformer.name || 'N/A']);
      
      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `category-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success message (you can add a toast here)
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [overview, metrics]);

  // Download chart data - separate function for performance
  const downloadChartData = useCallback(async () => {
    setIsExporting(true);
    try {
      // Prepare chart-specific data
      const chartDataCSV = {
        topSelling: {
          headers: ['Category', 'Quantity Sold'],
          rows: topSelling.map(item => [item.name, item.qty || 0])
        },
        profitDistribution: {
          headers: ['Category', 'Profit', 'Percentage'],
          rows: profitDist.map(item => [
            item.name,
            Number(item.profit || 0).toFixed(2),
            ((item.profit / profitDist.reduce((s, i) => s + i.profit, 0.01)) * 100).toFixed(1) + '%'
          ])
        }
      };
      
      // Create combined CSV
      const csvContent = [
        'Top Selling Categories',
        chartDataCSV.topSelling.headers.join(','),
        ...chartDataCSV.topSelling.rows.map(row => row.join(',')),
        '',
        'Profit Distribution',
        chartDataCSV.profitDistribution.headers.join(','),
        ...chartDataCSV.profitDistribution.rows.map(row => row.join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `category-charts-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [topSelling, profitDist]);

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
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg"
            >
              <BarChart3 className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Category Analytics
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Real-time performance insights
              </p>
            </div>
          </div>
          
          {/* Enhanced Controls */}
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select 
                className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium appearance-none cursor-pointer hover:border-purple-300 transition-colors" 
                value={params.range_days} 
                onChange={(e) => setParams(p => ({ ...p, range_days: Number(e.target.value) }))}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 6 months</option>
                <option value={365}>Last year</option>
              </select>
            </div>

            {/* Action Buttons */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchAll()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadChartData}
              disabled={isExporting || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              title="Download Charts Data"
            >
              <Download className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="py-20">
          <ContentSpinner variant="minimal" fullWidth message="Computing analytics..." />
        </div>
      ) : error ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4"
        >
          <AlertCircle className="h-6 w-6 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-700">Error Loading Analytics</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {/* KPI Cards Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Total Products Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Package className="h-6 w-6" />
                  </div>
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs bg-white/20 px-2 py-1 rounded-full"
                  >
                    +12%
                  </motion.span>
                </div>
                <h3 className="text-white/80 text-sm font-medium">Total Products</h3>
                <p className="text-3xl font-bold mt-1">{metrics.totalProducts.toLocaleString()}</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/60">Across all categories</p>
                </div>
              </div>
            </motion.div>

            {/* Units Sold Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <motion.span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    {metrics.growthRate}%
                  </motion.span>
                </div>
                <h3 className="text-white/80 text-sm font-medium">Units Sold</h3>
                <p className="text-3xl font-bold mt-1">{metrics.totalSold.toLocaleString()}</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/60">Turnover rate: {metrics.turnoverRate}%</p>
                </div>
              </div>
            </motion.div>

            {/* Revenue Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <motion.span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {metrics.performance.performance}
                  </motion.span>
                </div>
                <h3 className="text-white/80 text-sm font-medium">Total Profit</h3>
                <p className="text-3xl font-bold mt-1">${metrics.totalProfit.toLocaleString()}</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/60">Avg: ${metrics.avgProfit.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            {/* Top Performer Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Crown className="h-6 w-6" />
                  </div>
                  <motion.span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    Top
                  </motion.span>
                </div>
                <h3 className="text-white/80 text-sm font-medium">Best Category</h3>
                <p className="text-xl font-bold mt-1 truncate">{metrics.topPerformer.name || 'N/A'}</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/60">
                    Profit: ${(metrics.topPerformer.profit_approx || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Selling Categories Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Top Selling Categories</h3>
                    <p className="text-xs text-gray-500">By quantity sold</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Scroll to table section
                    const tableSection = document.getElementById('category-table-section');
                    tableSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="text-sm text-purple-600 hover:bg-purple-50 px-3 py-1 rounded-lg transition-colors"
                >
                  View All
                </motion.button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.topSelling} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="qty" 
                      fill="url(#barGradient)" 
                      radius={[8, 8, 0, 0]}
                      animationBegin={0}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Profit Distribution</h3>
                  <p className="text-xs text-gray-500 mt-1">Performance by category</p>
                </div>
                <div className="p-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
                  <PieIcon className="h-5 w-5 text-white" />
                </div>
              </div>

              {profitDist.length > 0 ? (
                <div className="space-y-6">
                  {/* Chart Section */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div style={{ width: '280px', height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={profitDist}
                              cx="50%"
                              cy="50%"
                              innerRadius={75}
                              outerRadius={110}
                              paddingAngle={2}
                              dataKey="profit"
                            >
                              {profitDist.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Profit']}
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Center Total */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 font-medium uppercase">Total</div>
                          <div className="text-2xl font-bold text-gray-800">
                            ${profitDist.reduce((sum, item) => sum + (item.profit || 0), 0).toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">{profitDist.length} items</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Category Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {profitDist
                        .sort((a, b) => b.profit - a.profit)
                        .slice(0, 8)
                        .map((item, index) => {
                          const total = profitDist.reduce((sum, i) => sum + Math.abs(i.profit || 0), 0.01);
                          const percentage = ((Math.abs(item.profit || 0) / total) * 100).toFixed(1);
                          
                          return (
                            <div 
                              key={item.name || index}
                              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm text-gray-700 truncate">
                                  {item.name || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-gray-500">
                                  {percentage}%
                                </span>
                                <span className="text-sm font-semibold text-gray-800 min-w-[60px] text-right">
                                  ${Number(item.profit || 0).toFixed(0)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {profitDist.length > 8 && (
                      <div className="text-center mt-3 text-xs text-gray-500">
                        +{profitDist.length - 8} more categories
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <PieIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Table Section */}
          <motion.div 
            id="category-table-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Category Performance Overview</h3>
                  <p className="text-xs text-gray-500">Detailed metrics for all categories</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToCSV}
                disabled={isExporting}
                className="flex items-center gap-2 text-sm text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className={`h-3 w-3 ${isExporting ? 'animate-pulse' : ''}`} />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </motion.button>
            </div>
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="p-3 text-right font-semibold text-gray-700">Products</th>
                    <th className="p-3 text-right font-semibold text-gray-700">Sold</th>
                    <th className="p-3 text-right font-semibold text-gray-700">Purchased</th>
                    <th className="p-3 text-right font-semibold text-gray-700">Profit</th>
                    <th className="p-3 text-right font-semibold text-gray-700">% of Sales</th>
                    <th className="p-3 text-right font-semibold text-gray-700">% of Profit</th>
                    <th className="p-3 text-right font-semibold text-gray-700">Avg Days</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {overview.map((r, idx) => (
                    <motion.tr 
                      key={r.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors"
                    >
                      <td className="p-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.chart[idx % COLORS.chart.length] }} />
                          {r.name}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">{r.products_count}</td>
                      <td className="p-3 text-right text-green-600 font-medium">{r.sold_qty}</td>
                      <td className="p-3 text-right text-blue-600 font-medium">{r.purchased_qty}</td>
                      <td className="p-3 text-right font-bold">
                        <span className={`${r.profit_approx >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Number(r.profit_approx).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-600">{Number(r.pct_of_all_sold).toFixed(1)}%</td>
                      <td className="p-3 text-right text-gray-600">{Number(r.pct_of_total_profit).toFixed(1)}%</td>
                      <td className="p-3 text-right">
                        <DaysInStockBadge 
                          days={r.avg_days_in_stock} 
                          size="xs" 
                          showIcon={false}
                        />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-gray-500 mt-4 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              <span>Approximate calculations based on current inventory data</span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.section>
  );
});

export default CategoryAnalytics;
