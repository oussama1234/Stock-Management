// define the PurchaseItem fragment
import { gql } from "@apollo/client";
import { PRODUCT_FRAGMENT } from "../../Products/Fragments/ProductFragments";
import { PURCHASE_FRAGMENT } from "../../Purchase/Fragments/PurchaseFragments";

export const PURCHASE_ITEM_FRAGMENT = gql`
  fragment PurchaseItemFragment on PurchaseItem {
    id
    quantity
    price
    created_at
    updated_at
    purchase {
      ...PurchaseFragment
    }
    product {
      ...ProductFragment
    }
  }
  ${PURCHASE_FRAGMENT}
  ${PRODUCT_FRAGMENT}
`;
