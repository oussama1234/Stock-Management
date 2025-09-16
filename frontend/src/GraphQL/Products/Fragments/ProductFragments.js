// initiating the fragments of a product so that we use it always in the queries
import { gql } from "@apollo/client";
import { CATEGORY_FRAGMENT } from "../../Categories/Fragments/CategoryFragments";
export const PRODUCT_FRAGMENT = gql`
  fragment ProductFragment on Product {
    id
    name
    description
    image
    price
    stock
    category {
      ...CategoryFragment
    }
  }
  ${CATEGORY_FRAGMENT}
`;
