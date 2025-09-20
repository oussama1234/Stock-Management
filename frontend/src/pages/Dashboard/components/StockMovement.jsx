// src/pages/Dashboard/components/StockMovement.jsx
// Visualizes stock movements (in vs out) over the selected range.
// Uses a lightweight stacked bar chart in SVG for performance.

import React, { useMemo } from "react";
import SectionCard from "./SectionCard";
import { Activity } from "lucide-react";

/**
 * Build stacked bar chart geometry from movement rows
 * @param {Array<{date: string, in_qty: number|string, out_qty: number|string}>} rows
 * @returns {{ bars: Array<{ x: number, inH: number, outH: number, date: string }>, maxTotal: number }}
 */
function useBars(rows = [], width = 600, height = 120, gap = 4) {
  return useMemo(() => {
    const normalized = rows.map((r) => ({
      date: r.date,
      in_qty: Number(r.in_qty || 0),
      out_qty: Number(r.out_qty || 0),
    }));
    const maxTotal = normalized.reduce((m, r) => Math.max(m, r.in_qty + r.out_qty), 1);
    const n = Math.max(normalized.length, 1);
    const barW = Math.max(2, Math.floor((width - gap * (n - 1)) / n));

    const bars = normalized.map((r, i) => {
      const x = i * (barW + gap);
      const inH = (r.in_qty / maxTotal) * height;
      const outH = (r.out_qty / maxTotal) * height;
      return { x, inH, outH, date: r.date };
    });

    return { bars, maxTotal, barW };
  }, [rows, width, height, gap]);
}

const StockMovement = React.memo(function StockMovement({ rows = [] }) {
  const width = Math.max(300, Math.min(900, (rows.length || 30) * 12));
  const height = 140;
  const gap = 3;
  const { bars, barW } = useBars(rows, width, height, gap);

  return (
    <SectionCard title="Stock Movements (In vs Out)" Icon={Activity}>
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="block">
          {bars.map((b, idx) => (
            <g key={idx} transform={`translate(${b.x},0)`}>
              {/* OUT (red) stacked on top of IN */}
              <rect
                x={0}
                y={height - b.outH}
                width={barW}
                height={b.outH}
                fill="#ef4444"
                opacity={0.7}
              />
              {/* IN (green), draw beneath */}
              <rect
                x={0}
                y={height - (b.inH + b.outH)}
                width={barW}
                height={b.inH}
                fill="#10b981"
                opacity={0.7}
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#10b981" }} /> In</div>
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#ef4444" }} /> Out</div>
      </div>
    </SectionCard>
  );
});

export default StockMovement;
