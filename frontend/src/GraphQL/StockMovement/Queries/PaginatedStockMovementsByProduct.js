// Paginated query for stock movements by product
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { STOCK_MOVEMENT_FRAGMENT } from "../Fragments/StockMovementFragments";

export const GET_PAGINATED_STOCK_MOVEMENTS_BY_PRODUCT = gql`
  query GetPaginatedStockMovementsByProduct(
    $product_id: Int!,
    $page: Int,
    $perPage: Int,
    $type: String,
    $dateFrom: String,
    $dateTo: String,
    $userId: Int,
    $reason: String,
    $sortBy: String,
    $sortOrder: String
  ) {
    paginatedStockMovementsByProduct(
      product_id: $product_id,
      page: $page,
      perPage: $perPage,
      type: $type,
      dateFrom: $dateFrom,
      dateTo: $dateTo,
      userId: $userId,
      reason: $reason,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      data {
        ...StockMovementFragment
      }
      meta {
        current_page
        per_page
        last_page
        total
        from
        to
        has_more_pages
      }
    }
  }
  ${STOCK_MOVEMENT_FRAGMENT}
`;

/**
 * Hook that returns a paginated query function to get stock movements by product id.
 *
 * It uses the GET_PAGINATED_STOCK_MOVEMENTS_BY_PRODUCT query to fetch paginated stock movements by product id.
 *
 * It returns an object with the following properties:
 * - data: the paginated stock movements data with metadata.
 * - loading: a boolean indicating if the query is in progress.
 * - error: an error object if the query fails.
 * - refetch: a function to refetch the data with new variables.
 *
 * @param {number} productId - the id of the product to fetch stock movements for.
 * @param {number} page - the page number for pagination (default: 1).
 * @param {number} perPage - the number of items per page (default: 10).
 * @returns {object} an object with the above properties.
 */
export const usePaginatedStockMovementsByProductQuery = (productId, page = 1, perPage = 10) =>
  useQuery(GET_PAGINATED_STOCK_MOVEMENTS_BY_PRODUCT, {
    variables: { product_id: productId, page, perPage },
    fetchPolicy: "network-only", // Always fetch fresh data for accurate analytics
    nextFetchPolicy: "network-only", // Ensure subsequent fetches are also fresh
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: !productId,
  });
