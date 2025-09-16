// initiating categories data for prodcuts modal so it loads after the moadl of edit or add

import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import { CATEGORY_FRAGMENT } from "../Fragments/CategoryFragments";
export const CATEGORIES_QUERY = gql`
  query GetCategories {
    categories {
      ...CategoryFragment
    }
  }
  ${CATEGORY_FRAGMENT}
`;

// exporting the useQuery to load categories data in products layout jsx

export const useCategoriesQuery = () =>
  useLazyQuery(CATEGORIES_QUERY, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });
