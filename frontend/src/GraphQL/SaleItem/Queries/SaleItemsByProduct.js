//query the sale items by product id
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { SALE_ITEM_FRAGMENT } from "../Fragments/SaleItemFragments";
export const GET_SALE_ITEMS_BY_PRODUCT = gql`
  query GetSaleItemsByProduct($product_id: Int!) {
    saleItemsByProduct(product_id: $product_id) {
      ...SaleItemFragment
    }
  }
  ${SALE_ITEM_FRAGMENT}
`;

/**
 * Hook that returns a query function to get all sale items by product id.
 *
 * It uses the GET_SALE_ITEMS_BY_PRODUCT query to fetch all sale items by product id.
 *
 * It returns an object with the following properties:
 * - data: the sale items data.
 * - loading: a boolean indicating if the query is in progress.
 * - error: an error object if the query fails.
 *
 * @param {number} productId - the id of the product to fetch sale items for.
 * @returns {object} an object with the above properties.
 */
export const useGetSaleItemsByProductQuery = (productId) =>
  useQuery(GET_SALE_ITEMS_BY_PRODUCT, {
    variables: { product_id: productId },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });
