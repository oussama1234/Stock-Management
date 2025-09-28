// src/pages/Inventory/Adjustments/AdjustmentKPIs.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { getInventoryHistory } from '@/api/Inventory';
import { Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const formatNum = (n) => new Intl.NumberFormat().format(Number(n || 0));

export default function AdjustmentKPIs({ className = '' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const abortRef = useRef(null);

  const fetchToday = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setLoading(true); setError(null);
      // Prefer a strict 'today' filter if backend supports it; fallback to last_7_days and filter client-side by date.
      const res = await getInventoryHistory({ date_range: 'last_7_days', per_page: 200, page: 1 });
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const today = new Date().toISOString().slice(0, 10);
      const todayRows = data.filter(r => (r.movement_date || '').slice(0, 10) === today);
      setRows(todayRows);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchToday(); return () => abortRef.current?.abort(); }, [fetchToday]);

  const stats = useMemo(() => {
    let count = rows.length;
    let inc = 0; let dec = 0;
    for (const r of rows) {
      const hasPrevNew = typeof r.previous_stock === 'number' && typeof r.new_stock === 'number';
      const diff = hasPrevNew ? (Number(r.new_stock) - Number(r.previous_stock)) : (r.type === 'IN' ? Number(r.quantity || 0) : -Number(r.quantity || 0));
      if (diff >= 0) inc += diff; else dec += Math.abs(diff);
    }
    return { count, inc, dec };
  }, [rows]);

  if (error) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        <div className="col-span-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {[{ label: 'Adjustments Today', value: stats.count, icon: Activity, gradient: 'from-gray-800 to-gray-600', text: 'text-gray-900' },
        { label: 'Total Increase Qty', value: stats.inc, icon: ArrowUpRight, gradient: 'from-emerald-500 to-green-500', text: 'text-emerald-700' },
        { label: 'Total Decrease Qty', value: stats.dec, icon: ArrowDownRight, gradient: 'from-rose-500 to-red-500', text: 'text-red-700' }]
        .map((k, idx) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: loading ? 0 : idx * 0.06 }}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
            aria-busy={loading}
            aria-live="polite"
          >
            <div className="flex items-center justify-between">
              <div className={`inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-r ${k.gradient} shadow text-white`}>
                <k.icon className="h-5 w-5" />
              </div>
              {loading ? (
                <div className="h-7 w-16 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <div className={`text-xl font-bold ${k.text}`}>{formatNum(k.value)}</div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500">{k.label}</div>
          </motion.div>
        ))}
    </div>
  );
}
