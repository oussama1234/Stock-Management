import { useCallback, useMemo, useState } from "react";

/**
 * useTabPagination
 * Lightweight pagination state manager for tab content.
 * - Keeps stable handlers with useCallback
 * - Minimizes re-renders by memoizing derived values
 */
export default function useTabPagination(initial = { page: 1, perPage: 10 }) {
  const [page, setPage] = useState(initial.page || 1);
  const [perPage, setPerPage] = useState(initial.perPage || 10);

  const setPageSafe = useCallback((p) => {
    setPage((prev) => (p && p > 0 ? p : prev));
  }, []);

  const setPerPageSafe = useCallback((pp) => {
    setPerPage((prev) => {
      const next = Number(pp) || prev;
      return next > 0 ? next : prev;
    });
    setPage(1); // reset to first page when page size changes
  }, []);

  const params = useMemo(() => ({ page, perPage }), [page, perPage]);

  return { page, perPage, setPage: setPageSafe, setPerPage: setPerPageSafe, params };
}
