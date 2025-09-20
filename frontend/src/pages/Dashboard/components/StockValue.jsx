// src/pages/Dashboard/components/StockValue.jsx
// Displays retail vs cost stock value

import React from "react";
import SectionCard from "./SectionCard";
import { Warehouse } from "lucide-react";
import { fmtCurrency } from "../utils";

const StockValue = React.memo(function StockValue({ retail, cost }) {
  return (
    <SectionCard title="Stock Value" Icon={Warehouse}>
      <div className="text-sm text-gray-600 mb-3">
        Retail value vs estimated cost value based on average purchase price
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="text-xs text-blue-600">Retail</div>
          <div className="text-xl font-bold text-blue-900">{fmtCurrency(retail)}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="text-xs text-emerald-600">Cost</div>
          <div className="text-xl font-bold text-emerald-900">{fmtCurrency(cost)}</div>
        </div>
      </div>
    </SectionCard>
  );
});

export default StockValue;
