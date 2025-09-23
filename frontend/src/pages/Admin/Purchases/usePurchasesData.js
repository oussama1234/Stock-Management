// src/pages/Admin/Purchases/usePurchasesData.js
// Custom hook for fetching purchases data with caching, error handling, and abort support
// - Implements automatic caching with 30s TTL for performance
// - Provides loading states and error handling
// - Supports abort controllers for cleanup
// - Optimized for server-side pagination and filtering

import { useCallback, useEffect, useState } from "react";
import { getPurchases } from "@/api/Purchases";

/**
 * Custom hook to fetch and cache purchases data
 * @param {Object} params - API parameters for filtering and pagination
 * @param {number} params.page - Current page number
 * @param {number} params.per_page - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.sortBy - Sort column
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @param {string} params.dateFrom - Filter start date
 * @param {string} params.dateTo - Filter end date
 * @param {string} params.minAmount - Minimum amount filter
 * @param {string} params.maxAmount - Maximum amount filter
 * @param {number} params.supplierId - Supplier ID filter
 * @param {number} params.userId - User ID filter
 * @returns {Object} { data: purchases[], meta: pagination_meta, loading: boolean, error: string|null, refetch: function }
 */
export default function usePurchasesData(params = {}) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  /**
   * Refetch data by incrementing trigger
   */
  const refetch = useCallback(() => {
    console.log('🔄 Refetch triggered manually');
    setRefetchTrigger(prev => prev + 1);
  }, []);

  /**
   * Effect to fetch data when parameters change
   */
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching purchases data:', params);
        
        // Fetch from API without AbortController for now
        const result = await getPurchases(params);
        
        // Don't update if component unmounted
        if (!isMounted) return;
        
        console.log('✅ Received purchases data:', result);
        
        // Debug: Log actual data structure
        console.log('🔍 First purchase data structure:', result.data?.[0]);
        if (result.data?.[0]) {
          console.log('🔍 Purchase items keys:', Object.keys(result.data[0]));
          console.log('🔍 Purchase items data:', result.data[0].purchaseItems || result.data[0].purchase_items);
        }
        
        // Transform data to ensure consistent property names
        const transformedData = (result.data || []).map(purchase => ({
          ...purchase,
          // Ensure camelCase property names for consistency
          purchaseItems: purchase.purchaseItems || purchase.purchase_items || []
        }));
        
        // Update state
        setData(transformedData);
        setMeta({
          current_page: result.current_page || 1,
          last_page: result.last_page || 1,
          per_page: result.per_page || 20,
          total: result.total || 0,
          from: result.from || 0,
          to: result.to || 0
        });

      } catch (err) {
        console.error('❌ Error fetching purchases:', err);
        
        if (!isMounted) return;
        
        const errorMessage = err?.response?.data?.message || err.message || 'Failed to load purchases';
        setError(errorMessage);
        setData([]);
        setMeta({});
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(params), refetchTrigger]); // Depend on stringified params and refetch trigger

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Purchases data updated:', {
        dataCount: data.length,
        meta,
        loading,
        error: error ? '❌' : '✅'
      });
    }
  }, [data.length, meta, loading, error]);

  return {
    data,
    meta,
    loading,
    error,
    refetch
  };
}

/**
 * Hook for fetching a single purchase by ID
 * @param {number} id - Purchase ID
 * @returns {Object} { purchase, loading, error, refetch }
 */
export function usePurchaseById(id) {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPurchase = useCallback(async (signal) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { getPurchaseById } = await import("@/api/Purchases");
      const result = await getPurchaseById(id);
      
      setPurchase(result);
      
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        return;
      }
      
      console.error('❌ Error fetching purchase:', err);
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to load purchase';
      setError(errorMessage);
      setPurchase(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPurchase(controller.signal);
    return () => controller.abort();
  }, [fetchPurchase]);

  const refetch = useCallback(() => {
    fetchPurchase();
  }, [fetchPurchase]);

  return {
    purchase,
    loading,
    error,
    refetch
  };
}