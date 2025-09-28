import { useCallback, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { PRODUCTS_QUERY } from '../../../../GraphQL/Products/Queries/Products';

// Compute stock status consistent with ProductsContext
const getStockStatus = (stock) => {
  const s = Number(stock || 0);
  if (s === 0) return 'out_of_stock';
  if (s <= 10) return 'low_stock';
  return 'in_stock';
};

export const useProductsCsvExport = () => {
  const apollo = useApolloClient();
  const [isExporting, setIsExporting] = useState(false);
  const abortRef = useRef({ aborted: false });

  // CSV headers memoized
  const headers = useMemo(() => [
    'ID',
    'Name',
    'Description',
    'Image',
    'Price',
    'Stock',
    'Days In Stock',
    'Category ID',
    'Category Name',
    'Created At',
    'Updated At',
  ], []);

  const exportProductsCsv = useCallback(async ({
    searchTerm = '',
    categoryFilter = '',
    stockFilter = '',
    sortBy = 'name',
    sortOrder = 'asc',
  } = {}) => {
    if (isExporting) return;

    abortRef.current.aborted = false;
    setIsExporting(true);
    try {
      // Fetch all pages (server paginated) with search applied server-side if present
      const pageSize = 200;
      let page = 1;
      const all = [];
      for (;;) {
        if (abortRef.current.aborted) break;
        const { data } = await apollo.query({
          query: PRODUCTS_QUERY,
          variables: { page, limit: pageSize, search: searchTerm || '' },
          fetchPolicy: 'network-only',
        });
        const payload = data?.products;
        const items = payload?.data || [];
        all.push(...items);
        const current = payload?.current_page || page;
        const last = payload?.last_page || page;
        if (current >= last) break;
        page = current + 1;
      }

      // Client-side filter for category and stock if set
      const filtered = all.filter((p) => {
        if (abortRef.current.aborted) return false;
        if (categoryFilter && String(p?.category?.id ?? '') !== String(categoryFilter)) return false;
        if (stockFilter) {
          const st = getStockStatus(p?.stock);
          if (st !== stockFilter) return false;
        }
        return true;
      });

      // Optional sorting
      const sorted = [...filtered].sort((a, b) => {
        const dir = sortOrder === 'desc' ? -1 : 1;
        const val = (key, obj) => {
          if (key === 'category') return obj?.category?.name?.toLowerCase?.() || '';
          const v = obj?.[key];
          if (typeof v === 'string') return v.toLowerCase();
          return v ?? '';
        };
        const av = val(sortBy, a);
        const bv = val(sortBy, b);
        if (av < bv) return -1 * dir; if (av > bv) return 1 * dir; return 0;
      });

      // Build CSV rows (chunk to avoid UI jank if very large)
      const encoder = (value) => {
        const s = value == null ? '' : String(value);
        // escape quotes
        return '"' + s.replaceAll('"', '""') + '"';
      };

      const rows = [headers.join(',')];
      const pushRow = (p) => {
        rows.push([
          encoder(p.id),
          encoder(p.name),
          encoder(p.description || ''),
          encoder(p.image || ''),
          encoder(p.price),
          encoder(p.stock),
          encoder(p.days_in_stock ?? ''),
          encoder(p.category?.id ?? ''),
          encoder(p.category?.name || ''),
          encoder(p.created_at || ''),
          encoder(p.updated_at || ''),
        ].join(','));
      };

      const chunkSize = 1000;
      for (let i = 0; i < sorted.length; i += chunkSize) {
        if (abortRef.current.aborted) break;
        const chunk = sorted.slice(i, i + chunkSize);
        for (const p of chunk) pushRow(p);
        // Yield to UI
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 0));
      }

      // Trigger download
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = searchTerm ? `products-${searchTerm}-export.csv` : 'products-export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [apollo, headers, isExporting]);

  const abortExport = useCallback(() => {
    abortRef.current.aborted = true;
  }, []);

  return { exportProductsCsv, abortExport, isExporting };
};