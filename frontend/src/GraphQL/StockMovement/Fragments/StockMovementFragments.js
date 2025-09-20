// define the stock movement fragment
import { gql } from "@apollo/client";
import { PRODUCT_FRAGMENT } from "../../Products/Fragments/ProductFragments";
import { PURCHASE_ITEM_FRAGMENT } from "../../PurchaseItem/Fragments/PurchaseItemFragments";
import { SALE_ITEM_FRAGMENT } from "../../SaleItem/Fragments/SaleItemFragments";
export const STOCK_MOVEMENT_FRAGMENT = gql`
  fragment StockMovementFragment on StockMovement {
    id
    type
    quantity
    previous_stock
    new_stock
    movement_date
    source_type
    source_id
    created_at
    updated_at
    product {
      ...ProductFragment
    }
    source {
      __typename
      ... on PurchaseItem {
        ...PurchaseItemFragment
      }
      ... on SaleItem {
        ...SaleItemFragment
      }
    }
  }
  ${PURCHASE_ITEM_FRAGMENT}
  ${SALE_ITEM_FRAGMENT}
  ${PRODUCT_FRAGMENT}
`;
