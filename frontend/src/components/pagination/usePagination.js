// src/components/pagination/usePagination.js
// Shared pagination state and helpers for server-side and client-side lists.
// - Centralizes current page and per-page size
// - Generates visible page numbers with windowing
// - Defensive clamping when changing pages or per-page
//
// Usage (server-side):
//   const { currentPage, perPage, setPage, setPerPage, generatePages } = usePagination({ initialPage: 1, initialPerPage: 9 });
//   // call generatePages(meta.lastPage)
//
// Usage (client-side):
//   const totalPages = Math.max(1, Math.ceil(items.length / perPage));
//   const pages = generatePages(totalPages);
//   const slice = items.slice((currentPage-1)*perPage, currentPage*perPage)

import { useCallback, useState } from "react";

/**
 * usePagination
 * @param {Object} opts
 * @param {number} opts.initialPage - default page
 * @param {number} opts.initialPerPage - default page size
 * @param {number} [opts.maxVisible=5] - number of visible page buttons
 */
export default function usePagination({ initialPage = 1, initialPerPage = 9, maxVisible = 5 } = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage, setPerPageState] = useState(initialPerPage);

  // Clamp a value to [min, max]
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const setPage = useCallback((page, totalPages = Infinity) => {
    const safeMax = Number.isFinite(totalPages) ? totalPages : Infinity;
    setCurrentPage((prev) => clamp(page, 1, safeMax));
  }, []);

  const setPerPage = useCallback((size) => {
    const parsed = Number(size) || initialPerPage;
    setPerPageState(parsed);
    // Reset to first page when per-page changes to avoid empty pages
    setCurrentPage(1);
  }, [initialPerPage]);

  const generatePages = useCallback((totalPages = 1) => {
    const pages = [];
    const half = Math.floor(maxVisible / 2);
    const start = Math.max(1, (currentPage - half));
    let end = Math.min(totalPages, start + maxVisible - 1);
    const correctedStart = Math.max(1, end - maxVisible + 1);

    for (let i = correctedStart; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, maxVisible]);

  return { currentPage, perPage, setPage, setPerPage, generatePages };
}
