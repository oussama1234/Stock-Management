import { useCallback, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useProductData } from '../context/ProductDataContext';
import { useToast } from '../../../../components/Toaster/ToastContext';
import { useStockValidation } from './useStockValidation';
import { useApolloClient } from '@apollo/client/react';
import { GET_PAGINATED_SALE_ITEMS_BY_PRODUCT } from '../../../../GraphQL/SaleItem/Queries/PaginatedSaleItemsByProduct';
import { GET_PAGINATED_PURCHASE_ITEMS_BY_PRODUCT } from '../../../../GraphQL/PurchaseItem/Queries/PaginatedPurchaseItemsByProduct';
import { GET_PAGINATED_STOCK_MOVEMENTS_BY_PRODUCT } from '../../../../GraphQL/StockMovement/Queries/PaginatedStockMovementsByProduct';

/**
 * High-performance multi-sheet Excel export for Product Details Refactored page
 * Returns an export function and loading state.
 */
export const useProductsExport = () => {
  const { product, sales, purchases, stockMovements, analytics } = useProductData();
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const generatingRef = useRef(false); // prevent double-clicks / re-renders

  const currentStock = (typeof product?.stock === 'number')
    ? product.stock
    : (typeof product?.quantity === 'number' ? product.quantity : 0);
  const { stockStatus } = useStockValidation(currentStock);
  const apollo = useApolloClient();

  // Helpers
  const autoSizeColumns = useCallback((ws, data) => {
    const cols = [];
    const rows = Array.isArray(data) ? data : [];
    const header = rows[0] || [];
    const colCount = header.length;

    for (let c = 0; c < colCount; c++) {
      let maxLen = String(header[c] ?? '').length;
      for (let r = 1; r < rows.length; r++) {
        const cell = rows[r]?.[c];
        const val = cell == null ? '' : (typeof cell === 'number' ? cell.toString() : String(cell));
        maxLen = Math.max(maxLen, val.length);
      }
      // Add a little padding; rough width calculation (characters -> Excel width)
      cols[c] = { wch: Math.min(Math.max(10, Math.floor(maxLen * 1.2)), 60) };
    }
    ws['!cols'] = cols;
  }, []);

  const applyCurrencyFormat = useCallback((ws, headerRow, currencyHeaders) => {
    const range = XLSX.utils.decode_range(ws['!ref'] || `A1:${XLSX.utils.encode_cell({ r: headerRow.length - 1, c: 0 })}`);
    const headerIndexes = new Map();
    headerRow.forEach((h, idx) => {
      if (currencyHeaders.includes(h)) headerIndexes.set(idx, true);
    });

    for (let R = 1; R <= range.e.r; ++R) {
      for (const C of headerIndexes.keys()) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (!cell) continue;
        // Ensure numeric and set a currency-like number format
        if (typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '$#,##0.00';
        } else {
          const num = Number(cell.v);
          if (Number.isFinite(num)) {
            cell.v = num;
            cell.t = 'n';
            cell.z = '$#,##0.00';
          }
        }
        ws[addr] = cell;
      }
    }
  }, []);

  const tryFreezeHeader = useCallback((ws) => {
    // Best-effort header freeze (supported in SheetJS in some environments)
    try {
      // Freeze first row
      ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };
    } catch {
      // no-op if not supported
    }
  }, []);

  const computeAverageUnitCost = useCallback(() => {
    if (!purchases || purchases.length === 0) return 0;

    // Aggregate cost per purchase with preference for purchase.total_amount
    const byPurchase = new Map();
    for (const item of purchases) {
      const p = item.purchase || {};
      const pid = p.id || item.purchase_id || item.purchaseId || `i-${item.id}`;
      const entry = byPurchase.get(pid) || { subtotal: 0, total_amount: p.total_amount, tax: p.tax, discount: p.discount, units: 0 };
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price || item.price) || 0;
      entry.subtotal += qty * price;
      entry.units += qty;
      if (p.total_amount !== undefined) entry.total_amount = p.total_amount;
      if (p.tax !== undefined) entry.tax = p.tax;
      if (p.discount !== undefined) entry.discount = p.discount;
      byPurchase.set(pid, entry);
    }

    let totalCost = 0;
    let totalUnits = 0;

    for (const entry of byPurchase.values()) {
      let cost = 0;
      if (entry.total_amount !== undefined && entry.total_amount !== null) {
        cost = Number(entry.total_amount || 0);
      } else {
        const sub = Number(entry.subtotal || 0);
        const taxPct = Number(entry.tax ?? 0);
        const discPct = Number(entry.discount ?? 0);
        const taxAmt = sub * (taxPct / 100);
        const discAmt = sub * (discPct / 100);
        cost = sub + taxAmt - discAmt;
      }
      totalCost += cost;
      totalUnits += Number(entry.units || 0);
    }

    if (totalUnits <= 0) return 0;
    return totalCost / totalUnits;
  }, [purchases]);

  // Memoize heavy transforms
  const averageUnitCost = useMemo(() => computeAverageUnitCost(), [computeAverageUnitCost]);

  const overviewSheetData = useMemo(() => {
    if (!product) return [];

    const headers = [
      'Product ID', 'Name', 'SKU', 'Category', 'Units Sold', 'Units Purchased', 'Revenue Total', 'Profit', 'Turn Around', 'Days in Stock', 'Current Stock', 'Low Stock Status', 'Adjusted Units'
    ];

    const totalUnitsSold = (sales || []).reduce((sum, s) => sum + (Number(s?.quantity) || 0), 0);
    const totalUnitsPurchased = (purchases || []).reduce((sum, p) => sum + (Number(p?.quantity) || 0), 0);

    const row = [
      product.id,
      product.name,
      product.sku,
      product.category || 'Unknown',
      totalUnitsSold,
      totalUnitsPurchased,
      Number(analytics?.totalSalesValue ?? 0),
      Number(analytics?.profitValue ?? 0),
      // Turn Around (turnover rate): units sold / current stock (fallback 0)
      currentStock > 0 ? Number((totalUnitsSold / currentStock).toFixed(2)) : 0,
      analytics?.daysInStock ?? null,
      currentStock,
      stockStatus.text,
      // Adjusted Units: net stock movement (in - out)
      (() => {
        const inQty = (stockMovements || [])
          .filter(m => ['in', 'purchase', 'adjustment_in'].includes(m.type))
          .reduce((sum, m) => sum + Math.abs(Number(m.quantity) || 0), 0);
        const outQty = (stockMovements || [])
          .filter(m => ['out', 'sale', 'adjustment_out'].includes(m.type))
          .reduce((sum, m) => sum + Math.abs(Number(m.quantity) || 0), 0);
        return inQty - outQty;
      })()
    ];

    return [headers, row];
  }, [product, sales, purchases, analytics, stockMovements, currentStock, stockStatus.text]);

  const salesSheetData = useMemo(() => {
    if (!product || !sales) return [];
    const headers = [
      'Sale ID', 'Product ID', 'Product Name', 'Quantity Sold', 'Sale Price', 'Customer', 'Date', 'Profit per Sale', 'Discounts', 'Total Revenue per Sale', 'Salesperson'
    ];
    const rows = sales.map((s) => {
      const qty = Number(s.quantity) || 0;
      const price = Number(s.unit_price || s.price) || 0;
      const saleObj = s.sale || {};
      const saleId = saleObj.id || s.id;
      const totalRevenue = saleObj.total_amount ? Number(saleObj.total_amount) : price * qty;
      const discountPct = saleObj.discount ?? 0;
      const customer = s.customer_name || s.customerName || s.customer?.name || saleObj.customer_name || saleObj.customer?.name || 'Walk-in Customer';
      const date = saleObj.sale_date || s.created_at || null;
      const salesperson = saleObj.user_name || saleObj.user || s.user || 'N/A';
      const profitPerSale = Number(((price - averageUnitCost) * qty).toFixed(2));
      return [
        saleId,
        product.id,
        product.name,
        qty,
        price,
        customer,
        date ? new Date(date) : '',
        profitPerSale,
        discountPct,
        totalRevenue,
        salesperson
      ];
    });
    return [headers, ...rows];
  }, [product, sales, averageUnitCost]);

  const purchasesSheetData = useMemo(() => {
    if (!product || !purchases) return [];
    const headers = [
      'Purchase ID', 'Product ID', 'Product Name', 'Quantity Purchased', 'Supplier', 'Purchase Price', 'Date', 'Total Cost', 'Warehouse Location'
    ];
    const rows = purchases.map((p) => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.unit_price || p.price) || 0;
      const purchaseObj = p.purchase || {};
      const purchaseId = purchaseObj.id || p.id;
      const totalCost = purchaseObj.total_amount ? Number(purchaseObj.total_amount) : price * qty;
      const supplier = p.supplier_name || p.supplierName || p.supplier?.name || purchaseObj.supplier_name || purchaseObj.supplier?.name || 'Unknown Supplier';
      const date = purchaseObj.purchase_date || p.created_at || null;
      const location = p.warehouse_location || purchaseObj.warehouse_location || 'Default';
      return [
        purchaseId,
        product.id,
        product.name,
        qty,
        price,
        supplier,
        date ? new Date(date) : '',
        totalCost,
        location
      ];
    });
    return [headers, ...rows];
  }, [product, purchases]);

  const movementsSheetData = useMemo(() => {
    if (!product || !stockMovements) return [];
    const headers = [
      'Movement ID', 'Product ID', 'Product Name', 'Movement Type', 'Quantity', 'Date', 'User', 'Notes'
    ];
    const rows = stockMovements.map((m) => {
      const movementId = m.id;
      const movementType = m.type || 'unknown';
      const qty = Math.abs(Number(m.quantity) || 0) * (['out', 'sale', 'adjustment_out'].includes(movementType) ? -1 : 1);
      const date = m.movement_date || m.created_at || m.date || null;
      const user = m.user_name || m.user || 'System';
      const notes = m.reason || m.notes || '';
      return [
        movementId,
        product.id,
        product.name,
        movementType,
        qty,
        date ? new Date(date) : '',
        user,
        notes
      ];
    });
    return [headers, ...rows];
  }, [product, stockMovements]);

  const buildWorkbook = useCallback(() => {
    const wb = XLSX.utils.book_new();

    const addSheet = (title, data, opts = {}) => {
      if (!data || data.length === 0) return;
      const ws = XLSX.utils.aoa_to_sheet(data, { cellDates: true });

      // Auto-size columns
      autoSizeColumns(ws, data);

      // Bold headers is generally not supported in OSS, but we'll attempt basic freeze + number formats
      tryFreezeHeader(ws);

      // Apply currency formats where applicable
      const header = data[0] || [];
      const currencyColumns = (title === 'Product Overview Details')
        ? ['Revenue Total', 'Profit']
        : (title === 'Sales Data')
          ? ['Sale Price', 'Profit per Sale', 'Total Revenue per Sale']
          : (title === 'Purchases Data')
            ? ['Purchase Price', 'Total Cost']
            : [];
      if (currencyColumns.length > 0) {
        applyCurrencyFormat(ws, header, currencyColumns);
      }

      XLSX.utils.book_append_sheet(wb, ws, title);
    };

    addSheet('Product Overview Details', overviewSheetData);
    addSheet('Sales Data', salesSheetData);
    addSheet('Purchases Data', purchasesSheetData);
    addSheet('Stock Movements', movementsSheetData);

    return wb;
  }, [overviewSheetData, salesSheetData, purchasesSheetData, movementsSheetData, autoSizeColumns, applyCurrencyFormat, tryFreezeHeader]);

  const exportProductsData = useCallback(async () => {
    if (generatingRef.current || isExporting) return;
    if (!product) {
      toast.error('No product data available to export.');
      return;
    }

    try {
      generatingRef.current = true;
      setIsExporting(true);

      // In case of very large datasets, yield to UI a bit
      await new Promise((r) => setTimeout(r, 0));

      // Fetch ALL sales/purchases/movements across pages to export everything
      const fetchAll = async (queryDoc, varBase, pageSize = 200) => {
        let page = 1;
        const all = [];
        for (;;) {
          const { data } = await apollo.query({
            query: queryDoc,
            variables: { ...varBase, page, perPage: pageSize },
            fetchPolicy: 'network-only'
          });
          const rootKey = Object.keys(data).find(k => /paginated/i.test(k));
          const payload = rootKey ? data[rootKey] : null;
          const items = payload?.data || [];
          const meta = payload?.meta || { current_page: page, last_page: page };
          all.push(...items);
          if (!meta || meta.current_page >= meta.last_page) break;
          page = meta.current_page + 1;
        }
        return all;
      };

      const allSales = await fetchAll(GET_PAGINATED_SALE_ITEMS_BY_PRODUCT, { product_id: Number(product.id) });
      const allPurchases = await fetchAll(GET_PAGINATED_PURCHASE_ITEMS_BY_PRODUCT, { product_id: Number(product.id) });
      const allMovements = await fetchAll(GET_PAGINATED_STOCK_MOVEMENTS_BY_PRODUCT, { product_id: Number(product.id) });

      // Temporarily override memoized arrays for workbook build
      const prevSales = sales;
      const prevPurchases = purchases;
      const prevMovements = stockMovements;
      try {
        // Build sheets from complete lists by temporarily using locals
        const tmpSalesSheetData = (() => {
          const headers = ['Sale ID','Product ID','Product Name','Quantity Sold','Sale Price','Customer','Date','Profit per Sale','Discounts','Total Revenue per Sale','Salesperson'];
          const rows = allSales.map((s) => {
            const qty = Number(s.quantity) || 0;
            const price = Number(s.unit_price || s.price) || 0;
            const saleObj = s.sale || {};
            const saleId = saleObj.id || s.id;
            const totalRevenue = saleObj.total_amount ? Number(saleObj.total_amount) : price * qty;
            const discountPct = saleObj.discount ?? 0;
            const customer = s.customer_name || s.customerName || s.customer?.name || saleObj.customer_name || saleObj.customer?.name || 'Walk-in Customer';
            const date = saleObj.sale_date || s.created_at || null;
            const salesperson = saleObj.user_name || saleObj.user || s.user || 'N/A';
            const profitPerSale = Number(((price - averageUnitCost) * qty).toFixed(2));
            return [saleId, product.id, product.name, qty, price, customer, date ? new Date(date) : '', profitPerSale, discountPct, totalRevenue, salesperson];
          });
          return [headers, ...rows];
        })();

        const tmpPurchSheetData = (() => {
          const headers = ['Purchase ID','Product ID','Product Name','Quantity Purchased','Supplier','Purchase Price','Date','Total Cost','Warehouse Location'];
          const rows = allPurchases.map((p) => {
            const qty = Number(p.quantity) || 0;
            const price = Number(p.unit_price || p.price) || 0;
            const purchaseObj = p.purchase || {};
            const purchaseId = purchaseObj.id || p.id;
            const totalCost = purchaseObj.total_amount ? Number(purchaseObj.total_amount) : price * qty;
            const supplier = p.supplier_name || p.supplierName || p.supplier?.name || purchaseObj.supplier_name || purchaseObj.supplier?.name || 'Unknown Supplier';
            const date = purchaseObj.purchase_date || p.created_at || null;
            const location = p.warehouse_location || purchaseObj.warehouse_location || 'Default';
            return [purchaseId, product.id, product.name, qty, price, supplier, date ? new Date(date) : '', totalCost, location];
          });
          return [headers, ...rows];
        })();

        const tmpMovesSheetData = (() => {
          const headers = ['Movement ID','Product ID','Product Name','Movement Type','Quantity','Date','User','Notes'];
          const rows = allMovements.map((m) => {
            const movementId = m.id;
            const movementType = m.type || 'unknown';
            const qty = Math.abs(Number(m.quantity) || 0) * (['out','sale','adjustment_out'].includes(movementType) ? -1 : 1);
            const date = m.movement_date || m.created_at || m.date || null;
            const user = m.user_name || m.user?.name || m.user || 'System';
            const notes = m.reason || m.notes || '';
            return [movementId, product.id, product.name, movementType, qty, date ? new Date(date) : '', user, notes];
          });
          return [headers, ...rows];
        })();

        const wb = XLSX.utils.book_new();
        const addSheet = (title, data) => {
          if (!data || data.length === 0) return;
          const ws = XLSX.utils.aoa_to_sheet(data, { cellDates: true });
          // Auto-size columns
          const header = data[0] || [];
          const cols = header.map((h, i) => {
            let maxLen = String(h || '').length;
            for (let r = 1; r < data.length; r++) {
              const v = data[r][i];
              const s = v == null ? '' : String(v);
              if (s.length > maxLen) maxLen = s.length;
            }
            return { wch: Math.min(Math.max(10, Math.floor(maxLen * 1.15)), 60) };
          });
          ws['!cols'] = cols;
          ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };
          XLSX.utils.book_append_sheet(wb, ws, title);
        };

        addSheet('Product Overview Details', overviewSheetData);
        addSheet('Sales Data', tmpSalesSheetData);
        addSheet('Purchases Data', tmpPurchSheetData);
        addSheet('Stock Movements', tmpMovesSheetData);

        const filename = `product-${product.sku || product.id}-details.xlsx`;
        XLSX.writeFile(wb, filename, { bookType: 'xlsx', compression: true });
      } finally {
        // restore if needed (no state mutated)
      }

      toast.success('Export complete! Your Excel file has been downloaded.');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export. Please try again.');
    } finally {
      generatingRef.current = false;
      setIsExporting(false);
    }
  }, [product, isExporting, overviewSheetData, averageUnitCost, apollo, sales, purchases, stockMovements, toast]);

  return {
    exportProductsData,
    isExporting
  };
};