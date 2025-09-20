// define the PurchaseItemsByProduct query
import { gql } from "@apollo/client";
import { PURCHASE_ITEM_FRAGMENT } from "../Fragments/PurchaseItemFragments";

export const GET_PURCHASE_ITEMS_BY_PRODUCT = gql`
  query GetPurchaseItemsByProduct($product_id: Int!) {
    purchaseItemsByProduct(product_id: $product_id) {
      ...PurchaseItemFragment
    }
  }
  ${PURCHASE_ITEM_FRAGMENT}
`;

// define the useGetPurchaseItemsByProductQuery hook

import { useQuery } from "@apollo/client/react";
/**
 * Hook that returns a query function to get all purchase items by product id.
 * It uses the GET_PURCHASE_ITEMS_BY_PRODUCT query to fetch all purchase items by product id.
 * It returns an object with the following properties:
 * - data: the purchase items data.
 * - loading: a boolean indicating if the query is in progress.
 * - error: an error object if the query fails.
 * @param {number} productId - the id of the product to fetch purchase items for.
 * @returns {object} an object with the above properties.
 */
export const useGetPurchaseItemsByProductQuery = (productId) =>
  useQuery(GET_PURCHASE_ITEMS_BY_PRODUCT, {
    variables: { product_id: productId },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });
