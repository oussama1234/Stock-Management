// src/pages/Inventory/Overview/MovementsChartTimeline.jsx
import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

function formatDateLabel(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return String(s);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MovementsChartTimeline({ data = [] }) {
  const series = Array.isArray(data) ? data : [];
  const netSeries = useMemo(() => series.map(r => ({
    period: r.period,
    net: Number(r.in_qty || 0) - Number(r.out_qty || 0),
  })), [series]);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Stock Movements</h3>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="gradInX" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
              </linearGradient>
              <linearGradient id="gradOutX" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tickFormatter={formatDateLabel} />
            <YAxis />
            <Tooltip labelFormatter={(v) => formatDateLabel(v)} contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb', backdropFilter: 'blur(4px)' }} />
            <Area type="monotone" dataKey="in_qty" name="IN" stroke="#10b981" fill="url(#gradInX)" isAnimationActive strokeWidth={2} />
            <Area type="monotone" dataKey="out_qty" name="OUT" stroke="#ef4444" fill="url(#gradOutX)" isAnimationActive strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline */}
      <motion.div className="mt-4 overflow-x-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex gap-2 min-w-full pb-2">
          {netSeries.map((d, idx) => {
            const pos = d.net >= 0;
            return (
              <motion.div
                key={d.period + '-' + idx}
                whileHover={{ y: -2, scale: 1.02 }}
                className={`shrink-0 px-3 py-2 rounded-xl border text-sm ${pos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                title={`${formatDateLabel(d.period)} • ${pos ? '+' : '-'}${Math.abs(d.net)}`}
              >
                <div className="text-xs text-gray-500">{formatDateLabel(d.period)}</div>
                <div className="font-semibold">{pos ? '+' : '-'}{Math.abs(d.net)}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
