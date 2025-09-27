// src/pages/Admin/Purchases/PurchasesTestHooks.jsx
// Test version that adds the hooks and state management from the original

import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  BarChart3, 
  Plus, 
  Download, 
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  Package,
  Users
} from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/Toaster/ToastContext";
import { useConfirm } from "@/components/ConfirmContext/ConfirmContext";
import usePagination from "@/components/pagination/usePagination";

import usePurchasesData from "./usePurchasesData";
import PurchasesFilters from "./components/PurchasesFilters";
import PurchasesStats from "./components/PurchasesStats";
import PurchasesTable from "./components/PurchasesTable";
import PurchaseModal from "./components/PurchaseModal";
import ContentSpinner from "@/components/Spinners/ContentSpinner";
import PaginationControls from "@/components/pagination/PaginationControls";
import { 
  createPurchase, 
  deletePurchase, 
  updatePurchase, 
  exportPurchases 
} from "@/api/Purchases";

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

export default function PurchasesTestHooks() {

  // Local UI state
  const toast = useToast();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  
  const { currentPage, perPage, setPage, setPerPage, generatePages } = usePagination({ 
    initialPage: 1, 
    initialPerPage: 20 
  });

  // Combine search and filters for API call
  const apiParams = useMemo(() => ({
    page: currentPage,
    per_page: perPage,
    search,
    ...filters
  }), [currentPage, perPage, search, filters]);

  // Data fetching with caching (TTL 30s) and server pagination
  const { data: purchases, meta, loading, error, refetch } = usePurchasesData(apiParams);

  // Derived, stable utilities
  const pageList = useMemo(() => generatePages(meta?.last_page || 1), [generatePages, meta?.last_page]);
  const formatCurrency = useCallback((n) => 
    new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD" 
    }).format(Number(n || 0)), []
  );
  const formatDate = useCallback((iso) => 
    new Date(iso).toLocaleString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }), []
  );

  // CRUD handlers with dynamic state updates (no page reload needed)
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((purchase) => {
    setEditing(purchase);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
  }, []);

  /**
   * Handle create or update purchase with dynamic state updates
   */
  const handleCreateOrUpdate = useCallback(async (payload) => {
    try {
      let result;
      if (editing) {
        result = await updatePurchase(editing.id, payload);
        toast.success("Purchase updated successfully! 🎉", {
          icon: "✅",
          duration: 3000
        });
      } else {
        result = await createPurchase(payload);
        toast.success("Purchase created successfully! 🎉", {
          icon: "✅",
          duration: 3000
        });
      }
      
      closeModal();
      refetch();
      
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e.message || "Operation failed";
      toast.error(errorMessage, {
        icon: "❌",
        duration: 5000
      });
    }
  }, [editing, closeModal, refetch, toast]);

  /**
   * Handle delete purchase with confirmation and dynamic state updates
   */
  const handleDelete = useCallback(async (purchase) => {
    const ok = await confirm({
      type: "warning",
      title: "Delete purchase?",
      description: (
        <div className="space-y-2">
          <p>This will remove purchase <strong>#{purchase.id}</strong> and reduce stock for its items.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-amber-600 mr-2" />
              <span className="text-sm text-amber-800">
                Stock will be reduced for {purchase.purchase_items?.length || 0} product(s)
              </span>
            </div>
          </div>
        </div>
      ),
      confirmText: "Yes, delete",
      cancelText: "Cancel",
    });
    
    if (!ok) return;
    
    try {
      await deletePurchase(purchase.id);
      toast.success("Purchase deleted successfully! 🗑️", {
        icon: "✅",
        duration: 3000
      });
      
      // If current page becomes empty after deletion, go back a page gracefully
      if (purchases.length === 1 && currentPage > 1) {
        setPage(currentPage - 1, meta.last_page);
      }
      
      refetch();
      
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e.message || "Delete failed";
      toast.error(errorMessage, {
        icon: "❌",
        duration: 5000
      });
    }
  }, [confirm, toast, purchases.length, currentPage, setPage, meta.last_page, refetch]);

  /**
   * Handle sorting with smooth transitions
   */
  const handleSort = useCallback((column, order) => {
    const newFilters = {
      ...filters,
      sortBy: column,
      sortOrder: order
    };
    setFilters(newFilters);
    setPage(1, meta.last_page);
  }, [filters, setFilters, setPage, meta.last_page]);

  /**
   * Handle CSV export with loading state
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportPurchases({
        search,
        ...filters,
        format: 'csv'
      });
      toast.success("Export completed! 📊", {
        icon: "✅",
        duration: 3000
      });
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e.message || "Export failed";
      toast.error(errorMessage, {
        icon: "❌",
        duration: 5000
      });
    } finally {
      setIsExporting(false);
    }
  }, [search, filters, toast]);

  // Stable callbacks for props
  const handleSearch = useCallback((v) => {
    setSearch(v);
    setPage(1, meta.last_page);
  }, [setSearch, setPage, meta.last_page]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1, meta.last_page);
  }, [setFilters, setPage, meta.last_page]);

  // Loading & error states
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto p-6"
      >
        <div className="text-center">Loading purchases...</div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-7xl mx-auto p-6"
      >
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 text-rose-700 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center">
            ❌ <span className="ml-2 font-medium">{error}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto p-6 space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl mr-4 shadow-lg">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Purchases (Test Hooks)
            </h1>
            <p className="text-gray-600 mt-1 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-emerald-500" />
              Testing with all hooks and handlers
            </p>
          </div>
        </div>

        <motion.div
          variants={itemVariants}
          className="flex items-center space-x-3"
        >
          <Link
            to="/dashboard/purchases/analytics"
            className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <BarChart3 className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            Analytics
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats cards */}
      <motion.div variants={itemVariants}>
        <PurchasesStats purchases={purchases} meta={meta} />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <PurchasesFilters
          onSearch={handleSearch}
          onNewPurchase={openCreate}
          onFiltersChange={handleFiltersChange}
          onExport={handleExport}
          isExporting={isExporting}
        />
      </motion.div>

      {/* Table */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-emerald-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Purchase Records</h3>
            </div>
            <div className="text-sm text-gray-500">
              {meta?.total || 0} total purchases
            </div>
          </div>
        </div>

        <div className="p-6">
          <PurchasesTable
            rows={purchases}
            onEdit={openEdit}
            onDelete={handleDelete}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onSort={handleSort}
            sortBy={filters.sortBy || 'purchase_date'}
            sortOrder={filters.sortOrder || 'desc'}
          />
        </div>
      </motion.div>

      {/* Pagination with smooth animations */}
      <AnimatePresence>
        {meta && meta.last_page > 1 && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <PaginationControls
              currentPage={currentPage}
              totalPages={meta.last_page}
              onPageChange={(p) => setPage(p, meta.last_page)}
              perPage={perPage}
              onPerPageChange={setPerPage}
              from={meta.from}
              to={meta.to}
              total={meta.total}
              pages={pageList}
              perPageOptions={[10, 20, 30, 50]}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal with beautiful entrance animations */}
      <AnimatePresence>
        {modalOpen && (
          <PurchaseModal
            open={modalOpen}
            onClose={closeModal}
            onSubmit={handleCreateOrUpdate}
            initial={editing}
          />
        )}
      </AnimatePresence>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Testing Status</h3>
        <p className="text-blue-700">
          ✅ All components rendering with hooks and handlers. 
          Modal state: {modalOpen ? 'Open' : 'Closed'}. 
          Editing: {editing ? `Purchase #${editing.id}` : 'None'}
        </p>
        <button 
          onClick={openCreate}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Test Open Modal
        </button>
      </div>
    </motion.div>
  );
}
