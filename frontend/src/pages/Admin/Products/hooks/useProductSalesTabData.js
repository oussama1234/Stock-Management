import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_PAGINATED_SALE_ITEMS_BY_PRODUCT } from "@/GraphQL/SaleItem/Queries/PaginatedSaleItemsByProduct";

/**
 * useProductSalesTabData
 * Server-driven filtering + pagination for product's sales tab.
 * - Memoizes variables to prevent unnecessary rerenders
 * - Uses Apollo useQuery (network-only) for fresh analytics
 */
export default function useProductSalesTabData(productId, { page, perPage }, initialFilters = {}) {
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    userId: null,
    sortBy: "created_at",
    sortOrder: "desc",
    ...initialFilters,
  });

  const stableSetFilter = useCallback((key, value) => {
    setFilters((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const vars = useMemo(() => ({
    product_id: Number(productId),
    page,
    perPage,
    search: filters.search || null,
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
    minAmount: filters.minAmount ? Number(filters.minAmount) : null,
    maxAmount: filters.maxAmount ? Number(filters.maxAmount) : null,
    userId: filters.userId ? Number(filters.userId) : null,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  }), [productId, page, perPage, filters]);

  const { data, loading, error, refetch, networkStatus } = useQuery(
    GET_PAGINATED_SALE_ITEMS_BY_PRODUCT,
    {
      variables: vars,
      fetchPolicy: "network-only",
      nextFetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
      skip: !productId,
    }
  );

  const items = useMemo(() => data?.paginatedSaleItemsByProduct?.data ?? [], [data]);
  const meta = useMemo(() => data?.paginatedSaleItemsByProduct?.meta ?? { current_page: page, per_page: perPage, last_page: 1, total: 0 }, [data, page, perPage]);

  return {
    items,
    meta,
    loading,
    error,
    filters,
    setFilter: stableSetFilter,
    refetch,
    networkStatus,
  };
}
