// src/pages/Inventory/LowStockAlertsPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import { AlertTriangle, Package, Hash, Eye, ShoppingCart, Wrench, Search, Tag } from 'lucide-react';
import { InventoryAdjustmentsRoute, ProductsRoute } from '@/router/Index';

import InventoryTabs from '@/pages/Inventory/components/InventoryTabs';
import { getLowStockReport } from '@/api/Reports';
import { getLowStockLevel, lowStockBadgeClasses } from '@/utils/stock';

export default function LowStockAlertsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState(null);

  const [params, setParams] = useState({ search: '', category_id: '', status: '', page: 1, per_page: 10, threshold: 10 });
  const abortRef = useRef(null);
  const firstLoadRef = useRef(true);
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (firstLoadRef.current) setLoading(true); else setRefetching(true);
      setError(null);
      // Use the reports endpoint (accurate low stock via AnalyticsService)
      const res = await getLowStockReport({ threshold: params.threshold });
      const array = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      setItems(array);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e?.response?.data?.message || e.message);
    } finally {
      firstLoadRef.current = false;
      setLoading(false);
      setRefetching(false);
    }
  }, [params.threshold]);

  useEffect(() => { fetchAlerts(); return () => abortRef.current?.abort(); }, [fetchAlerts]);

  const categories = useMemo(() => {
    const map = new Map();
    for (const r of items) {
      const id = r.category_id;
      const name = r.category_name;
      if (id != null && name) map.set(id, name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [items]);

  const filtered = useMemo(() => {
    let list = Array.isArray(items) ? [...items] : [];
    const q = params.search.trim().toLowerCase();
    if (q) list = list.filter(n => (n?.name || '').toLowerCase().includes(q));
    if (params.category_id) list = list.filter(n => String(n.category_id) === String(params.category_id));
    if (params.status) {
      list = list.filter(n => {
        const stock = Number(n.stock ?? 0);
        const threshold = Number(n.low_stock_threshold ?? params.threshold ?? 10);
        const level = getLowStockLevel(stock, threshold);
        return params.status === 'critical' ? level === 'critical' : params.status === 'low' ? level === 'low' : true;
      });
    }
    return list;
  }, [items, params.search, params.category_id, params.status, params.threshold]);

  const meta = useMemo(() => {
    const total = filtered.length;
    const last = Math.max(1, Math.ceil(total / (params.per_page || 10)));
    const page = Math.min(Math.max(1, params.page || 1), last);
    return { total, current_page: page, last_page: last };
  }, [filtered.length, params.page, params.per_page]);

  const pageSlice = useMemo(() => {
    const start = ((meta.current_page - 1) * params.per_page);
    return filtered.slice(start, start + params.per_page);
  }, [filtered, meta.current_page, params.per_page]);

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

  const gotoPage = (page) => setParams(p => ({ ...p, page }));

  const onExportCsv = () => {
    // Quick CSV export (client-side)
    const rows = [['Product', 'Category', 'Stock', 'Threshold', 'Status']].concat(filtered.map(n => {
      const name = n?.name;
      const stock = Number(n.stock ?? 0);
      const threshold = Number(n.low_stock_threshold ?? params.threshold ?? 10);
      const level = getLowStockLevel(stock, threshold);
      const status = level === 'critical' ? 'Critical' : level === 'low' ? 'Low' : 'OK';
      return [name, n?.category_name || '', stock, threshold, status];
    }));
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'low_stock_alerts.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (stock, threshold) => {
    const level = getLowStockLevel(stock, threshold);
    const classes = lowStockBadgeClasses(level);
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${classes}`}>
        {level === 'critical' ? 'Critical' : level === 'low' ? 'Low' : 'OK'}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header + Tabs */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center p-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-md">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Low Stock Alerts</h1>
              <div className="text-gray-500">Monitor items nearing depletion.</div>
            </div>
          </div>
        </div>
        <InventoryTabs />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" />
          <input
            className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
            placeholder="Search products..."
            value={params.search}
            onChange={(e) => setParams(p => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>
        <select
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
          value={params.category_id}
          onChange={(e) => setParams(p => ({ ...p, category_id: e.target.value, page: 1 }))}
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
          value={params.status}
          onChange={(e) => setParams(p => ({ ...p, status: e.target.value, page: 1 }))}
        >
          <option value="">All status</option>
          <option value="low">Low</option>
          <option value="critical">Critical</option>
        </select>
        <button onClick={onExportCsv} className="ml-auto px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm">Export CSV</button>
      </div>

      {/* Table */}
      {loading || refetching ? (
        <div className="p-6">
          <ContentSpinner fullwidth message={loading ? 'Loading alerts...' : 'Refreshing...'} />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-3">{error}</div>
      ) : (
        <div className="overflow-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left"><span className="inline-flex items-center gap-2"><Package className="h-4 w-4" /> Product</span></th>
                <th className="p-2 text-right"><span className="inline-flex items-center gap-2"><Hash className="h-4 w-4" /> Stock</span></th>
                <th className="p-2 text-right"><span className="inline-flex items-center gap-2"><Tag className="h-4 w-4" /> Min Threshold</span></th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((n, idx) => {
                const name = n?.name;
                const stock = Number(n.stock ?? 0);
                const threshold = Number(n.low_stock_threshold ?? params.threshold ?? 10);
                const productId = n?.id;
                return (
                  <tr key={n.id || idx} className="border-t hover:bg-gray-50">
                    <td className="p-2 min-w-[240px]">
                      <div className="inline-flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium truncate" title={name}>{name}</span>
                      </div>
                    </td>
                    <td className="p-2 text-right">{stock}</td>
                    <td className="p-2 text-right">{threshold}</td>
                    <td className="p-2">{statusBadge(stock, threshold)}</td>
                    <td className="p-2">
                      <div className="inline-flex items-center gap-2 opacity-80">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100" title="Reorder" onClick={() => navigate('/dashboard/purchases')}>
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                        {productId && (
                          <button className="p-1.5 rounded-lg hover:bg-gray-100" title="View details" onClick={() => navigate(`${ProductsRoute}/${productId}`)}>
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button className="p-1.5 rounded-lg hover:bg-gray-100" title="Adjust stock" onClick={() => navigate(InventoryAdjustmentsRoute)}>
                          <Wrench className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">Total: {meta.total}</div>
          <div className="flex items-center gap-1">
            {pages.map((p, idx) => (
              typeof p === 'number' ? (
                <button
                  key={`p-${p}`}
                  className={`px-3 py-1.5 rounded-xl border text-sm ${p === meta.current_page ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => gotoPage(p)}
                  aria-current={p === meta.current_page ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                >
                  {p}
                </button>
              ) : (
                <span key={`e-${idx}`} className="px-2 text-gray-400 select-none">…</span>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
