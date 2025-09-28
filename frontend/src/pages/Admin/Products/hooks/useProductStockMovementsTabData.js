import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_PAGINATED_STOCK_MOVEMENTS_BY_PRODUCT } from "@/GraphQL/StockMovement/Queries/PaginatedStockMovementsByProduct";

export default function useProductStockMovementsTabData(productId, { page, perPage }, initialFilters = {}) {
  const [filters, setFilters] = useState({
    type: "",
    reason: "",
    dateFrom: "",
    dateTo: "",
    userId: null,
    sortBy: "movement_date",
    sortOrder: "desc",
    ...initialFilters,
  });

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const vars = useMemo(() => ({
    product_id: Number(productId),
    page,
    perPage,
    type: filters.type || null,
    reason: filters.reason || null,
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
    userId: filters.userId ? Number(filters.userId) : null,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  }), [productId, page, perPage, filters]);

  const { data, loading, error, refetch, networkStatus } = useQuery(
    GET_PAGINATED_STOCK_MOVEMENTS_BY_PRODUCT,
    {
      variables: vars,
      fetchPolicy: "network-only",
      nextFetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
      skip: !productId,
    }
  );

  const items = useMemo(() => data?.paginatedStockMovementsByProduct?.data ?? [], [data]);
  const meta = useMemo(() => data?.paginatedStockMovementsByProduct?.meta ?? { current_page: page, per_page: perPage, last_page: 1, total: 0 }, [data, page, perPage]);

  return { items, meta, loading, error, filters, setFilter, refetch, networkStatus };
}
