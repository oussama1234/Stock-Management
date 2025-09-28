// define the stock movement fragment
import { gql } from "@apollo/client";
import { PRODUCT_FRAGMENT } from "../../Products/Fragments/ProductFragments";

export const STOCK_MOVEMENT_FRAGMENT = gql`
  fragment StockMovementFragment on StockMovement {
    id
    type
    quantity
    previous_stock
    new_stock
    movement_date
    reason
    user_id
    user_name
    source_type
    source_id
    created_at
    updated_at
    product {
      ...ProductFragment
    }
    # Removed source union selection to avoid server runtime error
  }
  ${PRODUCT_FRAGMENT}
`;
