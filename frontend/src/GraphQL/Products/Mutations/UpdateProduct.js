import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { PRODUCT_FRAGMENT } from "../Fragments/ProductFragments";
export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($id: Int!, $product: productInput!) {
    updateProduct(id: $id, product: $product) {
      ...ProductFragment
    }
  }
  ${PRODUCT_FRAGMENT}
`;

/**
 * Hook that returns a mutation function to update a product.
 *
 * It uses the UPDATE_PRODUCT_MUTATION to update a product with the given id.
 *
 * It returns an object with the following properties:
 * - updateProduct: a function that updates a product with the given id.
 * - data: the updated product data.
 * - loading: a boolean indicating if the mutation is in progress.
 * - error: an error object if the mutation fails.
 */

export const useUpdateProductMutation = () => {
  const [updateProduct, { data, loading, error }] = useMutation(
    UPDATE_PRODUCT_MUTATION
  );
  return { updateProduct, data, loading, error };
};
