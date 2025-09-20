// define the StockMovements query
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { STOCK_MOVEMENT_FRAGMENT } from "../Fragments/StockMovementFragments";
// define the stock movements query by product

export const GET_STOCK_MOVEMENTS_BY_PRODUCT = gql`
  query GetStockMovementsByProduct($product_id: Int!) {
    stockMovementsByProduct(product_id: $product_id) {
      ...StockMovementFragment
    }
  }
  ${STOCK_MOVEMENT_FRAGMENT}
`;

// define the useGetStockMovementsByProductQuery hook

/**
 * Hook that returns a query function to get all stock movements by product id.
 * It uses the GET_STOCK_MOVEMENTS_BY_PRODUCT query to fetch all stock movements by product id.
 * It returns an object with the following properties:
 * - data: the stock movements data.
 * - loading: a boolean indicating if the query is in progress.
 * - error: an error object if the query fails.
 * @param {number} productId - the id of the product to fetch stock movements for.
 * @returns {object} an object with the above properties.
 */

export const useGetStockMovementsByProductQuery = (productId) =>
  useQuery(GET_STOCK_MOVEMENTS_BY_PRODUCT, {
    variables: { product_id: productId },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });
