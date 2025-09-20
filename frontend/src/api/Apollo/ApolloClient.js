import { ApolloClient, InMemoryCache } from "@apollo/client";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";

// Apollo cache policies to improve pagination behavior and normalization.
// - Ensure Product is normalized by id (default), specify explicitly for clarity.
// - For Query.products, avoid accidental array merges across pages by replacing with incoming.
// - For ProductPagination.data, always replace the list to prevent stale concatenation.
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        products: {
          // Only search affects identity; page/limit produce distinct results we do not merge
          keyArgs: ["search"],
          merge(existing, incoming) {
            return incoming; // replace per request to avoid mixing pages
          },
        },
        productById: {
          keyArgs: ["id"],
        },
      },
    },
    Product: {
      keyFields: ["id"],
    },
    ProductPagination: {
      fields: {
        data: {
          merge(existing = [], incoming = []) {
            return incoming; // replace page data fully
          },
        },
      },
    },
  },
});

const client = new ApolloClient({
  link: new UploadHttpLink({
    uri: import.meta.env.VITE_BACKEND_GRAPHQL_URL, // Use environment variable or default to localhost
  }),
  cache,
});

export default client;
