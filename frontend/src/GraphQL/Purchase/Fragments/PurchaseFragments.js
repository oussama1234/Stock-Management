// define the Purchase Fragment
import { gql } from "@apollo/client";
import { SUPPLIER_FRAGMENT } from "../../Supplier/Fragments/SupplierFragments";
import { USER_FRAGMENT } from "../../User/Fragments/UserFragments";

export const PURCHASE_FRAGMENT = gql`
  fragment PurchaseFragment on Purchase {
    id
    total_amount
    purchase_date
    tax
    discount
    created_at
    updated_at
    user {
      ...UserFragment
    }
    supplier {
      ...SupplierFragment
    }
  }
  ${USER_FRAGMENT}
  ${SUPPLIER_FRAGMENT}
`;
