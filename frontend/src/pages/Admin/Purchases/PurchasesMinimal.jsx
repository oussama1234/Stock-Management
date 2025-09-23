// src/pages/Admin/Purchases/PurchasesMinimal.jsx
// Minimal version of original with just basic HTML to test rendering

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/Toaster/ToastContext";
import { useConfirm } from "@/components/ConfirmContext/ConfirmContext";
import usePagination from "@/components/pagination/usePagination";

import usePurchasesData from "./usePurchasesData";

// Import the child components for testing
import PurchasesStats from "./components/PurchasesStats";
import PurchasesFilters from "./components/PurchasesFilters";
import PurchasesTable from "./components/PurchasesTable";

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

export default function PurchasesMinimal() {
  console.log("🎯 PurchasesMinimal component rendering");
  
  // Local UI state
  const toast = useToast();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [testStep, setTestStep] = useState(0); // 0=basic, 1=+stats, 2=+filters, 3=+table
  
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
  
  console.log("🔍 PurchasesMinimal data:", { 
    purchasesCount: purchases?.length, 
    loading, 
    error,
    meta: meta ? { current_page: meta.current_page, total: meta.total } : null
  });

  // Loading & error states
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">Loading purchases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  console.log("📝 PurchasesMinimal about to render main content:", {
    hasData: !!purchases,
    dataLength: purchases?.length,
    hasMeta: !!meta,
    loading,
    error
  });

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              Purchases (Minimal Test)
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Basic test version - Data count: {purchases?.length || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard/purchases/analytics"
            className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl transition-all duration-300 flex items-center shadow-lg"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics
          </Link>
        </div>
      </motion.div>

      {/* Test Controls */}
      <motion.div variants={itemVariants}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-semibold text-yellow-800 mb-3">Component Testing</h2>
          <p className="text-yellow-700 text-sm mb-3">Click buttons to test each component:</p>
          <div className="flex gap-2 mb-3">
            {[0, 1, 2, 3].map(step => (
              <button
                key={step}
                onClick={() => setTestStep(step)}
                className={`px-3 py-1 rounded text-sm ${
                  testStep === step 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                }`}
              >
                {['Basic', '+ Stats', '+ Filters', '+ Table'][step]}
              </button>
            ))}
          </div>
          <p className="text-xs text-yellow-600">
            Current: {['Basic only', 'Basic + PurchasesStats', 'Basic + Stats + PurchasesFilters', 'Basic + Stats + Filters + PurchasesTable'][testStep]}
          </p>
        </div>
      </motion.div>

      {/* Step 1: Add PurchasesStats */}
      {testStep >= 1 && (
        <motion.div variants={itemVariants}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-blue-700 text-sm">Testing: PurchasesStats component</p>
          </div>
          <PurchasesStats purchases={purchases} meta={meta} />
        </motion.div>
      )}

      {/* Step 2: Add PurchasesFilters */}
      {testStep >= 2 && (
        <motion.div variants={itemVariants}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-blue-700 text-sm">Testing: PurchasesFilters component</p>
          </div>
          <PurchasesFilters
            onSearch={(v) => console.log('Search:', v)}
            onNewPurchase={() => console.log('New Purchase')}
            onFiltersChange={(f) => console.log('Filters:', f)}
            onExport={() => console.log('Export')}
            isExporting={false}
          />
        </motion.div>
      )}

      {/* Step 3: Add PurchasesTable */}
      {testStep >= 3 && (
        <motion.div variants={itemVariants}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-blue-700 text-sm">Testing: PurchasesTable component</p>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <PurchasesTable
                rows={purchases}
                onEdit={(p) => console.log('Edit:', p)}
                onDelete={(p) => console.log('Delete:', p)}
                formatCurrency={(n) => `$${Number(n || 0).toFixed(2)}`}
                formatDate={(iso) => new Date(iso).toLocaleDateString()}
                onSort={(col, order) => console.log('Sort:', col, order)}
                sortBy="purchase_date"
                sortOrder="desc"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Simple Table */}
      <motion.div variants={itemVariants}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Purchase Records</h3>
            <p className="text-sm text-gray-600">{meta?.total || 0} total purchases</p>
          </div>
          
          <div className="p-6">
            {purchases && purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">ID</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Supplier</th>
                      <th className="text-left py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.slice(0, 10).map((purchase) => (
                      <tr key={purchase.id} className="border-b">
                        <td className="py-2">{purchase.id}</td>
                        <td className="py-2">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                        <td className="py-2">{purchase.supplier?.name || 'N/A'}</td>
                        <td className="py-2">${purchase.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No purchases found
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Debug Info */}
      <motion.div variants={itemVariants}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Info</h3>
          <pre className="text-xs text-yellow-700 overflow-auto">
            {JSON.stringify({
              purchases: purchases ? `Array(${purchases.length})` : 'null',
              meta,
              loading,
              error,
              apiParams
            }, null, 2)}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
}