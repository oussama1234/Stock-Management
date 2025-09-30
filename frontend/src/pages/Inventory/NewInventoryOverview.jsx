// src/pages/Inventory/NewInventoryOverview.jsx
// High-performance inventory overview with beautiful modern design
import React, { memo, useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package2, Package, TrendingUp, AlertTriangle, Activity,
  BarChart3, PieChart, RefreshCw, Calendar, Download,
  ShoppingCart, Settings, Eye, Plus
} from 'lucide-react';
import { getInventoryKpis } from '@/api/Inventory';
import { getStockMovementsReport } from '@/api/Reports';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import InventoryKpiCard from './components/shared/InventoryKpiCard';
import InventoryChartCard from './components/shared/InventoryChartCard';
import InventoryNavTabs from './components/shared/InventoryNavTabs';

// Lazy load heavy components
const MovementsChart = React.lazy(() => import('./components/charts/MovementsChart'));
const StockDistributionChart = React.lazy(() => import('./components/charts/StockDistributionChart'));
const TopProductsTable = React.lazy(() => import('./components/tables/TopProductsTable'));

// Enhanced color palette
const COLORS = {
  primary: ['#6366F1', '#8B5CF6', '#A855F7'],
  success: ['#22C55E', '#10B981', '#14B8A6'],
  warning: ['#F59E0B', '#FB923C', '#FBBF24'],
  danger: ['#EF4444', '#F87171', '#FB7185'],
  info: ['#06B6D4', '#22D3EE', '#38BDF8'],
  chart: ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#10B981', '#EC4899']
};

// Custom hook for date range management
const useDateRange = () => {
  const [preset, setPreset] = useState('last_7_days');
  
  const buildParams = useCallback((p) => {
    if (!p || p === 'last_7_days') return { 
      preset: 'last_7_days', 
      date_range: 'last_7_days', 
      range_days: 7, 
      group_by: 'day' 
    };
    return p;
  }, []);

  return { preset, setPreset, buildParams };
};

// Custom hook for inventory data management
const useInventoryData = (rangeParams) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [movements, setMovements] = useState([]);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const invParams = { 
        range_days: rangeParams.range_days, 
        from_date: rangeParams.from_date, 
        to_date: rangeParams.to_date 
      };
      
      const reportParams = { 
        date_range: rangeParams.date_range, 
        group_by: rangeParams.group_by || 'day', 
        from_date: rangeParams.from_date, 
        to_date: rangeParams.to_date 
      };

      const [kpisData, movementsData] = await Promise.all([
        getInventoryKpis(invParams),
        getStockMovementsReport(reportParams)
      ]);

      setKpis(kpisData);
      setMovements((movementsData?.series || []).map(r => ({ 
        period: r.period, 
        in_qty: Number(r.in_qty || 0), 
        out_qty: Number(r.out_qty || 0) 
      })));
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e?.response?.data?.message || e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [rangeParams]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { loading, error, kpis, movements, refetch: fetchData };
};

const NewInventoryOverview = memo(function NewInventoryOverview() {
  const { preset, setPreset, buildParams } = useDateRange();
  const [rangeParams, setRangeParams] = useState(buildParams('last_7_days'));
  const { loading, error, kpis, movements, refetch } = useInventoryData(rangeParams);

  const onRangeChange = useCallback((params) => {
    setPreset(params.preset);
    setRangeParams(params);
  }, [setPreset]);

  // Memoized calculations for performance
  const metrics = useMemo(() => {
    const totals = kpis?.totals || {};
    return {
      totalStock: Number(totals.stock || 0),
      reserved: Number(totals.reserved || 0),
      available: Number(totals.available || 0),
      sold: Number(totals.sold || 0),
      purchased: Number(totals.purchased || 0),
      adjusted: Number(totals.adjusted || 0),
      // Calculate additional metrics
      turnoverRate: totals.purchased > 0 ? (totals.sold / totals.purchased * 100) : 0,
      utilizationRate: totals.stock > 0 ? ((totals.stock - totals.available) / totals.stock * 100) : 0
    };
  }, [kpis]);

  // Memoized chart data
  const chartData = useMemo(() => ({
    movements: movements.map((item, idx) => ({
      ...item,
      fill: COLORS.chart[idx % COLORS.chart.length]
    })),
    distribution: [
      { name: 'Available', value: metrics.available, fill: COLORS.success[0] },
      { name: 'Reserved', value: metrics.reserved, fill: COLORS.warning[0] },
      { name: 'Sold', value: metrics.sold, fill: COLORS.info[0] }
    ]
  }), [movements, metrics]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading && !kpis) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
          ))}
        </div>
        
        <ContentSpinner fullwidth message="Loading inventory dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-lg">
            <Package2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Inventory Overview
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Monitor your stock levels, movements, and performance
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <InventoryNavTabs className="mb-6" />

      {error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error loading data</span>
          </div>
          <p className="mt-1 text-sm opacity-90">{error}</p>
        </motion.div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <InventoryKpiCard
              title="Total Stock"
              value={metrics.totalStock}
              icon={Package}
              variant="primary"
              animationDelay={0}
              subtitle="All products"
            />
            <InventoryKpiCard
              title="Reserved"
              value={metrics.reserved}
              icon={Settings}
              variant="warning"
              animationDelay={0.1}
              subtitle="Pending orders"
            />
            <InventoryKpiCard
              title="Available"
              value={metrics.available}
              icon={Activity}
              variant="success"
              animationDelay={0.2}
              subtitle="Ready to sell"
            />
            <InventoryKpiCard
              title="Sold"
              value={metrics.sold}
              icon={TrendingUp}
              variant="info"
              animationDelay={0.3}
              subtitle="This period"
            />
            <InventoryKpiCard
              title="Purchased"
              value={metrics.purchased}
              icon={ShoppingCart}
              variant="purple"
              animationDelay={0.4}
              subtitle="This period"
            />
            <InventoryKpiCard
              title="Turnover Rate"
              value={metrics.turnoverRate}
              format="percentage"
              icon={BarChart3}
              variant="info"
              animationDelay={0.5}
              subtitle="Efficiency metric"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Movements Chart */}
            <InventoryChartCard
              title="Stock Movements"
              subtitle="Track inventory flow over time"
              icon={BarChart3}
              animationDelay={0.6}
              loading={loading}
              error={error}
            >
              <Suspense fallback={<div className="h-full flex items-center justify-center"><ContentSpinner /></div>}>
                <MovementsChart data={chartData.movements} />
              </Suspense>
            </InventoryChartCard>

            {/* Stock Distribution Chart */}
            <InventoryChartCard
              title="Stock Distribution"
              subtitle="Current inventory allocation"
              icon={PieChart}
              animationDelay={0.7}
              loading={loading}
              error={error}
            >
              <Suspense fallback={<div className="h-full flex items-center justify-center"><ContentSpinner /></div>}>
                <StockDistributionChart data={chartData.distribution} />
              </Suspense>
            </InventoryChartCard>
          </div>

          {/* Top Products Table */}
          <InventoryChartCard
            title="Top Products"
            subtitle="Products with highest inventory activity"
            icon={Package}
            animationDelay={0.8}
            height="h-96"
            loading={loading}
            error={error}
            actions={
              <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                <Eye className="w-4 h-4" />
                View All
              </button>
            }
          >
            <Suspense fallback={<div className="h-full flex items-center justify-center"><ContentSpinner /></div>}>
              <TopProductsTable rangeParams={rangeParams} />
            </Suspense>
          </InventoryChartCard>
        </>
      )}
    </div>
  );
});

export default NewInventoryOverview;