// src/pages/Dashboard/components/DateRangePicker.jsx
// Simple date range preset selector for dashboard analytics.
// Presets: 7, 14, 30, 90, 180, 365 days

import { CalendarRange } from "lucide-react";

/**
 * DateRangePicker
 * @param {Object} props
 * @param {number} value - current range in days
 * @param {(val:number)=>void} onChange - callback when selection changes
 */
export default function DateRangePicker({ value = 30, onChange }) {
  const presets = [
    { label: "7 days", value: 7 },
    { label: "14 days", value: 14 },
    { label: "30 days", value: 30 },
    { label: "3 months", value: 90 },
    { label: "6 months", value: 180 },
    { label: "This year", value: 365 },
  ];

  return (
    <div className="inline-flex items-center gap-2">
      <CalendarRange className="h-4 w-4 text-gray-500" />
      <select
        value={value}
        onChange={(e) => onChange && onChange(parseInt(e.target.value))}
        className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        aria-label="Select analytics range"
      >
        {presets.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
