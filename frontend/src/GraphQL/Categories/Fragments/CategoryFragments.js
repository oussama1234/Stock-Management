// seting up the category fragment

import { gql } from "@apollo/client";

export const CATEGORY_FRAGMENT = gql`
  fragment CategoryFragment on Category {
    id
    name
    description
  }
`;
