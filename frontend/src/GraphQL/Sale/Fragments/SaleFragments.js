// defining the sale item fragment
import { gql } from "@apollo/client";
import { PRODUCT_FRAGMENT } from "../../Products/Fragments/ProductFragments";
import { USER_FRAGMENT } from "../../User/Fragments/UserFragments";
export const SALE_FRAGMENT = gql`
  fragment SaleFragment on Sale {
    id
    customer_name
    tax
    discount
    total_amount
    sale_date
    user {
      ...UserFragment
    }
    items {
      id
      quantity
      price
      created_at
      product {
        ...ProductFragment
      }
    }
  }
  ${PRODUCT_FRAGMENT}
  ${USER_FRAGMENT}
`;
