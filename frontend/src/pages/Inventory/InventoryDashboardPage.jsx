// src/pages/Inventory/InventoryDashboardPage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback, Suspense } from 'react';
import { getInventoryKpis } from '@/api/Inventory';
import { getStockMovementsReport } from '@/api/Reports';
import { BarChart3, Package2, TrendingUp, ShoppingCart, Package, Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import KpiCard from '@/pages/Inventory/Overview/KpiCard';
import DateRangeSelector from '@/pages/Inventory/Overview/DateRangeSelector';
import InventoryTabs from '@/pages/Inventory/components/InventoryTabs';

const MovementsChartTimeline = React.lazy(() => import('@/pages/Inventory/Overview/MovementsChartTimeline'));

function useRangeParams() {
  const [preset, setPreset] = useState('last_7_days');
  const build = useCallback((p) => {
    if (!p || p === 'last_7_days') return { preset: 'last_7_days', date_range: 'last_7_days', range_days: 7, group_by: 'day' };
    // We'll receive full params object from DateRangeSelector
    return p;
  }, []);
  return { preset, setPreset, build };
}

export default function InventoryDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [movements, setMovements] = useState([]);
  const abortRef = useRef(null);
  const { preset, setPreset, build } = useRangeParams();
  const [rangeParams, setRangeParams] = useState(build('last_7_days'));

  const onRangeChange = useCallback((params) => {
    setPreset(params.preset);
    setRangeParams(params);
  }, [setPreset]);

  const fetchAll = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setLoading(true); setError(null);
      const invParams = { range_days: rangeParams.range_days, from_date: rangeParams.from_date, to_date: rangeParams.to_date };
      const reportParams = { date_range: rangeParams.date_range, group_by: rangeParams.group_by || 'day', from_date: rangeParams.from_date, to_date: rangeParams.to_date };
      const [k, m] = await Promise.all([
        getInventoryKpis(invParams),
        getStockMovementsReport(reportParams)
      ]);
      setKpis(k);
      setMovements((m?.series||[]).map(r => ({ period: r.period, in_qty: Number(r.in_qty||0), out_qty: Number(r.out_qty||0) })));
    } catch (e) {
      if (e.name !== 'AbortError') setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [rangeParams]);

  useEffect(() => { fetchAll(); return () => abortRef.current?.abort(); }, [fetchAll]);

  const totals = kpis?.totals || {};

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl mr-3 shadow-md">
            <Package2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Inventory Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector value={preset} onChange={onRangeChange} />
        </div>
      </div>

      <InventoryTabs />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse border border-gray-200 dark:border-gray-700" />
            ))}
          </div>
          <ContentSpinner fullwidth message="Loading inventory dashboard..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4">{error}</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard label="Total Stock" value={totals.stock} Icon={Package} gradient="from-gray-700 to-gray-500" iconBg="from-gray-100 to-gray-200" />
            <KpiCard label="Reserved" value={totals.reserved} Icon={BarChart3} gradient="from-purple-500 to-pink-500" iconBg="from-purple-100 to-pink-100" />
            <KpiCard label="Available" value={totals.available} Icon={Activity} gradient="from-green-500 to-emerald-500" iconBg="from-green-100 to-emerald-100" />
            <KpiCard label="Sold" value={totals.sold} Icon={TrendingUp} gradient="from-blue-500 to-indigo-500" iconBg="from-blue-100 to-indigo-100" />
            <KpiCard label="Purchased" value={totals.purchased} Icon={ShoppingCart} gradient="from-teal-500 to-cyan-500" iconBg="from-teal-100 to-cyan-100" />
            <KpiCard label="Adjusted" value={totals.adjusted} Icon={ArrowUpRight} gradient="from-amber-500 to-orange-500" iconBg="from-amber-100 to-orange-100" />
          </div>

          {/* Movements: Chart + Timeline */}
          <Suspense fallback={<div className="h-72 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse border border-gray-200 dark:border-gray-700" />}> 
            <MovementsChartTimeline data={movements} />
          </Suspense>
        </>
      )}
    </div>
  );
}
