// define SaleItem fragments
import { gql } from "@apollo/client";
import { PRODUCT_FRAGMENT } from "../../Products/Fragments/ProductFragments";
import { SALE_FRAGMENT } from "../../Sale/Fragments/SaleFragments";
export const SALE_ITEM_FRAGMENT = gql`
  fragment SaleItemFragment on SaleItem {
    id
    quantity
    price
    created_at
    updated_at
    sale {
      ...SaleFragment
    }
    product {
      ...ProductFragment
    }
  }
  ${SALE_FRAGMENT}
  ${PRODUCT_FRAGMENT}
`;
