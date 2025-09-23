// initiating a query for products so that we use it always in the queries
// importing the fragments
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { PRODUCT_FRAGMENT, PRODUCT_ANALYTICS_FRAGMENT } from "../Fragments/ProductFragments";
export const PRODUCTS_QUERY = gql`
  query GetProducts($page: Int, $limit: Int, $search: String) {
    products(page: $page, limit: $limit, search: $search) {
      data {
        ...ProductFragment
      }
      total
      per_page
      current_page
      from
      to
      last_page
      has_more_pages
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const PRODUCT_QUERY = gql`
  query GetProduct($id: Int!) {
    productById(id: $id) {
      ...ProductFragment
    }
  }
  ${PRODUCT_FRAGMENT}
`;

/**
 * useGetProductsQuery
 *s
 * This hook runs a query to get all products and store them in the cache.
 * It uses the cache-and-network fetch policy to get products from the cache
 * and the network, and the cache-first policy for subsequent fetches.
 * It also notifies the user about network status changes. The error policy
 * is set to all, so it will return all errors to the user.
 *
 * @returns {object} result object with the products in the data property
 *                   and other properties such as loading, error, networkStatus
 */

export const PRODUCT_ANALYTICS_QUERY = gql`
  query GetProductWithAnalytics($id: Int!) {
    productById(id: $id) {
      ...ProductAnalyticsFragment
    }
  }
  ${PRODUCT_ANALYTICS_FRAGMENT}
`;

export const useGetProductQuery = (id) =>
  useQuery(PRODUCT_QUERY, {
    variables: { id },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

export const useGetProductWithAnalyticsQuery = (id) =>
  useQuery(PRODUCT_ANALYTICS_QUERY, {
    variables: { id },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });
