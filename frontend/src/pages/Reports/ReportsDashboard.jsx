// src/pages/Reports/ReportsDashboard.jsx
// A performant, modular reports dashboard using Recharts and memoized transforms

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getLowStockReport,
  getProductsPurchased,
  getProductsSold,
  getPurchasesReport,
  getSalesReport,
  getStockMovementsReport,
} from "@/api/Reports";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, ShoppingCart, Package, AlertTriangle, Calendar, SlidersHorizontal, Plus, Minus, Search, Check } from "lucide-react";
import ContentSpinner from "@/components/Spinners/ContentSpinner";

const ranges = [
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_14_days", label: "Last 14 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_60_days", label: "Last 60 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "last_year", label: "Last year" },
  { value: "custom", label: "Custom" },
];

const defaultParams = { date_range: "last_30_days", group_by: "day", limit: 10, threshold: 10, product_id: null, from_date: null, to_date: null };

const formatCurrency = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
    Number(n || 0)
  );

export default function ReportsDashboard() {
  // Local UI filters
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [params, setParams] = useState(defaultParams);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const abortRef = useRef(null);

  // Product combobox state
  const [productOpen, setProductOpen] = useState(false);
  const comboRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setProductOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = useCallback(async () => {
    // Avoid fetching if custom range selected but dates incomplete
    if (params.date_range === "custom" && (!params.from_date || !params.to_date)) {
      return;
    }
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const [sales, purchases, movements, sold, purchased, lowStock] = await Promise.all([
        getSalesReport(params),
        getPurchasesReport(params),
        getStockMovementsReport(params),
        getProductsSold({ ...params }),
        getProductsPurchased({ ...params }),
        getLowStockReport({ ...params }),
      ]);

      setData({ sales, purchases, movements, sold, purchased, lowStock });
    } catch (e) {
      if (e.name === "AbortError") return;
      setError(e?.response?.data?.message || e.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);

  // Fetch product list (lightweight, first 100) once
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setLoadingProducts(true);
        const res = await (await import("@/api/Products")).getProducts({ per_page: 100 });
        if (!active) return;
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setProducts(list);
      } catch (e) {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  const onRangeChange = useCallback((e) => {
    const value = e.target.value;
    setParams((p) => ({ ...p, date_range: value, from_date: value === "custom" ? p.from_date : null, to_date: value === "custom" ? p.to_date : null }));
  }, []);

  const onGroupByChange = useCallback((e) => {
    setParams((p) => ({ ...p, group_by: e.target.value }));
  }, []);

  const setRange = useCallback((value) => {
    setParams((p) => ({ ...p, date_range: value, from_date: value === "custom" ? p.from_date : null, to_date: value === "custom" ? p.to_date : null }));
  }, []);

  const onLimitChange = useCallback((e) => {
    setParams((p) => ({ ...p, limit: Number(e.target.value) || 10 }));
  }, []);

  const onThresholdChange = useCallback((e) => {
    setParams((p) => ({ ...p, threshold: Number(e.target.value) || 10 }));
  }, []);

  const onProductChange = useCallback((e) => {
    const v = e.target.value;
    setParams((p) => ({ ...p, product_id: v ? Number(v) : null }));
  }, []);

  const onCustomDateChange = useCallback((key, value) => {
    setParams((p) => ({ ...p, [key]: value }));
  }, []);

  // Memoized transforms for charts
  const salesSeries = useMemo(() => {
    return (data.sales?.trends || []).map((d) => ({ period: d.period, revenue: Number(d.revenue || 0) }));
  }, [data.sales]);

  const purchasesSeries = useMemo(() => {
    return (data.purchases?.trends || []).map((d) => ({ period: d.period, amount: Number(d.amount || 0) }));
  }, [data.purchases]);

  const movementSeries = useMemo(() => {
    return (data.movements?.series || []).map((d) => ({
      period: d.period,
      in_qty: Number(d.in_qty || 0),
      out_qty: Number(d.out_qty || 0),
    }));
  }, [data.movements]);

  const topSold = useMemo(() => {
    return (data.sold?.products || []).map((p) => ({ name: p.product_name || p.product?.name, qty: Number(p.total_quantity || p.qty || 0) }));
  }, [data.sold]);

  const topPurchased = useMemo(() => {
    return (data.purchased?.products || []).map((p) => ({ name: p.product_name || p.product?.name, qty: Number(p.total_quantity || 0) }));
  }, [data.purchased]);

  const lowStockItems = useMemo(() => {
    const src = data.lowStock || data.low_stock;
    if (Array.isArray(src)) return src;
    if (src && Array.isArray(src.items)) return src.items;
    return [];
  }, [data.lowStock, data.low_stock]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center mb-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl mr-3 shadow-md">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Reports
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4" /> Range
          </div>
          <div className="flex flex-wrap gap-2">
            {ranges.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                  params.date_range === r.value
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {params.date_range === "custom" && (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg px-2 py-1 border border-gray-200 dark:border-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  className="bg-transparent outline-none text-sm"
                  value={params.from_date || ""}
                  onChange={(e) => onCustomDateChange("from_date", e.target.value)}
                />
              </div>
              <span className="text-gray-400">—</span>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg px-2 py-1 border border-gray-200 dark:border-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  className="bg-transparent outline-none text-sm"
                  value={params.to_date || ""}
                  onChange={(e) => onCustomDateChange("to_date", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <SlidersHorizontal className="h-4 w-4" /> Group by
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 flex">
            {[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ].map((g) => (
              <button
                key={g.value}
                onClick={() => setParams((p) => ({ ...p, group_by: g.value }))}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  params.group_by === g.value
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Top N</span>
            <div className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1">
              <button
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setParams((p) => ({ ...p, limit: Math.max(1, Math.min(100, (p.limit || 10) - 1)) }))}
                aria-label="decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="px-2 min-w-[2ch] text-center text-sm font-medium">{params.limit}</div>
              <button
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setParams((p) => ({ ...p, limit: Math.max(1, Math.min(100, (p.limit || 10) + 1)) }))}
                aria-label="increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Low-stock threshold</span>
            <div className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1">
              <button
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setParams((p) => ({ ...p, threshold: Math.max(0, (p.threshold || 10) - 1) }))}
                aria-label="decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="px-2 min-w-[2ch] text-center text-sm font-medium">{params.threshold}</div>
              <button
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setParams((p) => ({ ...p, threshold: Math.max(0, (p.threshold || 10) + 1) }))}
                aria-label="increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative" ref={comboRef}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Product</span>
              <button
                type="button"
                onClick={() => setProductOpen((o) => !o)}
                className={`inline-flex items-center justify-between min-w-[240px] px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow ${productOpen ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                disabled={loadingProducts}
              >
              <span className="truncate text-left">
                {products.find((p) => p.id === params.product_id)?.name || 'All products'}
              </span>
              <Search className="h-4 w-4 opacity-60" />
              </button>
            </div>
            {productOpen && (
              <div className="absolute z-20 mt-2 w-[320px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2">
                <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    className="flex-1 bg-transparent outline-none text-sm"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-64 overflow-auto py-1">
                  <button
                    onClick={() => { setParams((p) => ({ ...p, product_id: null })); setProductOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${params.product_id == null ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                  >
                    <span>All products</span>
                    {params.product_id == null && <Check className="h-4 w-4 opacity-80" />}
                  </button>
                  {products
                    .filter((p) => !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase()))
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setParams((s) => ({ ...s, product_id: p.id })); setProductOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${params.product_id === p.id ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                      >
                        <span className="truncate">{p.name}</span>
                        {params.product_id === p.id && <Check className="h-4 w-4 opacity-80" />}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <div className="font-semibold">Error</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {params.date_range === "custom" && (!params.from_date || !params.to_date) ? (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-2xl p-4">
          Select a custom From and To date to load reports.
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <ContentSpinner fullwidth message="Loading reports..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse border border-gray-200 dark:border-gray-700"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Sales Trends */}
          <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Sales Trends</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesSeries} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: '#6b7280' }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fill: '#6b7280' }} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb', backdropFilter: 'blur(4px)' }} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#gradSales)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">
              Total: {formatCurrency(data.sales?.summary?.total_sales_amount || 0)} | Orders: {data.sales?.summary?.orders_count || 0} | AOV: {formatCurrency(data.sales?.summary?.avg_order_value || 0)}
            </div>
          </section>

          {/* Purchases Trends */}
          <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold">Purchases Trends</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={purchasesSeries} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="gradPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: '#6b7280' }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fill: '#6b7280' }} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb', backdropFilter: 'blur(4px)' }} />
                <Legend />
                <Area type="monotone" dataKey="amount" name="Amount" stroke="#10b981" fill="url(#gradPurchases)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">
              Total: {formatCurrency(data.purchases?.summary?.total_purchases_amount || 0)} | Purchases: {data.purchases?.summary?.purchases_count || 0} | AOV: {formatCurrency(data.purchases?.summary?.avg_order_value || 0)}
            </div>
          </section>

          {/* Stock Movements */}
          <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Stock Movement</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={movementSeries} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: '#6b7280' }} />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb', backdropFilter: 'blur(4px)' }} />
                <Legend />
                <Area type="monotone" dataKey="in_qty" stroke="none" fill="url(#gradIn)" />
                <Area type="monotone" dataKey="out_qty" stroke="none" fill="url(#gradOut)" />
                <Line type="monotone" dataKey="in_qty" name="IN" stroke="#10b981" dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="out_qty" name="OUT" stroke="#ef4444" dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">
              Total IN: {data.movements?.summary?.total_in || 0} | Total OUT: {data.movements?.summary?.total_out || 0}
            </div>
          </section>

          {/* Top Sold Products */}
          <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold">Top Sold Products</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topSold} margin={{ top: 8, right: 16, left: 8, bottom: 8 }} barCategoryGap={8}>
                <defs>
                  <linearGradient id="barSold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} tick={{ fill: '#6b7280' }} />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb', backdropFilter: 'blur(4px)' }} />
                <Legend />
                <Bar dataKey="qty" name="Qty" fill="url(#barSold)" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Top Purchased Products */}
          <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5 text-cyan-500" />
              <h2 className="text-lg font-semibold">Top Purchased Products</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topPurchased} margin={{ top: 8, right: 16, left: 8, bottom: 8 }} barCategoryGap={8}>
                <defs>
                  <linearGradient id="barPurchased" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} tick={{ fill: '#6b7280' }} />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb', backdropFilter: 'blur(4px)' }} />
                <Legend />
                <Bar dataKey="qty" name="Qty" fill="url(#barPurchased)" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Low Stock List */}
          <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold">Low Stock Items</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {Array.isArray(lowStockItems) && lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <div key={item.id ?? item.product_id}
                       className="border rounded-xl p-3 flex items-center justify-between hover:shadow-md transition">
                    <div>
                      <div className="font-medium">{item.name || item.product_name}</div>
                      <div className="text-xs text-gray-500">
                        Category: {item.category_name || "-"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs inline-block px-2 py-1 rounded ${Number(item.stock || item.product_stock || 0) <= 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>
                        Stock: {item.stock ?? item.product_stock ?? 0}
                      </div>
                      {item.daily_velocity !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          Velocity: {Number(item.daily_velocity).toFixed(2)} / day
                        </div>
                      )}
                      {item.days_remaining !== undefined && (
                        <div className="text-xs text-gray-500">
                          Days remaining: {Number(item.days_remaining) === 9999 ? 'N/A' : Number(item.days_remaining).toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No low stock items for the selected range.</div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
