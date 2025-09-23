// src/pages/Admin/Sales/Sales.jsx
// Full Sales page: animated header, filters, table with expand, server-side pagination
// - Uses useSalesData for data loading with cache&abort
// - Uses usePagination for page/perPage; initial per_page=20
// - CRUD: create, update, delete via API, with functions kept here and components split out
// - Thorough comments for maintainability

import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  BarChart3, 
  Package,
  TrendingUp,
  Sparkles,
  DollarSign,
  Users,
  Calendar,
  Star
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/Toaster/ToastContext";
import { useConfirm } from "@/components/ConfirmContext/ConfirmContext";
import ContentSpinner from "@/components/Spinners/ContentSpinner";
import PaginationControls from "@/components/pagination/PaginationControls";
import usePagination from "@/components/pagination/usePagination";
import { SalesAnalyticsRoute } from "@/router/Index";

import useSalesData from "./useSalesData";
import SalesFilters from "./components/SalesFilters";
import SalesTable from "./components/SalesTable";
import SaleModal from "./components/SaleModal";
import SalesStats from "./components/SalesStats";
import { createSale, deleteSale, updateSale, exportSales } from "@/api/Sales";

export default function Sales() {
  // Local UI state
  const toast = useToast();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const { currentPage, perPage, setPage, setPerPage, generatePages } = usePagination({ initialPage: 1, initialPerPage: 20 });

  // Combine search and filters for API call
  const apiParams = useMemo(() => ({
    page: currentPage,
    per_page: perPage,
    search,
    ...filters
  }), [currentPage, perPage, search, filters]);

  // Data fetching with caching (TTL 30s) and server pagination
  const { data: rows, meta, loading, error, refetch } = useSalesData(apiParams);

  // Derived, stable utilities
  const pageList = useMemo(() => generatePages(meta?.last_page || 1), [generatePages, meta?.last_page]);
  const formatCurrency = useCallback((n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0)), []);
  const formatDate = useCallback((iso) => new Date(iso).toLocaleString(), []);

  // CRUD handlers (functions kept in page for cohesion; UI split in components)
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = useCallback(() => { 
    setEditing(null); 
    setModalOpen(true); 
  }, []);
  
  const openEdit = useCallback((sale) => { 
    setEditing(sale); 
    setModalOpen(true); 
  }, []);
  
  const closeModal = useCallback(() => { 
    setModalOpen(false); 
    setEditing(null); 
  }, []);

  const handleCreateOrUpdate = useCallback(async (payload) => {
    try {
      if (editing) {
        await updateSale(editing.id, payload);
        toast.success("Sale updated successfully");
      } else {
        await createSale(payload);
        toast.success("Sale created successfully");
      }
      closeModal();
      // Refresh current page; backend caches are bumped by server
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Operation failed");
    }
  }, [editing, closeModal, refetch, toast]);

  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = useCallback(async (sale) => {
    const ok = await confirm({
      type: "warning",
      title: "Delete sale?",
      description: (
        <div className="space-y-2">
          <p>
            This will remove sale <strong>#{sale.id}</strong> and
            restore stock for its items.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-amber-600 mr-2" />
              <span className="text-sm text-amber-800">
                Stock will be restored for{" "}
                {sale.items?.length || 0} product(s)
              </span>
            </div>
          </div>
        </div>
      ),
      confirmText: "Yes, delete",
      cancelText: "Cancel",
    });
    if (!ok) return;
    
    setDeletingId(sale.id);
    try {
      await deleteSale(sale.id);
      
      // If current page becomes empty after deletion, go back a page gracefully
      if (rows.length === 1 && currentPage > 1) {
        setPage(currentPage - 1, meta.last_page);
      }
      
      // Force refresh by bypassing cache
      await refetch();
      
      toast.success("Sale deleted successfully! 🗑️");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }, [confirm, toast, rows.length, currentPage, setPage, meta.last_page, refetch]);

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
      await exportSales({
        search,
        ...filters,
        format: "csv",
      });
      toast.success("Export completed! 📊");
    } catch (e) {
      const errorMessage =
        e?.response?.data?.message || e.message || "Export failed";
      toast.error(errorMessage);
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

  const handlePageChange = useCallback((p) => setPage(p, meta.last_page), [setPage, meta.last_page]);
  
  const handlePerPageChange = useCallback((v) => setPerPage(v), [setPerPage]);

  // Loading & error states with beautiful animations
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-40 animate-pulse"></div>
        </div>
        <ContentSpinner message="Loading sales..." fullWidth size="large" />
      </div>
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
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              ❌
            </motion.div>
            <span className="ml-2 font-medium">{error}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header with beautiful gradient */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mr-4 shadow-lg">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Sales
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
              Manage customer sales and transactions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={SalesAnalyticsRoute}
            className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <BarChart3 className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            Analytics
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div>
        <SalesStats sales={rows} meta={meta} />
      </div>

      {/* Filters */}
      <div>
        <SalesFilters 
          onSearch={handleSearch}
          onNewSale={openCreate}
          onFiltersChange={handleFiltersChange}
          onExport={handleExport}
          isExporting={isExporting}
        />
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-600/50 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/80 dark:to-gray-600/80 p-6 border-b border-gray-200/50 dark:border-gray-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Sales Records</h3>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {meta?.total || 0} total sales
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800">
          <SalesTable 
            rows={rows} 
            onEdit={openEdit} 
            onDelete={handleDelete} 
            formatCurrency={formatCurrency} 
            formatDate={formatDate}
            onSort={handleSort}
            sortBy={filters.sortBy || 'sale_date'}
            sortOrder={filters.sortOrder || 'desc'}
            deletingId={deletingId}
          />
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={meta.last_page}
            onPageChange={handlePageChange}
            perPage={perPage}
            onPerPageChange={handlePerPageChange}
            from={meta.from}
            to={meta.to}
            total={meta.total}
            pages={pageList}
            perPageOptions={[10, 20, 30, 50]}
          />
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <SaleModal 
          open={modalOpen} 
          onClose={closeModal} 
          onSubmit={handleCreateOrUpdate} 
          initial={editing} 
        />
      )}
    </div>
  );
}
