// Paginated query for purchase items by product
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { PURCHASE_ITEM_FRAGMENT } from "../Fragments/PurchaseItemFragments";

export const GET_PAGINATED_PURCHASE_ITEMS_BY_PRODUCT = gql`
  query GetPaginatedPurchaseItemsByProduct($product_id: Int!, $page: Int, $perPage: Int) {
    paginatedPurchaseItemsByProduct(product_id: $product_id, page: $page, perPage: $perPage) {
      data {
        ...PurchaseItemFragment
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
  ${PURCHASE_ITEM_FRAGMENT}
`;

/**
 * Hook that returns a paginated query function to get purchase items by product id.
 *
 * It uses the GET_PAGINATED_PURCHASE_ITEMS_BY_PRODUCT query to fetch paginated purchase items by product id.
 *
 * It returns an object with the following properties:
 * - data: the paginated purchase items data with metadata.
 * - loading: a boolean indicating if the query is in progress.
 * - error: an error object if the query fails.
 * - refetch: a function to refetch the data with new variables.
 *
 * @param {number} productId - the id of the product to fetch purchase items for.
 * @param {number} page - the page number for pagination (default: 1).
 * @param {number} perPage - the number of items per page (default: 10).
 * @returns {object} an object with the above properties.
 */
export const usePaginatedPurchaseItemsByProductQuery = (productId, page = 1, perPage = 10) =>
  useQuery(GET_PAGINATED_PURCHASE_ITEMS_BY_PRODUCT, {
    variables: { product_id: productId, page, perPage },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: !productId,
  });