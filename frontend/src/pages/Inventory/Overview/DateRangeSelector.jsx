// src/pages/Inventory/Overview/DateRangeSelector.jsx
import React, { useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const presets = [
  { key: 'last_7_days', label: 'Last 7 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
  { key: 'last_year', label: 'Last year' },
];

function toISO(d) { return d.toISOString().slice(0, 10); }
function startOfMonth(date) { const d = new Date(date); d.setDate(1); d.setHours(0,0,0,0); return d; }
function endOfMonth(date) { const d = new Date(date); d.setMonth(d.getMonth()+1, 0); d.setHours(23,59,59,999); return d; }
function startOfYear(date) { const d = new Date(date); d.setMonth(0,1); d.setHours(0,0,0,0); return d; }
function endOfYear(date) { const d = new Date(date); d.setMonth(11,31); d.setHours(23,59,59,999); return d; }

export default function DateRangeSelector({ value = 'last_7_days', onChange }) {
  const now = useMemo(() => new Date(), []);

  const handleChange = (key) => {
    let params = { preset: key };
    if (key === 'last_7_days') {
      params = { preset: key, date_range: 'last_7_days', range_days: 7, group_by: 'day' };
    } else if (key === 'this_month') {
      const from = startOfMonth(now); const to = now;
      const days = Math.max(1, Math.ceil((to - from) / (24*60*60*1000)) + 1);
      params = { preset: key, date_range: 'custom', from_date: toISO(from), to_date: toISO(to), range_days: days, group_by: 'day' };
    } else if (key === 'last_month') {
      const thisMonthStart = startOfMonth(now);
      const lastMonthEnd = new Date(thisMonthStart); lastMonthEnd.setDate(0); lastMonthEnd.setHours(23,59,59,999);
      const lastMonthStart = startOfMonth(lastMonthEnd);
      const days = Math.max(1, Math.ceil((lastMonthEnd - lastMonthStart) / (24*60*60*1000)) + 1);
      params = { preset: key, date_range: 'custom', from_date: toISO(lastMonthStart), to_date: toISO(lastMonthEnd), range_days: days, group_by: 'day' };
    } else if (key === 'this_year') {
      const from = startOfYear(now); const to = now;
      const days = Math.max(1, Math.ceil((to - from) / (24*60*60*1000)) + 1);
      params = { preset: key, date_range: 'custom', from_date: toISO(from), to_date: toISO(to), range_days: days, group_by: 'day' };
    } else if (key === 'last_year') {
      const lastYear = new Date(now.getFullYear()-1, now.getMonth(), now.getDate());
      const from = startOfYear(lastYear); const to = endOfYear(lastYear);
      const days = Math.max(1, Math.ceil((to - from) / (24*60*60*1000)) + 1);
      params = { preset: key, date_range: 'custom', from_date: toISO(from), to_date: toISO(to), range_days: days, group_by: 'day' };
    }
    onChange?.(params);
  };

  return (
    <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <select
        className="bg-transparent outline-none text-sm"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Date range"
      >
        {presets.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
      </select>
      <ChevronDown className="h-4 w-4 text-gray-400" />
    </div>
  );
}
