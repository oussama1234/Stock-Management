// src/components/pagination/PaginationControls.jsx
// Shared, accessible pagination controls with per-page selector.
// Designed to match the look & feel from Products.jsx and to be reused on Users.

import { motion } from "framer-motion";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

/**
 * PaginationControls Component
 *
 * Props:
 * - currentPage: number
 * - totalPages: number
 * - onPageChange: (page:number) => void
 * - perPage: number
 * - onPerPageChange: (size:number) => void
 * - from: number | undefined (display only)
 * - to: number | undefined (display only)
 * - total: number | undefined (display only)
 * - perPageOptions?: number[] (default [6,9,12,15])
 */
export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  perPage,
  onPerPageChange,
  from,
  to,
  total,
  perPageOptions = [6, 9, 12, 15],
  pages = [], // optional precomputed pages list
}) {
  const disabledPrev = currentPage <= 1;
  const disabledNext = currentPage >= totalPages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4"
    >
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Items per page:</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(parseInt(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {perPageOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {typeof from !== "undefined" && typeof to !== "undefined" && typeof total !== "undefined" && (
        <div className="text-sm text-gray-600">
          Showing {from} to {to} of {total} results
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* First Page Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(1)}
          disabled={disabledPrev}
          className={`p-2 rounded-lg ${
            disabledPrev ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          }`}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </motion.button>

        {/* Previous Page Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabledPrev}
          className={`p-2 rounded-lg ${
            disabledPrev ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((page, idx) => {
            const isEllipsis = typeof page !== 'number' || Number.isNaN(page);
            if (isEllipsis) {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium text-gray-400 bg-gray-50 cursor-default select-none"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }
            return (
              <motion.button
                key={`page-${page}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentPage === page ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md" : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </motion.button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabledNext}
          className={`p-2 rounded-lg ${
            disabledNext ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </motion.button>

        {/* Last Page Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(totalPages)}
          disabled={disabledNext}
          className={`p-2 rounded-lg ${
            disabledNext ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          }`}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
