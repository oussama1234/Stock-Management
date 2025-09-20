// src/pages/Dashboard/components/CategoryDistribution.jsx
// Displays sales quantity by category with simple relative bars

import React, { useMemo } from "react";
import SectionCard from "./SectionCard";
import { Activity } from "lucide-react";
import { fmtNumber } from "../utils";

const CategoryDistribution = React.memo(function CategoryDistribution({ rows = [] }) {
  const maxQty = useMemo(() => (rows[0]?.qty ? Number(rows[0].qty) : 0), [rows]);
  return (
    <SectionCard title="Sales by Category" Icon={Activity}>
      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.category}>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>{c.category}</span>
              <span className="font-medium">{fmtNumber(c.qty)}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded">
              <div
                className="h-2 bg-indigo-500 rounded"
                style={{ width: `${maxQty ? Math.min(100, (Number(c.qty) / maxQty) * 100) : 0}%` }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-gray-500">No category data available.</div>
        )}
      </div>
    </SectionCard>
  );
});

export default CategoryDistribution;
