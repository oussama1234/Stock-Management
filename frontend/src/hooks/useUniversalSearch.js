// src/hooks/useUniversalSearch.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { searchAll } from '@/api/Search';

export function useUniversalSearch({ initialTerm = '', perPage = 5, debounceMs = 350 } = {}) {
  const [term, setTerm] = useState(initialTerm);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const lastKeyRef = useRef('');

  const clear = useCallback(() => { setResults(null); setError(null); }, []);

  const fetchSuggestions = useCallback(async (q) => {
    const key = JSON.stringify({ q, perPage });
    lastKeyRef.current = key;
    try {
      setLoading(true); setError(null);
      if (!q || q.trim().length < 2) { setResults(null); return; }
      const data = await searchAll({ q: q.trim(), per_page: perPage });
      if (lastKeyRef.current !== key) return; // ignore stale
      setResults(data?.results || null);
    } catch (e) {
      if (lastKeyRef.current === key) setError(e?.response?.data?.message || e.message);
    } finally {
      if (lastKeyRef.current === key) setLoading(false);
    }
  }, [perPage]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(term), debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [term, fetchSuggestions, debounceMs]);

  return {
    term,
    setTerm,
    results,
    loading,
    error,
    clear,
    refetch: fetchSuggestions,
  };
}
