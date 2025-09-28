// src/pages/Inventory/List/StatusBadge.jsx
import React, { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export default function StatusBadge({ stock = 0, reserved = 0, available = 0, low = false, threshold = 10 }) {
  const status = useMemo(() => {
    const s = Number(stock || 0);
    const a = Number(available || (s - Number(reserved || 0)));
    if (a <= 0 || s <= 0) return 'critical';
    if (low || a < Number(threshold || 10)) return 'low';
    return 'ok';
  }, [stock, reserved, available, low, threshold]);

  if (status === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200 animate-pulse">
        <AlertCircle className="h-3.5 w-3.5" /> Critical
      </span>
    );
  }
  if (status === 'low') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
        <AlertTriangle className="h-3.5 w-3.5" /> Low
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
      <CheckCircle2 className="h-3.5 w-3.5" /> OK
    </span>
  );
}
