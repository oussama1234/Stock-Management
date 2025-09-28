import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export const useAdjustmentsExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const ref = useRef(false);

  const exportAdjustments = useCallback(async (rows = [], filename = 'inventory-adjustments.xlsx', opts = {}) => {
    if (ref.current || isExporting) return;
    try {
      ref.current = true;
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 0));

      const usersMap = opts?.usersMap || {};

      const headers = ['ID','Date','Product','Type','Quantity','Previous','New','Difference','Reason','User'];
      const dataRows = rows.map(r => {
        const hasPrevNew = typeof r.previous_stock === 'number' && typeof r.new_stock === 'number';
        const diff = hasPrevNew ? (Number(r.new_stock) - Number(r.previous_stock)) : (String(r.type).toUpperCase() === 'IN' ? Number(r.quantity || 0) : -Number(r.quantity || 0));
        const nameFromMap = r.user_id != null ? usersMap[r.user_id] : undefined;
        const userName = r.user?.name || r.user?.full_name || r.user_name || nameFromMap || (r.user_id ? `User #${r.user_id}` : 'Unknown');
        return [
          r.id,
          r.movement_date ? new Date(r.movement_date) : '',
          r.product?.name || '',
          r.type,
          Number(r.quantity || 0),
          r.previous_stock ?? '',
          r.new_stock ?? '',
          diff,
          r.reason || '',
          userName,
        ];
      });

      const sheetData = [headers, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(sheetData, { cellDates: true });
      ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };
      const cols = headers.map((h, i) => {
        let maxLen = String(h).length;
        for (const row of dataRows) {
          const v = row[i];
          const s = v == null ? '' : String(v);
        if (s.length > maxLen) maxLen = s.length;
        }
        return { wch: Math.min(Math.max(10, Math.floor(maxLen * 1.15)), 60) };
      });
      ws['!cols'] = cols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Adjustments');
      XLSX.writeFile(wb, filename, { compression: true });
    } finally {
      ref.current = false;
      setIsExporting(false);
    }
  }, [isExporting]);

  return { exportAdjustments, isExporting };
};
