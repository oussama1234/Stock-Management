import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_PAGINATED_PURCHASE_ITEMS_BY_PRODUCT } from "@/GraphQL/PurchaseItem/Queries/PaginatedPurchaseItemsByProduct";

export default function useProductPurchasesTabData(productId, { page, perPage }, initialFilters = {}) {
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    supplierId: null,
    userId: null,
    sortBy: "created_at",
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
    search: filters.search || null,
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
    minAmount: filters.minAmount ? Number(filters.minAmount) : null,
    maxAmount: filters.maxAmount ? Number(filters.maxAmount) : null,
    supplierId: filters.supplierId ? Number(filters.supplierId) : null,
    userId: filters.userId ? Number(filters.userId) : null,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  }), [productId, page, perPage, filters]);

  const { data, loading, error, refetch, networkStatus } = useQuery(
    GET_PAGINATED_PURCHASE_ITEMS_BY_PRODUCT,
    {
      variables: vars,
      fetchPolicy: "network-only",
      nextFetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
      skip: !productId,
    }
  );

  const items = useMemo(() => data?.paginatedPurchaseItemsByProduct?.data ?? [], [data]);
  const meta = useMemo(() => data?.paginatedPurchaseItemsByProduct?.meta ?? { current_page: page, per_page: perPage, last_page: 1, total: 0 }, [data, page, perPage]);

  return { items, meta, loading, error, filters, setFilter, refetch, networkStatus };
}
