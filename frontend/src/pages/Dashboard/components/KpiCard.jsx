// src/pages/Dashboard/components/KpiCard.jsx
// Lightweight KPI card with optional delta indicator and navigation link
// Memoized to avoid unnecessary re-renders when props are stable

import React from "react";
import { Link } from "react-router-dom";

const KpiCard = React.memo(function KpiCard({ label, value, Icon, accentClass, delta, to }) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-r ${accentClass} text-white`}>
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
        {typeof delta === "number" && (
          <div className={`text-sm font-medium ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      {content}
    </div>
  );
});

export default KpiCard;
