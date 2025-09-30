// src/pages/Inventory/NewLowStockAlerts.jsx
// High-performance low stock alerts with modern design and real-time updates
import React, { memo, useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Package, Search, Filter, Download, RefreshCw,
  ShoppingCart, Eye, Settings, TrendingDown, TrendingUp,
  Bell, Clock, Zap, Target, BarChart3, Activity
} from 'lucide-react';
import { getLowStockReport, getLowStockAlertsReport, exportLowStockReport } from '@/api/Reports';
import { getLowStockAlerts, exportLowStockAlerts } from '@/api/Inventory';
import { ProductsRoute, InventoryAdjustmentsRoute } from '@/router/Index';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import InventoryNavTabs from './components/shared/InventoryNavTabs';
import InventoryKpiCard from './components/shared/InventoryKpiCard';
import InventoryChartCard from './components/shared/InventoryChartCard';

// Lazy load components
const AlertsTable = React.lazy(() => import('./components/tables/AlertsTable'));
const AlertsChart = React.lazy(() => import('./components/charts/AlertsChart'));
const QuickActionModal = React.lazy(() => import('./components/modals/QuickActionModal'));

// Alert severity levels
const ALERT_SEVERITY = {
  CRITICAL: { level: 'critical', label: 'Critical', color: 'red', threshold: 0 },
  HIGH: { level: 'high', label: 'High', color: 'orange', threshold: 5 },
  MEDIUM: { level: 'medium', label: 'Medium', color: 'yellow', threshold: 10 },
  LOW: { level: 'low', label: 'Low', color: 'blue', threshold: 20 }
};

// Get alert severity based on stock level and threshold
const getAlertSeverity = (stock, threshold) => {
  if (stock <= 0) return ALERT_SEVERITY.CRITICAL;
  if (stock <= Math.min(threshold * 0.3, 5)) return ALERT_SEVERITY.HIGH;
  if (stock <= threshold) return ALERT_SEVERITY.MEDIUM;
  return ALERT_SEVERITY.LOW;
};

