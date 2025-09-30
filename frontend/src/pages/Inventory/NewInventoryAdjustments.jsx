// src/pages/Inventory/NewInventoryAdjustments.jsx
// High-performance inventory adjustments with lazy-loaded modal
import React, { memo, useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Settings, TrendingUp, TrendingDown, Activity,
  AlertTriangle, Package, Calendar, Filter, Download,
  RefreshCw, Eye, Edit3, Trash2
} from 'lucide-react';
import { postInventoryAdjustment } from '@/api/Inventory';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import InventoryKpiCard from './components/shared/InventoryKpiCard';
import InventoryChartCard from './components/shared/InventoryChartCard';
import InventoryNavTabs from './components/shared/InventoryNavTabs';

// Lazy load heavy components and modal
const AdjustmentFormModal = React.lazy(() => import('./components/modals/AdjustmentFormModal'));
const AdjustmentConfirmationModal = React.lazy(() => import('./components/modals/AdjustmentConfirmationModal'));
const StockMovementsDataTable = React.lazy(() => import('./components/tables/StockMovementsDataTable'));

// Custom toast component for notifications
const Toast = memo(function Toast({ open, type = 'success', message, onClose }) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  const styles = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className={`px-6 py-3 rounded-xl shadow-xl ${styles[type]}`}>
        <div className="flex items-center gap-2">
          {type === 'success' && <TrendingUp className="w-5 h-5" />}
          {type === 'error' && <AlertTriangle className="w-5 h-5" />}
          {type === 'info' && <Activity className="w-5 h-5" />}
          <span className="font-medium">{message}</span>
        </div>
      </div>
    </motion.div>
  );
});

// Custom hook for adjustment data management
const useAdjustmentsData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [tableVersion, setTableVersion] = useState(0);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    // This would fetch adjustments data from API
    // For now, we'll use the table version as a trigger for refresh
  }, []);

  const refreshData = useCallback(() => {
    setTableVersion(v => v + 1);
  }, []);

  return { loading, error, adjustments, kpis, tableVersion, refreshData };
};

// Custom hook for modal state management
const useModalState = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const openForm = useCallback(() => setFormOpen(true), []);
  const closeForm = useCallback(() => setFormOpen(false), []);
  
  const openConfirm = useCallback((data) => {
    setPending(data);
    setFormOpen(false);
    setConfirmOpen(true);
  }, []);
  
  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setPending(null);
  }, []);

  return {
    formOpen,
    confirmOpen,
    pending,
    submitting,
    setSubmitting,
    openForm,
    closeForm,
    openConfirm,
    closeConfirm
  };
};

const NewInventoryAdjustments = memo(function NewInventoryAdjustments() {
  const { loading, error, tableVersion, refreshData } = useAdjustmentsData();
  const {
    formOpen,
    confirmOpen,
    pending,
    submitting,
    setSubmitting,
    openForm,
    closeForm,
    openConfirm,
    closeConfirm
  } = useModalState();

  // Toast state
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  
  const showToast = useCallback((type, message) => {
    setToast({ open: true, type, message });
  }, []);
  
  const hideToast = useCallback(() => {
    setToast(t => ({ ...t, open: false }));
  }, []);

  // Handle form submission
  const handleConfirm = useCallback(async () => {
    try {
      setSubmitting(true);
      await postInventoryAdjustment({
        product_id: Number(pending.product_id),
        new_quantity: Number(pending.new_quantity),
        reason: pending.reason,
        notes: pending.notes || undefined,
      });
      
      closeConfirm();
      refreshData();
      showToast('success', 'Inventory adjusted successfully');
    } catch (e) {
      showToast('error', e?.response?.data?.message || e.message || 'Failed to save adjustment');
    } finally {
      setSubmitting(false);
    }
  }, [pending, closeConfirm, refreshData, showToast]);

  // Mock KPI data - in real app this would come from API
  const mockKpis = useMemo(() => ({
    totalAdjustments: 156,
    positiveAdjustments: 89,
    negativeAdjustments: 67,
    averageAdjustment: 12.5,
    thisMonth: 24,
    valueImpact: 2850.75
  }), []);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Toast Notifications */}
      <AnimatePresence>
        <Toast 
          open={toast.open} 
          type={toast.type} 
          message={toast.message} 
          onClose={hideToast}
        />
      </AnimatePresence>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl shadow-lg">
            <Settings className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Inventory Adjustments
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage and track inventory adjustments
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openForm}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Adjustment</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <InventoryNavTabs className="mb-6" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <InventoryKpiCard
          title="Total Adjustments"
          value={mockKpis.totalAdjustments}
          icon={Settings}
          variant="primary"
          animationDelay={0}
          subtitle="All time"
        />
        <InventoryKpiCard
          title="Positive"
          value={mockKpis.positiveAdjustments}
          icon={TrendingUp}
          variant="success"
          animationDelay={0.1}
          subtitle="Stock increases"
        />
        <InventoryKpiCard
          title="Negative"
          value={mockKpis.negativeAdjustments}
          icon={TrendingDown}
          variant="danger"
          animationDelay={0.2}
          subtitle="Stock decreases"
        />
        <InventoryKpiCard
          title="Avg Adjustment"
          value={mockKpis.averageAdjustment}
          icon={Activity}
          variant="info"
          animationDelay={0.3}
          subtitle="Per transaction"
        />
        <InventoryKpiCard
          title="This Month"
          value={mockKpis.thisMonth}
          icon={Calendar}
          variant="warning"
          animationDelay={0.4}
          subtitle="Recent activity"
        />
        <InventoryKpiCard
          title="Value Impact"
          value={mockKpis.valueImpact}
          format="currency"
          icon={Package}
          variant="purple"
          animationDelay={0.5}
          subtitle="Financial impact"
        />
      </div>

      {/* Stock Movements Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-96 flex items-center justify-center">
            <ContentSpinner />
          </div>
        }>
          <StockMovementsDataTable key={tableVersion} />
        </Suspense>
      </motion.div>

      {/* Lazy-loaded Modals */}
      <Suspense fallback={null}>
        {formOpen && (
          <AdjustmentFormModal 
            open={formOpen} 
            onOpenChange={closeForm} 
            onProceed={openConfirm}
          />
        )}
      </Suspense>
      
      <Suspense fallback={null}>
        {confirmOpen && (
          <AdjustmentConfirmationModal 
            open={confirmOpen} 
            onOpenChange={closeConfirm} 
            data={pending} 
            onConfirm={handleConfirm} 
            loading={submitting}
          />
        )}
      </Suspense>
    </div>
  );
});

export default NewInventoryAdjustments;