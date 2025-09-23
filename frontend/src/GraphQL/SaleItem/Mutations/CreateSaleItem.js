// defining the mutation to create a sale item by product
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { SALE_ITEM_FRAGMENT } from "../Fragments/SaleItemFragments";

export const CREATE_SALE_ITEM_MUTATION = gql`
  mutation CreateSaleItem($saleItem: saleItemInput!) {
    createSaleByProduct(saleItem: $saleItem) {
      ...SaleItemFragment
    }
  }
  ${SALE_ITEM_FRAGMENT}
`;
/**
 * useCreateSaleItemMutation
 * This hook runs a mutation to create a new sale item by product.
 * It uses the CREATE_SALE_ITEM_MUTATION mutation to create a new sale item.
 * It returns a tuple with a mutate function and an object with the following properties:
 * - data: the sale item data.
 * - loading: a boolean indicating if the mutation is in progress.
 * - error: an error object if the mutation fails.
 * @returns {array} a tuple with the mutate function and an object with the above properties.
 * @example
 * const [createSaleItem, { data, loading, error }] = useCreateSaleItemMutation();
 */

export const useCreateSaleItemMutation = () => {
  const [createSaleItem, { data, loading, error }] = useMutation(
    CREATE_SALE_ITEM_MUTATION
  );
  return { createSaleItem, data, loading, error };
};
