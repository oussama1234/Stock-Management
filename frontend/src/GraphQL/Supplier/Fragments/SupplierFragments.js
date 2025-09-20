// define the Supplier Fragment
import { gql } from "@apollo/client";

export const SUPPLIER_FRAGMENT = gql`
  fragment SupplierFragment on Supplier {
    id
    name
    email
    phone
    address
    created_at
    updated_at
  }
`;
