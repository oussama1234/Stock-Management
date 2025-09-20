// src/pages/Admin/Sales/Sales.jsx
// Full Sales page: animated header, filters, table with expand, server-side pagination
// - Uses useSalesData for data loading with cache&abort
// - Uses usePagination for page/perPage; initial per_page=20
// - CRUD: create, update, delete via API, with functions kept here and components split out
// - Thorough comments for maintainability

import { motion } from "framer-motion";
import { ShoppingCart, BarChart3 } from "lucide-react";
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
import { createSale, deleteSale, updateSale } from "@/api/Sales";

export default function Sales() {
  // Local UI state
  const toast = useToast();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
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

  const handleDelete = useCallback(async (sale) => {
    const ok = await confirm({
      type: "warning",
      title: "Delete sale?",
      description: `This will remove sale #${sale.id} and restore stock for its items.`,
      confirmText: "Yes, delete",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      await deleteSale(sale.id);
      toast.success("Sale deleted");
      // If current page becomes empty after deletion, go back a page gracefully
      if (rows.length === 1 && currentPage > 1) setPage(currentPage - 1, meta.last_page);
      refetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Delete failed");
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

  // Loading & error states
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div className="h-12 bg-gray-200 rounded-xl w-40 animate-pulse"></div>
        </div>
        <ContentSpinner message="Loading sales..." fullWidth size="large" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl mr-4">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sales</h1>
            <p className="text-gray-600">Manage customer sales and line items</p>
          </div>
        </div>
        
        <Link
          to={SalesAnalyticsRoute}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-300 flex items-center"
        >
          <BarChart3 className="h-5 w-5 mr-2" />
          View Analytics
        </Link>
      </motion.div>

      {/* Filters */}
      <SalesFilters 
        onSearch={handleSearch}
        onNewSale={openCreate}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-4">
        <SalesTable 
          rows={rows} 
          onEdit={openEdit} 
          onDelete={handleDelete} 
          formatCurrency={formatCurrency} 
          formatDate={formatDate}
          onSort={handleSort}
          sortBy={filters.sortBy || 'sale_date'}
          sortOrder={filters.sortOrder || 'desc'}
        />
      </motion.div>

      {/* Pagination */}
      {meta.last_page > 1 && (
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
      )}

      {/* Modal */}
      <SaleModal open={modalOpen} onClose={closeModal} onSubmit={handleCreateOrUpdate} initial={editing} />
    </div>
  );
}
