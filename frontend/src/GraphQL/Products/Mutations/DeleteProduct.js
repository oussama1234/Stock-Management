import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
export const DELETE_PRODUCT_MUTATION = gql`
  mutation DeleteProduct($id: Int!) {
    deleteProduct(id: $id) {
      success
      message
    }
  }
`;

/**
 * Hook that returns a mutation function to delete a product.
 *
 * It uses the DELETE_PRODUCT_MUTATION to delete a product with the given id.
 *
 * It returns an object with the following properties:
 * - deleteProduct: a function that deletes a product with the given id.
 * - data: the deleted product data.
 * - loading: a boolean indicating if the mutation is in progress.
 * - error: an error object if the mutation fails.
 */

export const useDeleteProductMutation = () => {
  const [deleteProductMutation, { data, loading, error }] = useMutation(
    DELETE_PRODUCT_MUTATION
  );
  return { deleteProductMutation, data, loading, error };
};