// Alert badge component
const AlertBadge = memo(function AlertBadge({ stock, threshold }) {
  const severity = getAlertSeverity(stock, threshold);
  
  const variants = {
    critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
    low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
  };

  return (
    <motion.span 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${variants[severity.level]}`}
    >
      {severity.level === 'critical' && <AlertTriangle className="w-3 h-3" />}
      {severity.level === 'high' && <TrendingDown className="w-3 h-3" />}
      {severity.level === 'medium' && <Clock className="w-3 h-3" />}
      {severity.level === 'low' && <Bell className="w-3 h-3" />}
      {severity.label}
    </motion.span>
  );
});

// Custom hook for alerts data management
const useAlertsData = (params) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const abortRef = useRef(null);

  // Stable reference to params using JSON.stringify for comparison
  const paramsRef = useRef();
  const paramsString = JSON.stringify(params);
  
  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      console.log('🔄 [LowStockAlerts] Fetching alerts data...', params);
      setError(null);
      setLoading(true);
      
      // Try multiple API endpoints for better coverage
      let response;
      try {
        // First try the dedicated low stock alerts endpoint
        response = await getLowStockAlerts({ ...params, signal: controller.signal });
        console.log('📊 [LowStockAlerts] Inventory API Response:', response);
      } catch (inventoryError) {
        console.log('⚠️ [LowStockAlerts] Inventory API failed, trying Reports API...', inventoryError.message);
        // Fallback to reports API
        response = await getLowStockReport(params);
        console.log('📊 [LowStockAlerts] Reports API Response:', response);
      }
      
      // Parse response data with multiple possible structures
      let items = [];
      if (Array.isArray(response?.data?.data)) {
        // Paginated response structure: { data: { data: [...], meta: {...} } }
        items = response.data.data;
      } else if (Array.isArray(response?.data)) {
        // Simple data array: { data: [...] }
        items = response.data;
      } else if (Array.isArray(response?.items)) {
        // Items structure: { items: [...] }
        items = response.items;
      } else if (Array.isArray(response)) {
        // Direct array response
        items = response;
      }
      
      // Transform data to ensure consistent structure
      const transformedItems = items.map(item => ({
        id: item.id,
        name: item.name || item.product_name,
        category_name: item.category_name || item.category?.name,
        category_id: item.category_id || item.category?.id,
        stock: item.stock || item.current_stock || item.quantity || 0,
        low_stock_threshold: item.low_stock_threshold || item.reorder_point || params.threshold || 10,
        daily_usage: item.daily_usage || item.average_daily_usage || 0,
        image: item.image || item.product_image,
        supplier_name: item.supplier_name || item.supplier?.name,
        supplier_id: item.supplier_id || item.supplier?.id,
        last_restocked: item.last_restocked || item.updated_at,
        days_until_stockout: item.days_until_stockout
      }));
      
      console.log('✅ [LowStockAlerts] Processed items:', transformedItems.length, 'alerts');
      setData(transformedItems);
      setLastUpdated(new Date());
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('❌ [LowStockAlerts] API Error:', e);
        setError(e?.response?.data?.message || e.message || 'Failed to load low stock alerts');
      }
    } finally {
      setLoading(false);
    }
  }, [paramsString]);

  // Only refetch when params actually change
  useEffect(() => {
    if (paramsRef.current !== paramsString) {
      paramsRef.current = paramsString;
      fetchData();
    }
    return () => abortRef.current?.abort();
  }, [paramsString, fetchData]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
};

// Custom hook for filter management
const useFilters = (data) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    severity: '',
    threshold: 10
  });

  // Get unique categories from data
  const categories = useMemo(() => {
    const categoryMap = new Map();
    data.forEach(item => {
      const id = item.category_id;
      const name = item.category_name;
      if (id && name) categoryMap.set(id, name);
    });
    return Array.from(categoryMap, ([id, name]) => ({ id, name }));
  }, [data]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(search) ||
        item.category_name?.toLowerCase().includes(search)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(item => 
        String(item.category_id) === String(filters.category)
      );
    }

    if (filters.severity) {
      filtered = filtered.filter(item => {
        const severity = getAlertSeverity(item.stock, item.low_stock_threshold || filters.threshold);
        return severity.level === filters.severity;
      });
    }

    return filtered;
  }, [data, filters]);

  return { filters, setFilters, categories, filteredData };
};

const NewLowStockAlerts = memo(function NewLowStockAlerts() {
  const navigate = useNavigate();
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data, loading, error, lastUpdated, refetch } = useAlertsData({ threshold: 10 });
  const { filters, setFilters, categories, filteredData } = useFilters(data);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!data.length) return { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    
    return data.reduce((acc, item) => {
      acc.total += 1;
      const severity = getAlertSeverity(item.stock || 0, item.low_stock_threshold || filters.threshold);
      acc[severity.level] += 1;
      return acc;
    }, { total: 0, critical: 0, high: 0, medium: 0, low: 0 });
  }, [data, filters.threshold]);

  // Chart data for trending
  const chartData = useMemo(() => {
    const severityData = Object.values(ALERT_SEVERITY).map(severity => ({
      name: severity.label,
      value: metrics[severity.level],
      fill: severity.level === 'critical' ? '#EF4444' :
            severity.level === 'high' ? '#F97316' :
            severity.level === 'medium' ? '#EAB308' : '#3B82F6'
    }));

    return severityData.filter(item => item.value > 0);
  }, [metrics]);

  // Event handlers
  const handleQuickAction = useCallback((product, action) => {
    if (action === 'reorder') {
      navigate('/dashboard/purchases');
    } else if (action === 'adjust') {
      navigate(InventoryAdjustmentsRoute);
    } else if (action === 'view') {
      navigate(`${ProductsRoute}/${product.id}`);
    }
  }, [navigate]);

  const handleExportCSV = useCallback(async () => {
    try {
      console.log('📤 [LowStockAlerts] Starting export...');
      
      const exportParams = {
        threshold: filters.threshold,
        search: filters.search || undefined,
        category_id: filters.category || undefined,
        severity: filters.severity || undefined
      };

      let blob;
      try {
        // Try the dedicated export endpoint first
        blob = await exportLowStockAlerts(exportParams);
        console.log('✅ [LowStockAlerts] Export from inventory API successful');
      } catch (inventoryError) {
        console.log('⚠️ [LowStockAlerts] Inventory export failed, trying reports API...', inventoryError.message);
        // Fallback to reports export
        blob = await exportLowStockReport(exportParams);
        console.log('✅ [LowStockAlerts] Export from reports API successful');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `low-stock-alerts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [LowStockAlerts] Export download completed');
    } catch (e) {
      console.error('❌ [LowStockAlerts] Export failed:', e);
      
      // Fallback to client-side CSV generation
      console.log('📊 [LowStockAlerts] Falling back to client-side CSV generation');
      const headers = ['Product', 'Category', 'Current Stock', 'Threshold', 'Severity', 'Days to Stock Out', 'Supplier'];
      const rows = filteredData.map(item => {
        const severity = getAlertSeverity(item.stock || 0, item.low_stock_threshold || filters.threshold);
        const daysToStockOut = item.stock > 0 && item.daily_usage > 0 
          ? Math.ceil(item.stock / item.daily_usage) 
          : 0;
        
        return [
          item.name || '',
          item.category_name || '',
          item.stock || 0,
          item.low_stock_threshold || filters.threshold,
          severity.label,
          daysToStockOut,
          item.supplier_name || ''
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n');

      const fallbackBlob = new Blob([csvContent], { type: 'text/csv' });
      const fallbackUrl = URL.createObjectURL(fallbackBlob);
      const fallbackLink = document.createElement('a');
      fallbackLink.href = fallbackUrl;
      fallbackLink.download = `low-stock-alerts-fallback-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
      URL.revokeObjectURL(fallbackUrl);
      
      console.log('✅ [LowStockAlerts] Fallback CSV export completed');
    }
  }, [filteredData, filters]);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-lg">
            <AlertTriangle className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Low Stock Alerts
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Monitor and manage inventory alerts
              {lastUpdated && (
                <span className="ml-2 text-xs">
                  • Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <InventoryNavTabs />

      {/* Alert Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <InventoryKpiCard
          title="Total Alerts"
          value={metrics.total}
          icon={Bell}
          variant="primary"
          animationDelay={0}
          subtitle="Active alerts"
        />
        <InventoryKpiCard
          title="Critical"
          value={metrics.critical}
          icon={AlertTriangle}
          variant="danger"
          animationDelay={0.1}
          subtitle="No stock left"
        />
        <InventoryKpiCard
          title="High Priority"
          value={metrics.high}
          icon={TrendingDown}
          variant="warning"
          animationDelay={0.2}
          subtitle="Very low stock"
        />
        <InventoryKpiCard
          title="Medium"
          value={metrics.medium}
          icon={Clock}
          variant="info"
          animationDelay={0.3}
          subtitle="Below threshold"
        />
        <InventoryKpiCard
          title="Low Priority"
          value={metrics.low}
          icon={Target}
          variant="success"
          animationDelay={0.4}
          subtitle="Watch closely"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10 pr-4 py-2 w-64 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Severity Filter */}
        <select
          value={filters.severity}
          onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium</option>
          <option value="low">Low Priority</option>
        </select>

        {/* Threshold Adjustment */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Threshold:
          </label>
          <input
            type="number"
            value={filters.threshold}
            onChange={(e) => setFilters(prev => ({ ...prev, threshold: Number(e.target.value) || 10 }))}
            min="1"
            max="100"
            className="w-20 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
          </div>
          <div className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center"
        >
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-medium mb-1">Error loading alerts</h3>
          <p className="text-sm opacity-90">{error}</p>
        </motion.div>
      ) : filteredData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-12 text-center"
        >
          <Zap className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-emerald-900 dark:text-emerald-100 mb-2">
            All good! No alerts found
          </h3>
          <p className="text-emerald-600 dark:text-emerald-400">
            Your inventory levels are healthy. Keep up the good work!
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts Table */}
          <InventoryChartCard
            title={`Active Alerts (${filteredData.length})`}
            subtitle="Products requiring immediate attention"
            icon={AlertTriangle}
            animationDelay={0.5}
            height="h-[500px]"
            loading={loading}
            error={error}
            className="lg:col-span-2"
            actions={
              <button
                onClick={() => setQuickActionOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Bulk Actions
              </button>
            }
          >
            <Suspense fallback={<div className="h-full flex items-center justify-center"><ContentSpinner /></div>}>
              <AlertsTable 
                data={filteredData} 
                threshold={filters.threshold}
                onQuickAction={handleQuickAction}
              />
            </Suspense>
          </InventoryChartCard>

          {/* Alert Distribution Chart */}
          <InventoryChartCard
            title="Alert Distribution"
            subtitle="Breakdown by severity level"
            icon={BarChart3}
            animationDelay={0.6}
            height="h-[500px]"
            loading={loading}
            error={error}
            variant="warning"
          >
            <Suspense fallback={<div className="h-full flex items-center justify-center"><ContentSpinner /></div>}>
              <AlertsChart data={chartData} />
            </Suspense>
          </InventoryChartCard>
        </div>
      )}

      {/* Quick Action Modal */}
      <Suspense fallback={null}>
        {quickActionOpen && (
          <QuickActionModal
            open={quickActionOpen}
            onClose={() => setQuickActionOpen(false)}
            data={filteredData}
            onAction={handleQuickAction}
          />
        )}
      </Suspense>
    </div>
  );
});

export default NewLowStockAlerts;