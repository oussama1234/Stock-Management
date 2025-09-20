// src/pages/Dashboard/utils.js
// Utility helpers for Dashboard formatting and lightweight calculations
// All functions are pure and tree-shakeable.

/**
 * Format a number as currency using the Intl API
 * @param {number|string} n - Numeric value to format
 * @param {string} currencyCode - ISO currency code (default USD)
 * @returns {string}
 */
export const fmtCurrency = (n, currencyCode = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(n || 0));

/**
 * Format a number with thousands separators
 * @param {number|string} n - Numeric value to format
 * @returns {string}
 */
export const fmtNumber = (n) => new Intl.NumberFormat().format(Number(n || 0));

/**
 * Compute percentage delta between current and previous value
 * @param {number} current
 * @param {number} previous
 * @returns {number}
 */
export const percentDelta = (current, previous) => {
  const prev = Number(previous || 0);
  const cur = Number(current || 0);
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
};

/**
 * Create SVG polyline points for a sparkline given raw values
 * @param {number[]} values
 * @param {number} width
 * @param {number} height
 * @returns {string} string points attribute for polyline
 */
export const sparkPoints = (values, width = 240, height = 70) => {
  if (!values || values.length === 0) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
};
