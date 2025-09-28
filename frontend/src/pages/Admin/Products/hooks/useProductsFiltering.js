import { useMemo } from 'react';

// Derive stock level bucket matching UI semantics
const getStockStatus = (stock) => {
  const s = Number(stock || 0);
  if (s === 0) return 'out_of_stock';
  if (s <= 10) return 'low_stock';
  return 'in_stock';
};

// Get comparable value for a given sort key
const getSortValue = (item, key) => {
  switch (key) {
    case 'name':
      return String(item?.name || '').toLowerCase();
    case 'price':
      return Number(item?.price || 0);
    case 'stock':
      return Number(item?.stock || 0);
    case 'created_at':
      return item?.created_at ? new Date(item.created_at).getTime() : 0;
    case 'category':
      return String(item?.category?.name || '').toLowerCase();
    default:
      return String(item?.name || '').toLowerCase();
  }
};

// Stable sort using Schwartzian transform for performance
const stableSort = (array, getValue, dir = 'asc') => {
  const direction = dir === 'desc' ? -1 : 1;
  const mapped = array.map((item, index) => ({ index, value: getValue(item) }));
  mapped.sort((a, b) => {
    const av = a.value;
    const bv = b.value;
    if (av < bv) return -1 * direction;
    if (av > bv) return 1 * direction;
    return a.index - b.index; // preserve original order
  });
  return mapped.map((m) => array[m.index]);
};

/**
 * useProductsFiltering
 * Client-side filtering and sorting for ProductsRefactored view.
 * No network calls; fully memoized based on inputs.
 */
export const useProductsFiltering = (
  products,
  { categoryFilter, stockFilter, sortBy = 'name', sortOrder = 'asc' }
) => {
  const processed = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];

    // 1) Filter (category + stock)
    let list = products;

    if (categoryFilter) {
      const catId = String(categoryFilter);
      list = list.filter((p) => String(p?.category?.id ?? '') === catId);
    }

    if (stockFilter) {
      list = list.filter((p) => getStockStatus(p?.stock) === stockFilter);
    }

    // 2) Sort
    const sorted = stableSort(list, (item) => getSortValue(item, sortBy), sortOrder);
    return sorted;
  }, [products, categoryFilter, stockFilter, sortBy, sortOrder]);

  return processed;
};