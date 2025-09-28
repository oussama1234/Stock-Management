// src/pages/Inventory/InventoryListPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getInventoryOverview } from '@/api/Inventory';
import { ProductsRoute } from '@/router/Index';
import StatusBadge from '@/pages/Inventory/List/StatusBadge';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import InventoryTabs from '@/pages/Inventory/components/InventoryTabs';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpNarrowWide, ArrowDownWideNarrow, Package, MoreHorizontal, Loader2 } from 'lucide-react';
import ExportButton from '@/pages/Admin/Products/components/ExportButton';
import { useInventoryExport } from '@/pages/Inventory/hooks/useInventoryExport';

const formatNum = (n) => new Intl.NumberFormat().format(Number(n||0));

export default function InventoryListPage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [params, setParams] = useState({ page: 1, per_page: 20, search: '', stock_status: '', sort_by: 'name', sort_order: 'asc', category_id: null });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerShadow, setHeaderShadow] = useState(false);
  const inFlightRef = useRef(false);
  const lastKeyRef = useRef('');
  const hasLoadedRef = useRef(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(params.search), 300);
    return () => clearTimeout(t);
  }, [params.search]);

  const effectiveParams = useMemo(() => ({ ...params, search: debouncedSearch }), [params, debouncedSearch]);

  const fetchList = useCallback(async () => {
    const key = JSON.stringify(effectiveParams);

    // Deduplicate identical in-flight requests
    if (inFlightRef.current && lastKeyRef.current === key) return;

    // Mark current request key
    lastKeyRef.current = key;

    try {
      setError(null);
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      inFlightRef.current = true;

      const res = await getInventoryOverview(effectiveParams);
      // Ignore stale responses
      if (lastKeyRef.current !== key) return;
      setData(res);
      hasLoadedRef.current = true;
    } catch (e) {
      if (lastKeyRef.current !== key) return;
      setError(e?.response?.data?.message || e.message);
    } finally {
      if (lastKeyRef.current === key) {
        inFlightRef.current = false;
        setLoading(false);
      }
    }
  }, [effectiveParams]);

  useEffect(() => { fetchList(); return () => {}; }, [fetchList]);

  const items = data?.data || [];
  const meta = data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: params.per_page };
  const isRefreshing = loading && hasLoadedRef.current;

  const { exportInventory, isExporting } = useInventoryExport();

  const handleExportAll = useCallback(async () => {
    try {
      const perPage = 100; // service caps per_page at 100
      let page = 1;
      let all = [];
      for (;;) {
        const res = await getInventoryOverview({ ...effectiveParams, page, per_page: perPage });
        const data = Array.isArray(res?.data) ? res.data : [];
        all = all.concat(data);
        const metaR = res?.meta || { current_page: page, last_page: page };
        if (!metaR || metaR.current_page >= metaR.last_page) break;
        page = metaR.current_page + 1;
      }
      await exportInventory(all, 'inventory-list.xlsx');
    } catch (e) {
      console.error('Export inventory failed', e);
    }
  }, [effectiveParams, exportInventory]);

  // Sticky header shadow on scroll
  const onScroll = (e) => {
    const top = e.currentTarget.scrollTop;
    setHeaderShadow(top > 0);
  };

  // Unique categories from current page (fallback in absence of categories API)
  const categories = useMemo(() => {
    const set = new Map();
    for (const p of items) {
      const id = p.category_id ?? p.category?.id;
      const name = p.category_name ?? p.category?.name;
      if (id != null && name) set.set(id, name);
    }
    return Array.from(set, ([id, name]) => ({ id, name }));
  }, [items]);

  // Sorting handlers
  const toggleSort = (by) => {
    setParams((p) => ({ ...p, sort_by: by, sort_order: p.sort_by === by ? (p.sort_order === 'asc' ? 'desc' : 'asc') : 'asc', page: 1 }));
  };

  // Pagination helpers
  const pages = useMemo(() => {
    const current = meta.current_page || 1;
    const last = meta.last_page || 1;
    const max = 9;
    if (last <= max) return Array.from({ length: last }, (_, i) => i + 1);
    const result = [1];
    let start = Math.max(2, current - 2);
    let end = Math.min(last - 1, current + 2);
    const need = max - 2;
    while ((end - start + 1) < need) {
      if (start > 2) start -= 1; else if (end < last - 1) end += 1; else break;
    }
    if (start > 2) result.push('...');
    for (let i = start; i <= end; i++) result.push(i);
    if (end < last - 1) result.push('...');
    result.push(last);
    return result;
  }, [meta.current_page, meta.last_page]);

  const gotoPage = (page) => setParams((p) => ({ ...p, page }));

  // Skeleton rows
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
      </td>
      <td className="p-3 text-right"><div className="h-4 w-12 bg-gray-200 rounded ml-auto" /></td>
      <td className="p-3 text-right"><div className="h-4 w-12 bg-gray-200 rounded ml-auto" /></td>
      <td className="p-3 text-right"><div className="h-4 w-12 bg-gray-200 rounded ml-auto" /></td>
      <td className="p-3"><div className="h-6 w-20 bg-gray-200 rounded" /></td>
    </tr>
  );

  return (
    <div className="p-4 space-y-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl">
      {/* Header with search and filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Inventory</h1>
          <div className="mt-2">
            <InventoryTabs />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" />
            <input
              className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              placeholder="Search products..."
              value={params.search}
              onChange={(e)=> setParams(p=>({ ...p, search: e.target.value, page: 1 }))}
              aria-label="Search"
            />
          </div>
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            value={params.stock_status}
            onChange={(e)=> setParams(p=>({ ...p, stock_status: e.target.value, page: 1 }))}
            aria-label="Status filter"
          >
            <option value="">All status</option>
            <option value="in">OK</option>
            <option value="low">Low</option>
            <option value="out">Critical</option>
          </select>
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            value={String(params.category_id ?? '')}
            onChange={(e)=> setParams(p=>({ ...p, category_id: e.target.value ? Number(e.target.value) : null, page: 1 }))}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            value={params.per_page}
            onChange={(e)=> setParams(p=>({ ...p, per_page: Number(e.target.value)||20, page: 1 }))}
            aria-label="Rows per page"
          >
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
          <ExportButton onClick={handleExportAll} disabled={isExporting || loading} tooltip="Export full inventory list" />
        </div>
      </div>

      {/* Table */}
      <div ref={scrollRef} onScroll={onScroll} className="overflow-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className={`sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 ${headerShadow ? 'shadow-sm' : ''}`}>
            <tr className="text-gray-600 dark:text-gray-300">
              <th className="p-3 text-left">
                <div className="inline-flex items-center gap-2 select-none cursor-pointer" onClick={() => toggleSort('name')}>
                  <span>Product</span>
                  {params.sort_by === 'name' ? (params.sort_order === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4"/> : <ArrowDownWideNarrow className="h-4 w-4"/>) : null}
                </div>
              </th>
              <th className="p-3 text-right">
                <div className="inline-flex items-center gap-2 select-none cursor-pointer" onClick={() => toggleSort('stock')}>
                  <span>Stock</span>
                  {params.sort_by === 'stock' ? (params.sort_order === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4"/> : <ArrowDownWideNarrow className="h-4 w-4"/>) : null}
                </div>
              </th>
              <th className="p-3 text-right">
                <div className="inline-flex items-center gap-2 select-none cursor-pointer" onClick={() => toggleSort('reserved_stock')}>
                  <span>Reserved</span>
                  {params.sort_by === 'reserved_stock' ? (params.sort_order === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4"/> : <ArrowDownWideNarrow className="h-4 w-4"/>) : null}
                </div>
              </th>
              <th className="p-3 text-right">
                <div className="inline-flex items-center gap-2 select-none cursor-pointer" onClick={() => toggleSort('available_stock')}>
                  <span>Available</span>
                  {params.sort_by === 'available_stock' ? (params.sort_order === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4"/> : <ArrowDownWideNarrow className="h-4 w-4"/>) : null}
                </div>
              </th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Initial load spinner inside table */}
            {(!hasLoadedRef.current && loading) && (
              <tr>
                <td colSpan={5} className="p-6">
                  <ContentSpinner fullwidth message={'Loading inventory...'} />
                </td>
              </tr>
            )}

            {/* Error row (only when not loading) */}
            {(!loading && error) && (
              <tr>
                <td colSpan={5} className="p-4">
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-3 text-sm">{error}</div>
                </td>
              </tr>
            )}

            {/* Refreshing indicator row (keep existing rows visible) */}
            {isRefreshing && (
              <tr>
                <td colSpan={5} className="p-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span>Refreshing results...</span>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty state (after we have loaded at least once and not loading) */}
            {(hasLoadedRef.current && !loading && items.length === 0) && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">No products found.</td>
              </tr>
            )}

            {/* Data rows */}
            {items.map((p, idx) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.015, 0.15) }}
                  className="group hover:bg-gray-50/70 dark:hover:bg-gray-800/60 cursor-pointer"
                  onClick={() => navigate(`${ProductsRoute}/${p.id}`)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img loading="lazy" src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={p.name}>{p.name}</div>
                        {p.category_name && <div className="text-xs text-gray-500 truncate">{p.category_name}</div>}
                      </div>
                      <button
                        type="button"
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={(e) => { e.stopPropagation(); }}
                        aria-label="Row actions"
                        title="Actions"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right font-medium text-gray-900 dark:text-gray-100">{formatNum(p.stock)}</td>
                  <td className="p-3 text-right text-gray-700 dark:text-gray-300">{formatNum(p.reserved_stock)}</td>
                  <td className="p-3 text-right text-gray-700 dark:text-gray-300">{formatNum(p.available_stock)}</td>
                  <td className="p-3">
                    <StatusBadge stock={p.stock} reserved={p.reserved_stock} available={p.available_stock} low={p.low_stock} />
                  </td>
                </motion.tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600 dark:text-gray-300">Total: {meta.total}</div>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50" onClick={() => gotoPage(1)} disabled={(params.page||1) <= 1} aria-label="First">
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button className="px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50" onClick={() => gotoPage(Math.max(1, (params.page||1)-1))} disabled={(params.page||1) <= 1} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pages.map((p, idx) => (
              typeof p === 'number' ? (
                <button
                  key={`p-${p}`}
                  className={`px-3 py-1.5 rounded-xl border text-sm ${p === meta.current_page ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                  onClick={() => gotoPage(p)}
                  aria-current={p === meta.current_page ? 'page' : undefined}
                >
                  {p}
                </button>
              ) : (
                <span key={`e-${idx}`} className="px-2 text-gray-400 select-none">…</span>
              )
            ))}
            <button className="px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50" onClick={() => gotoPage(Math.min(meta.last_page||1, (params.page||1)+1))} disabled={(params.page||1) >= (meta.last_page||1)} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button className="px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50" onClick={() => gotoPage(meta.last_page||1)} disabled={(params.page||1) >= (meta.last_page||1)} aria-label="Last">
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => navigate(ProductsRoute)}
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-xl hover:shadow-2xl transition will-change-transform hover:scale-105"
        aria-label="Add Product"
        title="Add Product"
      >
        <span className="text-lg leading-none">+</span>
        <span className="hidden sm:inline">Add Product</span>
      </button>
    </div>
  );
}
