import React, { memo, useMemo, forwardRef } from 'react';
import { useProductData } from '../../context/ProductDataContext';
import { useFormatters } from '../../hooks/useFormatters';
import { useImageUrl } from '../../hooks/useImageUrl';
import { Package, DollarSign, TrendingUp, TrendingDown, BarChart3, Clock, ShoppingCart, Percent, RefreshCcw, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './ProductPrintDocument.css';

// Styles moved to external CSS (ProductPrintDocument.css)

const Section = memo(({ title, children }) => (
  <div className="mb-4">
    <div className="section-title">{title}</div>
    {children}
  </div>
));

const KeyValue = memo(({ label, value }) => (
  <div className="flex justify-between py-1">
    <span className="muted small">{label}</span>
    <span className="small font-medium">{value}</span>
  </div>
));

// Generic KPI card for summary
const KpiCard = memo(({ title, value, sub, icon, iconClass }) => (
  <div className="kpi-card">
    <div className="kpi-row">
      <div style={{ minWidth: 0 }}>
        <div className="kpi-title">{title}</div>
        <div className="kpi-value" title={typeof value === 'string' ? value : undefined}>{value}</div>
        {sub ? <div className="kpi-sub">{sub}</div> : null}
      </div>
      <div className={`kpi-icon ${iconClass}`}>{icon}</div>
    </div>
  </div>
));

const SummaryPage = memo(({ product, analytics, formatters, imageUrl, generatedAt, kpis, stockBadge, stockLabel, sku }) => {
  const { formatDate } = formatters;

  return (
    <div className="print-page">
      <div className="header">
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} /> Product Performance Report
          </div>
          <div className="subtitle">Generated {formatDate(generatedAt)}</div>
        </div>
        <div className="header-right">
          <div className="chip">SKU: {sku}</div>
        </div>
      </div>
      <div className="gradient-line" />

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: Image */}
        <div style={{ width: 160, height: 160, border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {imageUrl ? (
            <img src={imageUrl} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div className="muted small">No image</div>
          )}
        </div>

        {/* Right: Top facts */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 6 }}>{product?.name}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <span className={stockBadge} style={{ fontWeight: 700 }}>{stockLabel}</span>
            {product?.category && (
              <span className="pill pill-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Tag size={12} /> {product.category}
              </span>
            )}
            {product?.price != null && (
              <span className="pill pill-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <DollarSign size={12} /> Price: {formatters.formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* KPI Grid */}
          <div className="kpi-grid">
            {kpis.map((k, idx) => (
              <KpiCard key={idx} title={k.title} value={k.value} sub={k.sub} icon={k.icon} iconClass={k.iconClass} />
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {product?.description && (
        <div className="block block-muted" style={{ marginTop: 10 }}>
          <div className="h3" style={{ marginBottom: 6 }}>Description</div>
          <div className="desc">{product.description}</div>
        </div>
      )}
    </div>
  );
});

const PurchasesPage = memo(({ rows, totals, formatters, maxRows = 24 }) => {
  const { formatCurrency, formatDate } = formatters;
  const displayRows = useMemo(() => rows.slice(0, maxRows), [rows, maxRows]);
  const hasMore = rows.length > maxRows;

  return (
    <div className="print-page">
      <div className="header">
        <div className="h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={16} /> Purchases
        </div>
        <div className="muted small">{rows.length} records</div>
      </div>
      <div className="totals">Total Amount: <strong>{formatCurrency(totals.totalAmount)}</strong> • Total Units: <strong>{totals.totalQty}</strong></div>
      {hasMore && (
        <div className="muted small">Showing first {maxRows} records to keep this page compact</div>
      )}

      <div className="table">
        <table>
          <thead>
            <tr>
              <th align="left">Date</th>
              <th align="left">Supplier</th>
              <th align="right">Qty</th>
              <th align="right">Unit Price</th>
              <th align="right">Subtotal</th>
              <th align="right">Tax</th>
              <th align="right">Discount</th>
              <th align="right">Total</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((p) => (
              <tr key={p.id}>
                <td>{formatDate(p.date)}</td>
                <td>{p.supplier || '—'}</td>
                <td align="right">{p.quantity}</td>
                <td align="right">{formatCurrency(p.unitPrice)}</td>
                <td align="right">{formatCurrency(p.subtotal)}</td>
                <td align="right">{formatCurrency(p.tax)}</td>
                <td align="right">{formatCurrency(p.discount)}</td>
                <td align="right">{formatCurrency(p.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}><span className="muted">Totals</span></td>
              <td align="right"><strong>{totals.totalQty}</strong></td>
              <td align="right"><strong>{formatCurrency((totals.totalSubtotal || 0) / Math.max(totals.totalQty || 1, 1))}</strong></td>
              <td align="right"><strong>{formatCurrency(totals.totalSubtotal || 0)}</strong></td>
              <td align="right"><strong>{formatCurrency(totals.totalTax || 0)}</strong></td>
              <td align="right"><strong>{formatCurrency(totals.totalDiscount || 0)}</strong></td>
              <td align="right"><strong>{formatCurrency(totals.totalAmount || 0)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

const SalesPage = memo(({ rows, totals, formatters, maxRows = 24 }) => {
  const { formatCurrency, formatDate } = formatters;
  const displayRows = useMemo(() => rows.slice(0, maxRows), [rows, maxRows]);
  const hasMore = rows.length > maxRows;

  return (
    <div className="print-page">
      <div className="header">
        <div className="h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} /> Sales
        </div>
        <div className="muted small">{rows.length} records</div>
      </div>
      <div className="totals">Total Amount: <strong>{formatCurrency(totals.totalAmount)}</strong> • Total Units: <strong>{totals.totalQty}</strong></div>
      {hasMore && (
        <div className="muted small">Showing first {maxRows} records to keep this page compact</div>
      )}

      <div className="table">
        <table>
          <thead>
            <tr>
              <th align="left">Date</th>
              <th align="left">Customer</th>
              <th align="right">Qty</th>
              <th align="right">Unit Price</th>
              <th align="right">Subtotal</th>
              <th align="right">Tax</th>
              <th align="right">Discount</th>
              <th align="right">Total</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((s) => (
              <tr key={s.id}>
                <td>{formatDate(s.date)}</td>
                <td>{s.customer || '—'}</td>
                <td align="right">{s.quantity}</td>
                <td align="right">{formatCurrency(s.unitPrice)}</td>
                <td align="right">{formatCurrency(s.subtotal)}</td>
                <td align="right">{formatCurrency(s.tax)}</td>
                <td align="right">{formatCurrency(s.discount)}</td>
                <td align="right">{formatCurrency(s.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}><span className="muted">Totals</span></td>
              <td align="right"><strong>{totals.totalQty}</strong></td>
              <td align="right"><strong>{formatCurrency((totals.totalSubtotal || 0) / Math.max(totals.totalQty || 1, 1))}</strong></td>
              <td align="right"><strong>{formatCurrency(totals.totalSubtotal || 0)}</strong></td>
              <td align="right"><strong>{formatCurrency(totals.totalTax || 0)}</strong></td>
              <td align="right"><strong>{formatCurrency(totals.totalDiscount || 0)}</strong></td>
              <td align="right"><strong>{formatCurrency(totals.totalAmount || 0)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

const StockMovementsPage = memo(({ rows, totals, formatters, maxRows = 30 }) => {
  const { formatDate } = formatters;
  const displayRows = useMemo(() => rows.slice(0, maxRows), [rows, maxRows]);
  const hasMore = rows.length > maxRows;
  return (
    <div className="print-page">
      <div className="header">
        <div className="h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={16} /> Stock Movements
        </div>
        <div className="muted small">{rows.length} records</div>
      </div>
      <div className="totals">Inbound: <strong>{totals.in}</strong> • Outbound: <strong>{totals.out}</strong> • Net: <strong>{totals.net}</strong></div>
      {hasMore && (
        <div className="muted small">Showing first {maxRows} records to keep this page compact</div>
      )}
      <div className="table">
        <table>
          <thead>
            <tr>
              <th align="left">Date</th>
              <th align="left">Type</th>
              <th align="right">Qty</th>
              <th align="right">Prev</th>
              <th align="right">New</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((m) => (
              <tr key={m.id}>
                <td>{formatDate(m.date)}</td>
                <td>
                  <span className={`pill ${m.type === 'IN' ? 'pill-green' : 'pill-red'}`}>{m.type}</span>
                </td>
                <td align="right">{m.quantity}</td>
                <td align="right">{m.previous}</td>
                <td align="right">{m.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const ProductPrintDocument = memo(forwardRef((props, ref) => {
  const { product, sales, purchases, analytics, stockMovements } = useProductData();
  const formatters = useFormatters();
  const { getImageUrl } = useImageUrl();

  const generatedAt = useMemo(() => new Date().toISOString(), []);

  // Prepare image
  const imageUrl = useMemo(() => {
    const images = product?.images || [];
    const first = images[0];
    return first ? getImageUrl(first) : (typeof product?.image === 'string' ? getImageUrl(product.image) : null);
  }, [product?.images, product?.image, getImageUrl]);

  // Normalized stock value
  const currentStock = useMemo(() => {
    if (typeof product?.stock === 'number') return product.stock;
    if (typeof product?.quantity === 'number') return product.quantity;
    return 0;
  }, [product?.stock, product?.quantity]);

  // KPI data preparation
  const kpis = useMemo(() => {
    const revenue = analytics?.totalSalesValue || 0;
    const cost = analytics?.totalPurchaseValue || 0;
    const profit = analytics?.profitValue || (revenue - cost);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Units
    const sold = (sales || []).reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const bought = (purchases || []).reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const velocity = analytics?.salesVelocity || 0;
    const turnover = currentStock > 0 ? (velocity / currentStock) : 0;

    const { formatCurrency, formatPercentage, formatNumber } = formatters;

    return [
      { title: 'Revenue', value: formatCurrency(revenue), sub: `${formatNumber(sold)} units sold`, icon: <DollarSign size={16} />, iconClass: 'icon-green' },
      { title: 'Cost', value: formatCurrency(cost), sub: `${formatNumber(bought)} units bought`, icon: <ShoppingCart size={16} />, iconClass: 'icon-purple' },
      { title: 'Profit', value: formatCurrency(profit), sub: `Margin ${formatPercentage(margin)}`, icon: <BarChart3 size={16} />, iconClass: profit >= 0 ? 'icon-green' : 'icon-red' },
      { title: 'Stock', value: formatNumber(currentStock), sub: 'On hand', icon: <Package size={16} />, iconClass: currentStock > 0 ? 'icon-blue' : 'icon-red' },
      { title: 'Velocity', value: `${formatNumber(velocity)} / mo`, sub: 'Sales velocity', icon: <TrendingUp size={16} />, iconClass: 'icon-amber' },
      { title: 'Turnover', value: `${turnover.toFixed(2)}x`, sub: 'Velocity / Stock', icon: <RefreshCcw size={16} />, iconClass: 'icon-slate' },
    ];
  }, [analytics, sales, purchases, currentStock, formatters]);

  const stockBadge = useMemo(() => {
    return currentStock <= 0 ? 'badge badge-red' : currentStock < 10 ? 'badge badge-amber' : 'badge badge-green';
  }, [currentStock]);

  const stockLabel = useMemo(() => {
    return currentStock > 0 ? `${formatters.formatNumber(currentStock)} in stock` : 'Out of stock';
  }, [currentStock, formatters]);

  const sku = useMemo(() => product?.sku || 'N/A', [product?.sku]);

  // Normalize purchases rows
  const purchaseRows = useMemo(() => {
    return (purchases || []).map((p) => {
      const unitPrice = Number(p.unit_price ?? p.price ?? 0) || 0;
      const qty = Number(p.quantity || 0) || 0;
      const date = p.purchase?.purchase_date || p.purchase_date || p.created_at || p.createdAt || new Date().toISOString();
      // Supplier name resolution
      let supplier = null;
      if (p.supplier_name && typeof p.supplier_name === 'string') supplier = p.supplier_name;
      else if (p.supplierName && typeof p.supplierName === 'string') supplier = p.supplierName;
      else if (p.purchase?.supplier_name && typeof p.purchase.supplier_name === 'string') supplier = p.purchase.supplier_name;
      else if (p.purchase?.supplier?.name && typeof p.purchase.supplier?.name === 'string') supplier = p.purchase.supplier.name;
      else if (p.supplier && typeof p.supplier === 'string') supplier = p.supplier;

      // Tax and discount percentages
      const taxPct = Number(p.purchase?.tax ?? p.tax ?? 0) || 0;
      const discPct = Number(p.purchase?.discount ?? p.discount ?? 0) || 0;

      const subtotal = qty * unitPrice;
      const tax = subtotal * (taxPct / 100);
      const discount = subtotal * (discPct / 100);
      const total = subtotal + tax - discount;

      return { id: p.id, date, supplier, quantity: qty, unitPrice, subtotal, tax, discount, total };
    });
  }, [purchases]);

  const purchaseTotals = useMemo(() => {
    return purchaseRows.reduce((acc, r) => {
      acc.totalQty += r.quantity;
      acc.totalSubtotal += r.subtotal;
      acc.totalTax += r.tax;
      acc.totalDiscount += r.discount;
      acc.totalAmount += r.total;
      return acc;
    }, { totalQty: 0, totalSubtotal: 0, totalTax: 0, totalDiscount: 0, totalAmount: 0 });
  }, [purchaseRows]);

  // Normalize sales rows
  const salesRows = useMemo(() => {
    return (sales || []).map((s) => {
      const unitPrice = Number(s.unit_price ?? s.price ?? 0) || 0;
      const qty = Number(s.quantity || 0) || 0;
      const date = s.sale?.sale_date || s.sale_date || s.created_at || s.createdAt || new Date().toISOString();
      // Customer name resolution
      let customer = null;
      if (s.customer_name && typeof s.customer_name === 'string') customer = s.customer_name;
      else if (s.customerName && typeof s.customerName === 'string') customer = s.customerName;
      else if (s.sale?.customer_name && typeof s.sale.customer_name === 'string') customer = s.sale.customer_name;
      else if (s.sale?.customer?.name && typeof s.sale.customer?.name === 'string') customer = s.sale.customer.name;
      else if (s.customer && typeof s.customer === 'string') customer = s.customer;

      // Tax and discount as percentage on the item subtotal
      const taxPct = Number(s.sale?.tax ?? s.tax ?? 0) || 0;
      const discPct = Number(s.sale?.discount ?? s.discount ?? 0) || 0;

      const subtotal = qty * unitPrice;
      const tax = subtotal * (taxPct / 100);
      const discount = subtotal * (discPct / 100);
      const total = subtotal + tax - discount;

      return { id: s.id, date, customer, quantity: qty, unitPrice, subtotal, tax, discount, total };
    });
  }, [sales]);

  const salesTotals = useMemo(() => {
    return salesRows.reduce((acc, r) => {
      acc.totalQty += r.quantity;
      acc.totalSubtotal += r.subtotal;
      acc.totalTax += r.tax;
      acc.totalDiscount += r.discount;
      acc.totalAmount += r.total;
      return acc;
    }, { totalQty: 0, totalSubtotal: 0, totalTax: 0, totalDiscount: 0, totalAmount: 0 });
  }, [salesRows]);

  // Stock movement rows
  const movementRows = useMemo(() => {
    return (stockMovements || []).map((m) => {
      const date = m.movement_date || m.created_at || m.createdAt || new Date().toISOString();
      const type = (m.type || '').toUpperCase();
      const qty = Number(m.quantity || 0) || 0;
      const prev = Number(m.previous_stock ?? 0) || 0;
      const next = Number(m.new_stock ?? 0) || 0;
      return { id: m.id, date, type: type === 'IN' || type === 'OUT' ? type : (qty >= 0 ? 'IN' : 'OUT'), quantity: qty, previous: prev, next };
    });
  }, [stockMovements]);

  const movementTotals = useMemo(() => {
    return movementRows.reduce((acc, r) => {
      if (r.type === 'IN') acc.in += r.quantity;
      else acc.out += Math.abs(r.quantity);
      acc.net = acc.in - acc.out;
      return acc;
    }, { in: 0, out: 0, net: 0 });
  }, [movementRows]);

  if (!product) return null;

  return (
<div ref={ref} className="print-only print-container print-document">

      <SummaryPage 
        product={product} 
        analytics={analytics || {}}
        formatters={formatters}
        imageUrl={imageUrl}
        generatedAt={generatedAt}
        kpis={kpis}
        stockBadge={stockBadge}
        stockLabel={stockLabel}
        sku={sku}
      />

      <PurchasesPage 
        rows={purchaseRows} 
        totals={purchaseTotals}
        formatters={formatters}
      />

      <SalesPage 
        rows={salesRows} 
        totals={salesTotals}
        formatters={formatters}
      />

      <StockMovementsPage
        rows={movementRows}
        totals={movementTotals}
        formatters={formatters}
      />
    </div>
  );
}));

ProductPrintDocument.displayName = 'ProductPrintDocument';

export default ProductPrintDocument;