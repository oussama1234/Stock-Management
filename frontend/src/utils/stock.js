// src/utils/stock.js
// Shared stock utility helpers to avoid duplication across pages

/**
 * Determine low stock level for a product
 * - critical: stock is 0 or below (out), or stock less than threshold
 * - low: stock > 0 and stock <= threshold
 * - ok: stock above threshold
 *
 * @param {number} stock
 * @param {number} threshold
 * @returns {'critical'|'low'|'ok'}
 */
export function getLowStockLevel(stock = 0, threshold = 10) {
  const s = Number(stock || 0);
  const t = Number(threshold || 10);
  if (s <= 0) return 'critical';
  if (s <= t) return 'low';
  return 'ok';
}

/**
 * True if stock is at or below the threshold (including out-of-stock)
 */
export function isLowStock(stock = 0, threshold = 10) {
  const level = getLowStockLevel(stock, threshold);
  return level === 'critical' || level === 'low';
}

/**
 * UI helper to get badge classes from low stock level
 */
export function lowStockBadgeClasses(level) {
  switch (level) {
    case 'critical':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'low':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}
