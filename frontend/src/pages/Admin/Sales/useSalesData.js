// src/pages/Admin/Sales/useSalesData.js
// Data hook for sales list with in-memory cache & TTL, server pagination and search.
// - Uses getSales() API to fetch paginated data
// - In-memory cache keyed by params to avoid redundant requests
// - Abort in-flight requests when params change

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getSales } from "@/api/Sales";

const CACHE_TTL_MS = 30 * 1000; // 30s
const salesCache = new Map();
const key = (p) => JSON.stringify(p || {});

export default function useSalesData(params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  
  // Ensure params has default values
  const normalizedParams = {
    page: 1,
    per_page: 20,
    search: '',
    sortBy: 'updated_at',
    sortOrder: 'desc',
    ...params
  };
  
  const cacheKey = key(normalizedParams);

  const invalidateCache = useCallback(() => {
    salesCache.clear();
  }, []);

  const fetchData = useCallback(async (p = params, forceRefresh = false) => {
    const k = key(p);
    const cached = salesCache.get(k);
    const now = Date.now();
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && cached && now - cached.time < CACHE_TTL_MS) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return { fromCache: true, data: cached.data };
    }

    // Abort previous request if still running
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      setLoading(true);
      setError(null);
      
      const res = await getSales(p, { signal: ctrl.signal });
      
      // Only update state if request wasn't aborted
      if (!ctrl.signal.aborted) {
        salesCache.set(k, { data: res, time: Date.now() });
        setData(res);
      }
      
      return { data: res };
    } catch (e) {
      if (e.name === "AbortError" || ctrl.signal.aborted) {
        return { aborted: true };
      }
      
      if (!ctrl.signal.aborted) {
        setError(e?.response?.data?.message || e.message || "Failed to load sales");
      }
      return { error: e };
    } finally {
      if (!ctrl.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData(normalizedParams);
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [cacheKey]);

  const items = useMemo(() => data?.data || [], [data]);
  const meta = useMemo(() => ({
    total: data?.total || 0,
    per_page: data?.per_page || normalizedParams.per_page,
    current_page: data?.current_page || normalizedParams.page,
    last_page: data?.last_page || 1,
    from: data?.from,
    to: data?.to,
  }), [data, normalizedParams.per_page, normalizedParams.page]);

  return { 
    data: items, 
    meta, 
    loading, 
    error, 
    refetch: () => fetchData(normalizedParams, true), // Force refresh on manual refetch
    invalidateCache
  };
}
