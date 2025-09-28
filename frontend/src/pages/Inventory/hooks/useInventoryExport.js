import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

export const useInventoryExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const generatingRef = useRef(false);

  const exportInventory = useCallback(async (items = [], filename = 'inventory-list.xlsx') => {
    if (generatingRef.current || isExporting) return;
    try {
      generatingRef.current = true;
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 0));

      const headers = ['Product ID','Name','Category','Stock','Reserved','Available','Low Stock'];
      const rows = (items || []).map(p => [
        p.id,
        p.name,
        p.category_name || p.category?.name || 'Unknown',
        Number(p.stock || 0),
        Number(p.reserved_stock || 0),
        Number(p.available_stock || Math.max(0, (p.stock||0) - (p.reserved_stock||0))),
        p.low_stock ? 'Yes' : 'No',
      ]);
      const data = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(data);
      // Auto-size columns
      const cols = headers.map((h, i) => {
        let maxLen = String(h).length;
        for (const row of rows) {
          const v = row[i];
          const s = v == null ? '' : String(v);
          if (s.length > maxLen) maxLen = s.length;
        }
        return { wch: Math.min(Math.max(10, Math.floor(maxLen * 1.2)), 60) };
      });
      ws['!cols'] = cols;
      // Freeze header
      ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      XLSX.writeFile(wb, filename, { compression: true });
    } finally {
      generatingRef.current = false;
      setIsExporting(false);
    }
  }, [isExporting]);

  return { exportInventory, isExporting };
};