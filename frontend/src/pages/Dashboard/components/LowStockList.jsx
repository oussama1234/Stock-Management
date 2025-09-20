// src/pages/Dashboard/components/LowStockList.jsx
// Shows low-stock products, optimized for simple DOM and memoized rendering

import React from "react";
import SectionCard from "./SectionCard";
import { TrendingDown } from "lucide-react";

const LowStockList = React.memo(function LowStockList({ products = [] }) {
  return (
    <SectionCard title="Low Stock" Icon={TrendingDown}>
      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.id} className="flex items-center justify-between p-3 rounded-xl border bg-rose-50 border-rose-100">
            <div className="flex items-center gap-2">
              {p.image && (
                <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />
              )}
              <span className="text-gray-800 font-medium">{p.name}</span>
            </div>
            <span className="text-rose-700 font-semibold">{p.stock}</span>
          </li>
        ))}
        {products.length === 0 && (
          <div className="text-gray-500">No products are critically low.</div>
        )}
      </ul>
    </SectionCard>
  );
});

export default LowStockList;
