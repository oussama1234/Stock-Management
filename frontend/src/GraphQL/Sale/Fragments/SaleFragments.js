// defining the sale item fragment
import { gql } from "@apollo/client";
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
  }
  ${USER_FRAGMENT}
`;
