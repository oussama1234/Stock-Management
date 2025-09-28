// src/pages/Inventory/Adjustments/AdjustmentTable.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getInventoryHistory } from '@/api/Inventory';
import { AxiosClient } from '@/api/AxiosClient';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Hash,
  Loader2,
  Package,
  Search,
  Tag,
  User as UserIcon,
} from 'lucide-react';
import ExportButton from '@/pages/Admin/Products/components/ExportButton';
import { useAdjustmentsExport } from '@/pages/Inventory/hooks/useAdjustmentsExport';

const dateRanges = ['last_7_days','last_14_days','last_30_days','last_60_days','last_90_days','last_6_months','last_year'];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

function UserAvatar({ name = '', fallback = '?' }) {
  const initials = useMemo(() => {
    if (!name) return fallback;
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts[1]?.[0] || '';
    return (first + last).toUpperCase() || fallback;
  }, [name, fallback]);
  return (
    <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 text-xs font-bold border border-indigo-200 mr-2">
      {initials}
    </div>
  );
}

export default function AdjustmentTable({ className = '' }) {
  const { exportAdjustments, isExporting } = useAdjustmentsExport();

  const [params, setParams] = useState({ date_range: 'last_30_days', page: 1, per_page: 10 });
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [sort, setSort] = useState({ by: 'movement_date', dir: 'desc' });

  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 10 });
  const [usersMap, setUsersMap] = useState({});
  const abortRef = useRef(null);
  const usersLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  const handleExportAll = useCallback(async () => {
    try {
      const perPage = 200;
      let page = 1;
      let all = [];
      for (;;) {
        const res = await getInventoryHistory({ ...params, page, per_page: perPage });
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        all = all.concat(data);
        const meta = res?.meta || res?.pagination || { current_page: page, last_page: page };
        if (!meta || meta.current_page >= meta.last_page) break;
        page = meta.current_page + 1;
      }
      await exportAdjustments(all, 'inventory-adjustments.xlsx', { usersMap });
    } catch (e) {
      console.error('Export adjustments failed', e);
    }
  }, [params, usersMap, exportAdjustments]);

  const fetchRows = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setError(null);
      const isFirst = !initializedRef.current;
      if (isFirst) setLoading(true); else setRefetching(true);

      const res = await getInventoryHistory({ ...params });
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const m = res?.meta || res?.pagination || (res && typeof res === 'object' ? { total: res.total, current_page: res.current_page, last_page: res.last_page, per_page: res.per_page } : null) || { total: data.length, current_page: params.page || 1, last_page: params.page || 1, per_page: params.per_page || data.length };
      setRows(data);
      setMeta({
        total: Number(m?.total || 0),
        current_page: Number(m?.current_page || 1),
        last_page: Number(m?.last_page || 1),
        per_page: Number(m?.per_page || params.per_page || 10),
      });
      initializedRef.current = true;

      // Build users lookup if necessary
      const ids = Array.from(new Set(data.map(r => r.user_id).filter(Boolean)));
      const missing = ids.filter(id => !usersMap[id] && !(data.find(r => r.user?.id === id && r.user?.name)));
      if (!usersLoadedRef.current && missing.length > 0) {
        try {
          const resp = await AxiosClient.get('/users', { params: { per_page: 1000 } });
          const arr = Array.isArray(resp?.data?.data) ? resp.data.data : (Array.isArray(resp?.data) ? resp.data : []);
          const map = {};
          for (const u of arr) {
            if (u && (u.id != null)) map[u.id] = u.name || u.full_name || u.email || `User #${u.id}`;
          }
          if (Object.keys(map).length > 0) {
            setUsersMap(prev => ({ ...map, ...prev }));
            usersLoadedRef.current = true;
          }
        } catch (e) {
          // ignore lookup errors; fallback will be used
        }
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
      setRows([]);
    } finally {
      setLoading(false);
      setRefetching(false);
    }
  }, [params]);

  useEffect(() => { fetchRows(); return () => { abortRef.current?.abort(); }; }, [fetchRows]);

  const onSort = (by) => {
    if (sort.by === by) setSort({ by, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    else setSort({ by, dir: 'asc' });
  };

  const filteredSorted = useMemo(() => {
    let list = [...rows];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => (r.product?.name || '').toLowerCase().includes(q) || (r.reason || '').toLowerCase().includes(q) || (r.user_name || r.user?.name || '').toLowerCase().includes(q));
    }
    if (reasonFilter) {
      list = list.filter(r => (r.reason || '').toLowerCase() === reasonFilter);
    }
    list.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const getVal = (r) => {
        if (sort.by === 'movement_date') return new Date(r.movement_date || 0).getTime();
        if (sort.by === 'difference') {
          const hasPrevNew = typeof r.previous_stock === 'number' && typeof r.new_stock === 'number';
          const diff = hasPrevNew ? (Number(r.new_stock) - Number(r.previous_stock)) : (r.type === 'IN' ? Number(r.quantity || 0) : -Number(r.quantity || 0));
          return diff;
        }
        if (sort.by === 'product') return (r.product?.name || '').toLowerCase();
        return 0;
      };
      const va = getVal(a); const vb = getVal(b);
      if (va < vb) return -1 * dir; if (va > vb) return 1 * dir; return 0;
    });
    return list;
  }, [rows, search, reasonFilter, sort]);

  const pages = useMemo(() => {
    const current = meta.current_page || 1;
    const last = meta.last_page || 1;
    const max = 9; // max items including ends and ellipses
    if (last <= max) return Array.from({ length: last }, (_, i) => i + 1);
    const result = [1];
    let start = Math.max(2, current - 2);
    let end = Math.min(last - 1, current + 2);
    const need = max - 2; // pages to show between first and last
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

  const formatDate = (v) => {
    if (!v) return '-';
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleString();
  };

  return (
    <section className={`relative bg-white rounded-2xl border border-gray-200 p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">Adjustment History</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" />
            <input
              className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="Search product, reason, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search adjustments"
            />
          </div>
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            aria-label="Filter by reason"
          >
            <option value="">All reasons</option>
            {['damage','lost','correction','other'].map(r => (
              <option key={r} value={r}>{cap(r)}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
            value={params.date_range}
            onChange={(e) => setParams(p => ({ ...p, date_range: e.target.value, page: 1 }))}
            aria-label="Date range"
          >
            {dateRanges.map(x => <option key={x} value={x}>{x.replaceAll('_', ' ')}</option>)}
          </select>
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
            value={params.per_page}
            onChange={(e) => setParams(p => ({ ...p, per_page: Number(e.target.value) || 10, page: 1 }))}
            aria-label="Rows per page"
          >
            {[10,20,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <ExportButton onClick={handleExportAll} disabled={isExporting || loading} tooltip="Export all adjustments" />
        </div>
      </div>

      {(loading || refetching) ? (
        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <tbody>
              <tr>
                <td colSpan={7} className="p-6">
                  <ContentSpinner fullwidth message={loading ? 'Loading adjustments...' : 'Refreshing...'} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-3 text-sm">{error}</div>
      ) : filteredSorted.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-center mb-3">
            <span className="text-2xl">📦</span>
          </div>
          <div className="text-gray-700 font-medium">No adjustments yet</div>
          <div className="text-gray-500 text-sm">Create your first adjustment to see history here.</div>
        </div>
      ) : (
        <>
          <div className="overflow-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left cursor-pointer select-none" onClick={() => onSort('movement_date')}>
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" /> Date/Time {sort.by === 'movement_date' ? (sort.dir === 'asc' ? <ArrowUpNarrowWide className="inline h-4 w-4"/> : <ArrowDownWideNarrow className="inline h-4 w-4"/>) : null}
                    </span>
                  </th>
                  <th className="p-2 text-left cursor-pointer select-none" onClick={() => onSort('product')}>
                    <span className="inline-flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" /> Product {sort.by === 'product' ? (sort.dir === 'asc' ? <ArrowUpNarrowWide className="inline h-4 w-4"/> : <ArrowDownWideNarrow className="inline h-4 w-4"/>) : null}
                    </span>
                  </th>
                  <th className="p-2 text-right">
                    <span className="inline-flex items-center gap-1 justify-end w-full"><Hash className="h-4 w-4 text-gray-500" /> Old Qty</span>
                  </th>
                  <th className="p-2 text-right">
                    <span className="inline-flex items-center gap-1 justify-end w-full"><Hash className="h-4 w-4 text-gray-500" /> New Qty</span>
                  </th>
                  <th className="p-2 text-right cursor-pointer select-none" onClick={() => onSort('difference')}>
                    <span className="inline-flex items-center gap-2 justify-end w-full">
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" /> / <ArrowDownRight className="h-4 w-4 text-red-600" /> Difference {sort.by === 'difference' ? (sort.dir === 'asc' ? <ArrowUpNarrowWide className="inline h-4 w-4"/> : <ArrowDownWideNarrow className="inline h-4 w-4"/>) : null}
                    </span>
                  </th>
                  <th className="p-2">
                    <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4 text-gray-500" /> Reason</span>
                  </th>
                  <th className="p-2">
                    <span className="inline-flex items-center gap-2"><UserIcon className="h-4 w-4 text-gray-500" /> User</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((r) => {
                  const hasPrevNew = typeof r.previous_stock === 'number' && typeof r.new_stock === 'number';
                  const diff = hasPrevNew ? (Number(r.new_stock) - Number(r.previous_stock)) : (r.type === 'IN' ? Number(r.quantity || 0) : -Number(r.quantity || 0));
                  const badge = diff >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200';
                  const dateStr = formatDate(r.movement_date);
                  const userName = r.user?.name || r.user?.full_name || r.user_name || usersMap[r.user_id] || (r.user_id ? `User #${r.user_id}` : 'Unknown');
                  return (
                    <tr key={r.id} className="border-t hover:bg-gray-50/60">
                      <td className="p-2 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-gray-700"><Calendar className="h-4 w-4 opacity-60" /><span title={String(r.movement_date || '')}>{dateStr}</span></div>
                      </td>
                      <td className="p-2 min-w-[220px]">
                        <div className="inline-flex items-center gap-2">
                          <Package className="h-4 w-4 opacity-70" />
                          <div className="truncate" title={r.product?.name || ''}>{r.product?.name}</div>
                        </div>
                      </td>
                      <td className="p-2 text-right">
                        <span className="inline-flex items-center gap-1 justify-end w-full text-gray-800"><Hash className="h-4 w-4 opacity-60" />{r.previous_stock}</span>
                      </td>
                      <td className="p-2 text-right">
                        <span className="inline-flex items-center gap-1 justify-end w-full text-gray-800"><Hash className="h-4 w-4 opacity-60" />{r.new_stock}</span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${badge}`}>
                          {diff >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />} {Math.abs(diff)}
                        </span>
                      </td>
                      <td className="p-2 capitalize">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-gray-50 border-gray-200 text-gray-700"><Tag className="h-3.5 w-3.5" /> {r.reason || '-'}</span>
                      </td>
                      <td className="p-2">
                        <div className="inline-flex items-center">
                          <UserAvatar name={userName} />
                          <span className="truncate max-w-[200px]" title={userName}>{userName}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="text-gray-600">Page {meta.current_page} of {meta.last_page} • Total {meta.total}</div>
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
        </>
      )}
    </section>
  );
}
