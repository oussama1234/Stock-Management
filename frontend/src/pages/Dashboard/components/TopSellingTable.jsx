// src/pages/Dashboard/components/TopSellingTable.jsx
// Table for top selling products, minimal layout, memoized for performance

import React from "react";
import SectionCard from "./SectionCard";
import { Boxes } from "lucide-react";
import { fmtCurrency, fmtNumber } from "../utils";

const TopSellingTable = React.memo(function TopSellingTable({ rows = [] }) {
  return (
    <SectionCard title="Top Selling Products" Icon={Boxes}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Qty</th>
              <th className="py-2 pr-4">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.product_id} className="border-t">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    {row?.product?.image && (
                      <img
                        src={row.product.image}
                        alt={row?.product?.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <span className="font-medium text-gray-800">
                      {row?.product?.name || `#${row.product_id}`}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-4">{fmtNumber(row.qty)}</td>
                <td className="py-2 pr-4">{fmtCurrency(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-gray-500">No top selling data yet.</div>
        )}
      </div>
    </SectionCard>
  );
});

export default TopSellingTable;
