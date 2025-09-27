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
    days_in_stock
    category {
      ...CategoryFragment
    }
    created_at
    updated_at
  }
  ${CATEGORY_FRAGMENT}
`;

export const PRODUCT_ANALYTICS_FRAGMENT = gql`
  fragment ProductAnalyticsFragment on Product {
    id
    name
    description
    image
    price
    stock
    days_in_stock
    category {
      ...CategoryFragment
    }
    total_sales_count
    total_purchases_count
    total_sales_value
    total_purchase_value
    profit_value
    profit_percentage
    sales_highlight
    createdAt: created_at
    updatedAt: updated_at
  }
  ${CATEGORY_FRAGMENT}
`;
