// src/pages/Dashboard/useDashboardMetrics.js
// Dedicated data hook to fetch dashboard metrics efficiently.
// - Debounces and cancels in-flight requests using AbortController
// - Simple in-memory cache with TTL to avoid refetching the same params
// - Returns { data, loading, error, refetch }

import { useEffect, useRef, useState, useCallback } from "react";
import { getDashboardMetrics } from "@/api/Dashboard";

// Simple in-memory cache for metrics by key
const cache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

const keyFromParams = (params) => JSON.stringify(params || {});

export const useDashboardMetrics = (params = { range_days: 30, low_stock_threshold: 5 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const paramsKey = keyFromParams(params);

  const fetchData = useCallback(async (ctrlParams = params) => {
    const key = keyFromParams(ctrlParams);

    // Serve fresh cache if available
    const cached = cache.get(key);
    const now = Date.now();
    if (cached && now - cached.time < CACHE_TTL_MS) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return { fromCache: true, data: cached.data };
    }

    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardMetrics(ctrlParams, { signal: controller.signal });
      cache.set(key, { data: res, time: Date.now() });
      setData(res);
      return { fromCache: false, data: res };
    } catch (e) {
      if (e.name === "AbortError") return { aborted: true };
      setError(e?.response?.data?.message || e.message || "Failed to load dashboard");
      return { error: e };
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and refetch when params change
  useEffect(() => {
    fetchData(params);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [paramsKey, fetchData]);

  const refetch = useCallback(() => fetchData(params), [fetchData, paramsKey]);

  return { data, loading, error, refetch };
};
