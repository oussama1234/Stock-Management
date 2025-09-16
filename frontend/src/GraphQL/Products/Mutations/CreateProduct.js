// creating a mutation query for product create
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { PRODUCT_FRAGMENT } from "../Fragments/ProductFragments";
export const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($product: productInput!) {
    createProduct(product: $product) {
      ...ProductFragment
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const useCreateProductMutation = () => {
  const [createProduct, { data, loading, error }] = useMutation(
    CREATE_PRODUCT_MUTATION
  );
  return { createProduct, data, loading, error };
};
